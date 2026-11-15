// Idempotent engine updater: back to ONE publish run a day (8am ET), dropping the 4pm run
// that update-engine-2x-daily.mjs added on 2026-09-16.
//
// Why (Ian, 2026-11-15, op #1633, audits/AUDIT-GROWTH-2026-11-15.md): 134 posts went out in
// 12 weeks and search clicks outside the MoltSets pages stayed flat (39, 52, 43 per 28 days),
// while outside evidence names two AI-drafted posts a day on a young domain as the main risk.
//
// Patches the LIVE workflow in place through live-patch.mjs (backup to ~/.n8n-backups, PUT,
// GET-verify), then removes the same interval from the committed JSON without reflowing it.
// n8n/watchdog.mjs reads the cron from the live node, so it needs no edit.
//
// Usage (N8N_API_URL + N8N_API_KEY in the env; the HGC-instance key lives in growth-engine/.env):
//   node n8n/update-engine-1x-daily.mjs --selftest                                   # offline
//   node --env-file=<growth-engine/.env> n8n/update-engine-1x-daily.mjs              # dry run
//   node --env-file=<growth-engine/.env> n8n/update-engine-1x-daily.mjs --apply      # backup, PUT, verify, sync JSON
// Re-running is a no-op.
// Revert: node --env-file=<growth-engine/.env> n8n/live-patch.mjs --restore <backup> --apply,
// then restore n8n/blog-post-engine.json from git.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const ID = 'sjZADhZGIuz9tZHK';
const KEEP = '0 8 * * *';
const DROP = '0 16 * * *';

const cronsOf = (wf) => wf.nodes
  .filter((n) => n.type === 'n8n-nodes-base.scheduleTrigger')
  .flatMap((n) => (n.parameters?.rule?.interval || []).filter((i) => i.field === 'cronExpression').map((i) => i.expression));

// Object-level edit, shared by the live patch and the selftest. Returns the change list
// (empty when already patched); throws when the schedule is not the shape it expects.
export function dropAfternoonRun(wf) {
  const nodes = wf.nodes.filter((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  if (nodes.length !== 1) throw new Error(`expected 1 scheduleTrigger node, found ${nodes.length}`);
  const intervals = nodes[0].parameters?.rule?.interval;
  if (!Array.isArray(intervals)) throw new Error('scheduleTrigger has no rule.interval array');
  if (!intervals.some((i) => i.field === 'cronExpression' && i.expression === KEEP)) throw new Error(`morning cron "${KEEP}" not found; schedule changed, aborting`);
  const kept = intervals.filter((i) => !(i.field === 'cronExpression' && i.expression === DROP));
  if (kept.length === intervals.length) return [];
  if (kept.length !== intervals.length - 1) throw new Error(`"${DROP}" appears more than once`);
  nodes[0].parameters.rule.interval = kept;
  return [`${nodes[0].name}: removed cron "${DROP}" (4pm ET); kept "${KEEP}" (8am ET)`];
}

// Text-level edit of the committed JSON: cut the one interval object, keep every other byte.
export function dropFromText(text) {
  const re = /,(\r?\n)([ \t]*)\{\r?\n[ \t]*"field": "cronExpression",\r?\n[ \t]*"expression": "0 16 \* \* \*"\r?\n[ \t]*\}/;
  const hits = text.match(new RegExp(re.source, 'g')) || [];
  if (hits.length === 0) return { text, changed: false };
  if (hits.length !== 1) throw new Error(`expected 1 "${DROP}" interval in the file, found ${hits.length}`);
  return { text: text.replace(re, ''), changed: true };
}

if (process.argv.includes('--selftest')) {
  const fails = [];
  const t = (name, ok) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) fails.push(name); };
  const wf = () => ({ nodes: [{ name: 'Weekday 8am', type: 'n8n-nodes-base.scheduleTrigger', parameters: { rule: { interval: [
    { field: 'cronExpression', expression: KEEP }, { field: 'cronExpression', expression: DROP }] } } }, { name: 'x', type: 'n8n-nodes-base.code' }] });
  const a = wf();
  t('removes the 4pm run and keeps the 8am run', dropAfternoonRun(a).length === 1 && cronsOf(a).join('|') === KEEP);
  t('a second pass is a no-op', dropAfternoonRun(a).length === 0 && cronsOf(a).join('|') === KEEP);
  const noMorning = wf(); noMorning.nodes[0].parameters.rule.interval.shift();
  let threw = false; try { dropAfternoonRun(noMorning); } catch { threw = true; }
  t('aborts when the morning cron is missing', threw);
  const src = JSON.stringify(wf(), null, 2);
  const cut = dropFromText(src);
  t('the text edit yields the same object as the object edit', cut.changed && JSON.stringify(JSON.parse(cut.text)) === JSON.stringify(a));
  t('the text edit survives CRLF', JSON.stringify(JSON.parse(dropFromText(src.replace(/\n/g, '\r\n')).text)) === JSON.stringify(a));
  t('the text edit is a no-op on a patched file', dropFromText(cut.text).changed === false);
  const committed = cronsOf(JSON.parse(readFileSync(FILE, 'utf8')));
  t(`the committed engine has a known schedule (${committed.join(' | ')})`, committed.includes(KEEP) && committed.every((c) => c === KEEP || c === DROP));
  console.log(`update-engine-1x-daily selftest: ${fails.length ? 'FAIL' : 'PASS'}`);
  process.exit(fails.length ? 1 : 0);
}

const { patchLive, api } = await import('./live-patch.mjs');
const APPLY = process.argv.includes('--apply');
const { live, changed } = await patchLive(ID, dropAfternoonRun, { apply: APPLY });
console.log(`  live crons before: ${cronsOf(live).join(' | ')}; active ${live.active}; nodes ${live.nodes.length}`);
let liveIsPatched = !changed;
if (APPLY && changed) {
  const after = cronsOf(await api('GET', `/workflows/${ID}`));
  console.log(`  live crons after:  ${after.join(' | ')}`);
  if (after.join('|') !== KEEP) throw new Error('live schedule is not the single 8am cron after the PUT');
  liveIsPatched = true;
}

// Sync the committed JSON only once live is in the new state.
const before = readFileSync(FILE, 'utf8');
const { text, changed: fileChanged } = dropFromText(before);
if (fileChanged) {
  const expected = JSON.parse(before);
  dropAfternoonRun(expected);
  if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(expected)) throw new Error(`${FILE}: text edit does not match the intended object; not writing`);
  if (liveIsPatched) writeFileSync(FILE, text);
}
console.log(`  local n8n/blog-post-engine.json: ${fileChanged ? (liveIsPatched ? 'synced' : 'would sync on --apply') : 'already in sync'}`);
