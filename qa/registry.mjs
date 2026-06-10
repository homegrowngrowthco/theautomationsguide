// Shared registry + MDX parsing helpers for the QA gates (lint-content.mjs +
// render-acceptance.mjs). ONE source of truth for "does this tool have a logo"
// and "which tools does a post reference", so the two gates can't silently drift
// apart (feedback_unified_fuzzy_match_key). Everything reads the .ts registries
// as text — no TS loader needed, same approach as lint-content.mjs.

import { readFileSync } from 'node:fs';

// Map of lowercased {slug, name, ...aliases} -> logo path, for every tool in
// tools.ts that carries a `logo:` field. Mirrors how the post components resolve
// a logo (t.logo || logoByKey[affiliateSlug] || logoByKey[name]).
export function loadLogoRegistry(toolsPath = 'src/data/tools.ts') {
  const src = readFileSync(toolsPath, 'utf-8');
  const idxs = [...src.matchAll(/slug:\s*["']([a-z0-9-]+)["']/g)].map((m) => ({ slug: m[1], i: m.index }));
  const entries = [];
  for (let k = 0; k < idxs.length; k++) {
    const block = src.slice(idxs[k].i, k + 1 < idxs.length ? idxs[k + 1].i : src.length);
    const name = (block.match(/name:\s*["'`]([^"'`]+)["'`]/) || [])[1] || idxs[k].slug;
    const aliasesRaw = (block.match(/aliases:\s*\[([^\]]*)\]/) || [])[1] || '';
    const aliases = [...aliasesRaw.matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
    const logo = (block.match(/logo:\s*["']([^"']+)["']/) || [])[1] || null;
    entries.push({ slug: idxs[k].slug, name, aliases, logo });
  }
  const logoByKey = new Map();
  for (const e of entries) {
    if (!e.logo) continue;
    for (const key of [e.slug, e.name, ...e.aliases]) logoByKey.set(key.toLowerCase(), e.logo);
  }
  return { entries, logoByKey };
}

// slug -> affiliate status ('live'|'applied'|'pending'|'rejected'|'no-program').
export function loadAffiliateStatus(alPath = 'src/data/affiliate-links.ts') {
  const src = readFileSync(alPath, 'utf-8');
  const map = new Map();
  for (const m of src.matchAll(/^\s{2}([a-z0-9-]+):\s*\{([\s\S]*?)\n\s{2}\}/gm)) {
    const status = (m[2].match(/status:\s*["']([a-z-]+)["']/) || [])[1] || 'unknown';
    map.set(m[1], status);
  }
  return map;
}

// Extract each `<Tag ...>` opening tag WITH all its props/data, balancing { } [ ]
// and quotes so JSX object/array props (tree={{...}}, tools={[...]}) don't
// truncate the match. Returns the opening-tag substrings (enough to read props).
export function extractTagBlocks(body, tag) {
  const blocks = [];
  const open = `<${tag}`;
  let i = 0;
  while ((i = body.indexOf(open, i)) !== -1) {
    const after = body[i + open.length];
    if (after && !/[\s/>]/.test(after)) { i += open.length; continue; } // <ToolBreakdownX> guard
    let depth = 0, inStr = null, j = i + open.length;
    for (; j < body.length; j++) {
      const c = body[j];
      if (inStr) { if (c === inStr && body[j - 1] !== '\\') inStr = null; continue; }
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') depth--;
      else if (c === '>' && depth <= 0) break;
    }
    blocks.push(body.slice(i, j + 1));
    i = j + 1;
  }
  return blocks;
}

// affiliateSlugs referenced inside the logo-bearing components (ToolBreakdown,
// ChooseIf) — the components that render a brand logo per tool.
export function refdLogoSlugs(body) {
  const blocks = [...extractTagBlocks(body, 'ToolBreakdown'), ...extractTagBlocks(body, 'ChooseIf')];
  const slugs = [];
  for (const blk of blocks) {
    for (const m of blk.matchAll(/affiliateSlug:\s*["']([a-z0-9-]+)["']/g)) slugs.push(m[1].toLowerCase());
  }
  return slugs;
}

// Strip frontmatter, normalize CRLF. Returns { fm, body }.
export function splitFrontmatter(src) {
  const norm = src.replace(/\r\n/g, '\n');
  const m = norm.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: norm };
}
