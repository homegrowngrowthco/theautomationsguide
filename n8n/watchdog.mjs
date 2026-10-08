// n8n watchdog: did every scheduled TAG run actually succeed (or get recovered by a re-run)?
// Layer 3 of the retry stack; runs from GitHub Actions (.github/workflows/n8n-watchdog.yml),
// OUTSIDE n8n, so it still works when n8n itself, the error workflow, or its API key is the
// thing that broke.
//
// Catches what the error workflow cannot: a schedule that never fired, a deactivated workflow,
// re-runs that never completed, and the error workflow failing or being switched off.
//
// For each watched workflow it reads the cron schedule FROM THE LIVE scheduleTrigger node (no
// hard-coded times, so a schedule change needs no edit here), lists the expected fire times in
// the window, and requires each to have a trigger-mode execution that succeeded or has a
// successful re-run somewhere down its retryOf chain. Any other failed execution in the window
// (webhook runs included) needs the same. Silent when everything is fine.
//
// Window: expected runs between (previous watchdog run's start - GRACE) and (now - GRACE), so
// consecutive windows tile with no gap however late GitHub fires the cron. GRACE (3.4h) outlasts
// the error workflow's re-run back-off (15m + 45m + 2h, plus run and check time), so a run is
// only judged once its re-runs have had their chance. The window was a fixed 13h until 10/02,
// but GitHub fired the schedules 4.7h and 6.1h late, unevenly (10/01-10/02), and two runs more
// than 13h apart leave runs nobody judges. The anchor is the previous COMPLETED run (success or
// failure, from the GitHub API), capped at MAX_SPAN (36h) so a long outage does not dredge up
// old incidents; with no anchor (API error, first run, local run) it falls back to SPAN (13h).
//
// Usage:
//   node --env-file=../growth-engine/.env n8n/watchdog.mjs --dry   # print, no Slack
//   node n8n/watchdog.mjs --selftest                                # offline fixtures
// Env: N8N_API_KEY (required), N8N_API_URL (default below), SLACK_WEBHOOK_URL (optional),
//      GITHUB_TOKEN + GITHUB_REPOSITORY + GITHUB_RUN_ID (set by Actions; find the anchor run),
//      WATCHDOG_NOW (ISO time, testing only: judge the window as if it were then; skips the
//      GitHub lookup) + WATCHDOG_PREV (ISO time, testing only: the anchor to use with it).
// Exit code 1 when there is anything to report, so the Action run fails visibly too.

const BASE = (process.env.N8N_API_URL || 'https://homegrowngrowth.app.n8n.cloud').replace(/\/+$/, '');
const INSTANCE_TZ = 'America/New_York'; // n8n instance default, used when a workflow sets none
const GRACE_MS = 3.4 * 3600e3;
const SPAN_MS = 13 * 3600e3;
const MAX_SPAN_MS = 36 * 3600e3;
const ERROR_WF_ID = 'FTIVt7L1ZXleNUf6';
// Topic Suggestor (vfEeiQg3TsPlD24J) left this list on 2026-10-08: retired, deactivated
// (n8n/retire-suggestor.mjs). A watched-but-inactive workflow would alert every window.
const WATCHED = ['sjZADhZGIuz9tZHK', 'coLm8goioffInJ2b', 'HbCayxHdzdYdfvfP',
  'vooFcTsWtyOok7Ps', 'dxOpkHKeWnilrRmv', 'LKKVtHqiD6cyxBWc'];
const HEADER = '🤖 *The Automations Guide*';
// Failed executions a human already recovered by hand (e.g. a fresh manual trigger, which n8n
// does not link as a re-run). Execution id -> reason. An acknowledged root or failed execution
// counts as recovered. Entries can be removed once a later watchdog run has judged past them
// (the window never reaches further back than GRACE + MAX_SPAN, about 39.4h).
// Pruned 2026-10-02: 22996, 23000, 22998 (the 10/01 Notion outage, recovered by hand).
export const ACKNOWLEDGED = {};

// ---- cron (5 or 6 fields; *, n, a-b, a,b, */n, a-b/n) evaluated in an IANA timezone ----
function fieldMatches(spec, value, min, max) {
  return spec.split(',').some((part) => {
    const [range, stepStr] = part.split('/');
    const step = stepStr ? Number(stepStr) : 1;
    let lo, hi;
    if (range === '*') { lo = min; hi = max; } else if (range.includes('-')) [lo, hi] = range.split('-').map(Number); else { lo = hi = Number(range); if (stepStr) hi = max; }
    return value >= lo && value <= hi && (value - lo) % step === 0;
  });
}
const partsCache = new Map();
function localParts(date, tz) {
  let f = partsCache.get(tz);
  if (!f) partsCache.set(tz, f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' }));
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { minute: +p.minute, hour: +p.hour, day: +p.day, month: +p.month, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
export function cronMatches(expr, date, tz) {
  let f = expr.trim().split(/\s+/);
  if (f.length === 6) f = f.slice(1); // drop seconds
  if (f.length !== 5) throw new Error(`unsupported cron "${expr}"`);
  const t = localParts(date, tz);
  const dowOk = fieldMatches(f[4].replace(/\b7\b/g, '0'), t.dow, 0, 6);
  return fieldMatches(f[0], t.minute, 0, 59) && fieldMatches(f[1], t.hour, 0, 23) && fieldMatches(f[2], t.day, 1, 31)
    && fieldMatches(f[3], t.month, 1, 12) && dowOk;
}
export function fireTimes(exprs, tz, fromMs, toMs) {
  const out = [];
  for (let m = Math.ceil(fromMs / 60e3) * 60e3; m <= toMs; m += 60e3) if (exprs.some((e) => cronMatches(e, new Date(m), tz))) out.push(m);
  return out;
}
export function cronsOf(wf) {
  const crons = [], unsupported = [];
  for (const n of wf.nodes || []) {
    if (n.type !== 'n8n-nodes-base.scheduleTrigger' || n.disabled) continue;
    for (const i of n.parameters?.rule?.interval || []) (i.field === 'cronExpression' ? crons.push(i.expression) : unsupported.push(JSON.stringify(i)));
  }
  return { crons, unsupported };
}

// ---- judging ----
const ok = (e) => e.status === 'success';
function recovered(root, execs, ack) {
  if (ok(root) || root.retrySuccessId || Object.hasOwn(ack, String(root.id))) return true;
  const kids = (id) => execs.filter((e) => String(e.retryOf) === String(id));
  const stack = kids(root.id);
  while (stack.length) { const e = stack.pop(); if (ok(e)) return true; stack.push(...kids(e.id)); }
  return false;
}
// The judged window. prevStartMs = when the previous completed watchdog run started (NaN when
// unknown); its window ended at prevStart - GRACE, so this one starts there.
export function windowFor(now, prevStartMs) {
  const to = now - GRACE_MS;
  if (!Number.isFinite(prevStartMs) || prevStartMs >= now) return { from: to - SPAN_MS, to, span: SPAN_MS, anchor: 'fallback 13h' };
  const span = now - prevStartMs;
  if (span > MAX_SPAN_MS) return { from: to - MAX_SPAN_MS, to, span: MAX_SPAN_MS, anchor: 'capped 36h' };
  return { from: to - span, to, span, anchor: 'previous run' };
}
// Returns problem strings for one workflow given its live definition and recent executions.
export function judge(wf, execs, now, tz = wf.settings?.timezone || INSTANCE_TZ, ack = ACKNOWLEDGED, span = SPAN_MS) {
  const problems = [];
  const from = now - GRACE_MS - span, to = now - GRACE_MS;
  const fmt = (ms) => new Date(ms).toLocaleString('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: '2-digit' }) + ' ET';
  if (!wf.active) problems.push(`*${wf.name}* is DEACTIVATED, so none of its schedules run.`);
  const { crons } = cronsOf(wf);
  const claimed = new Set();
  if (wf.active) {
    for (const f of fireTimes(crons, tz, from, to)) {
      const root = execs.filter((e) => e.mode === 'trigger' && !e.retryOf && Math.abs(Date.parse(e.startedAt) - f) <= 15 * 60e3)
        .sort((a, b) => Math.abs(Date.parse(a.startedAt) - f) - Math.abs(Date.parse(b.startedAt) - f))[0];
      if (!root) { problems.push(`*${wf.name}*: the ${fmt(f)} run never happened.`); continue; }
      claimed.add(String(root.id));
      if (!recovered(root, execs, ack)) problems.push(`*${wf.name}*: the ${fmt(f)} run failed and no re-run succeeded (execution ${root.id}).`);
    }
  }
  for (const e of execs) {
    const t = Date.parse(e.startedAt);
    if (e.retryOf || claimed.has(String(e.id)) || t < from || t > to || ok(e)) continue;
    if (!['trigger', 'webhook'].includes(e.mode)) continue;
    if (e.status === 'error' || e.status === 'crashed') { if (!recovered(e, execs, ack)) problems.push(`*${wf.name}*: a ${e.mode} run at ${fmt(t)} failed and no re-run succeeded (execution ${e.id}).`); }
  }
  return problems;
}

// ---- live ----
async function api(path) {
  const r = await fetch(`${BASE}/api/v1${path}`, { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY, accept: 'application/json' } });
  if (!r.ok) { const err = new Error(`GET ${path} -> ${r.status}`); err.status = r.status; throw err; }
  return r.json();
}
async function executionsSince(id, sinceMs) {
  const all = [];
  let cursor = '';
  for (let page = 0; page < 10; page++) {
    const r = await api(`/executions?workflowId=${id}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    all.push(...r.data);
    const oldest = r.data.at(-1);
    if (!r.nextCursor || !oldest || Date.parse(oldest.startedAt) < sinceMs) break;
    cursor = r.nextCursor;
  }
  return all;
}

// Start time of the previous completed watchdog run (this workflow, any trigger), or NaN.
async function previousRunStart() {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: self } = process.env;
  if (!token || !repo) return { ms: NaN, note: 'no GITHUB_TOKEN/GITHUB_REPOSITORY (local run)' };
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/n8n-watchdog.yml/runs?status=completed&per_page=10`,
      { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' } });
    if (!r.ok) return { ms: NaN, note: `GitHub API HTTP ${r.status}` };
    const prev = (await r.json()).workflow_runs.find((w) => String(w.id) !== String(self) && ['success', 'failure'].includes(w.conclusion));
    return prev ? { ms: Date.parse(prev.run_started_at), note: `run ${prev.id} started ${prev.run_started_at}` } : { ms: NaN, note: 'no previous completed run' };
  } catch (e) { return { ms: NaN, note: `GitHub API: ${e.message}` }; }
}

async function main() {
  const dry = process.argv.includes('--dry');
  const now = process.env.WATCHDOG_NOW ? Date.parse(process.env.WATCHDOG_NOW) : Date.now(); // override for testing only
  const prev = process.env.WATCHDOG_NOW
    ? { ms: process.env.WATCHDOG_PREV ? Date.parse(process.env.WATCHDOG_PREV) : NaN, note: 'WATCHDOG_PREV (testing)' }
    : await previousRunStart();
  const win = windowFor(now, prev.ms);
  const hours = (win.span / 3600e3).toFixed(1);
  console.log(`Window ${new Date(win.from).toISOString()} -> ${new Date(win.to).toISOString()} (${hours}h, ${win.anchor}; anchor: ${prev.note})`);
  const problems = [];
  if (!process.env.N8N_API_KEY) problems.push('The watchdog has no N8N_API_KEY secret, so it is BLIND. Add the repo secret.');
  else {
    try {
      for (const id of WATCHED) {
        const wf = await api(`/workflows/${id}`);
        const execs = await executionsSince(id, win.from - 6 * 3600e3);
        const p = judge(wf, execs, now, undefined, ACKNOWLEDGED, win.span);
        console.log(`${wf.name}: ${p.length ? p.length + ' problem(s)' : 'ok'} (crons: ${cronsOf(wf).crons.join(' | ') || 'none, webhook'})`);
        problems.push(...p);
      }
      const ew = await api(`/workflows/${ERROR_WF_ID}`);
      if (!ew.active) problems.push(`*${ew.name}* is DEACTIVATED: failures are neither alerted nor re-run.`);
      const ee = (await executionsSince(ERROR_WF_ID, now - win.span)).filter((e) => e.status === 'error' && Date.parse(e.startedAt) > now - win.span);
      if (ee.length) problems.push(`*${ew.name}* itself failed ${ee.length}x in the last ${hours}h (latest execution ${ee[0].id}): failures may have gone unalerted and un-retried.`);
      console.log(`${ew.name}: ${ew.active ? 'active' : 'INACTIVE'}, ${ee.length} failed run(s)`);
    } catch (e) {
      problems.push(e.status === 401 || e.status === 403
        ? `The watchdog's N8N_API_KEY was rejected (HTTP ${e.status}). It has probably expired: create a new key in n8n Settings > n8n API and update the repo secret.`
        : `The watchdog could not reach n8n (${e.message}).`);
    }
  }
  if (!problems.length) { console.log('All scheduled runs accounted for.'); return; }
  const text = `${HEADER}\n🐕 *n8n watchdog: ${problems.length} problem${problems.length === 1 ? '' : 's'}*\n${problems.map((p) => '• ' + p).join('\n')}`
    + (process.env.GITHUB_RUN_URL ? `\n<${process.env.GITHUB_RUN_URL}|Watchdog run>` : '');
  console.log('\n' + text);
  if (!dry && process.env.SLACK_WEBHOOK_URL) {
    const r = await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
    console.log(`Slack: HTTP ${r.status}`);
  }
  process.exitCode = 1;
}

// ---- offline selftest ----
function selftest() {
  const tz = 'America/New_York';
  const checks = [];
  const t = (name, pass, info = '') => checks.push([name, pass, info]);
  // Thu 2026-10-01 is EDT (UTC-4). 07:30 ET = 11:30Z; Mon+Thu cron.
  t('cron Mon+Thu 7:30 matches Thu 11:30Z (EDT)', cronMatches('30 7 * * 1,4', new Date('2026-10-01T11:30:00Z'), tz));
  t('cron Mon+Thu 7:30 skips Wed', !cronMatches('30 7 * * 1,4', new Date('2026-09-30T11:30:00Z'), tz));
  t('cron 8am in EST after DST ends = 13:00Z', cronMatches('0 8 * * *', new Date('2026-11-02T13:00:00Z'), tz) && !cronMatches('0 8 * * *', new Date('2026-11-02T12:00:00Z'), tz));
  t('cron step */15', cronMatches('*/15 * * * *', new Date('2026-10-01T11:45:00Z'), tz) && !cronMatches('*/15 * * * *', new Date('2026-10-01T11:50:00Z'), tz));
  t('cron 6-field (seconds) accepted', cronMatches('0 0 8 * * *', new Date('2026-10-01T12:00:00Z'), tz));
  const fires = fireTimes(['0 8 * * *', '0 16 * * *'], tz, Date.parse('2026-10-01T00:00:00Z'), Date.parse('2026-10-02T00:00:00Z'));
  t('engine 2x/day yields 08:00 and 16:00 ET', fires.length === 2 && new Date(fires[0]).toISOString() === '2026-10-01T12:00:00.000Z' && new Date(fires[1]).toISOString() === '2026-10-01T20:00:00.000Z', fires.map((f) => new Date(f).toISOString()).join(','));

  const wf = { name: 'Engine', active: true, settings: {}, nodes: [{ type: 'n8n-nodes-base.scheduleTrigger', parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * *' }, { field: 'cronExpression', expression: '0 16 * * *' }] } } }] };
  const now = Date.parse('2026-10-02T00:30:00Z'); // 20:30 ET: judges runs between ~04:06 and 17:06 ET Oct 1 => only the 08:00 and 16:00 runs
  const ex = (id, at, status, extra = {}) => ({ id, startedAt: at, status, mode: 'trigger', retryOf: null, ...extra });
  const morning = '2026-10-01T12:00:00.600Z', afternoon = '2026-10-01T20:00:00.100Z';
  const cases = [
    ['both runs succeeded -> quiet', [ex('1', morning, 'success'), ex('2', afternoon, 'success')], 0],
    ['08:00 failed, re-run 2 succeeded -> quiet', [ex('1', morning, 'error'), ex('1a', '2026-10-01T12:15:00Z', 'error', { mode: 'retry', retryOf: '1' }), ex('1b', '2026-10-01T13:00:00Z', 'success', { mode: 'retry', retryOf: '1a' }), ex('2', afternoon, 'success')], 0],
    ['08:00 failed, retrySuccessId set -> quiet', [ex('1', morning, 'error', { retrySuccessId: '9' }), ex('2', afternoon, 'success')], 0],
    ['08:00 failed, all re-runs failed -> 1 problem', [ex('1', morning, 'error'), ex('1a', '2026-10-01T12:15:00Z', 'error', { mode: 'retry', retryOf: '1' }), ex('2', afternoon, 'success')], 1],
    ['16:00 never ran -> 1 problem', [ex('1', morning, 'success')], 1],
    ['deactivated -> flagged', [ex('1', morning, 'success'), ex('2', afternoon, 'success')], 1, { active: false }],
  ];
  for (const [name, execs, want, over] of cases) { const p = judge({ ...wf, ...over }, execs, now, tz); t(name, p.length === want, p.join(' / ')); }
  const hook = { name: 'Publish Status', active: true, settings: {}, nodes: [] };
  t('webhook failure unrecovered -> 1 problem', judge(hook, [ex('5', '2026-10-01T15:00:00Z', 'error', { mode: 'webhook' })], now, tz).length === 1);
  t('webhook failure outside window -> quiet', judge(hook, [ex('5', '2026-10-01T23:00:00Z', 'error', { mode: 'webhook' })], now, tz).length === 0);
  const ack = { 1: 'recovered by hand' };
  t('acknowledged failed scheduled run -> quiet', judge(wf, [ex('1', morning, 'error'), ex('2', afternoon, 'success')], now, tz, ack).length === 0);
  t('unacknowledged failed scheduled run still reports', judge(wf, [ex('1', morning, 'success'), ex('2', afternoon, 'error')], now, tz, ack).length === 1);
  t('acknowledged webhook failure -> quiet', judge(hook, [ex('1', '2026-10-01T15:00:00Z', 'error', { mode: 'webhook' })], now, tz, ack).length === 0);

  // Anchored window (10/02): GitHub fired the 16:30Z cron at 21:11Z and the 04:30Z one at 10:38Z.
  const H = 3600e3, wNow = Date.parse('2026-10-02T10:38:00Z');
  const w1 = windowFor(wNow, Date.parse('2026-10-01T21:11:00Z'));
  t('anchored: window starts where the previous one ended', w1.anchor === 'previous run' && w1.from === Date.parse('2026-10-01T21:11:00Z') - GRACE_MS && w1.to === wNow - GRACE_MS, JSON.stringify(w1));
  t('no previous run -> 13h fallback', windowFor(wNow, NaN).span === SPAN_MS && windowFor(wNow, NaN).anchor === 'fallback 13h');
  t('previous run in the future -> 13h fallback', windowFor(wNow, wNow + H).span === SPAN_MS);
  const w3 = windowFor(wNow, wNow - 50 * H);
  t('previous run 50h ago -> capped at 36h', w3.span === MAX_SPAN_MS && w3.anchor === 'capped 36h', JSON.stringify(w3));
  // The gap the fixed 13h window left: previous run 18h earlier (16:38Z), a 10:00 ET (14:00Z) run
  // that failed on 10/01 sits after that run's window end (13:14Z) and before a 13h window start (18:14Z).
  const daily10 = { name: 'Daily 10am', active: true, settings: {}, nodes: [{ type: 'n8n-nodes-base.scheduleTrigger', parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 10 * * *' }] } } }] };
  const gapExecs = [ex('7', '2026-10-01T14:00:00.300Z', 'error')];
  const w4 = windowFor(wNow, Date.parse('2026-10-01T16:38:00Z'));
  t('gap regression: fixed 13h window misses the 10:00 ET failure', judge(daily10, gapExecs, wNow, tz, {}, SPAN_MS).length === 0);
  t('gap regression: anchored window reports it', judge(daily10, gapExecs, wNow, tz, {}, w4.span).length === 1, judge(daily10, gapExecs, wNow, tz, {}, w4.span).join(' / '));  let fail = 0;
  for (const [name, pass, info] of checks) { if (!pass) fail++; console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${pass || !info ? '' : '  -> ' + info}`); }
  if (fail) process.exit(1);
}

if (process.argv.includes('--selftest')) selftest();
else await main();
