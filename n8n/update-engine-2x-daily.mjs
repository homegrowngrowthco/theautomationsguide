// Idempotent engine updater: add a second daily publish run (volume-ramp gate cleared 9/16).
//
// Why: the 8/04 growth audit's C-5 rule was "revisit 2/day at first sustained 10-click
// week." The trailing week (9/7-9/13) hit 17 clicks across 5 distinct days (prior best
// was 9) - Ian's call 9/16 was to bump cadence now rather than wait a confirming week.
//
// Adds a second cron interval to the existing "Weekday 8am" scheduleTrigger node
// (despite its name it already fires every day: "0 8 * * *") rather than renaming the
// node or touching downstream logic - the node's single output still feeds the same
// "Get Next Topic" chain, so each trigger fire independently pulls and publishes the
// next Queued topic. 8am / 4pm ET, 8 hours apart, well clear of any single run's
// expected duration.
//
// Usage:  node n8n/update-engine-2x-daily.mjs      (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'n8n/blog-post-engine.json';

const wf = JSON.parse(readFileSync(FILE, 'utf-8'));
const node = wf.nodes.find((n) => n.name === 'Weekday 8am' && n.type === 'n8n-nodes-base.scheduleTrigger');
if (!node?.parameters?.rule?.interval) {
  console.error('Could not find the scheduleTrigger node\'s rule.interval array. Aborting.');
  process.exit(1);
}

const intervals = node.parameters.rule.interval;
const already = intervals.some((i) => i.field === 'cronExpression' && i.expression === '0 16 * * *');
if (already) {
  console.log('Already patched (0 16 * * * present). No-op.');
  process.exit(0);
}

const morning = intervals.find((i) => i.field === 'cronExpression' && i.expression === '0 8 * * *');
if (!morning) {
  console.error('Expected morning cron "0 8 * * *" not found; structure changed. Aborting.');
  process.exit(1);
}

intervals.push({ field: 'cronExpression', expression: '0 16 * * *' });

const serialized = JSON.stringify(wf, null, 2);
JSON.parse(serialized); // round-trip sanity
writeFileSync(FILE, serialized, 'utf-8');
console.log('Patched Weekday 8am: added a second cron interval, 0 16 * * * (4pm ET).');
console.log('Next: node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply');
