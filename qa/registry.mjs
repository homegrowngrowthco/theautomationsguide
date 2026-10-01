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

// ---- tool category taxonomy (lint A3c) ------------------------------------
// /tools renders one section per `toolCategories` entry, so a tool filed under any
// other category silently never appears there (2026-10-01: 18 of 46 listed tools,
// because auto-register defaulted new tools to an unrendered 'Sales Engagement').
// Parse the taxonomy as text (quote-agnostic: LP-builder entries are JSON-quoted;
// CRLF-aware) and report every way the grid and the registry can drift apart.
const quotedStrings = (s) => [...s.matchAll(/(['"])((?:(?!\1).)*)\1/g)].map((m) => m[2]);

export function parseToolTaxonomy(src) {
  const text = src.replace(/\r\n/g, '\n');
  const arrayOf = (name) => {
    const m = text.match(new RegExp(`export const ${name}\\b[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
    return m ? quotedStrings(m[1]) : null;
  };
  const subsBlock = text.match(/export const categorySubs\b[^=]*=\s*\{([\s\S]*?)\n\};/);
  const subs = subsBlock ? [...subsBlock[1].matchAll(/^\s*(['"])((?:(?!\1).)+)\1\s*:/gm)].map((m) => m[2]) : null;
  const toolsStart = text.indexOf('export const tools');
  const body = toolsStart >= 0 ? text.slice(toolsStart) : '';
  const idxs = [...body.matchAll(/slug:\s*(['"])([a-z0-9-]+)\1/g)].map((m) => ({ slug: m[2], i: m.index }));
  const tools = idxs.map((e, k) => {
    const block = body.slice(e.i, k + 1 < idxs.length ? idxs[k + 1].i : body.length);
    const cm = block.match(/category:\s*(['"])((?:(?!\1).)*)\1/);
    return { slug: e.slug, category: cm ? cm[2] : null, listed: !/listed:\s*false/.test(block) };
  });
  return { categories: arrayOf('toolCategories'), nav: arrayOf('navToolCategories'), subs, tools };
}

export function taxonomyProblems({ categories, nav, subs, tools }) {
  const hard = [], warn = [];
  if (!categories || !categories.length) return { hard: ['toolCategories not found or empty in tools.ts'], warn };
  const cats = new Set(categories);
  if (cats.size !== categories.length) hard.push('toolCategories has a duplicate entry');
  for (const t of tools) {
    if (!t.category) hard.push(`tool "${t.slug}" has no category`);
    else if (!cats.has(t.category)) {
      hard.push(`tool "${t.slug}" category "${t.category}" is not in toolCategories${t.listed ? ' (listed: it will never render on /tools/)' : ''}`);
    }
  }
  for (const c of nav || []) if (!cats.has(c)) hard.push(`navToolCategories "${c}" is not in toolCategories (header jump-link to a missing section)`);
  if (!subs) hard.push('categorySubs not found in tools.ts');
  else {
    const subSet = new Set(subs);
    for (const c of categories) if (!subSet.has(c)) hard.push(`category "${c}" has no categorySubs line`);
    for (const s of subs) if (!cats.has(s)) hard.push(`categorySubs "${s}" is not in toolCategories (stale)`);
  }
  for (const c of categories) {
    if (!tools.some((t) => t.category === c && t.listed)) warn.push(`category "${c}" has no listed tools (its /tools/ section is skipped)`);
  }
  return { hard, warn };
}

// Frozen fixtures: the checker is tested against fixed text, never the live registry.
export function taxonomySelftest() {
  const reg = (opts = {}) => {
    const q = opts.q || "'";
    const s = (x) => `${q}${x}${q}`;
    const cats = opts.cats || ['Workflow Automation', 'SEO, Content & Creative'];
    const nav = opts.nav || ['Workflow Automation'];
    const subs = opts.subs || cats;
    const tools = opts.tools || [['make', 'Workflow Automation', true], ['surfer', 'SEO, Content & Creative', true]];
    const out = [
      `export const toolCategories = [\n${cats.map((c) => `  ${s(c)},`).join('\n')}\n];`,
      `export const categorySubs: Record<string, string> = {\n${subs.map((c) => `  ${s(c)}: ${s('a line, with commas: and colons')},`).join('\n')}\n};`,
      `export const navToolCategories = [\n${nav.map((c) => `  ${s(c)},`).join('\n')}\n];`,
      `export const tools: Tool[] = [\n${tools.map(([slug, cat, listed]) => `  {\n    slug: ${s(slug)},\n    name: ${s(slug)},\n    category: ${s(cat)},\n${listed ? '' : '    listed: false,\n'}    faqs: [{ question: ${s('q')}, answer: ${s('a')} }],\n  },`).join('\n')}\n];`,
    ].join('\n\n');
    return opts.crlf ? out.replace(/\n/g, '\r\n') : out;
  };
  const run = (src) => taxonomyProblems(parseToolTaxonomy(src));
  const cases = [
    ['clean registry', reg(), (r) => r.hard.length === 0 && r.warn.length === 0],
    ['double-quoted (LP builder) + CRLF', reg({ q: '"', crlf: true }), (r) => r.hard.length === 0],
    ['listed tool in unrendered category', reg({ tools: [['make', 'Workflow Automation', true], ['surfer', 'SEO, Content & Creative', true], ['reply-io', 'Sales Engagement', true]] }),
      (r) => r.hard.length === 1 && r.hard[0].includes('reply-io') && r.hard[0].includes('never render')],
    ['unlisted tool in unknown category', reg({ tools: [['make', 'Workflow Automation', true], ['surfer', 'SEO, Content & Creative', true], ['frase', 'Sales Engagement', false]] }),
      (r) => r.hard.length === 1 && r.hard[0].includes('frase') && !r.hard[0].includes('never render')],
    ['nav entry not a category', reg({ nav: ['Workflow Automation', 'Newsletter Platform'] }), (r) => r.hard.length === 1 && r.hard[0].includes('Newsletter Platform')],
    ['category missing its sub line', reg({ subs: ['Workflow Automation'] }), (r) => r.hard.length === 1 && r.hard[0].includes('no categorySubs')],
    ['stale sub line', reg({ subs: ['Workflow Automation', 'SEO, Content & Creative', 'AI Agents'] }), (r) => r.hard.length === 1 && r.hard[0].includes('stale')],
    ['category with only unlisted tools warns', reg({ tools: [['make', 'Workflow Automation', true], ['surfer', 'SEO, Content & Creative', false]] }),
      (r) => r.hard.length === 0 && r.warn.length === 1],
    ['duplicate category', reg({ cats: ['Workflow Automation', 'Workflow Automation', 'SEO, Content & Creative'], subs: ['Workflow Automation', 'SEO, Content & Creative'] }),
      (r) => r.hard.some((h) => h.includes('duplicate'))],
  ];
  let fail = 0;
  for (const [name, src, ok] of cases) {
    const r = run(src);
    const pass = ok(r);
    if (!pass) fail++;
    console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` -> ${JSON.stringify(r)}`}`);
  }
  return fail;
}
