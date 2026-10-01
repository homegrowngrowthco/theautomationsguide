// Idempotent updater: the Daily Briefing flags Content Calendar topics stuck in "Generating".
//
// Why: the engine marks a topic Generating BEFORE its ~3 minutes of LLM work. If a run dies
// after that and the error workflow's delayed re-runs are exhausted, the topic sits in
// Generating forever: Get Next Topic only reads Queued, so nothing picks it up again and
// nothing says so. A fresh manual re-trigger makes it worse, because it claims the NEXT
// topic. Flagging anything in Generating for 3h+ (longer than the engine run plus the full
// re-run back-off) turns that silent strand into a morning line item: set it back to Queued.
//
// Also syncs the committed daily-briefing.json Build Briefing code to live (the committed
// copy was missing the "🤖 *The Automations Guide*" header line).
//
// Usage (from repo root):
//   node --env-file=../growth-engine/.env n8n/update-briefing-stuck-generating.mjs           # dry run
//   node --env-file=../growth-engine/.env n8n/update-briefing-stuck-generating.mjs --apply
// Re-running is a no-op. Revert: node n8n/live-patch.mjs --restore <backup> --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { patchLive } from './live-patch.mjs';

const ID = 'HbCayxHdzdYdfvfP';
const FILE = 'n8n/daily-briefing.json';
const MARK = 'stuck in Generating';

const EDITS = {
  'Get Topics State': ['body', [[
    "{ property: 'Status', select: { equals: 'Queued' } }] }",
    "{ property: 'Status', select: { equals: 'Queued' } }, { property: 'Status', select: { equals: 'Generating' } }] }",
  ]]],
  'Build Briefing': ['jsCode', [
    [
      "const queued = topics.filter(t => sel(t.properties?.Status) === 'Queued');\n",
      "const queued = topics.filter(t => sel(t.properties?.Status) === 'Queued');\n"
      + '// A topic left in Generating means an engine run died after claiming it and its re-runs ran out.\n'
      + '// Nothing picks it up again on its own (Get Next Topic reads only Queued). 3h clears a normal run\n'
      + '// plus the error workflow\'s full 15m/45m/2h re-run back-off.\n'
      + 'const STUCK_MS = 3 * 60 * 60 * 1000;\n'
      + "const stuck = topics.filter(t => sel(t.properties?.Status) === 'Generating' && Date.now() - Date.parse(t.last_edited_time) > STUCK_MS);\n",
    ],
    [
      'const totalPending = contentPRs.length + suggested.length',
      'const totalPending = stuck.length + contentPRs.length + suggested.length',
    ],
    [
      'const sections = [];\n',
      'const sections = [];\n\n'
      + 'if (stuck.length > 0) {\n'
      + "  const lines = stuck.slice(0, 5).map(t => `   • <${t.url}|${text(t.properties?.Topic || t.properties?.Name)}>`);\n"
      + "  sections.push(`:warning: *${stuck.length} topic${stuck.length === 1 ? '' : 's'} " + MARK + "* (an engine run died after claiming ${stuck.length === 1 ? 'it' : 'them'}). Set Status back to Queued to retry.\\n${lines.join('\\n')}`);\n"
      + '}\n',
    ],
  ]],
};

function edit(wf) {
  const changes = [];
  for (const [name, [field, pairs]] of Object.entries(EDITS)) {
    const p = wf.nodes.find((n) => n.name === name)?.parameters;
    if (!p || typeof p[field] !== 'string') throw new Error(`node "${name}".${field} not found`);
    if (p[field].includes('Generating')) continue; // already patched
    let s = p[field];
    for (const [from, to] of pairs) {
      if (s.split(from).length !== 2) throw new Error(`"${name}": anchor not found exactly once: ${from.slice(0, 60)}`);
      s = s.replace(from, to);
    }
    p[field] = s;
    changes.push(`${name}.${field}: ${pairs.length} edit(s)`);
  }
  return changes;
}

// --selftest: run the patched Build Briefing code against fixtures (no live write, no Slack).
if (process.argv.includes('--selftest')) {
  const wf = JSON.parse(readFileSync(FILE, 'utf8'));
  edit(wf);
  const code = wf.nodes.find((n) => n.name === 'Build Briefing').parameters.jsCode;
  const now = Date.now();
  const topic = (name, status, hoursAgo) => ({ url: `https://notion.so/${name.replace(/ /g, '-')}`, last_edited_time: new Date(now - hoursAgo * 3600e3).toISOString(),
    properties: { Status: { select: { name: status } }, Topic: { title: [{ plain_text: name }] } } });
  const run = (topics) => {
    const data = { Config: { slackWebhookUrl: 'x' }, 'Get Open PRs': [], 'Get Topics State': { results: topics }, 'Get Pending Drafts': { results: [] } };
    return new Function('$', 'console', code)((n) => ({ first: () => ({ json: data[n] }) }), { log() {} })[0].json;
  };
  const a = run([topic('Old stuck one', 'Generating', 5), topic('Running now', 'Generating', 1), topic('Next up', 'Queued', 30)]);
  const b = run([topic('Running now', 'Generating', 1)]);
  const checks = [
    ['stuck topic listed', a.message?.includes('1 topic ' + MARK) && a.message.includes('Old stuck one')],
    ['in-flight topic not flagged', !a.message?.includes('Running now')],
    ['stuck counts toward pending', a.totalPending === 1],
    ['nothing stuck: no post', b.skip === true],
  ];
  for (const [n, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`);
  if (checks.some(([, ok]) => !ok)) { console.log(a.message); process.exit(1); }
  process.exit(0);
}

const APPLY = process.argv.includes('--apply');
const { live, next, verified } = await patchLive(ID, edit, { apply: APPLY });
const target = verified || next || live;

// Sync the committed JSON: replace each edited parameter string with the live one, as a
// JSON-string literal swap so the rest of the file's formatting is untouched.
let text = readFileSync(FILE, 'utf8');
const local = JSON.parse(text);
let synced = 0;
for (const [name, [field]] of Object.entries(EDITS)) {
  const from = local.nodes.find((n) => n.name === name).parameters[field];
  const to = target.nodes.find((n) => n.name === name).parameters[field];
  if (from === to) continue;
  const lit = JSON.stringify(from);
  if (text.split(lit).length !== 2) throw new Error(`${FILE}: could not locate "${name}".${field} literal exactly once`);
  text = text.replace(lit, () => JSON.stringify(to));
  local.nodes.find((n) => n.name === name).parameters[field] = to;
  synced++;
}
if (synced) {
  if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(local)) throw new Error(`${FILE}: text swap did not produce the intended object`);
  if (APPLY || !next) writeFileSync(FILE, text);
}
console.log(`  local ${FILE}: ${synced ? `${APPLY || !next ? 'synced' : 'would sync'} ${synced} field(s)` : 'already in sync'}`);
