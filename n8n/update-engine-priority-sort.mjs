// Idempotent engine updater: fix the inverted Priority sort in "Get Next Topic".
//
// Why: Notion sorts a select property by its option order (High, Medium, Low),
// so direction 'descending' reads Low -> Medium -> High. The engine had been
// draining the queue LOWEST priority first: five Low posts published 8/10-8/14
// and Mediums 8/15-8/19 while all 17 High topics (queued since June) starved.
// 'ascending' = option order = High first, which is what was always intended.
// Created stays ascending as the FIFO tiebreak within a priority band.
//
// Usage:  node n8n/update-engine-priority-sort.mjs      (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'n8n/blog-post-engine.json';
const OLD = "{ property: 'Priority', direction: 'descending' }";
const NEW = "{ property: 'Priority', direction: 'ascending' }";

const wf = JSON.parse(readFileSync(FILE, 'utf-8'));
const node = wf.nodes.find((n) => n.name === 'Get Next Topic');
if (!node?.parameters?.body) {
  console.error('Could not find Get Next Topic node body. Aborting.');
  process.exit(1);
}

if (node.parameters.body.includes(NEW)) {
  console.log('Already patched (Priority sort is ascending). No-op.');
  process.exit(0);
}
if (!node.parameters.body.includes(OLD)) {
  console.error('Get Next Topic: descending Priority sort anchor not found; structure changed. Aborting.');
  process.exit(1);
}

// Token-count guard: swapping one word must not touch braces/backticks.
const tok = (s) => ({
  open: (s.match(/\{\{/g) || []).length,
  close: (s.match(/\}\}/g) || []).length,
  tick: (s.match(/`/g) || []).length,
});
const before = tok(node.parameters.body);
node.parameters.body = node.parameters.body.replace(OLD, NEW);
const after = tok(node.parameters.body);
if (before.open !== after.open || before.close !== after.close || before.tick !== after.tick) {
  console.error('ABORT: brace/backtick token count changed.');
  process.exit(1);
}

const serialized = JSON.stringify(wf, null, 2);
JSON.parse(serialized); // round-trip sanity
writeFileSync(FILE, serialized, 'utf-8');
console.log('Patched Get Next Topic: Priority sort descending -> ascending (High first).');
console.log('Next: node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply');
