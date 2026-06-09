// Tool Landing-Page Builder - generates /tools/<slug> hub pages for first-mover tools.
//
// WHAT THIS IS
//   The companion to build-backlog.mjs. The backlog builder surfaces high-leverage
//   NET-NEW topics, but most of the best first-mover topics come back flagged
//   "needs LP" because the anchor tool has no /tools/<slug> landing page yet. An LP
//   is what makes a post double as an internal-link + affiliate hook, so LP build
//   rate (not topic supply) is the real volume-ramp pacer. This script closes that
//   gap: given a set of tool names, it generates each tool's full hub-page entry
//   (blurb, bestFor, 2-3 positioning paragraphs, 3 FAQs) and the matching pending
//   /go/<slug> affiliate entry, then (with --apply) splices both into the registries.
//
//   Output is two TypeScript registry edits:
//     - src/data/tools.ts          -> a Tool entry (listed:false, indexable hub page)
//     - src/data/affiliate-links.ts -> a pending /go/<slug> entry (homepage+UTM fallback)
//   This mirrors exactly how the Session 17 pipeline tools were added by hand.
//
// HOW IT WORKS
//   1. Resolve the requested tools from one of the input modes (--tools / --from-backlog
//      / --from-stars), grounded with the category + note from AFFILIATE_PIPELINE.md.
//   2. Drop any tool whose slug or name is ALREADY in tools.ts (idempotent; re-runnable).
//   3. ONE batched Claude call writes every LP as strict JSON (neutral, factual, no hype).
//   4. Deterministic sanitize: strip em/en dashes (no prompt-trust), enforce a kebab slug,
//      validate body/faq shape, dedupe within the batch. The LLM is not trusted to sanitize.
//   5. Lightweight GET on each proposed homepage so a wrong fallback URL surfaces NOW,
//      not as a broken CTA later (per the "validate status with content" rule).
//   6. Write a preview (lp-batch.{json,md}). With --apply, splice the entries into the two
//      .ts registries before their closing bracket. Without --apply, nothing is touched.
//
// USAGE (run from the project root so dotenv finds ./.env with ANTHROPIC_API_KEY):
//   node backlog/build-tool-lp.mjs --tools="Maildoso,Trigify,FullEnrich,Attio,Bland AI"
//   node backlog/build-tool-lp.mjs --from-backlog            # tools flagged needsLP in backlog-batch.json
//   node backlog/build-tool-lp.mjs --from-stars --count=8    # the AFFILIATE_PIPELINE.md first-mover (star) tools
//   node backlog/build-tool-lp.mjs --tools="Bland AI" --apply   # actually write the registries
//   node backlog/build-tool-lp.mjs --tools="Vapi" --model=claude-opus-4-8

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const rp = (...p) => join(ROOT, ...p);
const r = (...p) => readFileSync(rp(...p), 'utf8');

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const flag = (k) => process.argv.includes(`--${k}`);

const MODEL = arg('model') || 'claude-sonnet-4-6';
const COUNT = Number(arg('count')) || 0; // 0 = no cap
const APPLY = flag('apply');
// --apply-cached re-sanitizes the existing lp-batch.json and splices THAT batch in,
// so what ships is exactly what was reviewed (no fresh, unreviewed generation). This
// mirrors the backlog builder's "eyeball the batch, then stage" two-phase design.
const APPLY_CACHED = flag('apply-cached');
const FROM_BACKLOG = flag('from-backlog');
const FROM_STARS = flag('from-stars');
const TOOLS_ARG = arg('tools');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set. Add it to .env (project root) or your environment.');
  process.exit(1);
}

// ---- ONE shared normalize helper (every dedup/match uses this). ----
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Strip em/en dashes deterministically rather than relying on a prompt rule.
const dedash = (s) => (s || '').replace(/\s*[—–]\s*/g, ', ');
// Kebab slug matching the affiliate-links.ts key convention (reply-io, cal-com, bland-ai).
const kebab = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- existing tools.ts registry (for idempotency + category reuse) ----------
function parseToolsTs() {
  const src = r('src', 'data', 'tools.ts');
  const region = src.slice(src.indexOf('export const tools'));
  const marks = [...region.matchAll(/slug:\s*'([^']+)'/g)];
  const tools = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : region.indexOf('];', start);
    const block = region.slice(start, end);
    const name = (block.match(/name:\s*'([^']+)'/) || [])[1] || marks[i][1];
    const category = (block.match(/category:\s*'([^']+)'/) || [])[1] || '';
    tools.push({ slug: marks[i][1], name, category });
  }
  return tools;
}

// ---------- AFFILIATE_PIPELINE.md "Full backlog" (category + note + first-mover star) ----------
function parsePipelineBacklog() {
  const md = r('AFFILIATE_PIPELINE.md');
  const start = md.indexOf('## Full backlog');
  const end = md.indexOf('## Already in the main registry');
  const region = md.slice(start, end < 0 ? undefined : end);
  const out = [];
  let category = 'Uncategorized';
  for (const line of region.split(/\r?\n/)) {
    const h = line.match(/^###\s+(.*)$/);
    if (h) { category = h[1].replace(/[⭐\u{1f50e}✅]/gu, '').replace(/\s+/g, ' ').trim(); continue; }
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const first = cells[1] || '';
    if (!first || /^-+$/.test(first) || first.toLowerCase() === 'tool') continue;
    if (/~~/.test(first)) continue; // excluded (e.g. ~~Koala~~)
    const name = first.replace(/\*\*/g, '').replace(/[⭐\u{1f50e}✅]/gu, '').trim();
    if (!name) continue;
    out.push({
      name,
      category,
      firstMover: /⭐/u.test(line),
      note: (cells[2] || '') + (cells[3] ? ` (${cells[3]})` : ''),
    });
  }
  return out;
}

// ---------- resolve the requested tool list ----------
function resolveRequested(pipeline) {
  const byNorm = new Map(pipeline.map((t) => [norm(t.name), t]));
  const hydrate = (name) => byNorm.get(norm(name)) || { name, category: '', firstMover: false, note: '' };

  if (TOOLS_ARG) {
    return TOOLS_ARG.split(',').map((s) => s.trim()).filter(Boolean).map(hydrate);
  }
  if (FROM_BACKLOG) {
    const f = rp('backlog', 'backlog-batch.json');
    if (!existsSync(f)) { console.error('--from-backlog needs backlog/backlog-batch.json. Run build-backlog.mjs first.'); process.exit(1); }
    const batch = JSON.parse(readFileSync(f, 'utf8'));
    const names = new Set();
    for (const t of batch.topics || []) if (t.needsLP && t.anchorTool) names.add(t.anchorTool);
    return [...names].map(hydrate);
  }
  if (FROM_STARS) {
    return pipeline.filter((t) => t.firstMover);
  }
  console.error('Pick an input mode: --tools="A,B,C", --from-backlog, or --from-stars. See the header for usage.');
  process.exit(1);
}

// ---------- Claude proposes the LP content (single batched call) ----------
function buildPrompt(requested, categories) {
  const toolLines = requested.map((t) => `- ${t.name}${t.category ? ` [pipeline category: ${t.category}]` : ''}${t.note ? ` - note: ${t.note}` : ''}`).join('\n');
  // NOTE: no backtick characters in this prompt (it lives inside a template literal).
  return [
    'You are the content lead for The Automations Guide, a neutral RevOps and GTM automation blog. You are writing the landing-page (hub-page) copy for a set of tools so the site is first to rank as each tool grows.',
    'Voice: factual, specific, lightly opinionated, never hypey. June 2026 market knowledge. Avoid superlatives and marketing cliche. Where a category is brand new (AI voice, GEO/AI-search, waterfall enrichment, person-level visitor ID), say so plainly and name the obvious competitors a buyer would compare against.',
    '',
    'TOOLS TO WRITE (one hub page each):',
    toolLines,
    '',
    'EXISTING CATEGORY LABELS (reuse the best-fitting one verbatim when it fits; only invent a new short label if none fits):',
    categories.map((c) => `- ${c}`).join('\n'),
    '',
    'For EACH tool return an object with these fields:',
    '  slug: kebab-case, derived from the name (e.g. "Bland AI" -> "bland-ai", "Reply.io" -> "reply-io").',
    '  name: the canonical brand name as users write it.',
    '  category: one category label (reuse an existing one if it fits).',
    '  homepage: the official root homepage URL, https, with trailing slash (e.g. https://www.example.com/). Be accurate; this becomes the link fallback.',
    '  badge: a short plan note, one of the natural options like "Free tier available", "Free trial", "Paid", "Free (open source)", "Paid (lifetime deals)".',
    '  badgeFree: true ONLY if the badge describes a genuinely free tier or open-source/free option, else false.',
    '  ctaLabel: "Try <Name>" (or "Explore <Name>" for open-source/self-host tools).',
    '  ctaPrimary: true for a filled teal button (default true), false for a ghost button.',
    '  blurb: ONE sentence (max ~32 words), what the tool is and who it is for. Shown on the card and hub hero.',
    '  bestFor: ONE sentence completing "Best for ...", the ideal buyer.',
    '  body: an array of EXACTLY 2 paragraphs (3-4 sentences each). Para 1: what it does and its angle. Para 2: where it fits in a RevOps/GTM stack and the natural head-to-head comparisons a buyer would run.',
    '  faqs: an array of EXACTLY 3 objects {question, answer}. Real buyer questions (what is it, how does it compare to <named competitor>, who should or should not use it). Each answer 1-2 sentences.',
    '  affiliateNote: one short sentence on the likely affiliate program if known (platform and/or commission), else "Affiliate program availability to verify on application."',
    '  aliases: array of 1-3 strings to detect the tool in post text (the canonical name plus any common variant; keep these distinctive to avoid false matches).',
    '',
    'HARD RULES: Do NOT use em dashes or en dashes anywhere; use commas, periods, or parentheses. Do NOT invent pricing numbers you are unsure of (describe the model instead). Keep every tool neutral; this is editorial, not an ad.',
    'Return STRICT JSON only, no prose, in this shape: {"tools":[{ ...fields above... }]}',
  ].join('\n');
}

async function propose(requested, categories) {
  const client = new Anthropic();
  const prompt = buildPrompt(requested, categories);
  let res;
  try {
    res = await client.messages.create({ model: MODEL, max_tokens: 8000, messages: [{ role: 'user', content: prompt }] });
  } catch (err) { console.error('Anthropic API call failed:', err.message); process.exit(1); }
  const raw = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) { console.error('Model did not return JSON. Raw:', raw.slice(0, 500)); process.exit(1); }
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch (e) { console.error('JSON parse failed:', e.message, '\nRaw:', raw.slice(0, 600)); process.exit(1); }
  return Array.isArray(parsed.tools) ? parsed.tools : [];
}

// ---------- deterministic sanitize + validate ----------
function sanitize(proposals, existingSlugs, existingNames) {
  const kept = [];
  const dropped = [];
  const seen = new Set();
  for (const p of proposals) {
    const name = dedash((p.name || '').trim());
    const slug = kebab(p.slug || name);
    if (!name || !slug) { dropped.push({ name: p.name || '(unnamed)', reason: 'missing name/slug' }); continue; }
    if (existingSlugs.has(slug) || existingNames.has(norm(name))) { dropped.push({ name, reason: 'already in tools.ts' }); continue; }
    if (seen.has(slug)) { dropped.push({ name, reason: 'duplicate within batch' }); continue; }
    const body = (Array.isArray(p.body) ? p.body : []).map(dedash).map((s) => s.trim()).filter(Boolean);
    const faqs = (Array.isArray(p.faqs) ? p.faqs : [])
      .map((f) => ({ question: dedash((f.question || '').trim()), answer: dedash((f.answer || '').trim()) }))
      .filter((f) => f.question && f.answer);
    if (body.length < 2 || faqs.length < 3) { dropped.push({ name, reason: `thin content (body ${body.length}, faqs ${faqs.length})` }); continue; }
    let homepage = (p.homepage || '').trim();
    if (homepage && !/^https?:\/\//i.test(homepage)) homepage = 'https://' + homepage;
    seen.add(slug);
    const aliases = [...new Set([name, ...(Array.isArray(p.aliases) ? p.aliases : [])].map((a) => dedash((a || '').trim())).filter(Boolean))];
    kept.push({
      slug, name,
      category: dedash((p.category || 'Uncategorized').trim()),
      homepage,
      badge: dedash((p.badge || 'Paid').trim()),
      badgeFree: !!p.badgeFree,
      ctaLabel: dedash((p.ctaLabel || `Try ${name}`).trim()),
      ctaPrimary: p.ctaPrimary !== false,
      blurb: dedash((p.blurb || '').trim()),
      // The hub template already renders "Best for: <bestFor>", so strip a leading
      // "Best for" the model tends to add or it double-renders ("Best for: Best for ...").
      bestFor: dedash((p.bestFor || '').trim()).replace(/^best for[:,]?\s+/i, (m) => '').replace(/^./, (c) => c.toUpperCase()),
      body: body.slice(0, 3),
      faqs: faqs.slice(0, 3),
      aliases,
      affiliateNote: dedash((p.affiliateNote || 'Affiliate program availability to verify on application.').trim()),
    });
  }
  return { kept, dropped };
}

// ---------- lightweight homepage reachability check (surfaces a wrong fallback URL now) ----------
async function checkUrls(kept) {
  await Promise.all(kept.map(async (t) => {
    if (!t.homepage) { t.urlStatus = 'none'; return; }
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      let res = await fetch(t.homepage, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 TAG-LP-builder' } });
      clearTimeout(to);
      t.urlStatus = String(res.status);
    } catch (e) { t.urlStatus = `ERR ${e.name === 'AbortError' ? 'timeout' : (e.message || '').slice(0, 40)}`; }
  }));
}

// ---------- TS emitters (JSON.stringify -> safe double-quoted TS literals) ----------
const q = (s) => JSON.stringify(s ?? '');

function emitToolEntry(t) {
  const lines = [];
  lines.push('  {');
  lines.push(`    slug: ${q(t.slug)},`);
  lines.push(`    name: ${q(t.name)},`);
  lines.push(`    category: ${q(t.category)},`);
  lines.push(`    badge: ${q(t.badge)},`);
  if (t.badgeFree) lines.push('    badgeFree: true,');
  lines.push(`    ctaLabel: ${q(t.ctaLabel)},`);
  lines.push(`    ctaPrimary: ${t.ctaPrimary ? 'true' : 'false'},`);
  lines.push('    listed: false,');
  lines.push(`    aliases: [${t.aliases.map(q).join(', ')}],`);
  lines.push(`    blurb: ${q(t.blurb)},`);
  lines.push(`    bestFor: ${q(t.bestFor)},`);
  lines.push('    body: [');
  for (const para of t.body) lines.push(`      ${q(para)},`);
  lines.push('    ],');
  lines.push('    faqs: [');
  for (const f of t.faqs) {
    lines.push('      {');
    lines.push(`        question: ${q(f.question)},`);
    lines.push(`        answer: ${q(f.answer)},`);
    lines.push('      },');
  }
  lines.push('    ],');
  lines.push('  },');
  return lines.join('\n');
}

function emitAffiliateEntry(t) {
  const key = /^[a-z][a-z0-9]*$/.test(t.slug) ? t.slug : `'${t.slug}'`;
  return [
    `  ${key}: {`,
    `    name: ${q(t.name)},`,
    `    url: '',`,
    `    homepageFallback: ${q(t.homepage || `https://${t.slug}.com/`)},`,
    `    status: 'pending',`,
    `    notes: ${q(`Pipeline (not yet applied). ${t.affiliateNote}`)},`,
    '  },',
  ].join('\n');
}

// ---------- splice into the two registries (idempotent: callers pre-filter existing) ----------
function spliceToolsTs(kept) {
  const file = rp('src', 'data', 'tools.ts');
  let src = readFileSync(file, 'utf8');
  // The tools array is the first `];` after `export const tools`.
  const anchor = src.indexOf('export const tools');
  const close = src.indexOf('\n];', anchor);
  if (close < 0) throw new Error('Could not find the close of the tools array in tools.ts');
  const block = '\n\n  // --- LP-builder additions (listed:false; flip to listed:true + add a logo once approved/published). ---\n'
    + kept.map(emitToolEntry).join('\n');
  src = src.slice(0, close) + block + src.slice(close);
  writeFileSync(file, src);
}

function spliceAffiliateLinks(kept) {
  const file = rp('src', 'data', 'affiliate-links.ts');
  let src = readFileSync(file, 'utf8');
  const anchor = src.indexOf('export const affiliateLinks');
  const close = src.indexOf('\n};', anchor);
  if (close < 0) throw new Error('Could not find the close of the affiliateLinks object in affiliate-links.ts');
  const block = '\n\n  // --- LP-builder additions (pending; /go/<slug> falls back to homepage + UTM until approved). ---\n'
    + kept.map(emitAffiliateEntry).join('\n');
  src = src.slice(0, close) + block + src.slice(close);
  writeFileSync(file, src);
}

// ---------- preview output ----------
function writePreview(kept, dropped, meta) {
  writeFileSync(rp('backlog', 'lp-batch.json'), JSON.stringify({ meta, tools: kept, dropped }, null, 2));
  const md = [
    `# Tool LP batch (${kept.length} landing pages)`,
    '',
    `Generated by build-tool-lp.mjs. Model: ${meta.model}. Requested: ${meta.requested}. Skipped (already had an LP / dupe): ${dropped.length}.`,
    meta.applied ? 'APPLIED to src/data/tools.ts + src/data/affiliate-links.ts.' : 'DRY RUN (no files changed). Re-run with --apply to splice these in.',
    '',
    'VERIFY each homepage status below before shipping (a 4xx/5xx/ERR means the /go fallback would break).',
    '',
    '| # | Slug | Name | Category | Badge | Homepage | HTTP |',
    '|---|---|---|---|---|---|---|',
    ...kept.map((t, i) => `| ${i + 1} | ${t.slug} | ${t.name} | ${t.category} | ${t.badge} | ${t.homepage || '(none)'} | ${t.urlStatus || '-'} |`),
    '',
    ...kept.flatMap((t) => [
      `## ${t.name} (/tools/${t.slug})`,
      `**Best for:** ${t.bestFor}`,
      '',
      t.blurb,
      '',
      ...t.body,
      '',
      ...t.faqs.flatMap((f) => [`**${f.question}**`, f.answer, '']),
    ]),
    dropped.length ? '## Skipped (not silently dropped)' : '',
    ...dropped.map((d) => `- ${d.name} - ${d.reason}`),
  ].join('\n');
  writeFileSync(rp('backlog', 'lp-batch.md'), md);
}

// ---------- apply a previously-reviewed batch (no new generation) ----------
function applyCached() {
  const f = rp('backlog', 'lp-batch.json');
  if (!existsSync(f)) { console.error('--apply-cached needs backlog/lp-batch.json. Run a dry run first.'); process.exit(1); }
  const existing = parseToolsTs();
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const existingNames = new Set(existing.map((t) => norm(t.name)));
  const cached = JSON.parse(readFileSync(f, 'utf8')).tools || [];
  // Re-run the deterministic sanitizer so any sanitizer fix applies + already-present tools drop out.
  const { kept, dropped } = sanitize(cached, existingSlugs, existingNames);
  if (!kept.length) { console.log('Nothing to apply (all cached tools already present or invalid).'); return; }
  spliceToolsTs(kept);
  spliceAffiliateLinks(kept);
  console.log(`APPLIED ${kept.length} cached entr(ies): ${kept.map((t) => t.slug).join(', ')}`);
  if (dropped.length) console.log('Skipped:', dropped.map((d) => `${d.name} (${d.reason})`).join(' | '));
  console.log('Next: run `npm run build` to verify, then eyeball /tools/<slug>.');
}

// ---------- main ----------
async function main() {
  if (APPLY_CACHED) return applyCached();

  const existing = parseToolsTs();
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const existingNames = new Set(existing.map((t) => norm(t.name)));
  const categories = [...new Set(existing.map((t) => t.category).filter(Boolean))];

  const pipeline = parsePipelineBacklog();
  let requested = resolveRequested(pipeline)
    .filter((t) => !existingSlugs.has(kebab(t.name)) && !existingNames.has(norm(t.name)));
  if (COUNT > 0) requested = requested.slice(0, COUNT);

  if (!requested.length) { console.log('Nothing to build (every requested tool already has an LP). Done.'); return; }

  console.log(`Building LPs for ${requested.length} tool(s): ${requested.map((t) => t.name).join(', ')}`);
  console.log(`Existing registry: ${existing.length} tools, ${categories.length} categories. Model: ${MODEL}.`);

  const proposals = await propose(requested, categories);
  const { kept, dropped } = sanitize(proposals, existingSlugs, existingNames);
  await checkUrls(kept);

  writePreview(kept, dropped, { model: MODEL, requested: requested.map((t) => t.name).join(', '), applied: APPLY });
  console.log(`\nProposed ${proposals.length} -> kept ${kept.length}, skipped ${dropped.length}.`);
  for (const t of kept) console.log(`  /tools/${t.slug}  (${t.name})  homepage ${t.homepage} [HTTP ${t.urlStatus}]`);
  if (dropped.length) console.log('Skipped:', dropped.map((d) => `${d.name} (${d.reason})`).join(' | '));
  console.log('\nWrote backlog/lp-batch.json and backlog/lp-batch.md');

  const badUrls = kept.filter((t) => !/^2\d\d$/.test(t.urlStatus || ''));
  if (badUrls.length) console.log(`\nWARNING: ${badUrls.length} homepage(s) did not return 2xx - verify before shipping: ${badUrls.map((t) => `${t.name}=${t.urlStatus}`).join(', ')}`);

  if (APPLY) {
    if (!kept.length) { console.log('\nNothing kept to apply.'); return; }
    spliceToolsTs(kept);
    spliceAffiliateLinks(kept);
    console.log(`\nAPPLIED ${kept.length} entr(ies) to src/data/tools.ts + src/data/affiliate-links.ts.`);
    console.log('Next: run `npm run build` to verify, eyeball /tools/<slug>, then flip listed:true + add a logo once a program is approved or an article publishes.');
  } else {
    console.log('\n(dry run - no files changed; pass --apply to splice these into the registries)');
  }
}

main().catch((e) => { console.error('\nFatal:', e.message || e); process.exit(1); });
