// Idempotent engine updater: add a prompt rule (Generate Draft) + verify line
// (Humanize) telling the model NOT to emit literal mail-merge placeholders (a
// field name wrapped in a pair of curly braces on each side) in MDX prose.
//
// Why: MDX parses such a placeholder as a JSX code expression, so a bare one in
// prose crashes the Astro build with "ReferenceError: <field> is not defined"
// (this failed PR #60's Lemlist-vs-Clay post). The CI `npm run build` gate now
// catches it, but this stops the engine from generating it in the first place.
//
// IMPORTANT (known gotchas): the prompt node bodies are n8n expressions, and
// this is a .mjs template literal. The inserted text contains NO literal double
// curly braces, NO backtick characters, and NO dollar-brace tokens — otherwise
// it would break n8n's expression tokenizer or this template literal. The rule
// therefore DESCRIBES the syntax in words instead of showing it.
//
// Usage:  node n8n/update-engine-merge-tag-guard.mjs      (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'n8n/blog-post-engine.json';
const SENTINEL = 'MERGE-FIELD PLACEHOLDERS';

// Generate Draft: a new bullet at the top of the existing MDX-syntax rule section.
const GD_ANCHOR = 'SVG / MDX SYNTAX RULE:\n';
const GD_INSERT =
  '- MERGE-FIELD PLACEHOLDERS: Never write a literal mail-merge placeholder ' +
  '(a field name wrapped in a pair of curly braces on each side, the kind email ' +
  'tools use for first name, company, etc.) in prose or in component text. MDX ' +
  'reads it as a code expression and the build crashes with a ReferenceError. To ' +
  'show merge-field syntax as an example, wrap it in inline code (single backtick ' +
  'characters) or describe it in words.\n';

// Humanize: a new verify line appended after the existing LAYOUT verify line.
const HU_ANCHOR =
  'LAYOUT verify — delete any <style> block and any wrapper <div> that sets grid/flex/width/max-width around a component (these squish it). Output the component directly, full-width.';
const HU_INSERT =
  '\nMERGE TAGS verify — if the draft contains a literal mail-merge placeholder ' +
  '(a field name inside a pair of curly braces on each side) anywhere in prose or ' +
  'component text, wrap it in inline code or rephrase it. Bare placeholders are ' +
  'parsed as code and crash the build.';

// Guard: the inserted text must not introduce expression-breaking tokens.
for (const [label, s] of [['GD', GD_INSERT], ['HU', HU_INSERT]]) {
  if (/\{\{|\}\}|`|\$\{/.test(s)) {
    console.error(`ABORT: ${label} insert contains a forbidden token ({{, }}, backtick, or dollar-brace).`);
    process.exit(1);
  }
}

const wf = JSON.parse(readFileSync(FILE, 'utf-8'));
const findNode = (name) => wf.nodes.find((n) => n.name === name);

const gd = findNode('Generate Draft');
const hu = findNode('Humanize');
if (!gd?.parameters?.body || !hu?.parameters?.body) {
  console.error('Could not find Generate Draft / Humanize node bodies. Aborting.');
  process.exit(1);
}

if (gd.parameters.body.includes(SENTINEL)) {
  console.log('Already patched (merge-tag guard present). No-op.');
  process.exit(0);
}

// Record pre-edit token counts so we can prove we introduced none.
const tok = (s) => ({
  open: (s.match(/\{\{/g) || []).length,
  close: (s.match(/\}\}/g) || []).length,
  tick: (s.match(/`/g) || []).length,
});
const gdBefore = tok(gd.parameters.body);
const huBefore = tok(hu.parameters.body);

if (!gd.parameters.body.includes(GD_ANCHOR)) {
  console.error('Generate Draft: SVG / MDX SYNTAX RULE anchor not found; structure changed. Aborting.');
  process.exit(1);
}
if (!hu.parameters.body.includes(HU_ANCHOR)) {
  console.error('Humanize: LAYOUT verify anchor not found; structure changed. Aborting.');
  process.exit(1);
}

gd.parameters.body = gd.parameters.body.replace(GD_ANCHOR, GD_ANCHOR + GD_INSERT);
hu.parameters.body = hu.parameters.body.replace(HU_ANCHOR, HU_ANCHOR + HU_INSERT);

// Self-checks: token counts unchanged (no expression-breakers introduced).
const gdAfter = tok(gd.parameters.body);
const huAfter = tok(hu.parameters.body);
for (const [label, b, a] of [['Generate Draft', gdBefore, gdAfter], ['Humanize', huBefore, huAfter]]) {
  if (b.open !== a.open || b.close !== a.close || b.tick !== a.tick) {
    console.error(`ABORT: ${label} brace/backtick token count changed (open ${b.open}->${a.open}, close ${b.close}->${a.close}, tick ${b.tick}->${a.tick}).`);
    process.exit(1);
  }
}

const serialized = JSON.stringify(wf, null, 2);
JSON.parse(serialized); // round-trip sanity
writeFileSync(FILE, serialized, 'utf-8');
console.log('Patched Generate Draft + Humanize with the merge-tag guard. Token counts unchanged; JSON round-trips.');
console.log('Next: node n8n/deploy-engine.mjs --apply  (run with --env-file=../restaurant-outreach/.env)');
