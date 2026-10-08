// Idempotent engine updater: the content PR's description still told the reader to
// "Review on the preview URL, then merge to publish". Since Session 105 (merge-on-green,
// #349/#354) content PRs merge themselves once qa + pr-gates are green; S108 fixed the
// same line in the Slack message (update-engine-slack-merge-copy.mjs). Only the PR body
// sentence changes.
//
// Usage (from the TAG repo root):
//   node n8n/update-engine-pr-body-merge-copy.mjs --dry      report only
//   node n8n/update-engine-pr-body-merge-copy.mjs            writes blog-post-engine.json
//   node --env-file=../growth-engine/.env n8n/update-engine-pr-body-merge-copy.mjs --live [--apply]
//        patches the LIVE node in place via live-patch.mjs (dry unless --apply; backup in ~/.n8n-backups/)
// Re-running is a no-op.

import { readFileSync, writeFileSync } from 'node:fs';
import { patchLive } from './live-patch.mjs';

const ENGINE_ID = 'sjZADhZGIuz9tZHK';
const path = 'n8n/blog-post-engine.json';
const DRY = process.argv.includes('--dry');
const LIVE = process.argv.includes('--live');
const APPLY = process.argv.includes('--apply');

const FROM = 'Netlify will post the deploy preview URL as a comment below. Review on the preview URL, then merge to publish.';
const TO = 'Netlify will post the deploy preview URL as a comment below. This PR merges itself once the qa and pr-gates checks pass; a failing check holds it open for a fix.';

// Returns a change list ([] = already patched). Aborts unless the anchor sits in exactly one node, once.
function mutate(wf) {
  if (wf.nodes.some((n) => typeof n.parameters?.body === 'string' && n.parameters.body.includes(TO))) return [];
  const nodes = wf.nodes.filter((n) => typeof n.parameters?.body === 'string' && n.parameters.body.includes(FROM));
  if (nodes.length !== 1) throw new Error(`anchor found in ${nodes.length} nodes (expected 1); engine text may have drifted`);
  const n = nodes[0];
  if (n.parameters.body.split(FROM).length !== 2) throw new Error(`${n.name}: anchor not unique`);
  const before = n.parameters.body;
  n.parameters.body = before.replace(FROM, TO);
  const b = n.parameters.body;
  if (/\{\{|\}\}|`/.test(TO)) throw new Error('replacement is not tokenizer-safe');
  const count = (s, re) => (s.match(re) || []).length;
  if (count(b, /\{\{/g) !== count(before, /\{\{/g) || count(b, /`/g) !== count(before, /`/g)) throw new Error('brace/backtick count changed');
  return [`${n.name}: PR body now says the PR merges itself on green (braces {{=${count(b, /\{\{/g)} }}=${count(b, /\}\}/g)})`];
}

if (LIVE) {
  await patchLive(ENGINE_ID, mutate, { apply: APPLY, label: '(PR body merge-on-green copy)' });
} else {
  const doc = JSON.parse(readFileSync(path, 'utf-8'));
  const changes = mutate(doc);
  console.log(changes.length ? changes.join('\n') : 'no changes (already patched)');
  if (DRY || !changes.length) process.exit(0);
  writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
  console.log('written ' + path);
}
