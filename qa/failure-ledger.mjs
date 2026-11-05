#!/usr/bin/env node
/**
 * Failure recurrence ledger for .github/workflows/qa-content-pr.yml.
 *
 * Each red QA run records {date, pr, sha, signature, run_id} in qa-failure-ledger.json
 * on the dedicated `qa-ledger` branch (maintained purely via the GitHub
 * contents API; the branch is never checked out). Entries older than
 * PRUNE_DAYS are dropped on every write. The script prints how many entries
 * (including the one just recorded) share this run's signature within
 * WINDOW_DAYS; the workflow escalates its failure PR comment + Slack ping when
 * that count reaches 2: the second occurrence of the same failure class in
 * 14 days means the class needs a structural fix, not another patch.
 *
 * Repeated-red alarm (op #1501): when one signature reaches ALARM_PRS distinct PRs
 * within WINDOW_DAYS, open ONE issue in the decision queue (OPS_REPO, labels needs-ian
 * and project:tag, titled "[tag] qa red on N PRs: <signature>"). It is checked on every
 * red at or over the threshold, not only at exactly 3, so a failed call retries on the
 * next red. Dedup is by the SIGNATURE parsed out of open project:tag titles, ignoring
 * the count: "[tag] qa red on 7 PRs: other" still blocks a new issue for `other`, and
 * "...: other-thing" does not. If the list call fails nothing is opened, since a
 * duplicate would ring Ian twice. A closed issue no longer dedups: while 3 PRs are still
 * in the window, the next red with that signature rings again, and the body says so.
 * Every failure of the alarm is a logged warning; the exit code and recurrence_count
 * stay what the ledger alone produced. No token (a fork PR, a context with no secrets)
 * is one plain log line with no annotation.
 *
 * Env:
 *   GITHUB_TOKEN       contents:write token (the workflow's GITHUB_TOKEN)
 *   GITHUB_REPOSITORY  owner/repo (set automatically in Actions)
 *   SIGNATURE          failure class, e.g. lint-content | build | other
 *   PR_NUMBER          PR number for the ledger entry
 *   HEAD_SHA           head sha for the ledger entry
 *   GITHUB_RUN_ID      run id for the ledger entry, so the issue can link the run
 *   OPS_ISSUES_PAT     Issues read+write on OPS_REPO only. Used for OPS_REPO calls only.
 *   OPS_API_URL        API base for OPS_REPO calls (default GITHUB_API_URL). Fixtures only.
 *   ALARM_TIMEOUT_MS   per-call timeout for OPS_REPO calls (default 15000)
 *   ALARM_PROBE=1      read only: read the ledger, list the open issues with the token and
 *                      report. Writes no ledger entry and opens nothing. This is how a
 *                      throwaway content/ branch proves the workflow step without faking
 *                      a red in the ledger or ringing Ian.
 *   DRY_RUN=1          no network: exercises append/prune/count against a
 *                      fixture array (LEDGER_FIXTURE env JSON, else built-in)
 *                      and prints what it WOULD write. For local testing.
 *
 * Modes:
 *   node qa/failure-ledger.mjs --selftest        offline fixtures (pr-gates)
 *   node qa/failure-ledger.mjs --replay <file>   what the alarm does on a JSON array of
 *                                                past entries, oldest first
 *
 * Output: appends recurrence_count=<n> to $GITHUB_OUTPUT when set; always
 * logs it to stdout. Exits non-zero on any LEDGER API error. The workflow step that
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

const OPS_REPO = 'homegrowngrowthco/claude-projects-ops';
const ALARM_PROJECT_LABEL = 'project:tag';
const ALARM_LABELS = ['needs-ian', ALARM_PROJECT_LABEL];
const ALARM_PRS = 3;
const ALARM_MAX_PAGES = 10;
const ALARM_TITLE = /^\[tag\] qa red on \d+ PRs?: (.+)$/;

const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';
const api = process.env.GITHUB_API_URL || 'https://api.github.com';
const signature = process.env.SIGNATURE || 'other';
const pr = Number(process.env.PR_NUMBER) || 0;
const sha = process.env.HEAD_SHA || '';
const runId = process.env.GITHUB_RUN_ID || '';
const dryRun = process.env.DRY_RUN === '1';
const probe = process.env.ALARM_PROBE === '1';

function daysAgo(n, now = Date.now()) {
  return new Date(now - n * 86400000);
}

/** Prune stale entries, append the new one, count same-signature in window. */
function appendPruneCount(entries, entry, now = Date.now()) {
  const pruned = entries.filter((e) => {
    const d = new Date(e && e.date);
    return !Number.isNaN(d.getTime()) && d >= daysAgo(PRUNE_DAYS, now);
  });
  pruned.push(entry);
  const cutoff = daysAgo(WINDOW_DAYS, now);
  const count = pruned.filter(
    (e) => e.signature === entry.signature && new Date(e.date) >= cutoff
  ).length;
  return { pruned, count };
}

// ---------------------------------------------------------------------------
// Repeated-red alarm: the decision, the wording, the calls.
// ---------------------------------------------------------------------------

/** One signature's reds in the window, and the distinct PRs among them. A re-run counts once. */
function alarmDecision(entries, sig, now = Date.now()) {
  const cutoff = daysAgo(WINDOW_DAYS, now);
  const reds = entries
    .filter((e) => {
      if (!e || e.signature !== sig || !Number.isInteger(e.pr) || e.pr <= 0) return false;
      const d = new Date(e.date);
      return !Number.isNaN(d.getTime()) && d >= cutoff && d.getTime() <= now;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const prs = [...new Set(reds.map((e) => e.pr))].sort((a, b) => a - b);
  return { ring: prs.length >= ALARM_PRS, prs, reds };
}

const alarmTitle = (n, sig) => `[tag] qa red on ${n} PRs: ${sig}`;

/** The signature an alarm title names, or null if the title is not an alarm. */
function signatureFromTitle(title) {
  const m = ALARM_TITLE.exec(String(title).trim());
  return m ? m[1].trim() : null;
}

function signatureMeaning(sig) {
  if (sig === 'playwright-install') {
    return 'CI infrastructure, not the posts: the browser install failed before the overflow and Vision gates ran. The usual cause is a runner image or Playwright change.';
  }
  if (sig === 'other') {
    return 'A step outside the named gates failed (checkout, install, preview, screenshots or a comment step), so it is more likely infrastructure than the posts. Read a run before editing any post.';
  }
  return `The \`${sig}\` gate stopped different posts, so the cause may sit upstream of them (engine prompt, sanitizer, registry or the gate itself). Check whether the reds share a cause; they may not.`;
}

/** Full URLs throughout: a bare #424 in the ops repo would link to the wrong issue. */
function alarmBody({ sig, prs, reds, sourceRepo, server, currentRunId }) {
  const base = `${server}/${sourceRepo}`;
  const evidence = reds.map((e) => {
    const when = new Date(e.date).toISOString().slice(0, 16) + 'Z';
    const link = e.run_id
      ? `[run](${base}/actions/runs/${e.run_id})`
      : `[checks on ${String(e.sha).slice(0, 7)}](${base}/commit/${e.sha}/checks) (recorded before the ledger kept run ids)`;
    return `- [#${e.pr}](${base}/pull/${e.pr}), ${when}, ${link}`;
  });
  return [
    `**Ask:** qa went red with the same failure signature, \`${sig}\`, on ${prs.length} different PRs within ${WINDOW_DAYS} days. What should the next TAG session do about it?`,
    '',
    `**What \`${sig}\` means:** ${signatureMeaning(sig)}`,
    '',
    '**Options**',
    '1. (Recommended) Reply "fix". The next TAG session reads the runs below, looks for the shared cause, fixes it in a PR and closes this with the link.',
    `2. Reply "known" if it is already handled or was a coincidence. A session closes this. While ${ALARM_PRS} PRs are still inside the ${WINDOW_DAYS}-day window, the next red with this signature opens a new issue.`,
    '3. Add the `parked` label, with the un-park condition in the body. While this stays open the alarm opens nothing more for this signature.',
    '',
    'No click path: a comment here is all it needs.',
    '',
    '**Evidence**',
    ...evidence,
    `- Ledger: ${base}/blob/${LEDGER_BRANCH}/${LEDGER_PATH} (entries older than ${PRUNE_DAYS} days are pruned)`,
    `- Opened by \`qa/failure-ledger.mjs\`${currentRunId ? ` in ${base}/actions/runs/${currentRunId}` : ''}. Later reds with this signature do not update this issue; the ledger has them.`,
  ].join('\n');
}

function redact(text, secret) {
  const s = String(text).replace(/[\r\n]+/g, ' ');
  return secret ? s.split(secret).join('***') : s;
}

function opsClient({ opsToken, opsApi, timeoutMs, fetchImpl }) {
  return (path, opts = {}) =>
    fetchImpl(`${opsApi}/repos/${OPS_REPO}${path}`, {
      ...opts,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        authorization: `Bearer ${opsToken}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'tag-qa-failure-ledger',
      },
    });
}

async function failedCall(what, res) {
  const text = await res.text().catch(() => '');
  return new Error(`${what}: HTTP ${res.status} ${text.slice(0, 200)}`);
}

/** Every open project:tag title. Throws on anything short of a complete, well-formed list. */
async function listOpenTitles(call) {
  const titles = [];
  for (let page = 1; page <= ALARM_MAX_PAGES; page++) {
    const label = encodeURIComponent(ALARM_PROJECT_LABEL);
    const res = await call(`/issues?state=open&labels=${label}&per_page=100&page=${page}`);
    if (!res.ok) throw await failedCall('list open issues', res);
    const items = await res.json();
    if (!Array.isArray(items) || items.some((i) => !i || typeof i.title !== 'string')) {
      throw new Error('list open issues: malformed response');
    }
    titles.push(...items.map((i) => ({ title: i.title, number: i.number })));
    if (items.length < 100) return titles;
  }
  throw new Error(`list open issues: more than ${ALARM_MAX_PAGES} pages, so the list is incomplete`);
}

/**
 * Open the issue if the decision says to and none is open. Throws on a failed call;
 * ringSafely is the only caller in production, and it catches.
 */
async function ringAlarm({ entries, sig, now, sourceRepo, server, currentRunId, opsToken, call }) {
  const { ring, prs, reds } = alarmDecision(entries, sig, now);
  if (!ring) return { outcome: 'below', prs };
  if (!opsToken) return { outcome: 'no-token', prs };

  const open = await listOpenTitles(call);
  const already = open.find((i) => signatureFromTitle(i.title) === sig);
  if (already) return { outcome: 'deduped', prs, number: already.number };

  const res = await call('/issues', {
    method: 'POST',
    body: JSON.stringify({
      title: alarmTitle(prs.length, sig),
      body: alarmBody({ sig, prs, reds, sourceRepo, server, currentRunId }),
      labels: ALARM_LABELS,
    }),
  });
  if (!res.ok) throw await failedCall('open issue', res);
  const made = await res.json();
  if (!made || !Number.isInteger(made.number)) throw new Error('open issue: malformed response');

  // GitHub silently drops labels the caller may not set. Without them the issue neither
  // rings nor dedups, so put them back explicitly rather than trust the create.
  const got = new Set((Array.isArray(made.labels) ? made.labels : []).map((l) => (l && l.name) || l));
  const missing = ALARM_LABELS.filter((l) => !got.has(l));
  if (missing.length) {
    const fix = await call(`/issues/${made.number}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labels: missing }),
    });
    if (!fix.ok) throw await failedCall(`add labels to issue #${made.number}`, fix);
  }
  return { outcome: 'opened', prs, number: made.number, relabelled: missing };
}

/** Never throws. Whatever happens here, the exit code stays the ledger's. */
async function ringSafely(entries, sig, deps = {}) {
  const opsToken = process.env.OPS_ISSUES_PAT || '';
  try {
    const call = opsClient({
      opsToken,
      opsApi: process.env.OPS_API_URL || api,
      timeoutMs: Number(process.env.ALARM_TIMEOUT_MS) || 15000,
      fetchImpl: deps.fetchImpl || fetch,
    });
    const r = await ringAlarm({
      entries,
      sig,
      now: Date.now(),
      sourceRepo: repo,
      server: process.env.GITHUB_SERVER_URL || 'https://github.com',
      currentRunId: runId,
      opsToken,
      call,
    });
    const where = `${sig}: ${r.prs.length} distinct PR(s) in ${WINDOW_DAYS}d`;
    if (r.outcome === 'below') console.log(`alarm: ${where}, under ${ALARM_PRS}, nothing to open.`);
    if (r.outcome === 'no-token') console.log(`alarm: ${where}, but OPS_ISSUES_PAT is not set here (fork PR or no secret); skipped.`);
    if (r.outcome === 'deduped') console.log(`alarm: ${where}, ops issue #${r.number} is already open for it; nothing opened.`);
    if (r.outcome === 'opened') console.log(`alarm: ${where}, opened ops issue #${r.number}.`);
    return r;
  } catch (err) {
    console.log(`::warning title=Repeated-red alarm::no issue opened for ${sig}: ${redact(err && err.message, opsToken)}`);
    return { outcome: 'warned' };
  }
}

/** Read-only check of the step and the token, for a throwaway content/ branch. */
async function probeAlarm(entries, sig) {
  const opsToken = process.env.OPS_ISSUES_PAT || '';
  const { prs } = alarmDecision(entries, sig, Date.now());
  console.log(`alarm probe: ledger holds ${entries.length} entries; ${sig} has ${prs.length} distinct PR(s) in ${WINDOW_DAYS}d. No ledger write, no issue.`);
  if (!opsToken) {
    console.log('alarm probe: OPS_ISSUES_PAT is not set in this step.');
    return;
  }
  try {
    const call = opsClient({
      opsToken,
      opsApi: process.env.OPS_API_URL || api,
      timeoutMs: Number(process.env.ALARM_TIMEOUT_MS) || 15000,
      fetchImpl: fetch,
    });
    const open = await listOpenTitles(call);
    const alarms = open.filter((i) => signatureFromTitle(i.title) !== null);
    console.log(`alarm probe: token listed ${open.length} open ${ALARM_PROJECT_LABEL} issue(s) on ${OPS_REPO}, ${alarms.length} of them alarm titles.`);
  } catch (err) {
    console.log(`::warning title=Repeated-red alarm probe::${redact(err && err.message, opsToken)}`);
  }
}

/** What the alarm does on past entries, using the same prune and decision code as a live run. */
function replayHistory(history) {
  const ordered = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  let ledger = [];
  const open = new Map();
  const rings = [];
  const deduped = [];
  for (const e of ordered) {
    const now = new Date(e.date).getTime();
    ledger = appendPruneCount(ledger, e, now).pruned;
    const { ring, prs } = alarmDecision(ledger, e.signature, now);
    if (!ring) continue;
    if (open.has(e.signature)) {
      deduped.push({ date: e.date, pr: e.pr, signature: e.signature, prs, issue: open.get(e.signature) });
      continue;
    }
    const title = alarmTitle(prs.length, e.signature);
    open.set(e.signature, title);
    rings.push({ date: e.date, signature: e.signature, prs, title });
  }
  return { rings, deduped };
}

// ---------------------------------------------------------------------------
// The ledger.
// ---------------------------------------------------------------------------

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
  // 422 = ref already exists (a concurrent run won the race), which is fine.
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
  if (runId) entry.run_id = runId;

  if (dryRun) {
    const fixture = process.env.LEDGER_FIXTURE
      ? JSON.parse(process.env.LEDGER_FIXTURE)
      : builtinFixture();
    const { pruned, count } = appendPruneCount(fixture, entry);
    console.log(`[dry-run] would write to ${LEDGER_BRANCH}/${LEDGER_PATH}:`);
    console.log(JSON.stringify(pruned, null, 2));
    emit(count);
    const { ring, prs } = alarmDecision(pruned, signature);
    console.log(ring
      ? `[dry-run] alarm would open, unless one is open: ${alarmTitle(prs.length, signature)}`
      : `[dry-run] alarm: ${prs.length} distinct PR(s), under ${ALARM_PRS}.`);
    return;
  }

  if (!repo || !token) {
    throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required (or set DRY_RUN=1)');
  }
  if (probe) {
    const { entries } = await readLedger();
    await probeAlarm(entries, signature);
    return;
  }
  await ensureBranch();
  const { entries, fileSha } = await readLedger();
  const { pruned, count } = appendPruneCount(entries, entry);
  await writeLedger(pruned, fileSha);
  console.log(`Ledger updated: ${pruned.length} entries on ${LEDGER_BRANCH}/${LEDGER_PATH}.`);
  emit(count);
  await ringSafely(pruned, signature);
}

// ---------------------------------------------------------------------------
// Offline fixtures. Node builtins only, no network beyond a stub on 127.0.0.1, and the
// child processes get a built env, so a real token in the caller's env cannot reach them.
// ---------------------------------------------------------------------------

// The real history, rebuilt on 2026-11-04 from every commit of the qa-ledger branch (the
// file itself prunes at 30 days). Op #1501. Do not edit it to match the code.
const REAL_HISTORY = [
  { date: '2026-07-22T12:03:14.454Z', pr: 210, sha: '57129de', signature: 'lint-content' },
  { date: '2026-07-25T12:03:50.616Z', pr: 215, sha: '9d7910a', signature: 'render-acceptance' },
  { date: '2026-09-20T12:04:03.949Z', pr: 292, sha: '27e40df', signature: 'mobile-overflow' },
  { date: '2026-10-02T20:03:13.327Z', pr: 334, sha: 'bab71d8', signature: 'lint-content' },
  { date: '2026-10-02T20:04:34.639Z', pr: 334, sha: '12decf2', signature: 'lint-content' },
  { date: '2026-10-05T18:42:40.242Z', pr: 350, sha: 'eb6e669', signature: 'lint-content' },
  { date: '2026-10-14T20:02:45.838Z', pr: 387, sha: '2e3cd24', signature: 'lint-content' },
  { date: '2026-10-29T12:04:20.020Z', pr: 421, sha: '8f9be72', signature: 'lint-content' },
  { date: '2026-10-30T12:03:53.201Z', pr: 424, sha: '3f33a06', signature: 'other' },
  { date: '2026-10-30T20:03:49.786Z', pr: 425, sha: '436a6a1', signature: 'other' },
  { date: '2026-11-01T21:03:19.645Z', pr: 426, sha: 'abe356d', signature: 'other' },
  { date: '2026-11-02T13:03:06.810Z', pr: 427, sha: 'a65a17d', signature: 'other' },
  { date: '2026-11-02T21:03:29.397Z', pr: 428, sha: '4faf302', signature: 'other' },
  { date: '2026-11-03T13:03:55.912Z', pr: 429, sha: 'd9e5ed5', signature: 'other' },
];

async function selftest() {
  const http = await import('node:http');
  const os = await import('node:os');
  const path = await import('node:path');
  const { execFile } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');

  let total = 0;
  let failed = 0;
  const check = (name, ok, detail = '') => {
    total++;
    if (!ok) {
      failed++;
      console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
    }
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ---- the decision ----
  const NOW = Date.parse('2026-11-04T12:00:00.000Z');
  const ago = (d, ms = 0) => new Date(NOW - d * 86400000 - ms).toISOString();
  const red = (p, date, sig = 'other', extra = {}) => ({ date, pr: p, sha: `sha${p}abcdef`, signature: sig, ...extra });
  const decide = (entries, sig = 'other') => alarmDecision(entries, sig, NOW);

  check('3 distinct PRs ring', decide([red(1, ago(5)), red(2, ago(3)), red(3, ago(1))]).ring);
  check('2 distinct PRs do not ring', !decide([red(1, ago(5)), red(2, ago(3))]).ring);
  check('3 reds on 2 PRs do not ring (a re-run is one PR)', !decide([red(1, ago(5)), red(1, ago(4)), red(2, ago(3))]).ring);
  check('exactly 14 days old still counts', decide([red(1, ago(14)), red(2, ago(3)), red(3, ago(1))]).ring);
  check('just over 14 days old does not', !decide([red(1, ago(14, 1)), red(2, ago(3)), red(3, ago(1))]).ring);
  check('another signature does not count', !decide([red(1, ago(5)), red(2, ago(3)), red(3, ago(1), 'build')]).ring);
  check('pr 0 and malformed entries are ignored',
    !decide([red(0, ago(5)), { signature: 'other', pr: 2 }, null, red(3, 'not a date'), red(4, ago(1)), red(5, ago(2))]).ring);
  check('an entry after "now" does not count', !decide([red(1, ago(5)), red(2, ago(3)), red(3, ago(-1))]).ring);
  check('infrastructure signature rings like any other',
    decide([red(1, ago(5), 'playwright-install'), red(2, ago(3), 'playwright-install'), red(3, ago(1), 'playwright-install')], 'playwright-install').ring);

  // ---- titles: dedup is by signature, whatever the count ----
  const titleCases = [
    ['[tag] qa red on 3 PRs: other', 'other'],
    ['[tag] qa red on 17 PRs: other', 'other'],
    ['[tag] qa red on 3 PRs: playwright-install', 'playwright-install'],
    ['  [tag] qa red on 3 PRs: other  ', 'other'],
    ['[tag] qa red on 3 PRs: other-thing', 'other-thing'],
    ['[tag] Add the OPS_ISSUES_PAT secret so repeated qa reds reach the queue (2 minutes)', null],
    ['[alita] qa red on 3 PRs: other', null],
  ];
  for (const [t, want] of titleCases) check(`title parse: ${t}`, signatureFromTitle(t) === want, String(signatureFromTitle(t)));
  check('a title round-trips', signatureFromTitle(alarmTitle(5, 'vision-fix')) === 'vision-fix');

  // ---- the body ----
  const bodyFor = (sig, reds) => alarmBody({
    sig, reds, prs: [...new Set(reds.map((e) => e.pr))],
    sourceRepo: 'o/r', server: 'https://github.com', currentRunId: '999',
  });
  const body = bodyFor('other', [red(424, ago(5)), red(425, ago(3), 'other', { run_id: '111' }), red(426, ago(1), 'other', { run_id: '999' })]);
  check('body links every PR by full URL', [424, 425, 426].every((n) => body.includes(`https://github.com/o/r/pull/${n})`)));
  check('body has no bare same-repo PR link', !/(^|[\s(])#42\d\b/m.test(body.replace(/\[#\d+\]/g, '')));
  check('body links the runs it has', body.includes('https://github.com/o/r/actions/runs/111') && body.includes('https://github.com/o/r/actions/runs/999'));
  check('body falls back to checks for an old entry', body.includes('https://github.com/o/r/commit/sha424abcdef/checks'));
  check('body asks first', body.startsWith('**Ask:**'));
  check('recommended option comes first', body.indexOf('(Recommended)') > 0 && body.indexOf('(Recommended)') < body.indexOf('\n2. '));
  check('options precede the evidence', body.indexOf('**Options**') < body.indexOf('**Evidence**'));
  check('body names the re-ring after a close', body.includes('opens a new issue'));
  check('playwright-install body says infrastructure', bodyFor('playwright-install', [red(1, ago(1), 'playwright-install')]).includes('CI infrastructure'));
  const dashes = [0x2013, 0x2014].map((c) => String.fromCharCode(c));
  check('no em or en dash in any body', ['other', 'playwright-install', 'lint-content'].every((s) => {
    const text = bodyFor(s, [red(1, ago(1), s)]);
    return !dashes.some((d) => text.includes(d));
  }));

  // ---- replay on the real ledger history ----
  const { rings, deduped } = replayHistory(REAL_HISTORY);
  const shape = rings.map((r) => [r.date, r.signature, r.prs]);
  check('replay rings twice, 10/14 lint-content then 11/01 other', same(shape, [
    ['2026-10-14T20:02:45.838Z', 'lint-content', [334, 350, 387]],
    ['2026-11-01T21:03:19.645Z', 'other', [424, 425, 426]],
  ]), JSON.stringify(shape));
  check('replay title on 11/01', rings[1] && rings[1].title === '[tag] qa red on 3 PRs: other');
  check('replay dedups #427 to #429 against the open issue', same(deduped.map((d) => [d.pr, d.prs.length]), [[427, 4], [428, 5], [429, 6]]), JSON.stringify(deduped.map((d) => [d.pr, d.prs.length])));

  // ---- the calls, in process ----
  const ok = (json, status = 200) => new Response(JSON.stringify(json), { status });
  const fakeFetch = (handlers) => {
    const calls = [];
    const f = async (url, opts = {}) => {
      const u = new URL(url);
      const call = { method: opts.method || 'GET', path: u.pathname, page: u.searchParams.get('page'), body: opts.body ? JSON.parse(opts.body) : null, auth: opts.headers.authorization, url };
      calls.push(call);
      return handlers(call);
    };
    f.calls = calls;
    return f;
  };
  const threeOther = [red(1, ago(5)), red(2, ago(3)), red(3, ago(1))];
  const ring = (f, entries = threeOther, sig = 'other', opsToken = 'pat-x') => ringAlarm({
    entries, sig, now: NOW, sourceRepo: 'o/r', server: 'https://github.com', currentRunId: '7', opsToken,
    call: opsClient({ opsToken, opsApi: 'https://stub.invalid', timeoutMs: 1000, fetchImpl: f }),
  });
  const created = (n = 501) => ok({ number: n, labels: ALARM_LABELS.map((name) => ({ name })) }, 201);

  let f = fakeFetch((c) => (c.method === 'GET' ? ok([]) : created()));
  let r = await ring(f);
  const post = f.calls.find((c) => c.method === 'POST');
  check('opens one issue', r.outcome === 'opened' && r.number === 501 && f.calls.filter((c) => c.method === 'POST').length === 1);
  check('issue goes to the ops repo', post && post.path === `/repos/${OPS_REPO}/issues`);
  check('issue title', post && post.body.title === '[tag] qa red on 3 PRs: other');
  check('issue labels', post && same(post.body.labels, ['needs-ian', 'project:tag']));
  check('issue sends the PAT', post && post.auth === 'Bearer pat-x');
  check('the list asks for open project:tag only', f.calls[0].url.includes('state=open') && f.calls[0].url.includes('labels=project%3Atag'));

  f = fakeFetch((c) => (c.method === 'GET' ? ok([{ number: 77, title: '[tag] qa red on 9 PRs: other' }]) : created()));
  r = await ring(f);
  check('an open title with a different count dedups', r.outcome === 'deduped' && r.number === 77 && !f.calls.some((c) => c.method === 'POST'));

  f = fakeFetch((c) => (c.method === 'GET' ? ok([{ number: 78, title: '[tag] qa red on 3 PRs: other-thing' }, { number: 79, title: '[tag] Something else about other' }]) : created()));
  r = await ring(f);
  check('a look-alike signature does not dedup', r.outcome === 'opened');

  f = fakeFetch((c) => {
    if (c.method !== 'GET') return created();
    if (c.page === '1') return ok(Array.from({ length: 100 }, (_, i) => ({ number: i + 1000, title: `[tag] filler ${i}` })));
    return ok([{ number: 80, title: '[tag] qa red on 4 PRs: other' }]);
  });
  r = await ring(f);
  check('dedup sees the second page', r.outcome === 'deduped' && r.number === 80);

  f = fakeFetch((c) => (c.method === 'GET' ? ok(Array.from({ length: 100 }, (_, i) => ({ number: i, title: `[tag] filler ${i}` }))) : created()));
  let threw = false;
  try { await ring(f); } catch { threw = true; }
  check('an endless list opens nothing', threw && !f.calls.some((c) => c.method === 'POST') && f.calls.length === ALARM_MAX_PAGES);

  f = fakeFetch((c) => {
    if (c.method === 'GET') return ok([]);
    if (c.path.endsWith('/labels')) return ok([]);
    return ok({ number: 502, labels: [] }, 201);
  });
  r = await ring(f);
  const relabel = f.calls.find((c) => c.path.endsWith('/502/labels'));
  check('silently dropped labels are put back', r.outcome === 'opened' && relabel && same(relabel.body.labels, ['needs-ian', 'project:tag']));

  f = fakeFetch(() => { throw new Error('should not call'); });
  r = await ring(f, threeOther, 'other', '');
  check('no token makes no call', r.outcome === 'no-token' && f.calls.length === 0);
  r = await ring(f, threeOther.slice(0, 2));
  check('under the threshold makes no call', r.outcome === 'below' && f.calls.length === 0);

  // ---- the process: exit code and recurrence_count survive every alarm failure ----
  const SECRET = 'pat-selftest-do-not-print';
  const self = fileURLToPath(import.meta.url);
  const recent = (d) => new Date(Date.now() - d * 86400000).toISOString();
  const seed = [red(1, recent(5)), red(2, recent(3))];
  const seedB64 = Buffer.from(JSON.stringify(seed)).toString('base64');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'failure-ledger-'));

  const closedPort = await new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });

  const runScenario = async (name, { list, create, env = {}, ledgerRead }) => {
    const seen = { puts: 0, lists: 0, creates: 0 };
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      const send = (status, text) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(text); };
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        if (u.pathname === '/repos/o/r/git/ref/heads/qa-ledger') return send(200, '{}');
        if (u.pathname === '/repos/o/r/contents/qa-failure-ledger.json') {
          if (req.method === 'PUT') { seen.puts++; return send(200, '{}'); }
          if (ledgerRead) return ledgerRead(send);
          return send(200, JSON.stringify({ content: seedB64, sha: 'abc' }));
        }
        if (u.pathname === `/repos/${OPS_REPO}/issues` && req.method === 'GET') { seen.lists++; return list(send); }
        if (u.pathname === `/repos/${OPS_REPO}/issues` && req.method === 'POST') { seen.creates++; return create(send); }
        return send(404, '{}');
      });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const output = path.join(tmp, `${total}-output`);
    fs.writeFileSync(output, '');
    const childEnv = {
      PATH: process.env.PATH || '', SystemRoot: process.env.SystemRoot || '',
      GITHUB_API_URL: url, OPS_API_URL: url, GITHUB_REPOSITORY: 'o/r', GITHUB_TOKEN: 'stub',
      SIGNATURE: 'other', PR_NUMBER: '3', HEAD_SHA: 'cafe123', GITHUB_RUN_ID: '42', GITHUB_OUTPUT: output,
      OPS_ISSUES_PAT: SECRET, ALARM_TIMEOUT_MS: '300',
    };
    for (const [k, v] of Object.entries(env)) {
      if (v === null) delete childEnv[k]; else childEnv[k] = v;
    }
    const result = await new Promise((resolve) => {
      execFile(process.execPath, [self], { env: childEnv, timeout: 20000 }, (err, stdout, stderr) => {
        resolve({ code: err ? (err.code ?? 1) : 0, out: `${stdout}${stderr}` });
      });
    });
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    return { ...result, seen, output: fs.readFileSync(output, 'utf8'), name };
  };

  const issueList = (send) => send(200, '[]');
  const issueMade = (send) => send(201, JSON.stringify({ number: 900, labels: ALARM_LABELS.map((name) => ({ name })) }));
  const asBefore = (s) => {
    check(`${s.name}: exit 0`, s.code === 0, `code ${s.code}: ${s.out}`);
    check(`${s.name}: recurrence_count still emitted`, s.output.includes('recurrence_count=3'), s.output);
    check(`${s.name}: ledger still written`, s.seen.puts === 1);
    check(`${s.name}: token not printed`, !s.out.includes(SECRET));
  };
  const warned = (s) => check(`${s.name}: logs a warning`, s.out.includes('::warning title=Repeated-red alarm::'), s.out);
  const quiet = (s) => check(`${s.name}: no annotation`, !s.out.includes('::warning'), s.out);

  const scenarios = [
    ['healthy ring', { list: issueList, create: issueMade }, (s) => { quiet(s); check(`${s.name}: one issue`, s.seen.creates === 1 && s.out.includes('opened ops issue #900'), s.out); }],
    ['no token at all', { list: issueList, create: issueMade, env: { OPS_ISSUES_PAT: null } }, (s) => { quiet(s); check(`${s.name}: no ops call`, s.seen.lists === 0 && s.seen.creates === 0); check(`${s.name}: says why`, s.out.includes('OPS_ISSUES_PAT is not set'), s.out); }],
    ['empty token (how Actions passes a missing secret)', { list: issueList, create: issueMade, env: { OPS_ISSUES_PAT: '' } }, (s) => { quiet(s); check(`${s.name}: no ops call`, s.seen.lists === 0 && s.seen.creates === 0); }],
    ['network error', { list: issueList, create: issueMade, env: { OPS_API_URL: `http://127.0.0.1:${closedPort}` } }, (s) => { warned(s); }],
    ['403 on the list, echoing the token', { list: (send) => send(403, JSON.stringify({ message: `Resource not accessible by ${SECRET}` })), create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['403 on the create', { list: issueList, create: (send) => send(403, JSON.stringify({ message: 'Resource not accessible' })) }, (s) => { warned(s); check(`${s.name}: tried once`, s.seen.creates === 1); }],
    ['500 on the list', { list: (send) => send(500, 'oops'), create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['malformed list, not JSON', { list: (send) => send(200, '<html>'), create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['malformed list, not an array', { list: (send) => send(200, '{"message":"hi"}'), create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['malformed list, items without titles', { list: (send) => send(200, '[{"number":1}]'), create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['malformed create response', { list: issueList, create: (send) => send(201, 'not json') }, (s) => { warned(s); }],
    ['list hangs past the timeout', { list: () => {}, create: issueMade }, (s) => { warned(s); check(`${s.name}: opens nothing`, s.seen.creates === 0); }],
    ['open issue already covers it', { list: (send) => send(200, JSON.stringify([{ number: 66, title: '[tag] qa red on 12 PRs: other' }])), create: issueMade }, (s) => { quiet(s); check(`${s.name}: opens nothing`, s.seen.creates === 0 && s.out.includes('#66'), s.out); }],
  ];
  for (const [name, opts, extra] of scenarios) {
    const s = await runScenario(name, opts);
    asBefore(s);
    extra(s);
  }

  // A ledger failure still exits 1 with no output, exactly as before, and rings nothing.
  const broken = await runScenario('ledger read fails', { list: issueList, create: issueMade, ledgerRead: (send) => send(500, 'nope') });
  check('ledger failure still exits non-zero', broken.code !== 0, `code ${broken.code}`);
  check('ledger failure emits no recurrence_count', !broken.output.includes('recurrence_count'));
  check('ledger failure rings nothing', broken.seen.lists === 0 && broken.seen.creates === 0);

  const under = await runScenario('under the threshold', { list: issueList, create: issueMade, env: { PR_NUMBER: '2' } });
  check('a repeat PR makes no ops call', under.seen.lists === 0 && under.seen.creates === 0 && under.code === 0, under.out);

  const probed = await runScenario('probe', { list: (send) => send(200, JSON.stringify([{ number: 1, title: '[tag] qa red on 3 PRs: build' }, { number: 2, title: '[tag] other' }])), create: issueMade, env: { ALARM_PROBE: '1' } });
  check('probe writes no ledger entry', probed.seen.puts === 0);
  check('probe opens nothing', probed.seen.creates === 0);
  check('probe lists with the token', probed.seen.lists === 1 && probed.out.includes('token listed 2 open') && probed.out.includes('1 of them alarm titles'), probed.out);
  check('probe exits 0', probed.code === 0);

  const dry = await runScenario('dry run', { list: issueList, create: issueMade, env: { DRY_RUN: '1', LEDGER_FIXTURE: JSON.stringify(seed) } });
  check('dry run names the title and makes no call', dry.code === 0 && dry.seen.lists === 0 && dry.seen.puts === 0 && dry.out.includes('[tag] qa red on 3 PRs: other'), dry.out);

  fs.rmSync(tmp, { recursive: true, force: true });

  // ---- the workflow still wires it the way this file assumes ----
  const wf = fs.readFileSync(new URL('../.github/workflows/qa-content-pr.yml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const uses = wf.match(/\$\{\{ secrets\.OPS_ISSUES_PAT \}\}/g) || [];
  check('workflow passes the secret exactly once', uses.length === 1, String(uses.length));
  const step = wf.slice(wf.indexOf('- name: Record failure in recurrence ledger'), wf.indexOf('run: node qa/failure-ledger.mjs'));
  check('the secret is on the ledger step', step.includes('OPS_ISSUES_PAT: ${{ secrets.OPS_ISSUES_PAT }}'));
  check('the ledger step cannot fail the job', step.includes('continue-on-error: true'));
  check('the ledger step has its own timeout', /timeout-minutes: \d+/.test(step));
  check('the runner stays pinned (gotcha 17)', wf.includes('runs-on: ubuntu-26.04') && !wf.includes('runs-on: ubuntu-latest'));

  console.log(`[failure-ledger] selftest: ${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
}

function replayCli() {
  const file = process.argv[process.argv.indexOf('--replay') + 1];
  const history = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { rings, deduped } = replayHistory(history);
  console.log(`[replay] ${history.length} entries, ${rings.length} issue(s) opened, assuming each stays open and the queue starts empty:`);
  for (const r of rings) console.log(`  RING ${r.date}  ${r.title}  (PRs ${r.prs.map((n) => `#${n}`).join(', ')})`);
  for (const d of deduped) console.log(`  dedup ${d.date}  #${d.pr}, ${d.prs.length} distinct PRs, covered by "${d.issue}"`);
}

if (process.argv.includes('--selftest')) {
  selftest().catch((err) => {
    console.error(`failure-ledger selftest error: ${err.stack || err}`);
    process.exit(1);
  });
} else if (process.argv.includes('--replay')) {
  replayCli();
} else {
  main().catch((err) => {
    console.error(`failure-ledger error: ${err.message}`);
    process.exit(1);
  });
}
