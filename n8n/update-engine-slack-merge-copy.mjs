// Idempotent engine updater: the "New post PR opened" Slack message still told Ian to
// "Review on the preview, then merge to publish". Since Session 105 (merge-on-green,
// #349/#354) content PRs merge themselves once qa + pr-gates are green, so the copy now
// says that. Only the Slack node changes; the PR body's similar line is left as is.
//
// Usage (from the TAG repo root):
//   node n8n/update-engine-slack-merge-copy.mjs --dry      report only
//   node n8n/update-engine-slack-merge-copy.mjs            writes blog-post-engine.json
//   node --env-file=../growth-engine/.env n8n/update-engine-slack-merge-copy.mjs --live [--apply]
//        patches the LIVE node in place via live-patch.mjs (dry unless --apply; backup in ~/.n8n-backups/)
// Re-running is a no-op.

import { readFileSync, writeFileSync } from 'node:fs';
import { patchLive } from './live-patch.mjs';

const ENGINE_ID = 'sjZADhZGIuz9tZHK';
const path = 'n8n/blog-post-engine.json';
const DRY = process.argv.includes('--dry');
const LIVE = process.argv.includes('--live');
const APPLY = process.argv.includes('--apply');

const FROM = "_Netlify will comment the deploy preview URL on the PR within ~2 min. Review on the preview, then merge to publish to ${$('Carry PR Info').first().json.siteBaseUrl}._";
const TO = "_It merges itself once the qa and pr-gates checks pass, then goes live on ${$('Carry PR Info').first().json.siteBaseUrl} about 2 min later. A failing check holds it open for a fix._";

// Returns a change list ([] = already patched). Aborts unless the anchor sits in exactly one node, once.
function mutate(wf) {
  if (wf.nodes.some((n) => typeof n.parameters?.body === 'string' && n.parameters.body.includes(TO))) return [];
  const nodes = wf.nodes.filter((n) => typeof n.parameters?.body === 'string' && n.parameters.body.includes(FROM));
  if (nodes.length !== 1) throw new Error(`anchor found in ${nodes.length} nodes (expected 1); engine text may have drifted`);
  const n = nodes[0];
  if (n.parameters.body.split(FROM).length !== 2) throw new Error(`${n.name}: anchor not unique`);
  n.parameters.body = n.parameters.body.replace(FROM, TO);
  const b = n.parameters.body;
  if (/\{\{/.test(TO) || /`/.test(TO)) throw new Error('replacement is not tokenizer-safe');
  return [`${n.name}: Slack copy now says the PR merges itself on green (braces {{=${(b.match(/\{\{/g) || []).length} }}=${(b.match(/\}\}/g) || []).length})`];
}

if (LIVE) {
  await patchLive(ENGINE_ID, mutate, { apply: APPLY, label: '(Slack merge-on-green copy)' });
} else {
  const doc = JSON.parse(readFileSync(path, 'utf-8'));
  const changes = mutate(doc);
  console.log(changes.length ? changes.join('\n') : 'no changes (already patched)');
  if (DRY || !changes.length) process.exit(0);
  writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
  console.log('written ' + path);
}
