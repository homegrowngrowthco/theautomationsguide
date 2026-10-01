// R6 (conversion audit 2026-10-01, finding F4): link the FIRST unlinked prose mention
// of every live-program tool through /go/<slug>/, but only in posts that carry no
// /go/ link for that tool anywhere yet. Deterministic, no network, no model.
//
//   node qa/link-live-mentions.mjs              # dry run: per-post diff summary + totals, writes nothing
//   node qa/link-live-mentions.mjs --write      # apply in place (CRLF/LF preserved byte-for-byte)
//   node qa/link-live-mentions.mjs --selftest   # frozen offline fixtures (CI)
//   node qa/link-live-mentions.mjs --post <path> [--write]   # one file
//
// What counts as "live": a parent slug in src/data/affiliate-links.ts with status
// 'live'. Deep-link variants (apollo-pricing, kit-convertkit, ...) group under their
// parent: a variant is a key that extends a parent key with "-..." AND shares its
// homepageFallback host. A post that already links ANY variant of a tool, or renders
// one through a component affiliateSlug prop (ToolBreakdown/ChooseIf/BottomLine/
// ComparisonTable/IntentTable all emit /go/<affiliateSlug>/), is left alone for that tool.
//
// What counts as a "mention": a whole-word, case-sensitive match of the tool's
// tools.ts name or alias (or the affiliate-links name when the tool has no hub),
// in prose only. Never matched: frontmatter (so FAQs), import/export lines,
// headings, blockquotes, fenced code + code spans, existing markdown/HTML links,
// images (alt text), bare URLs, table header rows, JSX expressions, and every
// component tag with its props. Component CHILDREN are skipped too, except the
// prose wrappers whose children are ordinary markdown (MyTake, SideBySide's
// Fragment slots), where existing posts already carry /go/ links.
//
// Common-word brand names (Make, Close, Kit, Clay, Motion, Instantly, Nutshell, ...)
// get extra guards: never at the start of a sentence, list item, table cell or bold
// label; never inside a Title Case run ("Starter Kit"); never before a word that
// makes it a field name ("Close Date"). Lowercase is never matched for any tool.
//
// The matcher (planLinks + loadLiveTools) is exported so qa/lint-content.mjs WARNs
// on new posts with the same rules; importing this file runs nothing.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLogoRegistry } from './registry.mjs';

const BLOG_DIR = 'src/content/blog';

// Brand names that are also ordinary English words (or read as one when capitalised
// at a sentence start). Lowercased tool slug OR name. Non-live entries are harmless
// and keep the guard in place if a program flips to live later.
export const AMBIGUOUS = new Set([
  'make', 'close', 'kit', 'clay', 'motion', 'instantly', 'nutshell', 'watermelon',
  'woodpecker', 'surfer', 'loops', 'folk', 'vector', 'warmly', 'otter', 'lindy',
  'signal house', 'constant contact', 'leadpages', 'flow',
]);

// A capitalised word right after these makes the ambiguous name a field/UI label.
const AMBIGUOUS_FOLLOWERS = {
  close: /^\s+(Date|Dates|Won|Lost|Rate|Rates|Reason|Reasons|Probability|Stage|Plan|Button)\b/,
  make: /^\s+(Sure|It|The|A|An|Or)\b/,
  kit: /^\s+(Of|Bag)\b/,
};

// Official brand casing that tools.ts does not list (lemlist styles itself lowercase).
// Only non-dictionary words belong here.
const EXTRA_NAMES = { lemlist: ['lemlist'] };

// Components whose children are plain markdown prose (existing posts already link there).
// Block <div>/<section> wrappers count too: one post wraps its whole body in
// <div class="prose-content">. Their inner components are still masked by their own tags.
const PROSE_CHILD_COMPONENTS = new Set(['MyTake', 'SideBySide', 'Fragment', 'div', 'section']);
const VOID_HTML = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'col', 'embed', 'param', 'track']);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

// ---- registry ---------------------------------------------------------------

// Every affiliate-links.ts entry, quoted keys included ('reply-io':). Quote-agnostic
// and CRLF-aware (CLAUDE.md gotcha 9).
export function loadAffiliateEntries(alPath = 'src/data/affiliate-links.ts') {
  const src = readFileSync(alPath, 'utf-8').replace(/\r\n/g, '\n');
  const map = new Map();
  for (const m of src.matchAll(/^ {2}['"]?([a-z0-9-]+)['"]?:\s*\{([\s\S]*?)\n {2}\},?/gm)) {
    const blk = m[2];
    const get = (f) => (blk.match(new RegExp(`${f}:\\s*(['"\`])((?:(?!\\1).)*)\\1`)) || [])[2] || '';
    map.set(m[1], { status: get('status') || 'unknown', name: get('name'), home: get('homepageFallback') });
  }
  return map;
}

// slug -> parent slug. A variant extends a parent key with "-..." and shares its host.
export function buildParentMap(entries) {
  const parentOf = new Map();
  for (const [slug, e] of entries) {
    let parent = slug;
    const parts = slug.split('-');
    for (let k = parts.length - 1; k >= 1; k--) {
      const cand = parts.slice(0, k).join('-');
      const pe = entries.get(cand);
      if (pe && hostOf(pe.home) && hostOf(pe.home) === hostOf(e.home)) { parent = cand; break; }
    }
    parentOf.set(slug, parent);
  }
  return parentOf;
}

// Live parent tools with the names a reader would see in prose.
export function loadLiveTools({ alPath, toolsPath } = {}) {
  const entries = loadAffiliateEntries(alPath);
  const parentOf = buildParentMap(entries);
  const { entries: toolEntries } = loadLogoRegistry(toolsPath);
  const toolBySlug = new Map(toolEntries.map((t) => [t.slug, t]));
  const tools = [];
  for (const [slug, e] of entries) {
    if (parentOf.get(slug) !== slug || e.status !== 'live') continue;
    const t = toolBySlug.get(slug);
    const names = [...new Set([...(t ? [t.name, ...t.aliases] : [e.name]), ...(EXTRA_NAMES[slug] || [])])]
      .filter((n) => n && n.length >= 3);
    tools.push({ slug, names });
  }
  return { tools, parentOf };
}

// ---- masking ----------------------------------------------------------------

// Returns a Uint8Array over `raw`: 1 = prose a link may be inserted into.
export function proseMask(raw) {
  const n = raw.length;
  const ok = new Uint8Array(n);
  // Frontmatter stays 0.
  let bodyStart = 0;
  const fm = raw.match(/^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/);
  if (fm) bodyStart = fm[0].length;
  ok.fill(1, bodyStart);

  const kill = (a, b) => ok.fill(0, Math.max(a, 0), Math.min(b, n));

  // -- line pass: fences, headings, blockquotes, ESM, tables, ref defs, FAQ sections
  const lines = [];
  for (let i = bodyStart; i < n;) {
    let j = raw.indexOf('\n', i);
    if (j === -1) j = n;
    lines.push({ s: i, e: j, t: raw.slice(i, j).replace(/\r$/, '') });
    i = j + 1;
  }
  let fence = null;
  let faqLevel = 0;
  for (let k = 0; k < lines.length; k++) {
    const { s, e, t } = lines[k];
    const trimmed = t.trim();
    const fm2 = trimmed.match(/^(`{3,}|~{3,})/);
    if (fence) { kill(s, e); if (fm2 && trimmed.startsWith(fence)) fence = null; continue; }
    if (fm2) { fence = fm2[1]; kill(s, e); continue; }
    const h = trimmed.match(/^(#{1,6})\s/);
    if (h) {
      kill(s, e);
      const lvl = h[1].length;
      if (faqLevel && lvl <= faqLevel) faqLevel = 0;
      if (/\b(FAQs?|Frequently asked)/i.test(trimmed)) faqLevel = lvl;
      continue;
    }
    if (faqLevel) { kill(s, e); continue; }
    if (/^>/.test(trimmed)) { kill(s, e); continue; }
    if (/^(import|export)\s/.test(t)) { kill(s, e); continue; }
    if (/^\[[^\]]+\]:\s/.test(trimmed)) { kill(s, e); continue; }
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(trimmed) && trimmed.includes('-')) {
      kill(s, e); // separator row; the row above it is the header
      if (k > 0 && lines[k - 1].t.includes('|')) kill(lines[k - 1].s, lines[k - 1].e);
      continue;
    }
  }

  // -- inline code spans (before tag scanning, so `<Tag>` in code is inert)
  // Same-line only: a stray backtick inside a JSX string prop must not pair with one
  // lines later and hide a real tag's `<` from the scanner below.
  for (const m of raw.slice(bodyStart).matchAll(/(`+)[^\n]*?\1/g)) {
    const a = bodyStart + m.index;
    if (ok[a]) kill(a, a + m[0].length);
  }

  // -- JSX / HTML tags, their props, non-prose children, comments, {expressions}
  const stack = []; // { name, prose }
  let blockDepth = 0;
  let i = bodyStart;
  while (i < n) {
    if (!ok[i] && raw[i] !== '<' && raw[i] !== '{') { i++; continue; }
    const c = raw[i];
    if (c === '<' && raw.startsWith('<!--', i)) {
      const end = raw.indexOf('-->', i);
      const stop = end === -1 ? n : end + 3;
      kill(i, stop); i = stop; continue;
    }
    if (c === '<' && /[A-Za-z/]/.test(raw[i + 1] || '') && ok[i]) {
      const closing = raw[i + 1] === '/';
      const nm = raw.slice(i + (closing ? 2 : 1)).match(/^[A-Za-z][A-Za-z0-9.]*/);
      if (!nm) { i++; continue; }
      // find the end of the tag, balancing quotes and braces (JSX props)
      let depth = 0, inStr = null, j = i + 1;
      for (; j < n; j++) {
        const ch = raw[j];
        if (inStr) { if (ch === inStr && raw[j - 1] !== '\\') inStr = null; continue; }
        if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
        else if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') depth--;
        else if (ch === '>' && depth <= 0) break;
      }
      const tagEnd = Math.min(j + 1, n);
      kill(i, tagEnd);
      const name = nm[0];
      const selfClosing = raw[j - 1] === '/' || VOID_HTML.has(name.toLowerCase());
      if (closing) {
        const idx = stack.map((x) => x.name).lastIndexOf(name);
        if (idx !== -1) {
          for (const x of stack.splice(idx)) if (!x.prose) blockDepth--;
        }
      } else if (!selfClosing) {
        const prose = PROSE_CHILD_COMPONENTS.has(name);
        stack.push({ name, prose });
        if (!prose) blockDepth++;
      }
      i = tagEnd; continue;
    }
    if (c === '{' && ok[i]) {
      let depth = 0, j = i;
      for (; j < n; j++) {
        if (raw[j] === '{') depth++;
        else if (raw[j] === '}') { depth--; if (depth === 0) break; }
      }
      kill(i, j + 1); i = j + 1; continue;
    }
    if (blockDepth > 0) ok[i] = 0;
    i++;
  }

  // -- inline links / images / autolinks / bare URLs on what is left
  const body = raw.slice(bodyStart);
  const inlineRes = [
    /!?\[(?:[^\[\]\n]|\[[^\]\n]*\])*\]\([^)\n]*\)/g, // [text](url) and ![alt](src)
    /!?\[[^\]\n]*\]\[[^\]\n]*\]/g, // [text][ref]
    /<https?:[^>\s]+>/g,
    /https?:\/\/[^\s)\]]+/g,
  ];
  for (const re of inlineRes) {
    for (const m of body.matchAll(re)) kill(bodyStart + m.index, bodyStart + m.index + m[0].length);
  }
  return ok;
}

// ---- matching ---------------------------------------------------------------

// Slugs (as parents) that already resolve to a /go/ link somewhere in the post:
// literal /go/<slug> anywhere (prose, HTML, props) or a component affiliateSlug prop.
export function linkedParents(raw, parentOf) {
  const out = new Set();
  const add = (s) => out.add(parentOf.get(s) || s);
  for (const m of raw.matchAll(/\/go\/([a-z0-9-]+)/g)) add(m[1]);
  for (const m of raw.matchAll(/affiliateSlug\s*[:=]\s*\{?\s*['"]([a-z0-9-]+)['"]/g)) add(m[1]);
  return out;
}

function isSentenceStart(raw, idx) {
  const lineStart = raw.lastIndexOf('\n', idx - 1) + 1;
  let before = raw.slice(lineStart, idx);
  before = before.replace(/[*_"'(\[“‘]+$/, '').replace(/\s+$/, '');
  if (before === '') return true;
  if (/^\s*([-*+]|\d+[.)])$/.test(before)) return true; // list marker
  if (/\|$/.test(before)) return true; // table cell start
  if (/[.!?:;]["'”’)]*$/.test(before)) return true;
  return false;
}

function precededByTitleCase(raw, idx) {
  const m = raw.slice(Math.max(0, idx - 40), idx).match(/([A-Za-z][A-Za-z0-9.'-]*)[ \t]+$/);
  return !!(m && /^[A-Z]/.test(m[1]));
}

// Plan insertions for one file. Returns { out, links:[{slug,name,index,context}] }.
export function planLinks(raw, { tools, parentOf }) {
  const ok = proseMask(raw);
  const already = linkedParents(raw, parentOf);
  const picks = [];
  for (const tool of tools) {
    if (already.has(tool.slug)) continue;
    const ambiguousTool = AMBIGUOUS.has(tool.slug) || tool.names.some((x) => AMBIGUOUS.has(x.toLowerCase()));
    let best = null;
    for (const name of tool.names) {
      const re = new RegExp(escapeRe(name), 'g');
      for (const m of raw.matchAll(re)) {
        const a = m.index, b = a + name.length;
        if (best && a >= best.index) break;
        let allOk = true;
        for (let p = a; p < b; p++) if (!ok[p]) { allOk = false; break; }
        if (!allOk) continue;
        const prev = raw[a - 1] || ' ', next = raw[b] || ' ', next2 = raw[b + 1] || ' ';
        if (/[A-Za-z0-9_\-/.@#]/.test(prev)) continue;
        if (/[A-Za-z0-9_\-/@]/.test(next)) continue;
        if (next === '.' && /[A-Za-z0-9]/.test(next2)) continue; // Clay.com when the alias is Clay
        if (ambiguousTool && AMBIGUOUS.has(name.toLowerCase())) {
          if (isSentenceStart(raw, a)) continue;
          if (precededByTitleCase(raw, a)) continue;
          const fol = AMBIGUOUS_FOLLOWERS[name.toLowerCase()];
          if (fol && fol.test(raw.slice(b, b + 30))) continue;
        }
        if (!best || a < best.index || (a === best.index && name.length > best.name.length)) best = { slug: tool.slug, name, index: a };
        break;
      }
    }
    if (best) picks.push(best);
  }
  // no two insertions may overlap (different tools sharing a span)
  picks.sort((x, y) => x.index - y.index || y.name.length - x.name.length);
  const chosen = [];
  let lastEnd = -1;
  for (const p of picks) {
    if (p.index < lastEnd) continue;
    chosen.push(p);
    lastEnd = p.index + p.name.length;
  }
  let out = raw;
  for (const p of [...chosen].sort((x, y) => y.index - x.index)) {
    out = out.slice(0, p.index) + `[${p.name}](/go/${p.slug}/)` + out.slice(p.index + p.name.length);
  }
  for (const p of chosen) {
    const ls = raw.lastIndexOf('\n', p.index - 1) + 1;
    let le = raw.indexOf('\n', p.index); if (le === -1) le = raw.length;
    p.line = raw.slice(0, p.index).split('\n').length;
    const from = Math.max(ls, p.index - 90), to = Math.min(le, p.index + p.name.length + 90);
    p.context = (from > ls ? '...' : '') + raw.slice(from, p.index) + `[${p.name}](/go/${p.slug}/)` + raw.slice(p.index + p.name.length, to).replace(/\r$/, '') + (to < le ? '...' : '');
  }
  return { out, links: chosen };
}

// ---- self-test (frozen fixtures, no repo reads) ----------------------------

function selftest() {
  const reg = {
    tools: [
      { slug: 'smartlead', names: ['Smartlead'] },
      { slug: 'make', names: ['Make', 'Integromat'] },
      { slug: 'close', names: ['Close', 'Close CRM', 'Close.com'] },
      { slug: 'kit', names: ['Kit', 'ConvertKit'] },
      { slug: 'apollo', names: ['Apollo.io', 'Apollo'] },
    ],
    parentOf: new Map([['smartlead', 'smartlead'], ['smartlead-pricing', 'smartlead'], ['make', 'make'], ['close', 'close'], ['kit', 'kit'], ['apollo', 'apollo']]),
  };
  const FM = '---\ntitle: "Smartlead and Make"\nfaqs:\n  - question: "Is Smartlead good?"\n    answer: "Smartlead is fine."\n---\n\n';
  let failed = 0;
  const t = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}`); if (!cond) failed++; };
  const run = (body) => planLinks(FM + body, reg);

  // 1. first prose mention only
  let r = run('We send with Smartlead daily. Smartlead also warms.\n');
  t('links first prose mention only', r.links.length === 1 && r.out.includes('with [Smartlead](/go/smartlead/) daily. Smartlead also') && r.out.startsWith(FM));

  // 2. skips heading / code span / fence / component prop / existing link / image alt / blockquote / table header
  r = run([
    '## Smartlead setup', '', 'Run `Smartlead --send` first.', '', '```', 'Smartlead', '```', '',
    '<ToolBreakdown tools={[{ name: "Smartlead", verdict: "Smartlead wins" }]} />', '',
    '> Smartlead quote', '', '![Smartlead dashboard](/img/x.png)', '',
    '| Smartlead | Make |', '|---|---|', '| ok | ok |', '',
    '<PullQuote>Smartlead in a pull quote</PullQuote>', '',
    'See [Smartlead](/tools/smartlead/) here; later Smartlead wins.', '',
  ].join('\n'));
  t('skips heading/code/fence/prop/blockquote/alt/table-header/pullquote/existing link', r.links.length === 1 && r.out.includes('later [Smartlead](/go/smartlead/) wins') && r.out.includes('verdict: "Smartlead wins"') && r.out.includes('| Smartlead | Make |'));

  // 3. MyTake / Fragment children are prose
  r = run('<MyTake>\nMy pick is Smartlead for volume.\n</MyTake>\n');
  t('links inside MyTake prose children', r.links.length === 1 && r.out.includes('pick is [Smartlead](/go/smartlead/) for'));

  // 4. skips when any /go/ for the tool (or a variant, or an affiliateSlug prop) exists
  r = run('Pricing is [here](/go/smartlead-pricing/). Smartlead is cheap.\n');
  t('skips tool with a variant /go/ link already', r.links.length === 0);
  r = run('<BottomLine affiliateSlug="smartlead" />\n\nSmartlead is cheap.\n');
  t('skips tool with an affiliateSlug component CTA', r.links.length === 0);

  // 5. ambiguous common-word names
  r = run('Make is great. Make sure you close it. Teams love Make for routing.\n');
  t('ambiguous name not linked at sentence start, linked mid-sentence', r.links.length === 1 && r.out.includes('love [Make](/go/make/) for') && r.out.startsWith(FM + 'Make is great. Make sure'));
  r = run('- Close is the CRM.\n\nSet the Close Date field. **Close:** fine. Grab the Starter Kit now.\n');
  t('ambiguous guards: list item, field name, bold label, Title Case run', r.links.length === 0);
  r = run('We moved from Pipedrive to Close.com last year.\n');
  t('alias with a dot (Close.com) links whole alias', r.links.length === 1 && r.out.includes('to [Close.com](/go/close/) last'));
  r = run('Visit Kit.com or the kit page. Then use ConvertKit forms.\n');
  t('Kit.com not split; lowercase never matched; next alias linked', r.links.length === 1 && r.out.includes('use [ConvertKit](/go/kit/) forms'));

  // 6. longest name at a position, possessive, hyphen compounds
  r = run('Apollo-sourced lists are noisy, but Apollo.io\'s free tier helps.\n');
  t('skips hyphen compound, prefers longest alias', r.links.length === 1 && r.out.includes("but [Apollo.io](/go/apollo/)'s free"));

  // 7. CRLF preserved + idempotent
  const crlf = (FM + 'Intro line.\n\nWe send with Smartlead and route with Make via webhooks.\n').replace(/\n/g, '\r\n');
  r = planLinks(crlf, reg);
  const lone = (s) => (s.match(/(^|[^\r])\n/g) || []).length;
  t('CRLF preserved', r.links.length === 2 && lone(r.out) === 0 && (r.out.match(/\r\n/g) || []).length === (crlf.match(/\r\n/g) || []).length);
  const r2 = planLinks(r.out, reg);
  t('idempotent: second run = 0 changes', r2.links.length === 0 && r2.out === r.out);

  // 8. frontmatter (incl. faqs) untouched even when it is the only mention
  r = run('No mentions here.\n');
  t('frontmatter/faqs never linked', r.links.length === 0 && r.out === FM + 'No mentions here.\n');

  console.log(failed ? `\n${failed} selftest(s) FAILED` : '\nAll selftests passed.');
  process.exit(failed ? 1 : 0);
}

// ---- CLI --------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return selftest();
  const WRITE = args.includes('--write');
  const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
  const reg = loadLiveTools();
  const files = getArg('--post')
    ? [getArg('--post')]
    : readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).sort().map((f) => path.join(BLOG_DIR, f));

  const perTool = new Map();
  const perPost = [];
  let total = 0;
  for (const file of files) {
    const raw = readFileSync(file, 'utf-8');
    const { out, links } = planLinks(raw, reg);
    if (!links.length) continue;
    perPost.push([path.basename(file), links.length]);
    total += links.length;
    console.log(`\n${path.basename(file)}  (+${links.length})`);
    for (const l of links) {
      perTool.set(l.slug, (perTool.get(l.slug) || 0) + 1);
      console.log(`  + ${l.name} -> /go/${l.slug}/  L${l.line}: ${l.context.trim()}`);
    }
    if (WRITE) writeFileSync(file, out, 'utf-8');
  }
  console.log(`\nLive parent tools: ${reg.tools.length} (${reg.tools.map((t) => t.slug).join(', ')})`);
  console.log('\nPer tool:');
  for (const [s, c] of [...perTool].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(4)}  ${s}`);
  console.log(`\nTotal: ${total} link(s) across ${perPost.length} post(s) of ${files.length}. ${WRITE ? 'WRITTEN.' : 'Dry run, nothing written (use --write).'}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(fileURLToPath(import.meta.url)).toLowerCase();
if (isMain) main();
