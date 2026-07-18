#!/usr/bin/env node
/**
 * Failure recurrence ledger for .github/workflows/qa-content-pr.yml.
 *
 * Each red QA run records {date, pr, sha, signature} in qa-failure-ledger.json
 * on the dedicated `qa-ledger` branch (maintained purely via the GitHub
 * contents API — the branch is never checked out). Entries older than
 * PRUNE_DAYS are dropped on every write. The script prints how many entries
 * (including the one just recorded) share this run's signature within
 * WINDOW_DAYS; the workflow escalates its failure PR comment + Slack ping when
 * that count reaches 2 — the second occurrence of the same failure class in
 * 14 days means the class needs a structural fix, not another patch.
 *
 * Env:
 *   GITHUB_TOKEN       contents:write token (the workflow's GITHUB_TOKEN)
 *   GITHUB_REPOSITORY  owner/repo (set automatically in Actions)
 *   SIGNATURE          failure class, e.g. lint-content | build | other
 *   PR_NUMBER          PR number for the ledger entry
 *   HEAD_SHA           head sha for the ledger entry
 *   DRY_RUN=1          no network: exercises append/prune/count against a
 *                      fixture array (LEDGER_FIXTURE env JSON, else built-in)
 *                      and prints what it WOULD write. For local testing.
 *
 * Output: appends recurrence_count=<n> to $GITHUB_OUTPUT when set; always
 * logs it to stdout. Exits non-zero on any API error — the workflow step that
 * runs this is continue-on-error, so a ledger hiccup can never break a QA run
 * (a missing recurrence_count output simply means no escalation).
 *
 * Branch bootstrap: if `qa-ledger` does not exist yet it is created via the
 * git refs API from the default branch's current sha, then the ledger file is
 * PUT onto it. First-ever red run after this ships creates everything.
 */

import fs from 'node:fs';

const LEDGER_PATH = 'qa-failure-ledger.json';
const LEDGER_BRANCH = 'qa-ledger';
const PRUNE_DAYS = 30;
const WINDOW_DAYS = 14;

const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';
const api = process.env.GITHUB_API_URL || 'https://api.github.com';
const signature = process.env.SIGNATURE || 'other';
const pr = Number(process.env.PR_NUMBER) || 0;
const sha = process.env.HEAD_SHA || '';
const dryRun = process.env.DRY_RUN === '1';

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000);
}

/** Prune stale entries, append the new one, count same-signature in window. */
function appendPruneCount(entries, entry) {
  const pruned = entries.filter((e) => {
    const d = new Date(e && e.date);
    return !Number.isNaN(d.getTime()) && d >= daysAgo(PRUNE_DAYS);
  });
  pruned.push(entry);
  const cutoff = daysAgo(WINDOW_DAYS);
  const count = pruned.filter(
    (e) => e.signature === entry.signature && new Date(e.date) >= cutoff
  ).length;
  return { pruned, count };
}

async function gh(path, opts = {}) {
  return fetch(`${api}/repos/${repo}${path}`, {
    ...opts,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'tag-qa-failure-ledger',
      ...(opts.headers || {}),
    },
  });
}

async function ensureBranch() {
  const res = await gh(`/git/ref/heads/${LEDGER_BRANCH}`);
  if (res.ok) return;
  if (res.status !== 404) throw new Error(`GET qa-ledger ref failed: ${res.status}`);
  const repoRes = await gh('');
  if (!repoRes.ok) throw new Error(`GET repo failed: ${repoRes.status}`);
  const { default_branch } = await repoRes.json();
  const baseRes = await gh(`/git/ref/heads/${default_branch}`);
  if (!baseRes.ok) throw new Error(`GET ${default_branch} ref failed: ${baseRes.status}`);
  const base = await baseRes.json();
  const createRes = await gh('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${LEDGER_BRANCH}`, sha: base.object.sha }),
  });
  // 422 = ref already exists (a concurrent run won the race) — that is fine.
  if (!createRes.ok && createRes.status !== 422) {
    throw new Error(`create qa-ledger branch failed: ${createRes.status} ${await createRes.text()}`);
  }
}

async function readLedger() {
  const res = await gh(`/contents/${LEDGER_PATH}?ref=${LEDGER_BRANCH}`);
  if (res.status === 404) return { entries: [], fileSha: null };
  if (!res.ok) throw new Error(`GET ledger failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  let entries = [];
  try {
    entries = JSON.parse(Buffer.from(json.content, 'base64').toString('utf8'));
    if (!Array.isArray(entries)) entries = [];
  } catch {
    entries = []; // corrupt ledger -> start fresh rather than fail forever
  }
  return { entries, fileSha: json.sha };
}

async function writeLedger(entries, fileSha) {
  const body = {
    message: `qa-ledger: record '${signature}' failure on PR #${pr}`,
    content: Buffer.from(JSON.stringify(entries, null, 2) + '\n').toString('base64'),
    branch: LEDGER_BRANCH,
  };
  if (fileSha) body.sha = fileSha;
  const res = await gh(`/contents/${LEDGER_PATH}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ledger failed: ${res.status} ${await res.text()}`);
}

function emit(count) {
  console.log(`recurrence_count=${count} (signature: ${signature}, window: ${WINDOW_DAYS}d)`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `recurrence_count=${count}\n`);
  }
}

function builtinFixture() {
  const iso = (d) => d.toISOString();
  return [
    // Same signature 5 days ago -> in window: the new entry makes it 2.
    { date: iso(daysAgo(5)), pr: 900, sha: 'aaaaaaa', signature },
    // Same signature 40 days ago -> pruned entirely (older than 30d).
    { date: iso(daysAgo(40)), pr: 899, sha: 'bbbbbbb', signature },
    // Different signature 2 days ago -> kept but never counted.
    { date: iso(daysAgo(2)), pr: 901, sha: 'ccccccc', signature: 'some-other-class' },
    // Malformed entry -> dropped by the date filter, never crashes the run.
    { pr: 898, signature },
  ];
}

async function main() {
  const entry = { date: new Date().toISOString(), pr, sha, signature };

  if (dryRun) {
    const fixture = process.env.LEDGER_FIXTURE
      ? JSON.parse(process.env.LEDGER_FIXTURE)
      : builtinFixture();
    const { pruned, count } = appendPruneCount(fixture, entry);
    console.log(`[dry-run] would write to ${LEDGER_BRANCH}/${LEDGER_PATH}:`);
    console.log(JSON.stringify(pruned, null, 2));
    emit(count);
    return;
  }

  if (!repo || !token) {
    throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required (or set DRY_RUN=1)');
  }
  await ensureBranch();
  const { entries, fileSha } = await readLedger();
  const { pruned, count } = appendPruneCount(entries, entry);
  await writeLedger(pruned, fileSha);
  console.log(`Ledger updated: ${pruned.length} entries on ${LEDGER_BRANCH}/${LEDGER_PATH}.`);
  emit(count);
}

main().catch((err) => {
  console.error(`failure-ledger error: ${err.message}`);
  process.exit(1);
});
