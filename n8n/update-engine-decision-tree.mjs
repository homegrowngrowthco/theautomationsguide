// Engine updater — make the engine emit <DecisionTree> + 2-3 visuals per post.
//
// Changes:
// 1. Generate Draft prompt:
//    a. Adds the DecisionTree import to the REQUIRED IMPORTS block (after Figure).
//    b. Swaps the COMPARISON skeleton's hand-drawn <Figure><svg> decision tree
//       for a <DecisionTree> component usage (also drops a stray em dash).
//    c. Adds a DECISION TREES section (component schema, "never hand-draw a
//       decision-tree SVG") + a VISUALS section ("2-3 visuals per post, never
//       fabricate product screenshots"). Inserted before the SVG / MDX rule,
//       which stays in place for process / workflow diagrams.
// 2. Humanize prompt: import count 7 -> 8, adds <DecisionTree> to the component
//    list, and a DECISION TREE verify line (convert leftover decision-tree SVGs;
//    leave process/workflow SVGs alone).
// 3. Parse Draft: NO change. Its import-presence check only asserts the
//    SideBySide import (still present), and sanitizeMdx() is still needed for
//    process-flow SVGs.
//
// CRITICAL: JSX examples use SPACED braces `tree={ { ... } }`, never literal `{{`/`}}`.
// The node body is an n8n expression `={{ JSON.stringify(...) }}` and n8n treats `{{`/`}}`
// as the expression delimiters — a literal inner `}}` closes the expression early and the
// run dies with "invalid syntax" (broke the 2026-06-04 run; see fix-engine-double-braces.mjs).
// Spaced `{ {` renders identically in MDX. (Same family as the no-backticks/${} rule below.)
//
// CRITICAL: the Generate Draft / Humanize bodies are n8n expressions
// (={{ JSON.stringify({ ... prompt-as-template-literal ... }) }}). All injected
// text MUST avoid backticks and ${ } or it breaks the template literal at
// runtime (see feedback_no_backticks_in_template_literal_prompts). Everything
// added below uses single/double quotes and bare { only.
//
// Idempotent: re-running on an already-updated JSON is a no-op.
// After running: deploy with n8n/deploy-engine.mjs (no manual re-import needed).

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);

const changes = [];

// ---- 1. Generate Draft ---------------------------------------------------
const gen = find('Generate Draft');
let genBody = gen.parameters.body;

// 1a. DecisionTree import after the Figure import.
const figImport = "import Figure from '@/components/post/Figure.astro';";
const dtImport = "import DecisionTree from '@/components/post/DecisionTree.astro';";
if (!genBody.includes(dtImport)) {
  genBody = genBody.replace(figImport, figImport + '\n' + dtImport);
  changes.push('Generate Draft: added DecisionTree import');
}

// 1b. Swap the COMPARISON skeleton decision-tree line.
const oldSkeleton =
  '- <SideBySide><Fragment slot="left">decision criteria text — 2-3 short paragraphs</Fragment><Fragment slot="right"><Figure caption="..."><svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">{/* simple decision tree, 3-4 boxes */}</svg></Figure></Fragment></SideBySide>';
const newSkeleton =
  '- <SideBySide><Fragment slot="left">decision criteria text, 2-3 short paragraphs</Fragment><Fragment slot="right"><DecisionTree caption="..." footer="optional one-line recommendation" tree={ { question: "...", branches: [ { label: "Yes", result: { title: "Use X", note: "why", tone: "primary" } }, { label: "No", result: { title: "Use Y", note: "why", tone: "alt" } } ] } } /></Fragment></SideBySide>';
if (genBody.includes(oldSkeleton)) {
  genBody = genBody.replace(oldSkeleton, newSkeleton);
  changes.push('Generate Draft: swapped skeleton SVG tree for <DecisionTree>');
}

// 1c. DECISION TREES + VISUALS sections, before the SVG / MDX SYNTAX RULE.
const decisionSection =
  'DECISION TREES — use the <DecisionTree> component, never a hand-drawn SVG:\n' +
  '- Any "which should you pick" or "how to choose" branch renders as <DecisionTree>, not an inline <svg>. The component is responsive, on-brand, and robust. Hand-drawn SVG decision trees are banned.\n' +
  '- Schema: tree={ { question: "string", branches: [ { label: "string", result: { title: "string", note: "string", tone: "primary" } } ] } }. A branch may nest another decision with next: { question, branches } instead of result. Optional caption="string" and footer="string" props.\n' +
  '- tone values: "primary" = the recommended pick (teal), "alt" = a viable alternative (amber), "neutral" = a fallback (muted). Give the main recommendation tone "primary".\n' +
  '- One question per node, 2-3 branches, nest at most one level deep.\n' +
  '\n' +
  'VISUALS — every post needs 2-3 visual elements, never a wall of text:\n' +
  '- A comparison post lands at least three: a <StatRow> near the top, a <ComparisonTable> for the head-to-head, and a <DecisionTree> in the "how to choose" section.\n' +
  '- Do NOT invent or hot-link product screenshots or external image URLs. Real product screenshots are added by a human in a later pass. If you use a <Figure> for an image, omit src rather than fabricate one.\n' +
  '\n';
if (!genBody.includes('DECISION TREES — use the <DecisionTree>')) {
  genBody = genBody.replace('SVG / MDX SYNTAX RULE:', decisionSection + 'SVG / MDX SYNTAX RULE:');
  changes.push('Generate Draft: added DECISION TREES + VISUALS sections');
}
gen.parameters.body = genBody;

// ---- 2. Humanize --------------------------------------------------------
const hum = find('Humanize');
let humBody = hum.parameters.body;

const oldImportVerify =
  "the seven import lines starting with 'import SideBySide'). Verify all 7 imports";
const newImportVerify =
  "the eight import lines starting with 'import SideBySide'). Verify all 8 imports";
if (humBody.includes(oldImportVerify)) {
  humBody = humBody.replace(oldImportVerify, newImportVerify);
  changes.push('Humanize: import count 7 -> 8');
}

const oldCompList =
  '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <MyTake>.';
const newCompList =
  '<StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <DecisionTree>, <MyTake>.';
if (humBody.includes(oldCompList)) {
  humBody = humBody.replace(oldCompList, newCompList);
  changes.push('Humanize: added <DecisionTree> to component list');
}

const humDtVerify =
  'DECISION TREE verify — if the draft draws a "which should you pick" decision tree as an inline <svg> (rect/text/line boxes), convert it to a <DecisionTree> component using the documented schema. Process or workflow diagrams (data flow, n8n graphs) may stay as inline SVG.\n\n';
if (!humBody.includes('DECISION TREE verify')) {
  humBody = humBody.replace('Output only the rewritten MDX', humDtVerify + 'Output only the rewritten MDX');
  changes.push('Humanize: added DECISION TREE verify line');
}
hum.parameters.body = humBody;

// ---- Write back ---------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
if (changes.length === 0) {
  console.log('No changes — engine already has the DecisionTree updates.');
} else {
  console.log('Applied:\n' + changes.map((c) => '  - ' + c).join('\n'));
}
