// Engine updater — rotate the comparison presentation so posts stop reading as
// templated (every comparison = the same 3-column card table is an AI tell).
//
// Adds two alternate formats alongside the full <ComparisonTable>:
//   - compact <ComparisonTable compact> : slim at-a-glance table + prose
//   - <ToolBreakdown>                    : section-per-product editorial blocks
// and instructs Generate Draft to pick ONE per post by fit and vary it.
//
// Changes:
// 1. Generate Draft: add the ToolBreakdown import; soften the skeleton's
//    hardcoded ComparisonTable bullet to a format-agnostic one; add a
//    COMPARISON FORMAT rotation section before the DECISION TREES section.
// 2. Humanize: import count 8 -> 9, add <ToolBreakdown> to the component list,
//    add a COMPARISON FORMAT verify line.
//
// CRITICAL: injected text avoids backticks and ${ } (Generate Draft / Humanize
// bodies are ={{ JSON.stringify({ ...template-literal prompt... }) }} expressions;
// see feedback_no_backticks_in_template_literal_prompts).
//
// Idempotent. After running: deploy with n8n/deploy-engine.mjs (no re-import).

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);
const changes = [];

// ---- 1. Generate Draft ---------------------------------------------------
const gen = find('Generate Draft');
let g = gen.parameters.body;

const dtImport = "import DecisionTree from '@/components/post/DecisionTree.astro';";
const tbImport = "import ToolBreakdown from '@/components/post/ToolBreakdown.astro';";
if (!g.includes(tbImport)) {
  g = g.replace(dtImport, dtImport + '\n' + tbImport);
  changes.push('Generate Draft: added ToolBreakdown import');
}

const oldCtBullet =
  '- <ComparisonTable title="..." tools={[ { name, tagline, pros: [...], cons: [...], pricing, affiliateSlug, ctaLabel, highlight: true|false }, ...2-4 tools ]} />';
const newCtBullet =
  '- The main comparison block: pick ONE format per the COMPARISON FORMAT rule below (full <ComparisonTable>, compact <ComparisonTable compact>, or <ToolBreakdown>) and vary it across posts';
if (g.includes(oldCtBullet)) {
  g = g.replace(oldCtBullet, newCtBullet);
  changes.push('Generate Draft: softened skeleton ComparisonTable bullet');
}

const formatSection =
  'COMPARISON FORMAT — rotate, do NOT default to the card table every post:\n' +
  '- Pick ONE of three presentations for the main comparison, by fit, and vary it post to post so the site does not read as templated:\n' +
  '  1. Full <ComparisonTable title="..." tools={[ { name, tagline, pros: [...], cons: [...], pricing, affiliateSlug, ctaLabel, highlight } ]} /> — when a feature-by-feature pros and cons read is the point.\n' +
  '  2. Compact <ComparisonTable compact title="..." tools={[ ...same fields... ]} /> — a slim at-a-glance table (name, tagline, pricing, CTA). Follow it with 2-3 short prose paragraphs that carry the tradeoffs.\n' +
  '  3. <ToolBreakdown title="..." tools={[ { name, tagline, body, highlights: [...], pricing, affiliateSlug, ctaLabel, highlight } ]} /> — section-per-product: each tool gets a heading, a narrative body paragraph, a couple of highlights, and a CTA. Reads editorial.\n' +
  '- All three share the same tool fields; ToolBreakdown adds a body paragraph (required) and optional highlights. Always set affiliateSlug on every tool so each links to /go/<slug>. Use exactly one comparison block per post.\n' +
  '\n';
if (!g.includes('COMPARISON FORMAT — rotate')) {
  g = g.replace('DECISION TREES — use the <DecisionTree>', formatSection + 'DECISION TREES — use the <DecisionTree>');
  changes.push('Generate Draft: added COMPARISON FORMAT rotation section');
}
gen.parameters.body = g;

// ---- 2. Humanize --------------------------------------------------------
const hum = find('Humanize');
let h = hum.parameters.body;

if (h.includes('eight import lines')) {
  h = h.replace('eight import lines', 'nine import lines');
  changes.push('Humanize: import count phrase eight -> nine');
}
if (h.includes('all 8 imports')) {
  h = h.replace('all 8 imports', 'all 9 imports');
  changes.push('Humanize: verify all 8 -> 9 imports');
}

const oldList = '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <DecisionTree>, <MyTake>.';
const newList = '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <DecisionTree>, <ToolBreakdown>, <MyTake>.';
if (h.includes(oldList)) {
  h = h.replace(oldList, newList);
  changes.push('Humanize: added <ToolBreakdown> to component list');
}

const fmtVerify =
  'COMPARISON FORMAT verify — do not force the post into the full 3-column card table. The compact <ComparisonTable compact> and <ToolBreakdown> formats are valid and preferred for variety; keep whichever format the draft used and do not convert it back to the full card table.\n\n';
if (!h.includes('COMPARISON FORMAT verify')) {
  h = h.replace('Output only the rewritten MDX', fmtVerify + 'Output only the rewritten MDX');
  changes.push('Humanize: added COMPARISON FORMAT verify line');
}
hum.parameters.body = h;

// ---- Write back ---------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log(changes.length ? 'Applied:\n' + changes.map((c) => '  - ' + c).join('\n') : 'No changes — already applied.');
