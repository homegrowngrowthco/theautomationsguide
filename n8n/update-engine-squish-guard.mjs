// Idempotent engine updater: extend sanitizeMdx() in the Parse Draft node to also
// strip MULTI-COLUMN inline grid/flex wrapper styles (the PR #51 squish vector).
//
// Today sanitizeMdx() strips <style> blocks but leaves inline style="display:grid;
// grid-template-columns:repeat(3,1fr)" wrappers, which force components into narrow
// columns. This adds a deterministic strip for the genuinely-squishing case only:
// multi-column grid (repeat(2+) or 2+ explicit tracks) and row-direction flex.
// Width-only / single-column (1fr) / overflow wrappers are harmless and left intact,
// matching qa/lint-content.mjs.
//
// Usage:  node n8n/update-engine-squish-guard.mjs           (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'n8n/blog-post-engine.json';
const MARKER = "out = out.replace(/<style>[\\s\\S]*?<\\/style>/g, '');";
const SENTINEL = 'PR #51 squish vector';

// Built in a template literal so doubled backslashes collapse to single ones in the
// resulting jsCode source (e.g. \\s -> \s). Double-quoted style attrs only (what the LLM emits).
const INSERT = `

  // Strip MULTI-COLUMN inline grid/flex wrappers (PR #51 squish vector). Width-only /
  // single-column (1fr) / overflow wrappers are harmless and left intact.
  out = out.replace(/ ?style="[^"]*(?:grid-template-columns:\\s*(?:repeat\\(\\s*[2-9]|[^;"]*\\s+[^;"]+)|display:\\s*flex(?![^"]*flex-direction:\\s*column))[^"]*"/gi, '');`;

const wf = JSON.parse(readFileSync(FILE, 'utf-8'));
const node = wf.nodes.find((n) => typeof n.parameters?.jsCode === 'string' && n.parameters.jsCode.includes('function sanitizeMdx'));
if (!node) { console.error('Could not find the sanitizeMdx jsCode node.'); process.exit(1); }

let code = node.parameters.jsCode;
if (code.includes(SENTINEL)) {
  console.log('Already patched (squish-guard present). No-op.');
  process.exit(0);
}
if (!code.includes(MARKER)) {
  console.error('Could not find the <style>-strip marker line; engine structure changed. Aborting.');
  process.exit(1);
}

node.parameters.jsCode = code.replace(MARKER, MARKER + INSERT);
writeFileSync(FILE, JSON.stringify(wf, null, 2), 'utf-8');
console.log('Patched sanitizeMdx() with the multi-column inline-wrapper strip.');

// Self-check: the inserted regex must compile.
try {
  // eslint-disable-next-line no-new
  new RegExp(/ ?style="[^"]*(?:grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;"]*\s+[^;"]+)|display:\s*flex(?![^"]*flex-direction:\s*column))[^"]*"/gi);
  console.log('Inserted regex compiles. Done.');
} catch (e) {
  console.error('Inserted regex failed to compile:', e.message);
  process.exit(1);
}
