// update-engine-notion-block-split.mjs — S96 (2026-07-29)
//
// Fixes the "social drafts get cut off in Notion" bug (LinkedIn especially).
//
// Root cause: Save LinkedIn Post + Save Twitter Thread each crammed the ENTIRE
// multi-paragraph draft into ONE Notion paragraph block via
// `.substring(0, 1999)`. Notion rich_text hard-caps at 2000 chars per object, so
// any post over ~1999 chars was silently truncated — and the part lost is the
// TAIL: the soft CTA and the "Full post: <url>" line. The LinkedIn prompt asks
// for 1200-1800 chars but the every-1-2-sentence line breaks + 3-5 takeaways +
// CTA + URL routinely push real drafts past the cap, so the ending vanished.
//
// Fix:
//   1. Parse Social Outputs (Code node): add a `toBlocks()` helper that splits
//      each draft into <=1900-char Notion paragraph blocks on paragraph/line
//      boundaries (nothing is discarded), and expose `twitterBlocks` +
//      `linkedinBlocks` on the output json.
//   2. Save LinkedIn Post + Save Twitter Thread: replace the single truncated
//      paragraph block with `.concat($json.<x>Blocks)` so the full draft is
//      written as however many blocks it needs (callout + N paragraphs, well
//      under Notion's 100-child-block create limit).
//
// Idempotent: each edit checks its "already applied" token and skips.
// Run: node n8n/update-engine-notion-block-split.mjs   (mutates blog-post-engine.json
// in place; deploy afterwards with deploy-engine.mjs --apply, then GET-verify)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const node = (name) => {
  const n = wf.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`node not found: ${name}`);
  return n;
};

let applied = 0, skipped = 0;
function edit(label, obj, key, find, replace, token) {
  const src = obj[key];
  if (src.includes(token)) { console.log(`SKIP (already applied): ${label}`); skipped++; return; }
  if (!src.includes(find)) throw new Error(`anchor missing for ${label}: ${find.slice(0, 70)}...`);
  const next = src.replace(find, replace);
  if (!next.includes(token) || next === src) throw new Error(`self-check failed for ${label}`);
  obj[key] = next;
  console.log(`APPLIED: ${label}`);
  applied++;
}

// ---- 1. Parse Social Outputs: add toBlocks() + expose *Blocks arrays ----
const pso = node('Parse Social Outputs').parameters;
const RETURN_ANCHOR = 'return [{ json: { ...carry, ...fields } }];';
// NOTE: this string is stored inside a jsCode field, so `\\n` here becomes the
// two-char escape `\n` in the stored code (a newline at n8n runtime). Same for
// `\\s`. Do not "simplify" the doubling.
const BLOCK_HELPER = [
  '// Notion rich_text hard-caps at 2000 chars per object. Cramming a whole',
  '// multi-paragraph draft into one block silently dropped the tail (CTA + URL).',
  '// Split into <=1900-char paragraph blocks on paragraph/line boundaries so the',
  '// full draft survives; the 3 Save nodes concat these onto their callout.',
  'const NOTION_MAX = 1900;',
  'function toBlocks(text) {',
  "  const mk = (s) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: s } }] } });",
  '  const out = [];',
  "  const push = (s) => { const t = String(s).replace(/\\s+$/, ''); if (t.trim()) out.push(mk(t)); };",
  "  const paras = String(text || '').split(/\\n{2,}/);",
  "  let buf = '';",
  "  const flush = () => { if (buf) { push(buf); buf = ''; } };",
  '  for (const p of paras) {',
  '    if (!p.trim()) continue;',
  '    if (p.length > NOTION_MAX) {',
  '      flush();',
  "      let line = '';",
  "      for (const ln of p.split('\\n')) {",
  '        if (line && (line.length + 1 + ln.length) > NOTION_MAX) { push(line); line = ln; }',
  "        else { line = line ? line + '\\n' + ln : ln; }",
  '        while (line.length > NOTION_MAX) { push(line.slice(0, NOTION_MAX)); line = line.slice(NOTION_MAX); }',
  '      }',
  '      if (line) push(line);',
  '      continue;',
  '    }',
  '    if (!buf) buf = p;',
  "    else if (buf.length + 2 + p.length <= NOTION_MAX) buf = buf + '\\n\\n' + p;",
  '    else { flush(); buf = p; }',
  '  }',
  '  flush();',
  "  return out.length ? out : [mk(String(text || '').slice(0, NOTION_MAX))];",
  '}',
  'const twitterBlocks = toBlocks(fields.twitter);',
  'const linkedinBlocks = toBlocks(fields.linkedin);',
  '',
  'return [{ json: { ...carry, ...fields, twitterBlocks, linkedinBlocks } }];',
].join('\n');
edit('Parse Social Outputs: toBlocks + *Blocks', pso, 'jsCode', RETURN_ANCHOR, BLOCK_HELPER, 'function toBlocks');

// ---- 2. Save LinkedIn Post: full draft via linkedinBlocks ----
const sl = node('Save LinkedIn Post').parameters;
edit('Save LinkedIn Post: concat linkedinBlocks', sl, 'body',
  ", { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: $json.linkedin.substring(0, 1999) } }] } }]",
  '].concat($json.linkedinBlocks)',
  '$json.linkedinBlocks');

// ---- 3. Save Twitter Thread: full draft via twitterBlocks ----
const st = node('Save Twitter Thread').parameters;
edit('Save Twitter Thread: concat twitterBlocks', st, 'body',
  ", { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: $json.twitter.substring(0, 1999) } }] } }]",
  '].concat($json.twitterBlocks)',
  '$json.twitterBlocks');

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n');
console.log(`\nDone: ${applied} applied, ${skipped} skipped. Wrote ${FILE}`);
console.log('Next: node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply (from repo root), then GET-verify.');
