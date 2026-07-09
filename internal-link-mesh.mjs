#!/usr/bin/env node
// Internal-link mesh backfill (audit S-1). Every /tools/<slug>/ hub is indexable
// but most have ZERO in-body inbound links, so they accrue no authority and rank
// pos 50+. This adds CONTEXTUAL in-prose links: the LLM only picks a verbatim
// existing phrase to hyperlink (it never writes prose); the script wraps that span
// deterministically, guarding against code / existing links / JSX. The build +
// lint gates then prove every post still compiles and every link resolves, so no
// hallucinated text can ship. Per post: up to 4 tool-hub links + up to 2 sibling
// posts, chosen by relevance, skipped if already linked. Idempotent (a hub whose
// href is already in the body is skipped, so re-runs add nothing new).
//
// Usage:
//   node --env-file=.env internal-link-mesh.mjs                 # analysis + census only
//   node --env-file=.env internal-link-mesh.mjs --plan --limit=3   # LLM-propose for 3 posts, print, no write
//   node --env-file=.env internal-link-mesh.mjs --write         # LLM-propose + apply to all posts

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const HERE = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(HERE, 'src', 'content', 'blog');
const WRITE = process.argv.includes('--write');
const PLAN = process.argv.includes('--plan') || WRITE; // PLAN = run the LLM but (unless --write) don't save
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0);
const MODEL = (process.argv.find((a) => a.startsWith('--model=')) || '').split('=')[1] || 'claude-sonnet-4-6';

const MAX_HUBS = 4;
const MAX_SIBLINGS = 2;
const AMBIGUOUS = new Set(['Make', 'Clay', 'Kit', 'Guide', 'Close', 'Motion', 'Warmly', 'Instantly']);
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- parse tools.ts registry ---
function loadTools() {
  const src = readFileSync(join(HERE, 'src', 'data', 'tools.ts'), 'utf-8');
  const idxs = [...src.matchAll(/slug:\s*["']([a-z0-9-]+)["']/g)].map((m) => ({ slug: m[1], i: m.index }));
  const tools = [];
  for (let k = 0; k < idxs.length; k++) {
    const block = src.slice(idxs[k].i, k + 1 < idxs.length ? idxs[k + 1].i : src.length);
    const name = (block.match(/name:\s*["'`]([^"'`]+)["'`]/) || [])[1] || idxs[k].slug;
    const aliasesRaw = (block.match(/aliases:\s*\[([^\]]*)\]/) || [])[1] || '';
    const aliases = [...aliasesRaw.matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
    tools.push({ slug: idxs[k].slug, name, aliases: aliases.length ? aliases : [name] });
  }
  return tools;
}

function mentionScore(tool, title, tags, body) {
  const ntags = tags.map(normalize);
  let score = 0, mentioned = false;
  for (const alias of tool.aliases) {
    const na = normalize(alias);
    const wb = new RegExp(`\\b${escapeRe(alias)}\\b`, AMBIGUOUS.has(alias) ? 'g' : 'gi');
    const hits = (body.match(wb) || []).length;
    if (ntags.includes(na)) { score += 500; mentioned = true; }
    if (new RegExp(`\\b${escapeRe(alias)}\\b`, 'i').test(title)) { score += 1000; mentioned = true; }
    if (AMBIGUOUS.has(alias)) { if (hits >= 2) { score += hits; mentioned = true; } }
    else if (hits > 0) { score += hits; mentioned = true; }
  }
  return mentioned ? score : 0;
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return null;
  const fence = raw.indexOf('\n---', 3);
  if (fence === -1) return null;
  const fmEnd = raw.indexOf('\n', fence + 1);
  if (fmEnd === -1) return null;
  return { fm: raw.slice(0, fmEnd + 1), body: raw.slice(fmEnd + 1) };
}
function fmField(fm, key) {
  const line = fm.match(new RegExp(`\\n${key}:\\s*(.+?)\\s*\\n`));
  if (!line) return '';
  const v = line[1];
  const dq = v.match(/^"((?:[^"\\]|\\.)*)"/); if (dq) return dq[1].replace(/\\"/g, '"');
  const sq = v.match(/^'((?:[^']|'')*)'/); if (sq) return sq[1].replace(/''/g, "'");
  return v;
}
function fmTags(fm) {
  const block = (fm.match(/\ntags:\s*\[([^\]]*)\]/) || [])[1]
    || (fm.match(/\ntags:\s*\n((?:\s*-\s*[^\n]+\n)+)/) || [])[1] || '';
  return [...block.matchAll(/["']?([A-Za-z0-9 _-]+)["']?/g)].map((m) => m[1].trim()).filter(Boolean);
}

// Balanced <Component ...> opening-tag ranges. Components in these posts carry tool
// data in multi-line array/object props (ToolBreakdown/ChooseIf/ComparisonTable etc.
// with name:/body:/highlights: strings), so a naive single-line brace regex misses
// them and links get wrapped INSIDE component data (which never renders). This scans
// each <Capitalized...> and balances { } [ ] and quotes to its closing '>'.
function componentRanges(body) {
  const ranges = [];
  const re = /<[A-Z][A-Za-z0-9]*/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    let depth = 0, inStr = null, j = m.index + m[0].length;
    for (; j < body.length; j++) {
      const c = body[j];
      if (inStr) { if (c === inStr && body[j - 1] !== '\\') inStr = null; continue; }
      if (c === '"' || c === "'" || c === '`') inStr = c;
      else if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') depth--;
      else if (c === '>' && depth <= 0) break;
    }
    ranges.push([m.index, j + 1]);
    re.lastIndex = j + 1;
  }
  return ranges;
}

// forbidden ranges an anchor must NOT overlap: code fences, inline code, existing
// markdown links, JSX expression braces, and full multi-line component tag blocks.
function forbiddenRanges(body) {
  const ranges = [];
  const pats = [/```[\s\S]*?```/g, /`[^`\n]*`/g, /\[[^\]]*\]\([^)]*\)/g, /\{[^}\n]*\}/g];
  for (const re of pats) for (const m of body.matchAll(re)) ranges.push([m.index, m.index + m[0].length]);
  ranges.push(...componentRanges(body));
  return ranges;
}
// wrap the first safe, whole-word occurrence of `anchor` as a link to href.
// returns the new body, or null if no safe occurrence exists / already linked.
function wrapAnchor(body, anchor, href) {
  if (body.includes(`](${href})`)) return null;        // already linked to this hub
  const ranges = forbiddenRanges(body);
  const inForbidden = (i, j) => ranges.some(([a, b]) => i < b && j > a);
  const wb = /\w/;
  let from = 0, idx;
  while ((idx = body.indexOf(anchor, from)) !== -1) {
    const end = idx + anchor.length;
    const before = idx > 0 ? body[idx - 1] : ' ';
    const after = end < body.length ? body[end] : ' ';
    const wordBoundary = !wb.test(before) && !wb.test(after);
    // Reject occurrences on a heading / component / import / blockquote line — links
    // belong in flowing prose, not in an `## H2` or a `<Component>` line.
    const lineStart = body.lastIndexOf('\n', idx - 1) + 1;
    const lineHead = body.slice(lineStart, idx);
    const badLine = /^\s{0,3}(#{1,6}\s|<|import\s|>\s?)/.test(lineHead) || /^\s{0,3}#{1,6}\s/.test(body.slice(lineStart, lineStart + 8));
    if (wordBoundary && !inForbidden(idx, end) && !badLine) {
      return body.slice(0, idx) + `[${anchor}](${href})` + body.slice(end);
    }
    from = idx + 1;
  }
  return null;
}

// --- load posts ---
const tools = loadTools();
const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
const posts = [];
for (const file of files) {
  const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts) { console.log(`!! ${file}: no frontmatter`); continue; }
  posts.push({ file, raw, ...parts, title: fmField(parts.fm, 'title'), tags: fmTags(parts.fm), slug: file.replace(/\.mdx?$/, '') });
}

// census
const inbound = new Map(tools.map((t) => [t.slug, 0]));
for (const p of posts) for (const t of tools) if (p.body.includes(`/tools/${t.slug}`)) inbound.set(t.slug, inbound.get(t.slug) + 1);
const orphans = [...inbound.entries()].filter(([, n]) => n === 0);
console.log(`\n=== HUB INBOUND-LINK CENSUS (${tools.length} hubs, ${posts.length} posts) ===`);
console.log(`Hubs with ZERO in-body inbound links: ${orphans.length} / ${tools.length}`);

// per-post plan
for (const p of posts) {
  p.hubCandidates = tools
    .map((t) => ({ t, score: mentionScore(t, p.title, p.tags, p.body) }))
    .filter((x) => x.score > 0 && !p.body.includes(`/tools/${x.t.slug}`))
    .sort((a, b) => b.score - a.score).slice(0, MAX_HUBS).map((x) => x.t);
  const ptags = new Set(p.tags.map(normalize));
  p.siblings = posts
    .filter((q) => q.slug !== p.slug && !p.body.includes(`/blog/${q.slug}`))
    .map((q) => ({ q, score: q.tags.map(normalize).filter((t) => ptags.has(t)).length }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.q.slug.localeCompare(a.q.slug))
    .slice(0, MAX_SIBLINGS).map((x) => x.q);
}

if (!PLAN) {
  const eligible = posts.filter((p) => p.hubCandidates.length || p.siblings.length);
  console.log(`\n${eligible.length} posts have link candidates. Re-run with --plan --limit=3 to preview LLM placement, or --write to apply.`);
  process.exit(0);
}

// --- LLM contextual placement ---
if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not set (pass --env-file=.env).'); process.exit(1); }
const client = new Anthropic();

async function proposeLinks(p) {
  const inTitle = (t) => t.aliases.some((a) => new RegExp(`\\b${escapeRe(a)}\\b`, 'i').test(p.title));
  const hubs = p.hubCandidates.map((t) => `  - id "tool:${t.slug}" -> ${t.name}${inTitle(t) ? '  (NAMED IN TITLE - prioritize linking this one)' : ''}`).join('\n');
  const sibs = p.siblings.map((q) => `  - id "post:${q.slug}" -> ${q.title}`).join('\n');
  const prompt = [
    'You are adding INTERNAL LINKS to an existing blog post. Do NOT rewrite, add, or remove any prose.',
    'For each TARGET, choose the single best VERBATIM span of text ALREADY in the post body to turn into a hyperlink.',
    'Rules:',
    '- The anchor must appear verbatim in the body (copy it EXACTLY, case-sensitive). Keep it to 1 to 3 words.',
    '- The anchor must be a NOUN PHRASE (a name or a short thing), NEVER a clause with a verb. Good: "Clay", "waterfall enrichment". Bad: "Clay is the fastest", "Apollo handles the top".',
    '- Choose from FLOWING PARAGRAPH PROSE only. Do NOT copy from tables, pricing lists, spec bullets, or <Component> cards.',
    '- Choose the first substantive mention where that tool/topic is actually discussed, not a passing list item.',
    '- For a tool, prefer the tool name itself, or a 2 to 3 word noun phrase referring to it.',
    '- Never choose text that is already a markdown link, inside `code`, or inside a <Component> tag.',
    '- If there is no natural anchor for a target, omit that target. Quality over coverage.',
    'Return ONLY JSON: {"links":[{"target":"<id>","anchor":"<verbatim span>"}]}',
    '',
    'TARGETS (tool hubs):', hubs || '  (none)',
    'TARGETS (sibling posts, link at most 1-2 where natural):', sibs || '  (none)',
    '',
    'POST BODY:', p.body,
  ].join('\n');
  const res = await client.messages.create({ model: MODEL, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] });
  const raw = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return [];
  try { return JSON.parse(m[0]).links || []; } catch { return []; }
}

const hrefFor = (target) => target.startsWith('tool:') ? `/tools/${target.slice(5)}/` : `/blog/${target.slice(5)}/`;

// Any post with candidates; wrapAnchor dedups per-href so posts that already have
// some /tools/ links just get their remaining named hubs linked.
let targetPosts = posts.filter((p) => p.hubCandidates.length || p.siblings.length);
if (LIMIT) targetPosts = targetPosts.slice(0, LIMIT);

let totalLinks = 0, wrote = 0;
for (const p of targetPosts) {
  const links = await proposeLinks(p);
  let body = p.body, applied = [], skipped = [];
  const validIds = new Set([...p.hubCandidates.map((t) => `tool:${t.slug}`), ...p.siblings.map((q) => `post:${q.slug}`)]);
  const usedHref = new Set();
  for (const l of links) {
    if (!l || !l.target || !l.anchor || !validIds.has(l.target)) { skipped.push(`${l?.target}: invalid target`); continue; }
    // Reject clause-length anchors (LLM sometimes returns a whole sentence); the
    // fallback then links the clean tool name instead.
    if (l.anchor.length > 34 || l.anchor.trim().split(/\s+/).length > 4) { skipped.push(`${l.target}: anchor too long "${l.anchor}"`); continue; }
    const href = hrefFor(l.target);
    if (usedHref.has(href)) continue;
    const next = wrapAnchor(body, l.anchor, href);
    if (next) { body = next; usedHref.add(href); applied.push(`[${l.anchor}](${href})`); }
    else skipped.push(`${l.target}: anchor "${l.anchor}" not found in a safe spot`);
  }
  // Deterministic fallback: for any named hub the LLM didn't place, wrap the tool's
  // own name/alias at its first safe PROSE occurrence. Non-ambiguous aliases only,
  // so we never link "Make" inside "Make sure". Guarantees a contextual link
  // whenever the tool is mentioned in prose at all.
  for (const t of p.hubCandidates) {
    const href = hrefFor(`tool:${t.slug}`);
    if (usedHref.has(href) || body.includes(`](${href})`)) continue;
    // Only aliases that (a) aren't ambiguous bare words and (b) share the brand
    // root (normalized alias contains the slug root), so we never link a dated or
    // unrelated alias like "Integromat" -> Make. Prefer the primary name, then
    // shorter aliases (the common prose form).
    const root = normalize(t.slug);
    const aliasCandidates = [t.name, ...t.aliases]
      .filter((a, i, arr) => arr.indexOf(a) === i && !AMBIGUOUS.has(a) && normalize(a).includes(root))
      .sort((a, b) => (a === t.name ? -1 : b === t.name ? 1 : a.length - b.length));
    for (const alias of aliasCandidates) {
      const next = wrapAnchor(body, alias, href);
      if (next) { body = next; usedHref.add(href); applied.push(`[${alias}](${href}) (fallback)`); break; }
    }
  }
  totalLinks += applied.length;
  console.log(`\n-- ${p.slug}`);
  console.log(`   applied: ${applied.join('  ') || '(none)'}`);
  if (skipped.length) console.log(`   skipped: ${skipped.join(' | ')}`);
  if (WRITE && body !== p.body) { writeFileSync(join(BLOG_DIR, p.file), p.fm + body, 'utf8'); wrote++; }
}
console.log(`\n${WRITE ? 'WROTE' : 'PLAN'}: ${totalLinks} contextual links across ${targetPosts.length} posts${WRITE ? ` (${wrote} files written)` : ''}.`);
if (!WRITE) console.log('Re-run with --write to apply.');
