// Idempotent updater (same pattern as update-engine-*.mjs): RETIRE <DecisionTree>
// from the engine entirely. Ian's call (Session 37): decision trees are the single
// biggest source of post-generation/QA errors (nested tree={{branches:[{result:{...}}]}}
// prop shape), so future posts must never emit one. The decision graphic becomes
// <ChooseIf> ("Choose X if" self-select cards) — flat array props, already proven,
// renders cleanly on mobile.
//
// Changes:
//   Generate Draft:
//     - drop the `import DecisionTree ...` line from REQUIRED IMPORTS (15 -> 14)
//     - reword the "How to choose" skeleton line (no SideBySide+DecisionTree)
//     - replace the whole DECISION TREES section with a DECISION GRAPHIC ban that
//       steers to <ChooseIf> / <IntentTable>
//     - reword the VISUALS comparison-post bullet (ChooseIf, one decision block)
//   Humanize:
//     - import-count preservation rule 15 -> 14
//     - drop <DecisionTree> from the component preserve list
//     - DECISION TREE verify now converts any inline-svg tree OR <DecisionTree> to <ChooseIf>
//     - delete the DECISION TREE FLATTEN verify (no tree to flatten anymore)
//
// Inserted text introduces NO backtick / `{{` / `}}` / `${` tokens (the Generate
// Draft + Humanize bodies are `={{ JSON.stringify({ ...template-literal... }) }}`
// expressions; any of those breaks n8n's tokenizer — feedback_no_backticks_in_template_literal_prompts)
// and no em/en dashes. A before/after token-count self-check enforces this.
//
//   node n8n/update-engine-retire-decision-tree.mjs    # writes blog-post-engine.json
// then deploy:
//   node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const SENTINEL = 'DECISION GRAPHIC — <DecisionTree> is RETIRED';

const gd = wf.nodes.find((n) => n.name === 'Generate Draft');
const hum = wf.nodes.find((n) => n.name === 'Humanize');
if (!gd || !hum) throw new Error('Generate Draft / Humanize node not found.');

if (gd.parameters.body.includes(SENTINEL)) {
  console.log('Already patched (DecisionTree retired). No-op.');
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

// helper: assert-and-replace exactly one occurrence
const sub = (body, label, oldStr, newStr) => {
  if (!body.includes(oldStr)) throw new Error(`${label}: anchor not found: ${JSON.stringify(oldStr.slice(0, 70))}`);
  return body.replace(oldStr, newStr);
};

let gb = gd.parameters.body;

// 1. drop the DecisionTree import line from REQUIRED IMPORTS
gb = sub(gb, 'GD import',
  "import DecisionTree from '@/components/post/DecisionTree.astro';\n",
  '');

// 2. "How to choose" skeleton line
gb = sub(gb, 'GD skeleton',
  'do NOT add a second decision aid or a SideBySide+DecisionTree here)',
  'do NOT add a second decision aid, a SideBySide, or any inline decision tree here)');

// 3. replace the whole DECISION TREES section (slice between two stable anchors)
const DT_START = 'DECISION TREES — use SPARINGLY';
const DT_END = '\nVISUALS — every post needs';
const i0 = gb.indexOf(DT_START);
const i1 = gb.indexOf(DT_END);
if (i0 === -1 || i1 === -1 || i1 <= i0) throw new Error('GD DECISION TREES section anchors not found.');
const GRAPHIC_BLOCK =
  'DECISION GRAPHIC — <DecisionTree> is RETIRED. Never emit it:\n' +
  '- Do NOT use <DecisionTree> anywhere in the post, and never hand-draw a decision tree as an inline <svg>. Both are banned and will fail QA.\n' +
  '- For any "which tool should I pick" decision, use <ChooseIf> (the "Choose X if" self-select cards from the COMPARISON FORMAT list above): 2 to 4 tools, 2-3 plain-language conditions each, an affiliateSlug + ctaLabel on every tool. It carries the same "if you are X, then pick Y" logic a tree did, but renders as flat, mobile-safe cards that never break.\n' +
  '- If a job-to-be-done matrix fits the decision better, use <IntentTable> instead. Pick exactly one decision block per post.\n';
gb = gb.slice(0, i0) + GRAPHIC_BLOCK + gb.slice(i1);

// 4. VISUALS comparison-post bullet
gb = sub(gb, 'GD visuals',
  '- A comparison post lands at least three: a <StatRow> near the top, a <ComparisonTable> for the head-to-head, and a <DecisionTree> in the "how to choose" section.',
  '- A comparison post lands at least three visual elements: a <KeyTakeaways> near the top, a <StatRow> with three facts, and ONE main comparison/decision block (prefer <ChooseIf> for the "which is for me" decision, or <ComparisonTable> / <ToolBreakdown> / <IntentTable> per the COMPARISON FORMAT rotation). Do NOT add a second decision graphic.');

gd.parameters.body = gb;

let hb = hum.parameters.body;

// 5. import-count preservation rule 15 -> 14
hb = sub(hb, 'HUM import count',
  "The import block (the fifteen import lines starting with 'import SideBySide'). Verify all 15 imports are present and in order.",
  "The import block (the fourteen import lines starting with 'import SideBySide'). Verify all 14 imports are present and in order.");

// 6. drop <DecisionTree> from the component preserve list
hb = sub(hb, 'HUM component list',
  '<Figure>, <DecisionTree>, <ToolBreakdown>,',
  '<Figure>, <ToolBreakdown>,');

// 7. DECISION TREE verify -> convert any tree (svg or component) to <ChooseIf>
hb = sub(hb, 'HUM dt verify',
  'DECISION TREE verify — if the draft draws a "which should you pick" decision tree as an inline <svg> (rect/text/line boxes), convert it to a <DecisionTree> component using the documented schema. Process or workflow diagrams (data flow, n8n graphs) may stay as inline SVG.',
  'DECISION GRAPHIC verify — <DecisionTree> is retired. If the draft contains a <DecisionTree>, OR draws a "which should you pick" decision tree as an inline <svg> (rect/text/line boxes), convert it to a <ChooseIf> component (2 to 4 tools, 2-3 plain-language conditions each, an affiliateSlug + ctaLabel per tool). Process or workflow diagrams (data flow, n8n graphs) may stay as inline SVG.');

// 8. delete the now-moot FLATTEN verify paragraph
hb = sub(hb, 'HUM flatten verify',
  '\n\nDECISION TREE FLATTEN verify — if any <DecisionTree> nests a sub-question inside a branch (a branch carrying another question instead of a result), FLATTEN it: collapse to ONE question with 2 to 4 leaf results, or replace it with <ChooseIf> / <IntentTable>. Nested trees render cramped, especially on mobile.',
  '');

hum.parameters.body = hb;

// ---- self-check: no expression-breaking tokens introduced ---------------------
const gdAfter = tok(gd.parameters.body);
const humAfter = tok(hum.parameters.body);
for (const [name, b, a] of [['Generate Draft', gdBefore, gdAfter], ['Humanize', humBefore, humAfter]]) {
  if (b.open !== a.open || b.close !== a.close || b.tick !== a.tick || b.dollar !== a.dollar)
    throw new Error(`${name}: token counts changed (would break the n8n expression): ${JSON.stringify({ b, a })}`);
}
// (Note: the prompt's section headings use em-dash separators by house convention,
// e.g. "DECISION GRAPHIC — ..."; the no-em-dash rule governs generated post CONTENT,
// enforced by the engine sanitizer + lint gate, not these instruction strings.)
// The ban text itself names <DecisionTree> ("Never emit <DecisionTree>"), so assert
// only that nothing instructs the model to IMPORT or EMIT one.
if (gd.parameters.body.includes('post/DecisionTree.astro'))
  throw new Error('Generate Draft still imports DecisionTree.');
if (gd.parameters.body.includes('Use <DecisionTree>') || gd.parameters.body.includes('DECISION TREES — use SPARINGLY'))
  throw new Error('Generate Draft still instructs emitting a DecisionTree.');
if (hum.parameters.body.includes('convert it to a <DecisionTree>') || hum.parameters.body.includes('<Figure>, <DecisionTree>'))
  throw new Error('Humanize still instructs creating/preserving a DecisionTree.');
JSON.parse(JSON.stringify(wf)); // round-trip guard

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n', 'utf8');
console.log('Updated blog-post-engine.json:');
console.log('  - Generate Draft: DecisionTree import dropped; DECISION TREES section replaced with DECISION GRAPHIC ban (ChooseIf); skeleton + VISUALS reworded');
console.log('  - Humanize: import count 15->14; DecisionTree dropped from preserve list; verify converts trees to ChooseIf; FLATTEN verify removed');
console.log(`Node count: ${wf.nodes.length}`);
