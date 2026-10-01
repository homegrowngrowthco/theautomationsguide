// Builds the TAG error workflow ("Error Trigger — TAG", FTIVt7L1ZXleNUf6) with delayed,
// self-limiting re-runs of failures that look temporary. Layer 2 of the retry stack (layer 1 =
// per-node Retry On Fail, update-retry-on-fail.mjs; layer 3 = the GitHub Action watchdog,
// n8n/watchdog.mjs).
//
// Why: on 2026-10-01 a Notion API outage (07:30-08:32 ET) failed 3 scheduled runs. Each one
// just posted a Slack alert and stopped; a human had to notice and re-trigger. Per-node retries
// (seconds apart) cannot ride out an outage of 30+ minutes; a re-run 15/45/120 minutes later can.
//
// How it behaves, per failed execution X of workflow W:
//   - Retried only if W is on the allow-list, X ran in trigger/webhook/retry mode, and the error
//     is a temporary HTTP failure: httpCode 5xx, 429 or a network code (ECONNABORTED, ETIMEDOUT,
//     ...). Code-node errors, 4xx and anything without an httpCode alert immediately, as before.
//   - Re-run number = hops up X's retryOf chain (stateless; the error workflow fires again when a
//     re-run fails, with mode "retry" and retryOf set - verified on this instance 2026-10-01).
//   - Re-runs use POST /api/v1/executions/{X}/retry, which resumes FROM THE FAILED NODE with the
//     saved data. For the engine that matters: it marks its topic "Generating" before the LLM
//     calls, so a fresh trigger would claim the next topic and strand this one.
//   - That call blocks until the re-run finishes, and Cloudflare cuts it at ~125s (524) while the
//     re-run keeps going. So the outcome is never read from that response: the workflow checks the
//     original execution's retrySuccessId 2 and 15 minutes later and posts "recovered" if set.
//     A re-run that fails fires this workflow again, which schedules the next one.
//   - After the last back-off step it alerts loudly and stops.
//
// The n8n API calls use the existing "n8n API (self) — watchdog" credential (also used by the
// HGC Pipeline Health Watchdog). If its key is rejected, the "re-run did not start" alert says so.
//
// Usage (from repo root, env from ../growth-engine/.env):
//   node --env-file=../growth-engine/.env n8n/build-error-retry.mjs                # dry run vs live
//   node --env-file=../growth-engine/.env n8n/build-error-retry.mjs --apply        # push live + write error-trigger.json
//   node --env-file=../growth-engine/.env n8n/build-error-retry.mjs --canary <targetId,...>
//       creates an ACTIVE "zz CANARY" copy with no Slack (NoOp nodes), seconds-scale waits and the
//       given workflows on its allow-list, and points those workflows at it. Delete it after.
// Revert: node n8n/live-patch.mjs --restore ~/.n8n-backups/FTIVt7L1ZXleNUf6-<ts>.json --apply

import { writeFileSync } from 'node:fs';
import { api, patchLive } from './live-patch.mjs';

const ERROR_WF_ID = 'FTIVt7L1ZXleNUf6';
const N8N_BASE = 'https://homegrowngrowth.app.n8n.cloud';
const API_CRED = { id: 'QqyCzwSckPL4rFXW', name: 'n8n API (self) — watchdog' };

// The 7 active TAG workflows. All are safe to resume from their failed node.
const RETRY_IDS = ['sjZADhZGIuz9tZHK', 'vfEeiQg3TsPlD24J', 'coLm8goioffInJ2b', 'HbCayxHdzdYdfvfP',
  'vooFcTsWtyOok7Ps', 'dxOpkHKeWnilrRmv', 'LKKVtHqiD6cyxBWc'];
const PROD = { waitsSeconds: '900,2700,7200', checksSeconds: '120,900' };
const CANARY = { waitsSeconds: '20,20,20', checksSeconds: '30,180' };

const HEADER = '🤖 *The Automations Guide*';

// ---- Code node bodies (plain JS, not n8n expressions, so backticks are fine here) ----
const DECIDE = String.raw`// Decide what to do with this failure: retry later, alert now, or skip.
const cfg = $('Config').first().json;
const p = $('Error Trigger').first().json;
const ex = p.execution || {};
const wf = p.workflow || {};
const err = ex.error || {};
const resp = $('Fetch Executions').first().json;
const list = resp && resp.statusCode === 200 && Array.isArray(resp.body?.data) ? resp.body.data : null;

const allow = String(cfg.retryWorkflowIds).split(',').map((s) => s.trim()).filter(Boolean);
const waits = String(cfg.waitsSeconds).split(',').map(Number);
const max = waits.length;
const code = String(err.httpCode ?? '').trim();
const TRANSIENT = /^(5\d\d|429|ECONNABORTED|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ESOCKETTIMEDOUT|EAI_AGAIN|ENOTFOUND|EPIPE)$/;

// Re-run number = hops up the retryOf chain.
const byId = new Map((list || []).map((e) => [String(e.id), e]));
let attempt = 0;
let cur = ex.retryOf ? String(ex.retryOf) : null;
const seen = new Set();
while (cur && !seen.has(cur)) {
  seen.add(cur);
  attempt++;
  const parent = byId.get(cur);
  cur = parent && parent.retryOf ? String(parent.retryOf) : null;
}
const alreadyRetried = (list || []).some((e) => String(e.retryOf) === String(ex.id));

let action = 'retry';
let reason = '';
if (!allow.includes(String(wf.id))) { action = 'alert'; reason = 'this workflow is not on the auto-retry list'; }
else if (!['trigger', 'webhook', 'retry'].includes(ex.mode)) { action = 'alert'; reason = 'mode "' + ex.mode + '" is not auto-retried'; }
else if (!TRANSIENT.test(code)) { action = 'alert'; reason = code ? 'error ' + code + ' is not a temporary error' : 'not an HTTP error (code or config), so a re-run would fail the same way'; }
else if (!list) { action = 'alert'; reason = 'could not read execution history (HTTP ' + (resp?.statusCode ?? resp?.error?.message ?? '?') + '), so not re-running blind. Check the "' + cfg.apiCredName + '" credential'; }
else if (alreadyRetried) { action = 'skip'; reason = 'already re-run'; }
else if (attempt >= max) { action = 'alert'; reason = 'gave up after ' + max + ' automatic re-runs'; }

const BT = String.fromCharCode(96); // backtick, for Slack inline code
const fmt = (s) => (s >= 3600 ? (s / 3600) + ' h' : s >= 60 ? Math.round(s / 60) + ' min' : s + ' s');
const msg = String(err.message || err.description || '(no message)');
const detail = err.description && err.description !== err.message ? ' (' + String(err.description).slice(0, 200) + ')' : '';
const node = ex.lastNodeExecuted || '(unknown node)';
const link = ex.url ? '<' + ex.url + '|Open execution in n8n>' : 'Execution ID: ' + ex.id;
const waitSeconds = action === 'retry' ? waits[attempt] : 0;

let slackText;
if (action === 'retry') {
  slackText = cfg.header + '\n🔁 *' + wf.name + '* failed at ' + BT + node + BT + ': ' + (code ? code + ' ' : '') + msg.slice(0, 200) + detail
    + '\nLooks temporary, so re-running from that step in ' + fmt(waitSeconds) + ' (re-run ' + (attempt + 1) + ' of ' + max + '). ' + link;
} else {
  const stack = String(err.stack || '').split('\n').slice(0, 6).join('\n');
  const gaveUp = attempt >= max && TRANSIENT.test(code) && reason.startsWith('gave up');
  const head = gaveUp
    ? '🔴 *' + wf.name + ' is still failing after ' + max + ' automatic re-runs. Needs a human.*'
    : '⚠️ *n8n workflow failure: ' + wf.name + '*';
  slackText = cfg.header + '\n' + head + '\nNode that errored: ' + BT + node + BT + '\nError: ' + msg + detail
    + (gaveUp ? '' : '\nNot auto-retried: ' + reason + '.') + '\n' + link + (stack ? '\n\n' + BT.repeat(3) + stack + BT.repeat(3) : '');
}

return [{ json: { action, reason, attempt, max, waitSeconds, execId: String(ex.id), workflowId: String(wf.id), workflowName: wf.name, slackText } }];`;

const outcome = (stage) => String.raw`// Stage ${stage}: did the re-run started by "Retry Execution" succeed?
// Never trust the retry call's own response for the outcome: it blocks until the re-run ends and
// Cloudflare cuts it at ~125s, while the re-run carries on. retrySuccessId on the original is the truth.
const cfg = $('Config').first().json;
const d = $('Decide').first().json;
const post = $('Retry Execution').first().json;
const orig = $json;
const recoveredId = orig.statusCode === 200 ? orig.body?.retrySuccessId : null;
const postCode = post.statusCode ?? null;
const postErr = post.error ? String(post.error.message || post.error) : '';
let outcome;
if (recoveredId) outcome = 'recovered';
else if (postCode === 200 && ['error', 'crashed', 'canceled'].includes(post.body?.status)) outcome = 'failed-again'; // its own error event takes over
else if (${stage} === 1 && (postCode === 200 || postCode === 524 || /timeout|ECONNABORTED|ETIMEDOUT|ECONNRESET|socket hang up/i.test(postErr))) outcome = 'pending';
else if (${stage} === 1) outcome = 'not-started';
else outcome = 'unknown'; // stage 2 and still no success: either it failed (error event handles it) or it is still running
let slackText = '';
if (outcome === 'recovered') {
  slackText = cfg.header + '\n✅ *' + d.workflowName + '* recovered: re-run ' + (d.attempt + 1) + ' succeeded. <' + cfg.n8nBaseUrl + '/workflow/' + d.workflowId + '/executions/' + recoveredId + '|Open execution>';
} else if (outcome === 'not-started') {
  slackText = cfg.header + '\n🔴 *' + d.workflowName + '*: the automatic re-run did not start (' + (postCode ? 'HTTP ' + postCode : postErr || 'no response')
    + '). Check the "' + cfg.apiCredName + '" credential, then re-run by hand. <' + cfg.n8nBaseUrl + '/workflow/' + d.workflowId + '/executions/' + d.execId + '|Open execution>';
}
return [{ json: { outcome, recoveredId, postCode, slackText } }];`;

// ---- Workflow graph ----
let seq = 0;
const nid = () => `tagerr00-0000-0000-0000-${String(++seq).padStart(12, '0')}`;
const node = (name, type, typeVersion, x, y, parameters, extra = {}) => ({ parameters, id: nid(), name, type, typeVersion, position: [x, y], ...extra });
const apiAuth = { authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth' };
const full = (timeout) => ({ timeout, response: { response: { fullResponse: true, neverError: true } } });
const RETRY3 = { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };
const ifEq = (name, x, y, expr, value) => node(name, 'n8n-nodes-base.if', 2.2, x, y, {
  conditions: { options: { version: 2, leftValue: '', caseSensitive: true, typeValidation: 'strict' }, combinator: 'and',
    conditions: [{ id: '1', leftValue: expr, rightValue: value, operator: { type: 'string', operation: 'equals' } }] },
  options: {} });
const wait = (name, x, y, expr) => node(name, 'n8n-nodes-base.wait', 1.1, x, y, { amount: expr, unit: 'seconds' }, { webhookId: `tag-err-${name.toLowerCase().replace(/\W+/g, '-')}` });

export function buildGraph({ slackWebhookUrl, retryIds, timing, canary = false }) {
  seq = 0;
  const slack = (name, x, y, textExpr) => canary
    ? node(name, 'n8n-nodes-base.noOp', 1, x, y, {})
    : node(name, 'n8n-nodes-base.httpRequest', 4.2, x, y, {
      method: 'POST', url: `={{ $('Config').first().json.slackWebhookUrl }}`,
      sendBody: true, contentType: 'raw', rawContentType: 'application/json',
      body: `={{ JSON.stringify({ text: ${textExpr} }) }}`, options: { timeout: 30000 } }, RETRY3);
  const getExec = (name, x, y) => node(name, 'n8n-nodes-base.httpRequest', 4.2, x, y, {
    url: `={{ $('Config').first().json.n8nBaseUrl }}/api/v1/executions/{{ $('Decide').first().json.execId }}`,
    ...apiAuth, options: full(30000) }, { ...RETRY3, credentials: { httpHeaderAuth: API_CRED } });

  const nodes = [
    node('Error Trigger', 'n8n-nodes-base.errorTrigger', 1, 0, 300, {}),
    node('Config', 'n8n-nodes-base.set', 3.4, 220, 300, { assignments: { assignments: [
      ['slackWebhookUrl', slackWebhookUrl], ['n8nBaseUrl', N8N_BASE], ['retryWorkflowIds', retryIds.join(',')],
      ['waitsSeconds', timing.waitsSeconds], ['checksSeconds', timing.checksSeconds], ['apiCredName', API_CRED.name], ['header', HEADER],
    ].map(([name, value], i) => ({ id: `c${i + 1}`, name, value, type: 'string' })) }, includeOtherFields: false, options: {} }),
    node('Fetch Executions', 'n8n-nodes-base.httpRequest', 4.2, 440, 300, {
      url: `={{ $('Config').first().json.n8nBaseUrl }}/api/v1/executions?workflowId={{ $('Error Trigger').first().json.workflow.id }}&limit=100`,
      ...apiAuth, options: full(30000) }, { ...RETRY3, credentials: { httpHeaderAuth: API_CRED }, onError: 'continueRegularOutput' }),
    node('Decide', 'n8n-nodes-base.code', 2, 660, 300, { jsCode: DECIDE }),
    ifEq('Retry?', 880, 300, '={{ $json.action }}', 'retry'),
    slack('Slack Retrying', 1100, 200, `$('Decide').first().json.slackText`),
    wait('Back Off', 1320, 200, `={{ $('Decide').first().json.waitSeconds }}`),
    node('Retry Execution', 'n8n-nodes-base.httpRequest', 4.2, 1540, 200, {
      method: 'POST', url: `={{ $('Config').first().json.n8nBaseUrl }}/api/v1/executions/{{ $('Decide').first().json.execId }}/retry`,
      ...apiAuth, sendBody: true, specifyBody: 'json', jsonBody: '{ "loadWorkflow": false }', options: full(100000) },
      { credentials: { httpHeaderAuth: API_CRED }, onError: 'continueRegularOutput' }),
    wait('Check Delay 1', 1760, 200, `={{ Number(String($('Config').first().json.checksSeconds).split(',')[0]) }}`),
    getExec('Check Original 1', 1980, 200),
    node('Outcome 1', 'n8n-nodes-base.code', 2, 2200, 200, { jsCode: outcome(1) }),
    ifEq('Recovered 1?', 2420, 120, '={{ $json.outcome }}', 'recovered'),
    slack('Slack Recovered 1', 2640, 40, `$json.slackText`),
    ifEq('Pending?', 2640, 200, '={{ $json.outcome }}', 'pending'),
    wait('Check Delay 2', 2860, 160, `={{ Number(String($('Config').first().json.checksSeconds).split(',')[1]) }}`),
    getExec('Check Original 2', 3080, 160),
    node('Outcome 2', 'n8n-nodes-base.code', 2, 3300, 160, { jsCode: outcome(2) }),
    ifEq('Recovered 2?', 3520, 160, '={{ $json.outcome }}', 'recovered'),
    slack('Slack Recovered 2', 3740, 160, `$json.slackText`),
    ifEq('Not Started?', 2860, 300, '={{ $json.outcome }}', 'not-started'),
    slack('Slack Not Started', 3080, 300, `$json.slackText`),
    ifEq('Alert?', 1100, 420, `={{ $('Decide').first().json.action }}`, 'alert'),
    slack('Slack Alert', 1320, 420, `$('Decide').first().json.slackText`),
  ];
  const c = {};
  const link = (from, to, out = 0) => { c[from] ||= { main: [] }; while (c[from].main.length <= out) c[from].main.push([]); c[from].main[out].push({ node: to, type: 'main', index: 0 }); };
  link('Error Trigger', 'Config'); link('Config', 'Fetch Executions'); link('Fetch Executions', 'Decide'); link('Decide', 'Retry?');
  link('Retry?', 'Slack Retrying', 0); link('Retry?', 'Alert?', 1);
  link('Slack Retrying', 'Back Off'); link('Back Off', 'Retry Execution'); link('Retry Execution', 'Check Delay 1');
  link('Check Delay 1', 'Check Original 1'); link('Check Original 1', 'Outcome 1'); link('Outcome 1', 'Recovered 1?');
  link('Recovered 1?', 'Slack Recovered 1', 0); link('Recovered 1?', 'Pending?', 1);
  link('Pending?', 'Check Delay 2', 0); link('Pending?', 'Not Started?', 1);
  link('Check Delay 2', 'Check Original 2'); link('Check Original 2', 'Outcome 2'); link('Outcome 2', 'Recovered 2?');
  link('Recovered 2?', 'Slack Recovered 2', 0);
  link('Not Started?', 'Slack Not Started', 0);
  link('Alert?', 'Slack Alert', 0);
  return { nodes, connections: c };
}

// ---- Offline selftest of the two Code nodes (no network) ----
function selftest() {
  const cfg = { retryWorkflowIds: 'WF_ENGINE', waitsSeconds: PROD.waitsSeconds, checksSeconds: PROD.checksSeconds, apiCredName: API_CRED.name, header: HEADER, n8nBaseUrl: N8N_BASE };
  const run = (code, data, $json) => new Function('$', '$json', code)((n) => ({ first: () => ({ json: data[n] }) }), $json)[0].json;
  const decide = ({ wfId = 'WF_ENGINE', mode = 'trigger', id = '900', retryOf, httpCode = '500', list = [], listStatus = 200 }) => run(DECIDE, {
    Config: cfg,
    'Error Trigger': { workflow: { id: wfId, name: 'Blog Post Engine' }, execution: { id, mode, retryOf, url: 'https://x/e/' + id, lastNodeExecuted: 'Get Next Topic',
      error: { message: 'The service was not able to process your request', description: 'Cross-cell memcached access is not allowed', httpCode, stack: 'NodeApiError\n at x' } } },
    'Fetch Executions': listStatus === 200 ? { statusCode: 200, body: { data: list } } : { statusCode: listStatus, body: { message: 'unauthorized' } },
  });
  const chain = [{ id: '900', retryOf: null }, { id: '901', retryOf: '900' }, { id: '902', retryOf: '901' }, { id: '903', retryOf: '902' }];
  const out = (stage, post, orig) => run(outcome(stage), { Config: cfg, Decide: { workflowName: 'Blog Post Engine', workflowId: 'WF_ENGINE', execId: '900', attempt: 0 }, 'Retry Execution': post }, orig);
  const cases = [
    ['Notion 500 on first failure -> retry in 15 min', decide({ list: chain.slice(0, 1) }), (r) => r.action === 'retry' && r.waitSeconds === 900 && r.attempt === 0 && r.slackText.includes('re-run 1 of 3') && !r.slackText.includes('undefined')],
    ['second failure (re-run 1 failed) -> retry in 45 min', decide({ id: '901', mode: 'retry', retryOf: '900', list: chain.slice(0, 2) }), (r) => r.action === 'retry' && r.waitSeconds === 2700 && r.attempt === 1],
    ['re-run 3 failed -> give up loudly', decide({ id: '903', mode: 'retry', retryOf: '902', list: chain }), (r) => r.action === 'alert' && r.slackText.includes('still failing after 3')],
    ['timeout code ECONNABORTED -> retry', decide({ httpCode: 'ECONNABORTED' }), (r) => r.action === 'retry'],
    ['429 -> retry', decide({ httpCode: '429' }), (r) => r.action === 'retry'],
    ['404 -> alert, not retried', decide({ httpCode: '404' }), (r) => r.action === 'alert' && r.reason.includes('404')],
    ['code-node error (no httpCode) -> alert', decide({ httpCode: null }), (r) => r.action === 'alert' && r.reason.includes('not an HTTP error')],
    ['workflow not on list -> alert', decide({ wfId: 'OTHER' }), (r) => r.action === 'alert' && r.reason.includes('not on the auto-retry list')],
    ['execution history unreadable (401) -> alert naming credential', decide({ listStatus: 401 }), (r) => r.action === 'alert' && r.reason.includes(API_CRED.name)],
    ['already re-run -> skip', decide({ list: chain.slice(0, 2) }), (r) => r.action === 'skip'],
    ['Slack text has a backtick-quoted node name', decide({}), (r) => r.slackText.includes('`Get Next Topic`')],
    ['outcome: retrySuccessId set -> recovered', out(1, { statusCode: 524 }, { statusCode: 200, body: { retrySuccessId: '905' } }), (r) => r.outcome === 'recovered' && r.slackText.includes('/executions/905')],
    ['outcome: 524 and nothing yet -> pending', out(1, { statusCode: 524 }, { statusCode: 200, body: { retrySuccessId: null } }), (r) => r.outcome === 'pending'],
    ['outcome: client timeout -> pending', out(1, { error: { message: 'timeout of 100000ms exceeded' } }, { statusCode: 200, body: {} }), (r) => r.outcome === 'pending'],
    ['outcome: re-run returned error -> failed-again, silent', out(1, { statusCode: 200, body: { status: 'error' } }, { statusCode: 200, body: {} }), (r) => r.outcome === 'failed-again' && !r.slackText],
    ['outcome: 401 on retry call -> not-started alert', out(1, { statusCode: 401, body: {} }, { statusCode: 401, body: {} }), (r) => r.outcome === 'not-started' && r.slackText.includes('HTTP 401')],
    ['outcome stage 2: still nothing -> unknown, silent', out(2, { statusCode: 524 }, { statusCode: 200, body: {} }), (r) => r.outcome === 'unknown' && !r.slackText],
  ];
  let fail = 0;
  for (const [name, r, ok] of cases) { const pass = ok(r); if (!pass) fail++; console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${pass ? '' : '  ' + JSON.stringify(r)}`); }
  const g = buildGraph({ slackWebhookUrl: 'https://hooks.slack.com/x', retryIds: RETRY_IDS, timing: PROD });
  const names = new Set(g.nodes.map((n) => n.name));
  const dangling = Object.entries(g.connections).flatMap(([from, v]) => [from, ...v.main.flat().map((c) => c.node)]).filter((n) => !names.has(n));
  const exprs = JSON.stringify(g.nodes.map((n) => n.parameters)).match(/={{[^"]*}}/g) || [];
  const badExpr = exprs.filter((e) => /`/.test(e) || (e.match(/{{/g) || []).length !== (e.match(/}}/g) || []).length);
  console.log(`${dangling.length ? 'FAIL' : 'PASS'} graph has no dangling connections${dangling.length ? ': ' + dangling : ''}`);
  console.log(`${badExpr.length ? 'FAIL' : 'PASS'} ${exprs.length} expressions: no backticks, balanced {{ }}${badExpr.length ? ': ' + badExpr : ''}`);
  if (fail || dangling.length || badExpr.length) process.exit(1);
}

// ---- CLI ----
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ci = args.indexOf('--canary');

if (args.includes('--selftest')) {
  selftest();
} else if (ci >= 0) {
  const targets = String(args[ci + 1] || '').split(',').filter(Boolean);
  if (!targets.length) throw new Error('--canary needs comma-separated target workflow ids');
  const g = buildGraph({ slackWebhookUrl: 'canary-no-slack', retryIds: targets, timing: CANARY, canary: true });
  const created = await api('POST', '/workflows', { name: 'zz CANARY error retry (delete me)', ...g, settings: { executionOrder: 'v1', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all' } });
  await api('POST', `/workflows/${created.id}/activate`);
  for (const t of targets) await patchLive(t, (wf) => { wf.settings.errorWorkflow = created.id; return [`errorWorkflow -> ${created.id}`]; }, { apply: true });
  console.log(`CANARY error workflow ${created.id} (active). Targets now report to it: ${targets.join(', ')}`);
} else {
  const live = await api('GET', `/workflows/${ERROR_WF_ID}`);
  const slackWebhookUrl = live.nodes.find((n) => n.name === 'Config')?.parameters?.assignments?.assignments?.find((a) => a.name === 'slackWebhookUrl')?.value;
  if (!/^https:\/\/hooks\.slack\.com\//.test(slackWebhookUrl || '')) throw new Error('could not read the live Slack webhook from the Config node');
  const g = buildGraph({ slackWebhookUrl, retryIds: RETRY_IDS, timing: PROD });
  await patchLive(ERROR_WF_ID, (wf) => {
    if (JSON.stringify(wf.nodes.map((n) => [n.name, n.parameters])) === JSON.stringify(g.nodes.map((n) => [n.name, n.parameters]))) return [];
    wf.nodes = g.nodes; wf.connections = g.connections;
    return [`replace ${live.nodes.length} nodes with ${g.nodes.length} (delayed re-runs for ${RETRY_IDS.length} workflows, ${PROD.waitsSeconds}s back-off)`];
  }, { apply: APPLY });
  if (APPLY) {
    const local = buildGraph({ slackWebhookUrl: 'REPLACE_WITH_SLACK_WEBHOOK_URL', retryIds: RETRY_IDS, timing: PROD });
    for (const n of local.nodes) if (n.credentials) n.credentials.httpHeaderAuth = { id: 'REPLACE_WITH_N8N_API_CREDENTIAL_ID', name: API_CRED.name };
    writeFileSync('n8n/error-trigger.json', JSON.stringify({ name: live.name, ...local, settings: { executionOrder: 'v1' } }, null, 2) + '\n');
    console.log('  wrote n8n/error-trigger.json (placeholders for Slack URL + credential id)');
  }
}
