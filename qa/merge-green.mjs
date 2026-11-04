// Merge-on-green for content PRs (Session 105, Ian's rule 2026-10-05: no manual merges).
//
// Called from .github/workflows/auto-merge-content.yml via actions/github-script:
//   - mode 'run'   (workflow_run: a qa or PR-gates run just completed): evaluate the
//     one PR on that run's branch and merge it the moment every required check is
//     green on its CURRENT head sha. Polls while a check is still pending (the PR
//     gates on a bot-pushed head are dispatched at the end of the qa job, so they
//     finish a few minutes after qa does).
//   - mode 'sweep' (daily backstop + manual dispatch): evaluate every open content
//     PR once, merge the green ones, re-run a stuck qa once (recoveryPlan below),
//     Slack-report the red or stalled ones.
//
// Never merges red. Never bypasses: the merge goes through the API as
// github-actions[bot], which is not a ruleset bypass actor, and pins `sha` so a
// commit that lands mid-evaluation makes the merge fail instead of shipping an
// unchecked head.
//
//   node qa/merge-green.mjs --selftest   # frozen offline fixtures (CI)

import { readFileSync } from 'node:fs';

export const REQUIRED_CHECKS = ['qa', 'pr-gates'];
export const NETLIFY_CONTEXT = 'netlify/theautomationsguide/deploy-preview';
export const HOLD_LABEL = 'no-auto-merge';
const RED = new Set(['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure', 'stale']);

const BOT_LOGIN = 'github-actions[bot]';
const BOT_HEAD = /^\[(auto-register|qa-fix-\d+)\]/;
const QA_WORKFLOW_PATH = '.github/workflows/qa-content-pr.yml';

// The retry cap lives in GitHub, not in memory: run_attempt survives between sweeps
// and any re-run counts, so a sweep re-runs a given qa run at most once.
export const MAX_QA_ATTEMPTS = 2;

// qa steps whose red repeats on the same tree. Everything else (runner image, npm,
// browser install, preview server, the Vision API, a job timeout) can pass on a retry.
export const CONTENT_GATE_STEPS = [
  'Lint content (deterministic gate)',
  'Logo-asset gate (deterministic)',
  'Build site (catch MDX compile errors fast)',
  'Render-acceptance gate (deterministic, post-build)',
  'Mobile-overflow gate (deterministic, post-build)',
  'Verify the fix builds and renders',
  'Block the merge (needs a human)',
];

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
  // GitHub's own verdict wins: the ruleset reads only checks in suites tied to the
  // PR, so a check from a dispatched run can look green here yet not count (#353).
  else if (pr.mergeable_state === 'blocked') wait.push('GitHub reports the PR blocked (a required check is missing from its rollup)');

  if (blocked.length) return { state: 'blocked', reasons: blocked };
  if (wait.length) return { state: 'wait', reasons: wait };
  return { state: 'merge', reasons: [] };
}

// The newest qa run that really executed. A GITHUB_TOKEN push also creates a run on
// the new head, with zero jobs, actor github-actions[bot] and (despite the old name
// "action_required stub") conclusion `failure` in the API, so a stub is told apart by
// its actor. The one to re-run is the run that pushed the bot commit: it checks out
// the branch by name, so a new attempt gates the tip, and on a pass its publish step
// puts the verdict there and dispatches the PR gates (the #354 path; #353's qa
// attempt 2 did exactly this on 10/05).
export function pickQaRun(runs) {
  return runs
    .filter((r) => r.event === 'pull_request' && r.actor?.login !== BOT_LOGIN)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] || null;
}

// Pure decision for a PR with no qa pass on its head (a bot-pushed head with no qa
// check, or a red qa): { action: 'none' | 'rerun' | 'report', reason? }.
// `gh pr update-branch` from the sweep is NOT an option: it would push as
// GITHUB_TOKEN and make new stubs (gotcha 5). A re-run keeps its original GITHUB_SHA,
// so it reuses the workflow file of its original merge commit: after a workflow fix
// only a push by a person starts a run on the new file (#424 after #430).
export function recoveryPlan({ pr, reviews = [], checkRuns = [], headMessage = '', headDate = null,
  run = null, failedStep = null, workflowChanged = false }) {
  const none = { action: 'none' };
  if (pr.draft || (pr.labels || []).some((l) => l.name === HOLD_LABEL)) return none;
  if (reviews.some((r) => r.state === 'CHANGES_REQUESTED') || pr.mergeable_state === 'dirty') return none;
  const qa = latestByName(checkRuns).get('qa');
  if (qa ? qa.status !== 'completed' || !RED.has(qa.conclusion) : !BOT_HEAD.test(headMessage)) return none;
  if (!run) return { action: 'report', reason: 'no qa run found to re-run' };
  if (run.status !== 'completed') return none;
  const person = `run gh pr update-branch ${pr.number} from a person's login`;
  // A gate red repeats only if the gate saw this tree. A bot commit pushed after the
  // run ended (the PR-comment tool reply) changed it, so that one is worth a re-run.
  const gateSawHead = !headDate || Date.parse(headDate) <= Date.parse(run.updated_at);
  if (CONTENT_GATE_STEPS.includes(failedStep) && gateSawHead) {
    return { action: 'report', reason: `qa failed at "${failedStep}" on this tree, so a re-run would repeat it: content, fix the post or close the PR` };
  }
  if (run.run_attempt >= MAX_QA_ATTEMPTS) {
    return { action: 'report', reason: `qa run ${run.id} was already re-run (attempt ${run.run_attempt}, cap ${MAX_QA_ATTEMPTS}) and the head still has no pass: ${failedStep ? `last failed at "${failedStep}"` : 'no failed step'}; ${person}` };
  }
  if (workflowChanged) {
    return { action: 'report', reason: `the qa workflow changed after run ${run.id} and a re-run would reuse its old file: ${person} so a new run starts on the current one` };
  }
  return { action: 'rerun', reason: `qa run ${run.id} ${failedStep ? `failed at "${failedStep}"` : `ended ${run.conclusion}`}, head has no pass` };
}

// A job cancelled before any runner took it (Actions incident, #353 on 10/05). The
// run's own conclusion can be `failure`, because the pr-gates rollup job did run and
// went red on its cancelled needs, so this reads the jobs. A job that hit its timeout
// has a runner name (#417's hung install) and is left to recoveryPlan.
export function runnerlessCancel(run, jobs) {
  return run.run_attempt === 1 && run.conclusion !== 'success'
    && jobs.some((j) => j.conclusion === 'cancelled' && !j.runner_name);
}

async function rerunIfRunnerless(github, owner, repo, core, run) {
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { owner, repo, run_id: run.id, per_page: 100 });
  if (!runnerlessCancel(run, jobs)) return false;
  try {
    await github.rest.actions.reRunWorkflow({ owner, repo, run_id: run.id });
    core.notice(`Run ${run.id} (${run.name}) had jobs cancelled with no runner; re-ran it once.`);
    return true;
  } catch (err) {
    core.warning(`Re-run of ${run.id} failed: ${err.message}`);
    return false;
  }
}

async function planRecovery(github, owner, repo, g) {
  const { data: head } = await github.rest.repos.getCommit({ owner, repo, ref: g.pr.head.sha });
  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    owner, repo, workflow_id: QA_WORKFLOW_PATH.split('/').pop(), branch: g.pr.head.ref, per_page: 100,
  });
  const run = pickQaRun(runs);
  let failedStep = null;
  let workflowChanged = false;
  if (run) {
    const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { owner, repo, run_id: run.id, per_page: 100 });
    failedStep = jobs.flatMap((j) => j.steps || []).find((s) => s.conclusion === 'failure')?.name || null;
    const { data: commits } = await github.rest.repos.listCommits({
      owner, repo, sha: 'master', path: QA_WORKFLOW_PATH, since: run.created_at, per_page: 1,
    });
    workflowChanged = commits.length > 0;
  }
  const plan = recoveryPlan({ ...g, headMessage: head.commit.message, headDate: head.commit.committer.date, run, failedStep, workflowChanged });
  return { plan, run };
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
  if (wr && wr.conclusion !== 'success' && wr.head_sha === pr0.head.sha
    && await rerunIfRunnerless(github, owner, repo, core, wr)) return;

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
  const rerun = [];
  for (const p of prs.filter(isContentPr)) {
    const g = await gather(github, owner, repo, p.number);
    const v = evaluate(g);
    const ageH = Math.round((Date.now() - Date.parse(p.created_at)) / 3600000);
    core.info(`#${p.number} (${ageH}h): ${v.state} ${v.reasons.join('; ')}`);
    if (v.state !== 'merge') {
      // A run cancelled with no runner first: the instant path may have died in the
      // same incident. A re-run is not news, so it stays out of Slack; if it does not
      // recover, the next sweep reports the PR with the reason.
      const headRuns = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, { owner, repo, head_sha: g.pr.head.sha, per_page: 100 });
      let reran = false;
      for (const r of headRuns) {
        if (r.status === 'completed' && r.conclusion !== 'success' && r.run_attempt === 1
          && await rerunIfRunnerless(github, owner, repo, core, r)) reran = true;
      }
      if (reran) { rerun.push(p); continue; }
      const { plan, run } = await planRecovery(github, owner, repo, g);
      core.info(`#${p.number} recovery: ${plan.action} ${plan.reason || ''}`);
      if (plan.action === 'rerun') {
        try {
          await github.rest.actions.reRunWorkflow({ owner, repo, run_id: run.id });
          core.notice(`#${p.number}: ${plan.reason}; re-ran qa once.`);
          rerun.push(p);
          continue;
        } catch (err) {
          v.reasons.push(`re-run of qa run ${run.id} failed: ${err.message}`);
        }
      } else if (plan.action === 'report') {
        v.reasons.push(plan.reason);
      }
    }
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
  core.info(`Merged: ${merged.length}, re-ran: ${rerun.length}, stuck: ${stuck.length}`);
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
    ['GitHub-blocked waits even when checks look green (#353)', { pr: pr({ mergeable_state: 'blocked' }), checkRuns: green }, 'wait'],
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

  // Stuck-head recovery, shaped from the real runs of #417, #421, #424, #425.
  const lint = 'Lint content (deterministic gate)';
  const pw = 'Install Playwright Chromium';
  const AUTOREG = '[auto-register] Register tools referenced in src/content/blog/x.mdx';
  const netlifyOnly = [run('Pages changed - theautomationsguide', 'neutral')];
  const qaRun = (o = {}) => ({ id: 1, status: 'completed', conclusion: 'failure', run_attempt: 1,
    created_at: '2026-10-30T12:02:51Z', updated_at: '2026-10-30T12:04:00Z', ...o });
  const stuckHead = { pr: pr({ number: 424 }), checkRuns: netlifyOnly, headMessage: AUTOREG, headDate: '2026-10-30T12:03:14Z' };
  const plans = [
    ['#417 job timeout on the install, bot head: re-run', { ...stuckHead, run: qaRun({ conclusion: 'cancelled' }) }, 'rerun'],
    ['#421 lint red on the pushed tree: report, a re-run repeats it', { ...stuckHead, run: qaRun(), failedStep: lint }, 'report'],
    ['#424 install red, first sweep: re-run', { ...stuckHead, run: qaRun(), failedStep: pw }, 'rerun'],
    ['#424 next sweep, attempt 2: cap, report', { ...stuckHead, run: qaRun({ run_attempt: 2 }), failedStep: pw }, 'report'],
    ['#424 after the workflow fix: re-run reuses the old file, report', { ...stuckHead, run: qaRun(), failedStep: pw, workflowChanged: true }, 'report'],
    ['lint red, then a tool reply pushed a bot commit: the tree changed, re-run',
      { ...stuckHead, headDate: '2026-10-30T15:00:00Z', run: qaRun(), failedStep: lint }, 'rerun'],
    ['that re-run also red: cap holds', { ...stuckHead, headDate: '2026-10-30T15:00:00Z', run: qaRun({ run_attempt: 2 }), failedStep: lint }, 'report'],
    ['#425 install red on a head with one commit: re-run', { pr: pr({ number: 425 }), checkRuns: [run('qa', 'failure')], headMessage: 'content: add X', run: qaRun(), failedStep: pw }, 'rerun'],
    ['vision needs a human on the head: report', { pr: pr(), checkRuns: [run('qa', 'failure')], run: qaRun(), failedStep: 'Block the merge (needs a human)' }, 'report'],
    ['bot head, qa run still going: none', { ...stuckHead, run: qaRun({ status: 'in_progress', conclusion: null }) }, 'none'],
    ['bot head, no real run found: report', { ...stuckHead }, 'report'],
    ['person pushed, qa not reported yet: none', { ...stuckHead, headMessage: 'fix: edit the post', run: qaRun() }, 'none'],
    ['published qa pass on the head: none', { ...stuckHead, checkRuns: [run('qa', 'success')], run: qaRun() }, 'none'],
    ['qa in progress on the head: none', { ...stuckHead, checkRuns: [run('qa', null, { status: 'in_progress' })], run: qaRun() }, 'none'],
    ['hold label wins: none', { ...stuckHead, pr: pr({ labels: [{ name: HOLD_LABEL }] }), run: qaRun() }, 'none'],
    ['conflict: a re-run could not merge, none', { ...stuckHead, pr: pr({ mergeable: false, mergeable_state: 'dirty' }), run: qaRun() }, 'none'],
  ];
  for (const [name, input, want] of plans) {
    const got = recoveryPlan(input).action;
    if (got !== want) { fail++; console.log(`FAIL plan ${name}: want ${want}, got ${got}`); }
  }
  if (!recoveryPlan({ ...stuckHead, run: qaRun(), failedStep: pw, workflowChanged: true }).reason.includes('gh pr update-branch 424')) {
    fail++; console.log('FAIL the workflow-changed report must carry the update-branch command');
  }

  // #417's three runs: the stub on the head is ignored, the real run is newest of the rest.
  const stub = { id: 3, event: 'pull_request', conclusion: 'failure', actor: { login: BOT_LOGIN }, created_at: '2026-10-26T20:03:06Z' };
  const real = { id: 2, event: 'pull_request', conclusion: 'cancelled', actor: { login: 'homegrowngrowthco' }, created_at: '2026-10-26T20:02:36Z' };
  const old = { id: 1, event: 'pull_request', conclusion: 'failure', actor: { login: 'homegrowngrowthco' }, created_at: '2026-10-26T19:00:00Z' };
  const picks = [
    ['stub skipped', [stub, real, old], 2],
    ['only a stub', [stub], null],
  ];
  for (const [name, runs, want] of picks) {
    const got = pickQaRun(runs)?.id ?? null;
    if (got !== want) { fail++; console.log(`FAIL pickQaRun ${name}: want ${want}, got ${got}`); }
  }

  // #353's first attempts on 10/05, and the two look-alikes that must not re-run.
  const noRunner = { conclusion: 'cancelled', runner_name: '' };
  const ran = { conclusion: 'success', runner_name: 'GitHub Actions 1' };
  const cancels = [
    ['#353 qa, cancelled with no runner', { run_attempt: 1, conclusion: 'failure' }, [noRunner], true],
    ['#353 PR gates, rollup red over cancelled needs', { run_attempt: 1, conclusion: 'failure' },
      [ran, noRunner, { conclusion: 'failure', runner_name: 'GitHub Actions 2' }], true],
    ['already re-run once', { run_attempt: 2, conclusion: 'failure' }, [noRunner], false],
    ['#417 job timeout has a runner', { run_attempt: 1, conclusion: 'cancelled' }, [{ conclusion: 'cancelled', runner_name: 'GitHub Actions 3' }], false],
    ['stub run has no jobs', { run_attempt: 1, conclusion: 'failure' }, [], false],
  ];
  for (const [name, r, jobs, want] of cancels) {
    if (runnerlessCancel(r, jobs) !== want) { fail++; console.log(`FAIL runnerlessCancel ${name}`); }
  }

  // The names above must match the workflow, or the classes silently stop matching.
  const wf = readFileSync(new URL(`../${QA_WORKFLOW_PATH}`, import.meta.url), 'utf8');
  const contract = [...CONTENT_GATE_STEPS, pw].map((s) => `- name: ${s}`);
  contract.push('id: playwright-install', 'SIG="playwright-install"');
  for (const s of contract) if (!wf.includes(s)) { fail++; console.log(`FAIL qa-content-pr.yml has no "${s}"`); }

  const total = cases.length + content.length + plans.length + 1 + picks.length + cancels.length + contract.length;
  console.log(`[merge-green] selftest: ${total - fail}/${total} passed`);
  process.exit(fail ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
