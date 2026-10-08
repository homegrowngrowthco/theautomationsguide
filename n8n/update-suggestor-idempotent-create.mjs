// Make the Topic Suggestor safe to retry (Session 108, 2026-10-08).
//
// Incident: the 10/08 11:30Z run hit a Notion 429 on the 4th of 5 "Create Suggestion in
// Notion" requests, after 3 pages were already created. The error workflow (retry stack
// layer 2) re-runs a failed node with ALL its saved input items, so the 15-min retry
// created all 5 again: 3 topics landed twice. Any multi-item create node has this shape;
// the engine's creates are single-item, so this was the one exposed case.
//
// This patch:
// 1. Inserts "Find Existing Title" (a read, safe to retry: Retry On Fail 3x 5s) that queries
//    the Content Calendar for each suggestion's exact title, and "Keep New Topics" (Code)
//    that drops any suggestion whose title already exists, in any status.
// 2. "Create Suggestion in Notion": onError continueRegularOutput, so a failed request
//    becomes an error item instead of failing the run. No failed run = no layer-2 re-run
//    = no duplicates. A dropped suggestion is reported in Slack, never retried.
//    Writes are spaced 1 per second (was 400 ms).
// 3. "Build Slack Message" counts the pages actually created (was: every parsed suggestion).
//
// Usage (from the TAG repo root):
//   node n8n/update-suggestor-idempotent-create.mjs --dry   report only (repo JSON)
//   node n8n/update-suggestor-idempotent-create.mjs         writes n8n/topic-suggestor.json
//   node --env-file=../growth-engine/.env n8n/update-suggestor-idempotent-create.mjs --live [--apply]
//        patches the LIVE workflow via live-patch.mjs (dry unless --apply; backup in ~/.n8n-backups/)
// Re-running is a no-op. Revert live: node n8n/live-patch.mjs --restore <backup.json> --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { patchLive } from './live-patch.mjs';

const SUGGESTOR_ID = 'vfEeiQg3TsPlD24J';
const path = 'n8n/topic-suggestor.json';
const DRY = process.argv.includes('--dry');
const LIVE = process.argv.includes('--live');
const APPLY = process.argv.includes('--apply');

const FIND = 'Find Existing Title';
const KEEP = 'Keep New Topics';
const CREATE = 'Create Suggestion in Notion';
const PARSE = 'Parse Suggestions';
const SLACK_MSG = 'Build Slack Message';

const keepCode = `// Drop any suggestion whose exact title already exists in the Content Calendar (any status).
// One input item per "Find Existing Title" query, paired back to its Parse Suggestions item.
const src = $('Parse Suggestions').all();
const out = [];
$input.all().forEach((it, i) => {
  const idx = it.pairedItem?.item ?? i;
  if (!src[idx]) throw new Error('No Parse Suggestions item for query ' + i);
  if ((it.json.results || []).length) return;
  out.push({ json: src[idx].json, pairedItem: { item: i } });
});
return out;`;

const slackCode = `// Summarise the pages actually created. "Create Suggestion in Notion" continues on error,
// so each input item is either a created page (object: 'page') or an error item.
const config = $('Config').first().json;
const items = $input.all().map(i => i.json);
const created = items.filter(j => j.object === 'page');
const failed = items.length - created.length;
const title = (p) => (p.properties?.Topic?.title || []).map(t => t.plain_text).join('');
let lines = created.map((p, i) => \`\${i + 1}. *\${title(p)}*, \${p.properties?.Priority?.select?.name || '?'} priority, \${p.properties?.Tag?.select?.name || '?'}\`).join('\\n');
if (failed) lines += \`\\n\\n:warning: \${failed} suggestion(s) were not created (Notion error). They are not retried, so no duplicates.\`;
return [{ json: {
  slackWebhookUrl: config.slackWebhookUrl,
  count: created.length,
  summary: lines,
  topicsDatabaseId: config.topicsDatabaseId,
}}];`;

function mutate(wf) {
  if (wf.nodes.some((n) => n.name === FIND)) return [];
  const byName = (name) => {
    const n = wf.nodes.find((x) => x.name === name);
    if (!n) throw new Error(`node "${name}" not found`);
    return n;
  };
  const create = byName(CREATE);
  const slackMsg = byName(SLACK_MSG);
  byName(PARSE);
  const wire = JSON.stringify(wf.connections[PARSE]?.main);
  if (wire !== JSON.stringify([[{ node: CREATE, type: 'main', index: 0 }]])) throw new Error(`unexpected ${PARSE} wiring: ${wire}`);
  if (create.onError) throw new Error(`${CREATE} already has onError=${create.onError}; edit by hand`);
  if (!slackMsg.parameters.jsCode.includes("$('Parse Suggestions').all()")) throw new Error(`${SLACK_MSG} code drifted; edit by hand`);

  const [x, y] = create.position;
  const find = {
    parameters: {
      method: 'POST',
      url: "=https://api.notion.com/v1/databases/{{ $json.topicsDatabaseId }}/query",
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: structuredClone(create.parameters.headerParameters),
      sendBody: true,
      contentType: 'raw',
      rawContentType: 'application/json',
      body: "={{ JSON.stringify({ filter: { property: 'Topic', title: { equals: $json.topic } }, page_size: 1 }) }}",
      options: { batching: { batch: { batchSize: 1, batchInterval: 1000 } }, timeout: 30000 },
    },
    id: randomUUID(),
    name: FIND,
    type: create.type,
    typeVersion: create.typeVersion,
    position: [x, y],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    credentials: structuredClone(create.credentials),
  };
  const keep = {
    parameters: { jsCode: keepCode },
    id: randomUUID(),
    name: KEEP,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [x + 220, y],
  };
  // Shift the create node and everything downstream of it right by two slots.
  for (const name of [CREATE, SLACK_MSG, 'Slack Notify']) {
    const n = wf.nodes.find((k) => k.name === name);
    if (n) n.position = [n.position[0] + 440, n.position[1]];
  }
  wf.nodes.push(find, keep);
  wf.connections[PARSE] = { main: [[{ node: FIND, type: 'main', index: 0 }]] };
  wf.connections[FIND] = { main: [[{ node: KEEP, type: 'main', index: 0 }]] };
  wf.connections[KEEP] = { main: [[{ node: CREATE, type: 'main', index: 0 }]] };

  create.onError = 'continueRegularOutput';
  create.parameters.options.batching.batch.batchInterval = 1000;
  slackMsg.parameters.jsCode = slackCode;

  return [
    `+ ${FIND} (exact-title query, Retry On Fail 3x 5s, 1 req/s) and + ${KEEP} (drops existing titles)`,
    `${PARSE} -> ${FIND} -> ${KEEP} -> ${CREATE}`,
    `${CREATE}: onError continueRegularOutput, batchInterval 400 -> 1000 ms`,
    `${SLACK_MSG}: counts created pages, reports failed ones`,
  ];
}

if (LIVE) {
  await patchLive(SUGGESTOR_ID, mutate, { apply: APPLY, label: '(idempotent create)' });
} else {
  const raw = readFileSync(path, 'utf-8');
  const doc = JSON.parse(raw);
  const roundTrip = JSON.stringify(doc, null, 2) === raw.replace(/\r\n/g, '\n').replace(/\n$/, '');
  const changes = mutate(doc);
  console.log(changes.length ? changes.map((c) => '  ~ ' + c).join('\n') : 'no changes (already patched)');
  if (!roundTrip) console.log('note: repo JSON is not in JSON.stringify(_, null, 2) form; the write will reformat it');
  if (DRY || !changes.length) process.exit(0);
  writeFileSync(path, JSON.stringify(doc, null, 2) + '\n', 'utf-8');
  console.log('written ' + path);
}
