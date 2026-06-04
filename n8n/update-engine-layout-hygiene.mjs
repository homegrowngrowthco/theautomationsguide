// Engine updater — kill two formatting bugs Ian caught on a generated post (PR #51):
//   1. Squished StatRow: the model wrapped <StatRow> in a per-post
//      <style>.stat-row-3up{display:grid;grid-template-columns:repeat(3,1fr)}</style>
//      + <div>. StatRow is a single self-contained element, so the 3-col wrapper
//      put it in 1/3 width and crushed its cards. FIX: sanitizeMdx() strips ALL
//      post-level <style> blocks (components are self-styled + responsive); the
//      leftover bare <div> is harmless. Plus a prompt rule against wrappers.
//   2. Awkward <SideBySide><DecisionTree> "how to choose" step (empty column gap +
//      the yes/no tree Ian dislikes). FIX: drop that hardcoded skeleton bullet; the
//      rotating COMPARISON FORMAT block already covers compare + decide (prefers
//      ChooseIf / IntentTable). Trees stay demoted to sequential-only.
//
// CRITICAL: prompt text uses no backticks and no {{ }}. Idempotent.
// Deploy with deploy-engine.mjs --apply (no component dependency; safe anytime).

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const changes = [];

// --- 1. Parse Draft sanitizeMdx: strip post-level <style> blocks ---
const pd = doc.nodes.find((n) => n.name === 'Parse Draft');
let pdCode = pd.parameters.jsCode;
if (!pdCode.includes('<style>')) {
  const anchor = '  // Old dark-theme diagram colors';
  const inject =
    '  // Strip per-post <style> blocks: components are self-styled + responsive; ad-hoc\n' +
    "  // grid/width wrappers (e.g. .stat-row-3up) squish them. The bare <div> left behind is harmless.\n" +
    "  out = out.replace(/<style>[\\s\\S]*?<\\/style>/g, '');\n\n" +
    anchor;
  if (pdCode.includes(anchor)) {
    pdCode = pdCode.replace(anchor, inject);
    pd.parameters.jsCode = pdCode;
    changes.push('Parse Draft: sanitizeMdx strips post-level <style> blocks');
  }
}

// --- 2. Generate Draft: drop the SideBySide+DecisionTree "how to choose" bullet ---
const gen = doc.nodes.find((n) => n.name === 'Generate Draft');
let g = gen.parameters.body;
const sbsBullet =
  '- One ## section "How to choose" with 1-2 paragraphs\n' +
  '- <SideBySide><Fragment slot="left">decision criteria text, 2-3 short paragraphs</Fragment><Fragment slot="right"><DecisionTree caption="..." footer="optional one-line recommendation" tree={ { question: "...", branches: [ { label: "Yes", result: { title: "Use X", note: "why", tone: "primary" } }, { label: "No", result: { title: "Use Y", note: "why", tone: "alt" } } ] } } /></Fragment></SideBySide>\n';
const sbsReplacement = '- One ## section "How to choose" with 1-2 paragraphs (the rotating comparison/decision block above already covers compare + decide; do NOT add a second decision aid or a SideBySide+DecisionTree here)\n';
if (g.includes(sbsBullet)) {
  g = g.replace(sbsBullet, sbsReplacement);
  changes.push('Generate Draft: removed forced SideBySide+DecisionTree how-to-choose step');
}

// --- 3. Generate Draft: no custom CSS / wrapper divs rule ---
const layoutRule =
  'LAYOUT — no custom CSS or wrapper divs:\n' +
  '- Do NOT emit <style> blocks. Do NOT wrap a component in a <div> that sets grid-template-columns, display:grid, display:flex, width, or max-width. Every component (StatRow, ComparisonTable, ChooseIf, IntentTable, SpectrumBar, ToolBreakdown, Figure, KeyTakeaways, etc.) is already responsive and fills the content column on its own. Output the component tag directly with no surrounding layout markup.\n' +
  '\n';
if (!g.includes('LAYOUT — no custom CSS')) {
  g = g.replace('SVG / MDX SYNTAX RULE:', layoutRule + 'SVG / MDX SYNTAX RULE:');
  changes.push('Generate Draft: added LAYOUT no-custom-CSS rule');
}
gen.parameters.body = g;

// --- 4. Humanize parity ---
const hum = doc.nodes.find((n) => n.name === 'Humanize');
let h = hum.parameters.body;
const layoutVerify =
  'LAYOUT verify — delete any <style> block and any wrapper <div> that sets grid/flex/width/max-width around a component (these squish it). Output the component directly, full-width.\n\n';
if (!h.includes('LAYOUT verify')) {
  h = h.replace('Output only the rewritten MDX', layoutVerify + 'Output only the rewritten MDX');
  changes.push('Humanize: added LAYOUT verify (strip style/wrapper)');
}
hum.parameters.body = h;

writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
const gb = doc.nodes.find((n) => n.name === 'Generate Draft').parameters.body;
console.log(changes.length ? 'Applied:\n' + changes.map((c) => '  - ' + c).join('\n') : 'No changes — already applied.');
console.log(`Generate Draft braces: {{ =${(gb.match(/\{\{/g) || []).length} }} =${(gb.match(/\}\}/g) || []).length} (must be 1/1)`);
