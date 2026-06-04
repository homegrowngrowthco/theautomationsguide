// Engine updater — add the three new decision-aid formats (ChooseIf, IntentTable,
// SpectrumBar) to the comparison-format rotation and demote DecisionTree to
// genuinely-sequential decisions only.
//
// CRITICAL: all injected JSX examples use single braces only (tools={[ { ... } ]}).
// Never literal {{ }} — n8n treats those as expression delimiters and the run dies
// with "invalid syntax" (see fix-engine-double-braces.mjs + the memory).
//
// Idempotent. After running: deploy with n8n/deploy-engine.mjs --apply.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const changes = [];

// ---- 1. Generate Draft ---------------------------------------------------
const gen = doc.nodes.find((n) => n.name === 'Generate Draft');
let g = gen.parameters.body;

// 1a. imports
const tbImport = "import ToolBreakdown from '@/components/post/ToolBreakdown.astro';";
const newImports =
  tbImport +
  "\\nimport ChooseIf from '@/components/post/ChooseIf.astro';" +
  "\\nimport IntentTable from '@/components/post/IntentTable.astro';" +
  "\\nimport SpectrumBar from '@/components/post/SpectrumBar.astro';";
// NOTE: the body stores newlines as real \n inside the JSON string once parsed,
// so match/replace on the parsed JS string uses real newlines:
const tbImportReal = "import ToolBreakdown from '@/components/post/ToolBreakdown.astro';";
const newImportsReal =
  tbImportReal +
  "\nimport ChooseIf from '@/components/post/ChooseIf.astro';" +
  "\nimport IntentTable from '@/components/post/IntentTable.astro';" +
  "\nimport SpectrumBar from '@/components/post/SpectrumBar.astro';";
if (!g.includes("import ChooseIf")) {
  g = g.replace(tbImportReal, newImportsReal);
  changes.push('Generate Draft: added ChooseIf / IntentTable / SpectrumBar imports');
}

// 1b. expand the COMPARISON FORMAT block
const oldFormat =
  'COMPARISON FORMAT — rotate, do NOT default to the card table every post:\n' +
  '- Pick ONE of three presentations for the main comparison, by fit, and vary it post to post so the site does not read as templated:\n' +
  '  1. Full <ComparisonTable title="..." tools={[ { name, tagline, pros: [...], cons: [...], pricing, affiliateSlug, ctaLabel, highlight } ]} /> — when a feature-by-feature pros and cons read is the point.\n' +
  '  2. Compact <ComparisonTable compact title="..." tools={[ ...same fields... ]} /> — a slim at-a-glance table (name, tagline, pricing, CTA). Follow it with 2-3 short prose paragraphs that carry the tradeoffs.\n' +
  '  3. <ToolBreakdown title="..." tools={[ { name, tagline, body, highlights: [...], pricing (entry tier plus one higher tier when useful), affiliateSlug, ctaLabel, highlight } ]} /> — section-per-product: each tool gets a heading, a narrative body paragraph, a couple of highlights, and a CTA. Reads editorial.\n' +
  '- All three share the same tool fields; ToolBreakdown adds a body paragraph (required) and optional highlights. Always set affiliateSlug on every tool so each links to /go/<slug>. Use exactly one comparison block per post.\n\n';

const newFormat =
  'COMPARISON FORMAT — rotate, do NOT default to the card table every post:\n' +
  '- Pick ONE main comparison/decision format, by fit, and vary it post to post so the site does not read as templated. Options:\n' +
  '  1. Full <ComparisonTable title="..." tools={[ { name, tagline, pros: [...], cons: [...], pricing, affiliateSlug, ctaLabel, highlight } ]} /> — when a feature-by-feature pros and cons read is the point.\n' +
  '  2. Compact <ComparisonTable compact title="..." tools={[ ...same fields... ]} /> — slim at-a-glance table (name, tagline, pricing, CTA), then 2-3 short prose paragraphs carrying the tradeoffs.\n' +
  '  3. <ToolBreakdown title="..." tools={[ { name, tagline, body, highlights: [...], pricing (entry tier plus one higher tier when useful), affiliateSlug, ctaLabel, highlight } ]} /> — section-per-product editorial blocks.\n' +
  '  4. <ChooseIf title="..." tools={[ { name, conditions: [...], pricing, affiliateSlug, ctaLabel, highlight } ]} /> — "Choose X if" self-select cards (2-4 tools). PREFER THIS for "which is for me" decisions: the reader picks by their own situation. 2-3 plain-language conditions per tool.\n' +
  '  5. <IntentTable title="..." caption="..." cols={[ { name, affiliateSlug, ctaLabel, highlight } ]} rows={[ { label, cells: [...] } ]} /> — job-to-be-done matrix: intent rows (e.g. "Best for", "AI philosophy", "Team fit") by tool; each row\'s cells align to the cols order. Highly scannable.\n' +
  '  6. <SpectrumBar leftLabel="ToolA" rightLabel="ToolB" caption="..." dimensions={[ { name, leftPole, rightPole, lean } ]} /> — TWO-tool comparisons only: a labeled spectrum per dimension (lean is "left", "center", or "right") when the real decider is operating style/philosophy.\n' +
  '- Always set affiliateSlug on every tool/col so each links to /go/<slug>. Use exactly one comparison/decision block per post.\n\n';

if (g.includes(oldFormat)) {
  g = g.replace(oldFormat, newFormat);
  changes.push('Generate Draft: expanded COMPARISON FORMAT to 6 options (ChooseIf/IntentTable/SpectrumBar)');
}

// 1c. demote DECISION TREES
const oldTree =
  'DECISION TREES — use the <DecisionTree> component, never a hand-drawn SVG:\n' +
  '- Any "which should you pick" or "how to choose" branch renders as <DecisionTree>, not an inline <svg>. The component is responsive, on-brand, and robust. Hand-drawn SVG decision trees are banned.';
const newTree =
  'DECISION TREES — use SPARINGLY, only for genuinely sequential decisions:\n' +
  '- Use <DecisionTree> ONLY when the choice truly depends on one answer THEN another (e.g. "what is your CRM? then your sending volume?"). For most "which is for me" decisions, prefer <ChooseIf> or <IntentTable> from the COMPARISON FORMAT list above. Never hand-draw a decision tree as an inline <svg>; that is banned.';
if (g.includes(oldTree)) {
  g = g.replace(oldTree, newTree);
  changes.push('Generate Draft: demoted DECISION TREES to sequential-only');
}
gen.parameters.body = g;

// ---- 2. Humanize --------------------------------------------------------
const hum = doc.nodes.find((n) => n.name === 'Humanize');
let h = hum.parameters.body;
if (h.includes('nine import lines')) { h = h.replace('nine import lines', 'twelve import lines'); changes.push('Humanize: import count nine -> twelve'); }
if (h.includes('all 9 imports')) { h = h.replace('all 9 imports', 'all 12 imports'); changes.push('Humanize: verify all 9 -> 12 imports'); }
const oldList = '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <DecisionTree>, <ToolBreakdown>, <MyTake>.';
const newList = '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <DecisionTree>, <ToolBreakdown>, <ChooseIf>, <IntentTable>, <SpectrumBar>, <MyTake>.';
if (h.includes(oldList)) { h = h.replace(oldList, newList); changes.push('Humanize: added ChooseIf/IntentTable/SpectrumBar to component list'); }
hum.parameters.body = h;

// ---- Write + verify -----------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
const gb = doc.nodes.find((n) => n.name === 'Generate Draft').parameters.body;
const ob = (gb.match(/\{\{/g) || []).length, cb = (gb.match(/\}\}/g) || []).length;
console.log(changes.length ? 'Applied:\n' + changes.map((c) => '  - ' + c).join('\n') : 'No changes — already applied.');
console.log(`Generate Draft braces: {{ =${ob} }} =${cb} (must be 1/1)`);
