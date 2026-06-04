// Engine updater — add the editorial-polish body components to generated posts:
//   <KeyTakeaways>  right after the quick-answer (scannable, AI-quotable summary)
//   <BottomLine>    at the close (verdict + recommended tool CTA)
//   <Sources>       at the very end (consolidated citations; E-E-A-T + GEO)
//
// CRITICAL: all JSX examples use single braces only — never literal {{ }}
// (n8n treats {{ }} as expression delimiters; see fix-engine-double-braces.mjs).
//
// Idempotent. Deploy with deploy-engine.mjs --apply AFTER the component PR merges.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const changes = [];

const gen = doc.nodes.find((n) => n.name === 'Generate Draft');
let g = gen.parameters.body;

// 1. imports (after ComparisonTable, the last import)
const ctImport = "import ComparisonTable from '@/components/ComparisonTable.astro';";
const newImports =
  ctImport +
  "\nimport KeyTakeaways from '@/components/post/KeyTakeaways.astro';" +
  "\nimport Sources from '@/components/post/Sources.astro';" +
  "\nimport BottomLine from '@/components/post/BottomLine.astro';";
if (!g.includes('import KeyTakeaways')) {
  g = g.replace(ctImport, newImports);
  changes.push('Generate Draft: added KeyTakeaways / Sources / BottomLine imports');
}

// 2. KeyTakeaways right after the quick-answer bullet
const qaBullet = '- <div class="quick-answer"><strong>Quick answer:</strong> [TL;DR]</div>\n';
const kt = qaBullet + "- <KeyTakeaways items={[ 'three to five scannable one-line takeaways' ]} />\n";
if (!g.includes('<KeyTakeaways items=')) {
  g = g.replace(qaBullet, kt);
  changes.push('Generate Draft: KeyTakeaways after quick-answer');
}

// 3. BottomLine + Sources at the close of the COMPARISON skeleton
const closeBullet = '- One ## section, single takeaway paragraph (no "in conclusion")\n\n';
const close =
  '- One ## section, single takeaway paragraph (no "in conclusion")\n' +
  '- <BottomLine verdict="1-2 sentence recommendation" pick="ToolName" affiliateSlug="slug" ctaLabel="Try ToolName" />\n' +
  '- <Sources sources={[ { label: "Publisher: short title", url: "https://..." } ]} /> at the very end, listing the external sources you cited inline (no invented URLs)\n\n';
if (!g.includes('<BottomLine verdict=')) {
  g = g.replace(closeBullet, close);
  changes.push('Generate Draft: BottomLine + Sources at close');
}
gen.parameters.body = g;

// 4. Humanize parity
const hum = doc.nodes.find((n) => n.name === 'Humanize');
let h = hum.parameters.body;
if (h.includes('twelve import lines')) { h = h.replace('twelve import lines', 'fifteen import lines'); changes.push('Humanize: import count twelve -> fifteen'); }
if (h.includes('all 12 imports')) { h = h.replace('all 12 imports', 'all 15 imports'); changes.push('Humanize: verify all 12 -> 15 imports'); }
const oldList = '<SpectrumBar>, <MyTake>.';
const newList = '<SpectrumBar>, <KeyTakeaways>, <Sources>, <BottomLine>, <MyTake>.';
if (h.includes(oldList)) { h = h.replace(oldList, newList); changes.push('Humanize: added KeyTakeaways/Sources/BottomLine to component list'); }
hum.parameters.body = h;

writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
const gb = doc.nodes.find((n) => n.name === 'Generate Draft').parameters.body;
console.log(changes.length ? 'Applied:\n' + changes.map((c) => '  - ' + c).join('\n') : 'No changes — already applied.');
console.log(`Generate Draft braces: {{ =${(gb.match(/\{\{/g) || []).length} }} =${(gb.match(/\}\}/g) || []).length} (must be 1/1)`);
