// Idempotent updater (same pattern as update-engine-*.mjs): switches the Blog
// Post Engine to 7-day posting and adds a "no Queued topic" Slack alert.
//
// Part B of the Session-27 QA/scheduling plan. Two changes:
//  1. Schedule Trigger cron `0 8 * * 1-5` -> `0 8 * * *` (every day, same slot).
//  2. A SIDE BRANCH off "Get Next Topic": an IF "Queue Empty?" (results.length == 0)
//     -> "Slack Queue Empty". This is purely additive — the existing
//     Get Next Topic -> Parse Topic happy path is left untouched, so the alert can
//     NEVER break post generation. On a non-empty queue the IF's true-output has no
//     items and Slack does not fire; on an empty queue it pings the same webhook the
//     success notification uses (from the Config node).
//
//   node n8n/update-engine-daily-and-empty-alert.mjs        # writes blog-post-engine.json
// then deploy:
//   node --env-file=../restaurant-outreach/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const IF_NODE = 'Queue Empty?';
const SLACK_NODE = 'Slack Queue Empty';
let changed = [];

// ---- 1. cron -> daily -------------------------------------------------------
const sched = wf.nodes.find((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
if (!sched) throw new Error('Schedule Trigger node not found.');
const interval = sched.parameters?.rule?.interval?.[0];
if (!interval || interval.field !== 'cronExpression') throw new Error('Unexpected Schedule Trigger shape.');
if (interval.expression !== '0 8 * * *') {
  if (interval.expression !== '0 8 * * 1-5')
    console.warn(`Note: cron was "${interval.expression}", expected "0 8 * * 1-5". Setting to daily anyway.`);
  interval.expression = '0 8 * * *';
  changed.push('cron -> 0 8 * * *');
} else {
  console.log('cron already daily (0 8 * * *).');
}

// ---- 2. empty-queue alert side branch (idempotent) --------------------------
const haveIf = wf.nodes.some((n) => n.name === IF_NODE);
const haveSlack = wf.nodes.some((n) => n.name === SLACK_NODE);

if (!haveIf || !haveSlack) {
  const getNext = wf.nodes.find((n) => n.name === 'Get Next Topic');
  if (!getNext) throw new Error('"Get Next Topic" node not found.');
  const [gx, gy] = getNext.position || [680, 300];

  if (!haveIf) {
    wf.nodes.push({
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
          conditions: [
            {
              id: 'cond-empty-queue',
              // Get Next Topic returns the raw Notion query response; .results is the page array.
              leftValue: '={{ ($json.results || []).length }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'equals' },
            },
          ],
          combinator: 'and',
        },
        options: {},
      },
      id: 'tag00001-0000-0000-0000-0000000000fe',
      name: IF_NODE,
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [gx + 220, gy + 220],
    });
    changed.push(`added "${IF_NODE}" IF node`);
  }

  if (!haveSlack) {
    wf.nodes.push({
      parameters: {
        method: 'POST',
        url: "={{ $('Config').first().json.slackWebhookUrl }}",
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
        sendBody: true,
        contentType: 'raw',
        rawContentType: 'application/json',
        // No em/en dashes (Ian's hard rule); no `{{`/backticks inside (n8n tokenizer).
        body: "={{ JSON.stringify({ text: ':warning: *Blog engine: no Queued topic today.* The daily run found an empty Content Calendar queue, so no post was generated. Flip a Suggested topic to Queued (or run the backlog builder) to resume daily publishing.' }) }}",
        options: { timeout: 30000 },
      },
      id: 'tag00001-0000-0000-0000-0000000000fd',
      name: SLACK_NODE,
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [gx + 440, gy + 220],
    });
    changed.push(`added "${SLACK_NODE}" node`);
  }
}

// ---- 3. connections (additive; happy path untouched) ------------------------
wf.connections = wf.connections || {};
// Get Next Topic -> (existing) Parse Topic + (new) Queue Empty?
const gn = (wf.connections['Get Next Topic'] ||= { main: [[]] });
gn.main[0] ||= [];
if (!gn.main[0].some((c) => c.node === 'Parse Topic'))
  throw new Error('Expected Get Next Topic -> Parse Topic connection missing; aborting to avoid corrupting the happy path.');
if (!gn.main[0].some((c) => c.node === IF_NODE)) {
  gn.main[0].push({ node: IF_NODE, type: 'main', index: 0 });
  changed.push('wired Get Next Topic -> Queue Empty?');
}
// Queue Empty? true-output (index 0) -> Slack Queue Empty; false-output (index 1) -> nothing
const ifc = (wf.connections[IF_NODE] ||= { main: [[], []] });
ifc.main[0] ||= [];
ifc.main[1] ||= [];
if (!ifc.main[0].some((c) => c.node === SLACK_NODE)) {
  ifc.main[0].push({ node: SLACK_NODE, type: 'main', index: 0 });
  changed.push('wired Queue Empty? [true] -> Slack Queue Empty');
}

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n', 'utf8');
console.log(changed.length ? `Updated blog-post-engine.json:\n  - ${changed.join('\n  - ')}` : 'No changes (already up to date).');
console.log(`Node count: ${wf.nodes.length}`);
