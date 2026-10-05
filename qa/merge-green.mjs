// Merge-on-green for content PRs (Session 105, Ian's rule 2026-10-05: no manual merges).
//
// Called from .github/workflows/auto-merge-content.yml via actions/github-script:
//   - mode 'run'   (workflow_run: a qa or PR-gates run just completed): evaluate the
//     one PR on that run's branch and merge it the moment every required check is
//     green on its CURRENT head sha. Polls while a check is still pending (the PR
//     gates on a bot-pushed head are dispatched at the end of the qa job, so they
//     finish a few minutes after qa does).
//   - mode 'sweep' (daily backstop + manual dispatch): evaluate every open content
//     PR once, merge the green ones, Slack-report the red or stalled ones.
//
// Never merges red. Never bypasses: the merge goes through the API as
// github-actions[bot], which is not a ruleset bypass actor, and pins `sha` so a
// commit that lands mid-evaluation makes the merge fail instead of shipping an
// unchecked head.
//
//   node qa/merge-green.mjs --selftest   # frozen offline fixtures (CI)

export const REQUIRED_CHECKS = ['qa', 'pr-gates'];
export const NETLIFY_CONTEXT = 'netlify/theautomationsguide/deploy-preview';
export const HOLD_LABEL = 'no-auto-merge';
const RED = new Set(['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure', 'stale']);

export function isContentPr(pr) {
  return pr.title.startsWith('content:') && pr.head.ref.startsWith('content/');
}

// Latest check run per name (a re-run or a published verdict supersedes older ones).
export function latestByName(checkRuns) {
  const out = new Map();
  for (const c of checkRuns) {
    const prev = out.get(c.name);
    const t = (x) => Date.parse(x.completed_at || x.started_at || 0) || 0;
    if (!prev || t(c) > t(prev) || (t(c) === t(prev) && c.id > prev.id)) out.set(c.name, c);
  }
  return out;
}

// Pure decision: { state: 'merge' | 'wait' | 'blocked', reasons: [] }.
// `statuses` is the combined commit-status list (newest first, as the API returns it).
export function evaluate({ pr, reviews = [], checkRuns = [], statuses = [], required = REQUIRED_CHECKS }) {
  const blocked = [];
  const wait = [];
  if (pr.state !== 'open') return { state: 'blocked', reasons: [`PR is ${pr.state}`] };
  if (pr.draft) blocked.push('draft');
  if ((pr.labels || []).some((l) => l.name === HOLD_LABEL)) blocked.push(`held by the ${HOLD_LABEL} label`);
  if (reviews.some((r) => r.state === 'CHANGES_REQUESTED')) blocked.push('has a CHANGES_REQUESTED review');

  const latest = latestByName(checkRuns);
  for (const [name, c] of latest) {
    if (c.status === 'completed' && RED.has(c.conclusion)) blocked.push(`check ${name} is ${c.conclusion}`);
  }
  for (const name of required) {
    const c = latest.get(name);
    if (!c) wait.push(`${name} not reported on head ${pr.head.sha.slice(0, 8)}`);
    else if (c.status !== 'completed') wait.push(`${name} is ${c.status}`);
    // A content PR's qa must have RUN: a skipped qa means the gates never saw this head.
    else if (c.conclusion !== 'success' && !RED.has(c.conclusion)) blocked.push(`${name} is ${c.conclusion}, not success`);
  }

  const netlify = statuses.find((s) => s.context === NETLIFY_CONTEXT);
  if (netlify) {
    if (netlify.state === 'pending') wait.push('Netlify deploy preview pending');
    else if (netlify.state !== 'success') blocked.push(`Netlify deploy preview ${netlify.state}`);
  }

  if (pr.mergeable_state === 'dirty') blocked.push('merge conflict with master');
  else if (pr.mergeable === null || pr.mergeable_state === 'unknown') wait.push('GitHub is still computing mergeability');

  if (blocked.length) return { state: 'blocked', reasons: blocked };
  if (wait.length) return { state: 'wait', reasons: wait };
  return { state: 'merge', reasons: [] };
}

async function gather(github, owner, repo, number) {
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: number });
  const [reviews, checkRuns, statuses] = await Promise.all([
    github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: number, per_page: 100 }),
    github.paginate(github.rest.checks.listForRef, { owner, repo, ref: pr.head.sha, per_page: 100 }),
    github.paginate(github.rest.repos.listCommitStatusesForRef, { owner, repo, ref: pr.head.sha, per_page: 100 }),
  ]);
  return { pr, reviews, checkRuns, statuses };
}

async function merge(github, owner, repo, pr) {
  await github.rest.pulls.merge({
    owner,
    repo,
    pull_number: pr.number,
    merge_method: 'squash',
    sha: pr.head.sha,
    commit_title: `${pr.title} (#${pr.number})`,
  });
}

async function slack(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: `🤖 *The Automations Guide*\n${text}` }),
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// mode 'run': one PR, poll while waiting. Returns a summary string.
export async function runForBranch({ github, context, core, branch, pollMs = 20000, maxWaitMs = 12 * 60000 }) {
  const { owner, repo } = context.repo;
  const { data: prs } = await github.rest.pulls.list({ owner, repo, state: 'open', head: `${owner}:${branch}` });
  const pr0 = prs.find(isContentPr);
  if (!pr0) {
    core.info(`No open content PR on ${branch}; nothing to do (non-content PRs use GitHub auto-merge).`);
    return;
  }

  // A [qa-fix-N] push from inside the qa job never re-triggers qa (GITHUB_TOKEN), so
  // the fixed head would sit with no verdict. Re-run the qa run that pushed it: the
  // re-run checks out the branch tip, counts the fix, re-reviews, and on a pass
  // publishes its verdict onto that head (or goes red at the 2-fix limit).
  const wr = context.payload.workflow_run;
  if (wr && wr.path && wr.path.endsWith('qa-content-pr.yml') && wr.conclusion === 'success' && wr.head_sha !== pr0.head.sha) {
    const { data: head } = await github.rest.repos.getCommit({ owner, repo, ref: pr0.head.sha });
    const latest = latestByName(
      await github.paginate(github.rest.checks.listForRef, { owner, repo, ref: pr0.head.sha, per_page: 100 }),
    );
    if (/^\[qa-fix-\d+\]/.test(head.commit.message) && !latest.get('qa') && wr.run_attempt < 3) {
      core.info(`Head ${pr0.head.sha.slice(0, 8)} is an unreviewed qa-fix commit; re-running qa run ${wr.id}.`);
      await github.rest.actions.reRunWorkflow({ owner, repo, run_id: wr.id });
      return;
    }
  }

  const started = Date.now();
  for (;;) {
    const g = await gather(github, owner, repo, pr0.number);
    const v = evaluate(g);
    core.info(`#${g.pr.number} @ ${g.pr.head.sha.slice(0, 8)}: ${v.state}${v.reasons.length ? ' (' + v.reasons.join('; ') + ')' : ''}`);
    if (v.state === 'merge') {
      try {
        await merge(github, owner, repo, g.pr);
        core.notice(`Merged #${g.pr.number} (${g.pr.head.sha.slice(0, 8)}) on green.`);
      } catch (err) {
        core.warning(`Merge of #${g.pr.number} failed: ${err.message}`);
        await slack(`🚨 Content PR <${g.pr.html_url}|#${g.pr.number}> is green but the merge failed: ${err.message}`);
      }
      return;
    }
    // Red: the qa job already commented + Slacked its own failure; nothing to add.
    if (v.state === 'blocked') return;
    if (Date.now() - started > maxWaitMs) {
      core.notice(`Gave up waiting on #${g.pr.number}: ${v.reasons.join('; ')}. The daily sweep will retry.`);
      return;
    }
    await sleep(pollMs);
  }
}

// mode 'sweep': every open content PR once; Slack the ones that need a human.
export async function sweep({ github, context, core }) {
  const { owner, repo } = context.repo;
  const prs = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', base: 'master', per_page: 100 });
  const merged = [];
  const stuck = [];
  for (const p of prs.filter(isContentPr)) {
    const g = await gather(github, owner, repo, p.number);
    const v = evaluate(g);
    const ageH = Math.round((Date.now() - Date.parse(p.created_at)) / 3600000);
    core.info(`#${p.number} (${ageH}h): ${v.state} ${v.reasons.join('; ')}`);
    if (v.state === 'merge') {
      try {
        await merge(github, owner, repo, g.pr);
        merged.push(p);
      } catch (err) {
        stuck.push({ p, ageH, reasons: [`merge failed: ${err.message}`] });
      }
    } else if (v.state === 'blocked' || ageH >= 2) {
      stuck.push({ p, ageH, reasons: v.reasons });
    }
  }
  const parts = [];
  if (merged.length) {
    parts.push(`Daily sweep merged ${merged.length} green content PR(s) the instant path missed:\n` +
      merged.map((p) => `• <${p.html_url}|#${p.number}> ${p.title}`).join('\n'));
  }
  if (stuck.length) {
    parts.push(`🚨 ${stuck.length} content PR(s) are NOT merging and need you:\n` +
      stuck.map((s) => `• <${s.p.html_url}|#${s.p.number}> (${s.ageH}h old) ${s.p.title}\n    ↳ ${s.reasons.join('; ')}`).join('\n'));
  }
  if (parts.length) await slack(parts.join('\n\n'));
  core.info(`Merged: ${merged.length}, stuck: ${stuck.length}`);
}

// ---------------------------------------------------------------- selftest
function selftest() {
  const sha = 'abcdef1234567890';
  const pr = (o = {}) => ({ state: 'open', draft: false, labels: [], mergeable: true, mergeable_state: 'clean',
    title: 'content: X', head: { ref: 'content/x', sha }, ...o });
  const run = (name, conclusion, o = {}) => ({ id: o.id || 1, name, status: o.status || 'completed', conclusion,
    completed_at: o.at || '2026-10-05T10:00:00Z' });
  const green = [run('qa', 'success'), run('pr-gates', 'success'), run('freshness', 'success')];
  const ok = [{ context: NETLIFY_CONTEXT, state: 'success' }];
  const cases = [
    ['all green merges', { pr: pr(), checkRuns: green, statuses: ok }, 'merge'],
    ['red qa blocks', { pr: pr(), checkRuns: [run('qa', 'failure'), run('pr-gates', 'success')], statuses: ok }, 'blocked'],
    ['red non-required check blocks', { pr: pr(), checkRuns: [...green, run('build', 'failure', { id: 2 })] }, 'blocked'],
    ['skipped qa on a content PR blocks', { pr: pr(), checkRuns: [run('qa', 'skipped'), run('pr-gates', 'success')] }, 'blocked'],
    ['qa missing on bot-pushed head waits', { pr: pr(), checkRuns: [run('pr-gates', 'success')] }, 'wait'],
    ['pr-gates in progress waits', { pr: pr(), checkRuns: [run('qa', 'success'), run('pr-gates', null, { status: 'in_progress' })] }, 'wait'],
    ['re-run success supersedes old failure', { pr: pr(), checkRuns: [run('qa', 'failure', { id: 1, at: '2026-10-05T09:00:00Z' }),
      run('qa', 'success', { id: 2, at: '2026-10-05T10:00:00Z' }), run('pr-gates', 'success')] }, 'merge'],
    ['newer failure supersedes old success', { pr: pr(), checkRuns: [run('qa', 'success', { id: 1, at: '2026-10-05T09:00:00Z' }),
      run('qa', 'failure', { id: 2, at: '2026-10-05T10:00:00Z' }), run('pr-gates', 'success')] }, 'blocked'],
    ['Netlify pending waits', { pr: pr(), checkRuns: green, statuses: [{ context: NETLIFY_CONTEXT, state: 'pending' }] }, 'wait'],
    ['Netlify failure blocks', { pr: pr(), checkRuns: green, statuses: [{ context: NETLIFY_CONTEXT, state: 'failure' }] }, 'blocked'],
    ['newest Netlify status wins', { pr: pr(), checkRuns: green, statuses: [{ context: NETLIFY_CONTEXT, state: 'success' },
      { context: NETLIFY_CONTEXT, state: 'pending' }] }, 'merge'],
    ['changes requested blocks', { pr: pr(), checkRuns: green, reviews: [{ state: 'CHANGES_REQUESTED' }] }, 'blocked'],
    ['hold label blocks', { pr: pr({ labels: [{ name: HOLD_LABEL }] }), checkRuns: green }, 'blocked'],
    ['draft blocks', { pr: pr({ draft: true }), checkRuns: green }, 'blocked'],
    ['conflict blocks', { pr: pr({ mergeable: false, mergeable_state: 'dirty' }), checkRuns: green }, 'blocked'],
    ['mergeability unknown waits', { pr: pr({ mergeable: null, mergeable_state: 'unknown' }), checkRuns: green }, 'wait'],
    ['closed PR blocks', { pr: pr({ state: 'closed' }), checkRuns: green }, 'blocked'],
  ];
  let fail = 0;
  for (const [name, input, want] of cases) {
    const got = evaluate(input).state;
    if (got !== want) { fail++; console.log(`FAIL ${name}: want ${want}, got ${got}`); }
  }
  const content = [
    [{ title: 'content: a', head: { ref: 'content/a' } }, true],
    [{ title: 'Session 105: docs', head: { ref: 'content/a' } }, false],
    [{ title: 'content: a', head: { ref: 'ci/a' } }, false],
  ];
  for (const [p, want] of content) if (isContentPr(p) !== want) { fail++; console.log(`FAIL isContentPr ${p.title} ${p.head.ref}`); }
  const total = cases.length + content.length;
  console.log(`[merge-green] selftest: ${total - fail}/${total} passed`);
  process.exit(fail ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
