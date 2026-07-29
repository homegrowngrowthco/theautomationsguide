// Idempotent updater (same pattern as update-engine-*.mjs): tell the engine to
// keep <DecisionTree> FLAT (no nested sub-questions).
//
// The engine already says "use DecisionTree sparingly, prefer ChooseIf/IntentTable",
// but nothing forbids NESTING. PR #74's flowchart nested a sub-question inside
// every top-level branch, which is the shape that renders cramped/clipped on
// mobile (the component now degrades gracefully, but a flat tree is simply better
// and trivially QA-able). This adds:
//   - Generate Draft: a FLAT-tree rule under the existing DECISION TREES section.
//   - Humanize: a DECISION TREE FLATTEN verify line.
//
// Inserted text introduces NO backtick / `{{` / `}}` / `${` tokens (the Generate
// Draft + Humanize bodies are `={{ JSON.stringify({ ...prompt-as-template-literal... }) }}`
// expressions, so any of those would break n8n's tokenizer — see
// feedback_no_backticks_in_template_literal_prompts) and no em/en dashes.
// A before/after token-count self-check enforces this.
//
//   node n8n/update-engine-flat-trees.mjs        # writes blog-post-engine.json
// then deploy:
//   node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const SENTINEL = 'Keep the tree FLAT';

const gd = wf.nodes.find((n) => n.name === 'Generate Draft');
const hum = wf.nodes.find((n) => n.name === 'Humanize');
if (!gd || !hum) throw new Error('Generate Draft / Humanize node not found.');

if (gd.parameters.body.includes(SENTINEL)) {
  console.log('Already patched (flat-tree rule present). No-op.');
  process.exit(0);
}

const tok = (s) => ({
  open: (s.match(/\{\{/g) || []).length,
  close: (s.match(/\}\}/g) || []).length,
  tick: (s.match(/`/g) || []).length,
  dollar: (s.match(/\$\{/g) || []).length,
});
const gdBefore = tok(gd.parameters.body);
const humBefore = tok(hum.parameters.body);

// ---- Generate Draft: FLAT-tree bullet under the existing DECISION TREES head --
const GD_ANCHOR = 'DECISION TREES — use SPARINGLY, only for genuinely sequential decisions:\n';
const GD_INSERT =
  '- Keep the tree FLAT. ONE question with 2 to 4 leaf branches, each ending in a result. Do NOT nest a sub-question inside a branch (no nested decisions). Nested trees render cramped, especially on mobile. If a choice genuinely needs two levels, use <ChooseIf> or <IntentTable> instead of a DecisionTree.\n';
if (!gd.parameters.body.includes(GD_ANCHOR)) throw new Error('Generate Draft DECISION TREES anchor not found.');
gd.parameters.body = gd.parameters.body.replace(GD_ANCHOR, GD_ANCHOR + GD_INSERT);

// ---- Humanize: a flatten-verify paragraph before COMPARISON FORMAT verify -----
const HUM_ANCHOR = '\n\nCOMPARISON FORMAT verify';
const HUM_INSERT =
  '\n\nDECISION TREE FLATTEN verify — if any <DecisionTree> nests a sub-question inside a branch (a branch carrying another question instead of a result), FLATTEN it: collapse to ONE question with 2 to 4 leaf results, or replace it with <ChooseIf> / <IntentTable>. Nested trees render cramped, especially on mobile.';
if (!hum.parameters.body.includes(HUM_ANCHOR)) throw new Error('Humanize COMPARISON FORMAT anchor not found.');
hum.parameters.body = hum.parameters.body.replace(HUM_ANCHOR, HUM_INSERT + HUM_ANCHOR);

// ---- self-check: no expression-breaking tokens introduced ---------------------
const gdAfter = tok(gd.parameters.body);
const humAfter = tok(hum.parameters.body);
for (const [name, b, a] of [['Generate Draft', gdBefore, gdAfter], ['Humanize', humBefore, humAfter]]) {
  if (b.open !== a.open || b.close !== a.close || b.tick !== a.tick || b.dollar !== a.dollar)
    throw new Error(`${name}: token counts changed (would break the n8n expression): ${JSON.stringify({ b, a })}`);
}
JSON.parse(JSON.stringify(wf)); // round-trip guard

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n', 'utf8');
console.log('Updated blog-post-engine.json:\n  - Generate Draft: FLAT-tree rule added under DECISION TREES\n  - Humanize: DECISION TREE FLATTEN verify added');
console.log(`Node count: ${wf.nodes.length}`);
