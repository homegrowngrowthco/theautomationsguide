// Topic Backlog Builder - Phase 1 (known-universe ranking + dedup).
//
// WHAT THIS IS
//   A standalone "topic engine" that surfaces the highest-leverage NET-NEW
//   comparison/alternatives/best-of topics from the tools we already know about
//   (the tools.ts registry + the AFFILIATE_PIPELINE.md backlog), ranks them, and
//   guarantees they do NOT cannibalize anything already published or staged.
//
//   Phase 1 writes a ranked batch to local files ONLY (backlog-batch.json + .md)
//   so Ian can eyeball quality. NOTHING is written to Notion here. Once the output
//   is trusted, this logic is promoted into an n8n workflow whose dedup corpus is a
//   live Notion query instead of the local CONTENT_CALENDAR.md snapshot.
//
// HOW IT WORKS
//   1. Load the universe: tools.ts (slug/name/category/listed/aliases) + the
//      "Full backlog" section of AFFILIATE_PIPELINE.md (~72 more tools, by
//      category, with first-mover stars).
//   2. Load existing coverage (the dedup corpus): every published src/content/blog
//      post (title + tags -> tool set) + the 16 CONTENT_CALENDAR.md staged rows.
//   3. ONE Claude call proposes N ranked net-new topics, each anchored on a
//      universe tool, told what is already covered so it avoids overlap.
//   4. A DETERMINISTIC dedup guard (one shared normalize helper) hard-drops exact
//      collisions and flags partial overlaps. The LLM is not trusted to dedup.
//   5. Sanitize (no em/en dashes) + sort + write backlog-batch.{json,md}.
//
// USAGE (run from the project root so dotenv finds ./.env with ANTHROPIC_API_KEY):
//   node backlog/build-backlog.mjs            # default 25 topics
//   node backlog/build-backlog.mjs --count=40 # more
//   node backlog/build-backlog.mjs --model=claude-opus-4-8  # override model

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const r = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

const COUNT = Number((process.argv.find((a) => a.startsWith('--count=')) || '').split('=')[1]) || 25;
const MODEL = (process.argv.find((a) => a.startsWith('--model=')) || '').split('=')[1] || 'claude-sonnet-4-6';
// --mine-only: load the corpus, run GSC query mining, print unserved demand, exit.
// (No Anthropic call â€” a free debugging/inspection mode for the mining layer.)
const MINE_ONLY = process.argv.includes('--mine-only');

// --stage writes the kept topics to the live Notion Content Calendar as
// Status:Suggested (the publishing engine only fires on Status:Queued, so staged
// rows never auto-publish). Requires NOTION_TOKEN. The DB id defaults to the same
// Content Calendar the engine reads (Config.topicsDatabaseId); override via env.
const STAGE = process.argv.includes('--stage');
const STATUS = process.argv.includes('--status');
// --audit-queue: re-check every Queued/Suggested Notion row against the CURRENT
// published corpus (catches duplicates/slop that reached the queue by any path, not
// just builder proposals). --prune-apply flips the dedup collisions to Skipped.
const AUDIT_QUEUE = process.argv.includes('--audit-queue');
const SELFTEST = process.argv.includes('--selftest');
const PRUNE_APPLY = process.argv.includes('--prune-apply');
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB = process.env.NOTION_DATABASE_ID || '62f34586-4f78-4b83-b2ac-105f500d059e';
const NOTION_VERSION = '2022-06-28'; // matches the live engine's Notion-Version header

// --status: read-only queue census (no LLM, no writes). Answers "how many Queued
// topics are left before the daily engine runs dry". Requires NOTION_TOKEN.
if (STATUS) {
  if (!NOTION_TOKEN) {
    console.error('--status requires NOTION_TOKEN. Run: node --env-file=<path-with-NOTION_TOKEN> backlog/build-backlog.mjs --status');
    process.exit(1);
  }
  await queueStatus();
  process.exit(0);
}

// --selftest never calls Claude: it replays a fixed fixture through the local
// dedup/fence logic, so it must run key-free (that is what makes it CI-able).
if (!process.env.ANTHROPIC_API_KEY && !MINE_ONLY && !SELFTEST) {
  console.error('ANTHROPIC_API_KEY not set. Add it to .env (project root) or your environment.');
  process.exit(1);
}
if (STAGE && !NOTION_TOKEN) {
  console.error('--stage requires NOTION_TOKEN (the Notion integration token shared with the engine).');
  process.exit(1);
}

// ---- ONE shared normalize helper (every join/dedup uses this; duplicating it
// across functions silently collapses or splits matches). ----
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Strip em/en dashes deterministically rather than relying on a prompt rule.
const dedash = (s) => (s || '').replace(/\s*[â€”â€“]\s*/g, ', ');

// ---- ANCHOR FENCE (anti-slop). Tools we must NEVER anchor a post on: no-affiliate
// incumbents a young domain cannot rank for. GSC proof (2026-07): gong-alternatives
// = 301 impr @ avg pos 71, 0 clicks, no /go/ program â€” pure wasted spend. These may
// still appear as a comparison foil or the "from" side of a migration; they just may
// never be the anchorTool the post is built around. Extend as new dead anchors surface. ----
const NO_ANCHOR = new Set(
  ['gong', 'outreach', 'salesloft', 'zoominfo', 'salesforce', 'gainsight', 'marketo',
   'seismic', 'clari', '6sense', 'sixsense', 'chorus', 'drift', 'people.ai', 'highspot']
    .map(norm)
);

// affiliate-links.ts is the source of truth for whether a /go/<slug> CTA can route
// at all. The hand-maintained NO_ANCHOR list above went stale: the 2026-08-12 queue
// scrub Skipped 36 of 72 topics, 11 of them anchored on tools with NO registry entry
// (savvycal, uplead, lead-forensics, dripify, sharpspring, iterable, zendesk-sell,
// insightly, freshsales, salesmate, airtable). Those reach the calendar because the
// universe includes AFFILIATE_PIPELINE.md's wishlist, which is a list of programs we
// might one day join, not ones we can monetise today. Deriving the fence from the
// registry closes that gap and keeps closing it as statuses change.
// Key may be bare (zapier:) or quoted ('reply-io':) â€” same quote-agnostic parse the
// content linter needs (CLAUDE.md gotcha 9).
function parseAffiliateStatus() {
  const src = r('src', 'data', 'affiliate-links.ts');
  const region = src.slice(src.indexOf('affiliateLinks'));
  const marks = [...region.matchAll(/^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{/gm)];
  const byslug = new Map();
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : region.length;
    const block = region.slice(start, end);
    byslug.set(norm(marks[i][1]), (block.match(/status:\s*['"]([a-z-]+)['"]/) || [])[1] || 'unknown');
  }
  return byslug;
}
const AFFILIATE_STATUS = parseAffiliateStatus();
// A status that can never pay out. `pending` is fine: the program exists, we just
// have not applied yet, so the post is monetisable the day we do.
const DEAD_STATUS = new Set(['no-program', 'rejected']);
const affiliateStatusOf = (tool) =>
  AFFILIATE_STATUS.get(norm(tool.slug)) ?? AFFILIATE_STATUS.get(norm(tool.name)) ?? null;

// Returns a human-readable fence reason, or null if the tool is a legal anchor.
function noAnchorReason(tool) {
  if (!tool) return null;
  if (NO_ANCHOR.has(norm(tool.slug)) || NO_ANCHOR.has(norm(tool.name))) {
    return `"${tool.name}" is a fenced no-program incumbent`;
  }
  const status = affiliateStatusOf(tool);
  if (status === null) return `"${tool.name}" has no affiliate-links.ts entry, so no /go/ CTA can route`;
  if (DEAD_STATUS.has(status)) return `"${tool.name}" affiliate status is ${status}, so the post can never earn`;
  return null;
}
const isNoAnchor = (tool) => noAnchorReason(tool) !== null;

// ---------- 1. UNIVERSE: tools.ts ----------
function parseToolsTs() {
  const src = r('src', 'data', 'tools.ts');
  const region = src.slice(src.indexOf('export const tools'));
  const marks = [...region.matchAll(/slug:\s*'([^']+)'/g)];
  const tools = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : region.indexOf('];', start);
    const block = region.slice(start, end);
    const name = (block.match(/name:\s*'([^']+)'/) || [])[1];
    const category = (block.match(/category:\s*'([^']+)'/) || [])[1];
    const aliasRaw = (block.match(/aliases:\s*\[([^\]]*)\]/) || [])[1] || '';
    const aliases = [...aliasRaw.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    tools.push({
      slug: marks[i][1],
      name: name || marks[i][1],
      category: category || 'Uncategorized',
      hasLP: true, // every tools.ts entry has a /tools/<slug> hub
      listed: !/listed:\s*false/.test(block),
      firstMover: false,
      aliases: aliases.length ? aliases : [name || marks[i][1]],
    });
  }
  return tools;
}

// ---------- 1b. UNIVERSE: AFFILIATE_PIPELINE.md "Full backlog" (~72 more) ----------
function parsePipelineBacklog() {
  const md = r('AFFILIATE_PIPELINE.md');
  const start = md.indexOf('## Full backlog');
  const end = md.indexOf('## Already in the main registry');
  const region = md.slice(start, end < 0 ? undefined : end);
  const lines = region.split(/\r?\n/);
  const out = [];
  let category = 'Uncategorized';
  for (const line of lines) {
    const h = line.match(/^###\s+(.*)$/);
    if (h) {
      category = h[1].replace(/[â­ðŸ”Žâœ…]/g, '').replace(/\s+/g, ' ').trim();
      continue;
    }
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // cells[0] is '' (leading pipe). First real cell is cells[1].
    const first = cells[1] || '';
    if (!first || /^-+$/.test(first) || first.toLowerCase() === 'tool') continue; // header/separator
    if (/~~/.test(first)) continue; // excluded (e.g. ~~Koala~~)
    const name = first.replace(/\*\*/g, '').replace(/[â­ðŸ”Žâœ…]/g, '').trim();
    if (!name) continue;
    const notes = (cells[3] || '') + ' ' + (cells[2] || '');
    out.push({
      slug: norm(name),
      name,
      category,
      hasLP: false,
      listed: false,
      firstMover: /â­/.test(line), // a star anywhere in the row
      aliases: [name],
    });
  }
  return out;
}

// ---------- 2. EXISTING COVERAGE (dedup corpus) ----------
function aliasHit(aliases, hay) {
  // Token-boundary match. norm() strips separators entirely, which let aliases
  // match ACROSS word joins ("foR B2B" -> "forb2b" contains "rb2b"; "toolKIT"
  // contains "kit"). Keep boundaries as single spaces so a tool only hits on
  // whole-token runs.
  const h = ' ' + (hay || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  return aliases.some((a) => {
    const n = (a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return n.length >= 3 && h.includes(' ' + n + ' ');
  });
}

function parsePublishedPosts(universe) {
  const dir = join(ROOT, 'src', 'content', 'blog');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  const posts = [];
  for (const f of files) {
    const src = readFileSync(join(dir, f), 'utf8');
    const fm = src.match(/^---([\s\S]*?)---/);
    const block = fm ? fm[1] : '';
    const title = (block.match(/title:\s*['"]?(.+?)['"]?\s*$/m) || [])[1] || f.replace(/\.mdx$/, '');
    const tagsRaw = (block.match(/tags:\s*\[([^\]]*)\]/) || [])[1] || '';
    const hay = `${title} ${tagsRaw} ${f}`;
    const toolset = universe.filter((t) => aliasHit(t.aliases, hay)).map((t) => t.slug);
    posts.push({ source: 'published', title: title.trim(), keyword: norm(title), toolset: [...new Set(toolset)].sort() });
  }
  return posts;
}

function parseCalendarRows(universe) {
  // CONTENT_CALENDAR.md was a June-2026 snapshot, deleted 2026-07-17 (the queue
  // lives in Notion). Without NOTION_TOKEN the calendar half of the dedup corpus
  // is unavailable; degrade loudly to published-posts-only rather than dedup
  // against a stale snapshot.
  let md;
  try {
    md = r('CONTENT_CALENDAR.md');
  } catch {
    console.warn('WARN: no NOTION_TOKEN and no local calendar snapshot; dedup corpus = published posts only. Set NOTION_TOKEN for the live Content Calendar.');
    return [];
  }
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // | # | Topic | Anchor | Also | Target keyword | Priority | Pub | Angle |
    if (!/^\d+$/.test(cells[1] || '')) continue; // only numbered data rows
    const topic = cells[2] || '';
    const keyword = cells[5] || '';
    const hay = `${topic} ${cells[3]} ${cells[4]} ${keyword}`;
    const toolset = universe.filter((t) => aliasHit(t.aliases, hay)).map((t) => t.slug);
    rows.push({ source: 'staged', title: topic, keyword: norm(keyword) || norm(topic), toolset: [...new Set(toolset)].sort() });
  }
  return rows;
}

// ---------- 2b. LIVE Notion corpus + staging (only when NOTION_TOKEN present) ----------
async function notionApi(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

// Pull EVERY Content Calendar row (any status) so the dedup corpus reflects what
// is already published, queued, generating, or staged - superseding the local
// CONTENT_CALENDAR.md snapshot once a token is available.
async function fetchNotionCalendar(universe) {
  const rows = [];
  let cursor;
  do {
    const res = await notionApi('POST', `/databases/${NOTION_DB}/query`, { page_size: 100, start_cursor: cursor });
    if (!res.ok) throw new Error(`Notion query failed (${res.status}): ${JSON.stringify(res.json).slice(0, 300)}`);
    for (const page of res.json.results || []) {
      const props = page.properties || {};
      const title = (props.Topic?.title || []).map((t) => t.plain_text).join('');
      const kw = (props['Target Keyword']?.rich_text || []).map((t) => t.plain_text).join('');
      const hay = `${title} ${kw}`;
      const toolset = universe.filter((t) => aliasHit(t.aliases, hay)).map((t) => t.slug);
      rows.push({ source: 'notion', title: title.trim(), keyword: norm(kw) || norm(title), toolset: [...new Set(toolset)].sort() });
    }
    cursor = res.json.has_more ? res.json.next_cursor : undefined;
  } while (cursor);
  return rows;
}

// Read-only queue census (drives --status). Tallies Content Calendar rows by
// Status and reports the Queued runway (how many posts the daily engine can still
// publish before it hits the "Slack Queue Empty" alert).
async function queueStatus() {
  const byStatus = new Map();
  const queued = [];
  const suggested = [];
  let cursor;
  do {
    const res = await notionApi('POST', `/databases/${NOTION_DB}/query`, { page_size: 100, start_cursor: cursor });
    if (!res.ok) throw new Error(`Notion query failed (${res.status}): ${JSON.stringify(res.json).slice(0, 300)}`);
    for (const page of res.json.results || []) {
      const props = page.properties || {};
      const status = props.Status?.select?.name || '(none)';
      const topic = (props.Topic?.title || []).map((t) => t.plain_text).join('').trim();
      const pub = props['Pub Date']?.date?.start || '';
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
      if (status === 'Queued') queued.push({ topic, pub });
      if (status === 'Suggested') suggested.push({ topic, pub });
    }
    cursor = res.json.has_more ? res.json.next_cursor : undefined;
  } while (cursor);

  const order = ['Queued', 'Suggested', 'Generating', 'In Review', 'Published', 'Skipped'];
  const keys = [...new Set([...order, ...byStatus.keys()])].filter((k) => byStatus.has(k));
  console.log(`\n=== CONTENT CALENDAR QUEUE (db ${NOTION_DB}) ===`);
  for (const k of keys) console.log(`  ${k.padEnd(12)} ${byStatus.get(k)}`);

  queued.sort((a, b) => (a.pub || '').localeCompare(b.pub || ''));
  const dated = queued.filter((q) => q.pub);
  console.log(`\nRUNWAY: ${queued.length} Queued topic(s) left` +
    (dated.length ? ` (Pub Dates ${dated[0].pub} .. ${dated[dated.length - 1].pub})` : '') + '.');
  const today = new Date().toISOString().slice(0, 10);
  const future = dated.filter((q) => q.pub >= today).length;
  if (queued.length === 0) console.log('  >> EMPTY: the next daily run will fire the "Slack Queue Empty" alert. Top up now.');
  else console.log(`  ${future} dated today-or-later; ${suggested.length} Suggested rows staged and ready to flip to Queued.`);
  for (const q of queued.slice(0, 15)) console.log(`   - ${q.pub || '(no date)'}  ${q.topic.slice(0, 70)}`);
}

// Publish-time dedup + fence AUDIT (drives --audit-queue). Generation-time dedup()
// only guards what the BUILDER proposes; rows still reach Queued by a manual add, a
// bulk import, or an older run whose corpus predated a now-published post. This
// re-checks every Queued/Suggested row against the CURRENT published corpus (local
// posts + Published Notion rows) with the SAME collide()/fence, and with
// --prune-apply flips the collisions to Status:Skipped so the daily engine never
// generates a duplicate. Safe: only hard dedup collisions are auto-skipped; fence
// mentions are advisories (a no-anchor tool can legitimately be a migration "from"
// side), reported but never auto-skipped.
async function auditQueue(universe) {
  if (!NOTION_TOKEN) {
    console.error('--audit-queue requires NOTION_TOKEN. Run: node --env-file=<path-with-NOTION_TOKEN> backlog/build-backlog.mjs --audit-queue [--prune-apply]');
    process.exit(1);
  }
  const rows = [];
  let cursor;
  do {
    const res = await notionApi('POST', `/databases/${NOTION_DB}/query`, { page_size: 100, start_cursor: cursor });
    if (!res.ok) throw new Error(`Notion query failed (${res.status}): ${JSON.stringify(res.json).slice(0, 300)}`);
    for (const page of res.json.results || []) {
      const props = page.properties || {};
      const title = (props.Topic?.title || []).map((t) => t.plain_text).join('').trim();
      const kw = (props['Target Keyword']?.rich_text || []).map((t) => t.plain_text).join('');
      const status = props.Status?.select?.name || '(none)';
      const toolset = universe.filter((t) => aliasHit(t.aliases, `${title} ${kw}`)).map((t) => t.slug);
      rows.push({ id: page.id, title, keyword: norm(kw) || norm(title), status, toolset: [...new Set(toolset)].sort() });
    }
    cursor = res.json.has_more ? res.json.next_cursor : undefined;
  } while (cursor);

  const published = rows.filter((r) => r.status === 'Published');
  const active = rows.filter((r) => r.status === 'Queued' || r.status === 'Suggested');
  // Corpus = local published posts + Published Notion rows (ground truth of what exists).
  const index = buildIndex(universe, [...parsePublishedPosts(universe), ...published]);

  const collisions = [];
  const fenceAdvisories = [];
  // Check Queued first (higher risk: auto-fires), then Suggested; an earlier-kept
  // active row joins the index so two identical Queued rows also collide.
  const ordered = [...active.filter((r) => r.status === 'Queued'), ...active.filter((r) => r.status === 'Suggested')];
  for (const row of ordered) {
    const reason = collide(universe, index, row);
    if (reason) { collisions.push({ ...row, reason }); continue; }
    addToIndex(universe, index, row);
    const namedNoAnchor = universe.filter((t) => isNoAnchor(t) && aliasHit(t.aliases, row.title));
    if (namedNoAnchor.length && intentOf(row.title) === 'alternatives') {
      fenceAdvisories.push({ ...row, note: `built around no-program incumbent ${namedNoAnchor.map((t) => t.name).join(', ')}` });
    }
  }

  console.log(`\n=== QUEUE AUDIT (db ${NOTION_DB}) ===`);
  console.log(`Active: ${active.length} rows (${active.filter((r) => r.status === 'Queued').length} Queued, ${active.filter((r) => r.status === 'Suggested').length} Suggested). Corpus: local posts + ${published.length} Published Notion rows.`);
  console.log(`\nDUPLICATE COLLISIONS (auto-Skip candidates): ${collisions.length}`);
  for (const c of collisions) console.log(`  [${c.status}] ${c.title.slice(0, 66)}\n        -> ${c.reason}`);
  console.log(`\nFENCE ADVISORIES (manual review, NOT auto-skipped): ${fenceAdvisories.length}`);
  for (const a of fenceAdvisories) console.log(`  [${a.status}] ${a.title.slice(0, 66)}  (${a.note})`);

  if (PRUNE_APPLY && collisions.length) {
    let skipped = 0;
    for (const c of collisions) {
      const res = await notionApi('PATCH', `/pages/${c.id}`, { properties: { Status: { select: { name: 'Skipped' } } } });
      if (res.ok) skipped++; else console.error(`  FAILED to skip "${c.title.slice(0, 40)}" (${res.status})`);
    }
    console.log(`\n--prune-apply: set ${skipped}/${collisions.length} duplicate rows to Skipped.`);
  } else if (collisions.length) {
    console.log('\n(dry run â€” re-run with --prune-apply to Skip the duplicate collisions.)');
  }
}

async function stageToNotion(kept) {
  let created = 0;
  const failed = [];
  for (const t of kept) {
    const note = [t.rationale, t.needsLP ? '[needs LP]' : '', t.alsoCovers.length ? `Also covers: ${t.alsoCovers.join(', ')}` : '']
      .filter(Boolean).join(' ').slice(0, 1900);
    const body = {
      parent: { database_id: NOTION_DB },
      properties: {
        Topic: { title: [{ text: { content: t.topic.slice(0, 1900) } }] },
        Status: { select: { name: 'Suggested' } },
        Priority: { select: { name: t.priority } },
        Tag: { select: { name: t.tag } },
        'Target Keyword': { rich_text: [{ text: { content: (t.targetKeyword || '').slice(0, 1900) } }] },
        Notes: { rich_text: [{ text: { content: note } }] },
      },
    };
    const res = await notionApi('POST', '/pages', body);
    if (res.ok) { created++; } else { failed.push(`${t.topic} (${res.status}: ${JSON.stringify(res.json).slice(0, 160)})`); }
  }
  return { created, failed };
}

// ---------- 2c. OBSERVED SEARCH DEMAND (GSC query mining) ----------
// Pull last-28d queries the site already earns impressions for, drop rank-tracker
// junk, and keep the ones no published/staged topic serves. These become priority
// topic candidates: real demand beats registry permutations.
// Auth: GSC_TOKEN_JSON (contents of an OAuth token.json with client_id/client_secret/
// refresh_token, webmasters.readonly scope) or GSC_TOKEN_FILE (path to it). Skips
// gracefully when neither is set so local runs without GSC still work.
const GSC_SITE = process.env.GSC_SITE || 'sc-domain:theautomationsguide.com';
const STOPWORDS = new Set(['the', 'a', 'an', 'for', 'of', 'in', 'on', 'to', 'vs', 'versus', 'and', 'or', 'best', 'top', 'with', 'is', 'are', 'what', 'which', 'how', 'why', 'when', 'you', 'your', 'my', 'it', 'that', '2024', '2025', '2026', '2027', 'tool', 'tools', 'software']);
const tokenSet = (s) => new Set(
  (s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w))
);
function tokenCoverage(qTokens, cTokens) {
  if (!qTokens.size) return 1;
  let hit = 0;
  for (const w of qTokens) if (cTokens.has(w)) hit++;
  return hit / qTokens.size;
}

async function gscAccessToken() {
  const raw = process.env.GSC_TOKEN_JSON || (process.env.GSC_TOKEN_FILE ? readFileSync(process.env.GSC_TOKEN_FILE, 'utf8') : '');
  if (!raw) return null;
  const t = JSON.parse(raw);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: t.client_id, client_secret: t.client_secret,
      refresh_token: t.refresh_token, grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`GSC token refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).access_token;
}

async function mineGscDemand(covered) {
  const access = await gscAccessToken();
  if (!access) { console.log('(GSC mining skipped: set GSC_TOKEN_JSON or GSC_TOKEN_FILE to enable)'); return []; }
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 28 * 864e5).toISOString().slice(0, 10);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['query'], rowLimit: 1000 }),
    }
  );
  if (!res.ok) throw new Error(`GSC searchAnalytics failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const rows = (await res.json()).rows || [];
  // Human queries only: no rank-tracker operator strings, no URLs/phone numbers, some volume.
  const human = rows.filter((r) => {
    const q = r.keys[0] || '';
    if (r.impressions < 3) return false;
    if (q.length > 80 || q.includes('"') || q.includes('site:') || /https?:\/\//.test(q)) return false;
    if (/^[\d\s()+-]+$/.test(q)) return false;
    return true;
  });
  const coveredTokens = covered.map((c) => tokenSet(`${c.title} ${c.keyword}`));
  const unserved = [];
  for (const r of human) {
    const qt = tokenSet(r.keys[0]);
    if (qt.size < 2) continue; // single-token queries are brand/navigation noise
    const best = Math.max(0, ...coveredTokens.map((ct) => tokenCoverage(qt, ct)));
    if (best < 0.6) unserved.push({ query: r.keys[0], impressions: r.impressions, position: Math.round(r.position) });
  }
  unserved.sort((a, b) => b.impressions - a.impressions);
  return unserved.slice(0, 40);
}

// ---------- 3. PROPOSE via Claude (single batched call) ----------
function buildPrompt(universe, covered, count, demand) {
  const toolLines = universe
    .map((t) => `- ${t.name} [${t.category}]${t.firstMover ? ' (first-mover)' : ''}${t.hasLP ? ' (has LP)' : ''}`)
    .join('\n');
  const coveredLines = covered.map((c) => `- ${c.title} (${c.source})`).join('\n');
  const demandLines = demand.length
    ? [
        '',
        'OBSERVED SEARCH DEMAND (Google already shows this site for these queries but no dedicated post serves them - topics that directly serve one of these OUTRANK every other consideration; note the served query in the rationale):',
        ...demand.map((d) => `- "${d.query}" (${d.impressions} impressions/28d, avg position ${d.position})`),
      ]
    : [];
  // NOTE: no backtick characters in this prompt (it lives inside a template literal).
  return [
    'You are the topic strategist for The Automations Guide, a RevOps/GTM automation blog.',
    'Its edge is being the EARLY, ideally first, neutral comparison for tools before their category crowds, then riding branded and category search. Each post should anchor on one tool that has an affiliate landing page so it doubles as an internal-link and affiliate hook.',
    '',
    'TOOL UNIVERSE (anchor every topic on one of these; strongly prefer tools marked (first-mover) and (has LP)):',
    toolLines,
    '',
    'ALREADY COVERED (published or staged) - do NOT propose anything that overlaps these in tool set or search intent:',
    coveredLines,
    ...demandLines,
    '',
    `TASK: propose the ${count} highest-leverage NET-NEW topics. Favor: observed-demand queries above (highest priority), thin-competition first-mover categories (AI SDR agents, AI voice, visitor ID, AI agent builders, GEO/AI-search), tools that tie back to the site core (n8n, Make, HubSpot, Apollo, Clay), and decisions with real buyer search demand.`,
    '',
    `FORMAT MIX (rough quotas out of ${count}; the site over-indexes on plain comparisons and its best-ranking post is a migration guide):`,
    `- at most ${Math.ceil(count / 4)} plain "X vs Y (vs Z)" comparisons`,
    `- at least ${Math.ceil(count / 5)} migration guides ("Migrate from X to Y without losing Z", "Switching from X")`,
    `- at least ${Math.ceil(count / 5)} pricing/cost breakdowns ("X pricing explained", "What a Y stack actually costs")`,
    '- some integration recipes ("Connect X to Y for <outcome>") and problem-first posts keyed on a symptom ("Your <system> does <bad thing>, here is the fix") rather than a tool name',
    '- single-tool reviews ("X review: the honest take") where the observed demand shows "<tool> review" queries',
    '- "X alternatives" only where no alternatives post exists for that tool yet',
    '',
    'HARD FENCE (a proposal that breaks this is discarded): NEVER set anchorTool to a no-affiliate incumbent this young domain cannot rank for: Gong, Outreach, Salesloft, ZoomInfo, Salesforce, Gainsight, Marketo, Seismic, Clari, 6sense, Chorus, Drift, Highspot. You MAY name them as a comparison foil or as the "from" side of a migration ("Migrate off Outreach to X"), but the anchorTool must be a tool with an affiliate landing page or a realistic affiliate path. Prefer anchors marked (has LP).',
    '',
    'Return STRICT JSON only, no prose, in this shape:',
    '{"topics":[{"topic":"...","anchorTool":"...","alsoCovers":["..."],"targetKeyword":"...","tag":"comparison|tools|automation|revops|guide","priority":"High|Medium|Low","firstMover":true,"needsLP":false,"rationale":"one sentence on why this wins"}]}',
    'Rules: anchorTool MUST be a universe tool by name. tag MUST be one of the five listed. needsLP=true if the anchor tool has no LP. Do NOT use em dashes or en dashes anywhere; use commas or periods. Keep titles natural, not keyword-stuffed.',
  ].join('\n');
}

async function propose(universe, covered, count, demand) {
  const client = new Anthropic();
  const prompt = buildPrompt(universe, covered, count, demand);
  let res;
  try {
    res = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    console.error('Anthropic API call failed:', err.message);
    process.exit(1);
  }
  const raw = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) { console.error('Model did not return JSON. Raw:', raw.slice(0, 500)); process.exit(1); }
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch (e) { console.error('JSON parse failed:', e.message, '\nRaw:', raw.slice(0, 500)); process.exit(1); }
  return Array.isArray(parsed.topics) ? parsed.topics : [];
}

// ---------- 4. DETERMINISTIC dedup guard ----------
function signature(toolset) { return [...new Set(toolset)].sort().join('|'); }

// Resolve an LLM-supplied tool name to a universe tool. Exact on name/alias first,
// then a prefix fallback so "Profound" -> "Profound / AthenaHQ" and "Artisan" ->
// "Artisan (Ava)" still match (the pipeline doc parenthesizes/slashes some names).
function makeResolver(universe) {
  const exact = new Map();
  for (const t of universe) { exact.set(norm(t.name), t); for (const a of t.aliases) exact.set(norm(a), t); }
  return (name) => {
    const n = norm(name);
    if (!n) return null;
    if (exact.has(n)) return exact.get(n);
    if (n.length < 4) return null; // avoid spurious short-token matches (n8n, etc.)
    for (const t of universe) { const tn = norm(t.name); if (tn.startsWith(n) || n.startsWith(tn)) return t; }
    for (const t of universe) for (const a of t.aliases) { const an = norm(a); if (an.length >= 4 && (an.startsWith(n) || n.startsWith(an))) return t; }
    return null;
  };
}

// Classify a title/keyword into a search-intent class. Single-anchor intents
// (alternatives, pricing, migration) should exist at most ONCE per anchor tool â€”
// this is the gate that would have stopped the two "Instantly alternatives" posts
// shipped 8 days apart (2026-06-02 + 2026-06-10, consolidated in PR #158).
function intentOf(text) {
  const s = (text || '').toLowerCase();
  if (/\bmigrat|switch(ing)?\s+(from|to|off)\b/.test(s)) return 'migration';
  if (/\bpricing\b|\bprice\b|\bcosts?\b/.test(s)) return 'pricing';
  if (/\balternativ/.test(s)) return 'alternatives';
  if (/\breview\b/.test(s)) return 'review';
  return null;
}
// Tools named in the TITLE text itself (not the whole-post toolset â€” an
// alternatives post mentions many tools in the body, but is "about" the one in
// its title).
function titleTools(universe, text) {
  return universe.filter((t) => aliasHit(t.aliases, text)).map((t) => t.slug);
}
function intentKeys(universe, title, keyword) {
  const intent = intentOf(`${title} ${keyword}`);
  if (!intent) return [];
  const slugs = titleTools(universe, `${title} ${keyword}`);
  // Migrations are pair-wise: "Pipedrive to Attio" and "Pipedrive to Close" are
  // different topics, so key on the sorted pair when both ends are known tools.
  if (intent === 'migration' && slugs.length >= 2) return [`migration::${[...slugs].sort().join('+')}`];
  return slugs.map((slug) => `${intent}::${slug}`);
}
function jaccard(a, b) {
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  const union = a.size + b.size - hit;
  return union ? hit / union : 0;
}

// Comparison posts compete PAIR-wise: "A vs B vs C" and "B vs A vs D" both own the
// "a vs b" query space. The 7/13+7/16 waterfall-enrichment twins slipped past every
// gate above (different third tool -> different signature; reordered names -> title
// jaccard 0.57 < 0.72). A shared pair alone is NOT a collision (Cognism-vs-Apollo-
// vs-Lusha "European outbound" legitimately coexists with Lusha-vs-Apollo-vs-
// ZoomInfo "B2B contact data") â€” it collides only when the non-tool FRAMING tokens
// also overlap (jaccard >= 0.5), i.e. same pair sold under the same category angle.
const isComparison = (text) => /\bvs\.?(\s|$)|\bversus\b/i.test(text || '');
function comparisonEntry(universe, title, keyword) {
  const text = `${title} ${keyword || ''}`;
  if (!isComparison(text)) return null;
  const slugs = [...new Set(titleTools(universe, text))].sort();
  if (slugs.length < 2) return null;
  const pairs = new Set();
  for (let i = 0; i < slugs.length; i++) for (let j = i + 1; j < slugs.length; j++) pairs.add(`${slugs[i]}+${slugs[j]}`);
  const toolToks = tokenSet(universe.filter((t) => slugs.includes(t.slug)).flatMap((t) => [t.name, ...t.aliases]).join(' '));
  const rest = new Set([...tokenSet(text)].filter((w) => !toolToks.has(w)));
  return { title, pairs, rest };
}

// Build a dedup index from a covered corpus. Shared by generation-time dedup() and
// the publish-time auditQueue(), so both use IDENTICAL collision logic (a duplicate
// the builder would have rejected is also a duplicate the queue audit rejects).
function buildIndex(universe, covered) {
  const sigs = new Map(); // signature -> {title, intent} of the first covered item owning it
  for (const c of covered) {
    const s = signature(c.toolset);
    if (s.length && !sigs.has(s)) sigs.set(s, { title: c.title, intent: intentOf(`${c.title} ${c.keyword}`) });
  }
  return {
    keywords: new Set(covered.map((c) => c.keyword)),
    titles: new Set(covered.map((c) => norm(c.title))),
    sigs,
    intents: new Set(covered.flatMap((c) => intentKeys(universe, c.title, c.keyword))),
    titleTokens: covered.map((c) => ({ title: c.title, toks: tokenSet(`${c.title} ${c.keyword}`) })),
    comparisons: covered.map((c) => comparisonEntry(universe, c.title, c.keyword)).filter(Boolean),
  };
}
// Return a collision reason vs the index, or null if the candidate is net-new.
// cand = { title, keyword, toolset }.
function collide(universe, index, cand) {
  const topic = cand.title;
  const kw = cand.keyword || norm(topic);
  const sig = signature(cand.toolset);
  if (index.keywords.has(kw) || index.titles.has(norm(topic))) return 'keyword/title already covered';
  // Identical tool set: collide only within the same intent class â€” a migration
  // guide over {pipedrive, hubspot} is NOT a duplicate of a comparison over the
  // same pair (migrations are the site's winning format; don't prune them because
  // a comparison exists). Single-tool sets additionally require a non-null intent
  // (review/pricing/alternatives/migration): "RB2B Review" vs "RB2B Pricing" are
  // distinct posts, and two GENERAL posts about one tool are near-dup-title
  // territory (0.72 gate below), not automatic duplicates.
  if (sig && index.sigs.has(sig)) {
    const owner = index.sigs.get(sig);
    const candIntent = intentOf(`${topic} ${cand.keyword || ''}`);
    if (owner.intent === candIntent && (sig.includes('|') || candIntent !== null)) {
      return `identical tool set (${candIntent || 'general'}) already covered by: ${owner.title}`;
    }
  }
  const iHit = intentKeys(universe, topic, cand.keyword).find((k) => index.intents.has(k));
  if (iHit) return `intent already covered (${iHit})`;
  const toks = tokenSet(`${topic} ${cand.keyword || ''}`);
  const near = index.titleTokens.find((c) => jaccard(toks, c.toks) >= 0.72);
  if (near) return `near-duplicate title of: ${near.title}`;
  const ce = comparisonEntry(universe, topic, cand.keyword);
  if (ce) {
    const hit = index.comparisons.find((c) => [...ce.pairs].some((p) => c.pairs.has(p)) && jaccard(ce.rest, c.rest) >= 0.5);
    if (hit) return `comparison pair + framing already covered by: ${hit.title}`;
    // BARE PERMUTATION. The framing gate above deliberately lets a shared pair
    // coexist under a DIFFERENT angle ("Cognism vs Apollo vs Lusha: European
    // outbound" alongside "Lusha vs Apollo vs ZoomInfo: B2B contact data"). But a
    // title carrying no angle at all ("Reply.io vs Lemlist vs Instantly: 2026")
    // has no differentiating framing to compare, so jaccard stays under 0.5 and it
    // sails through. Three such permutations of the lemlist/smartlead/instantly/
    // reply-io family reached the calendar and were Skipped by hand on 2026-08-12.
    // A shared pair plus no angle IS the duplicate.
    // ce.rest is already stopword- and year-stripped by tokenSet, so "â€¦: 2026"
    // reduces to the empty set.
    if (ce.rest.size < 2) {
      const perm = index.comparisons.find((c) => [...ce.pairs].some((p) => c.pairs.has(p)));
      if (perm) return `bare permutation: shares a tool pair with "${perm.title}" and adds no differentiating framing`;
    }
  }
  return null;
}
function addToIndex(universe, index, cand) {
  index.keywords.add(cand.keyword || norm(cand.title));
  index.titles.add(norm(cand.title));
  const sig = signature(cand.toolset);
  if (sig && !index.sigs.has(sig)) index.sigs.set(sig, { title: cand.title, intent: intentOf(`${cand.title} ${cand.keyword || ''}`) });
  for (const k of intentKeys(universe, cand.title, cand.keyword)) index.intents.add(k);
  index.titleTokens.push({ title: cand.title, toks: tokenSet(`${cand.title} ${cand.keyword || ''}`) });
  const ce = comparisonEntry(universe, cand.title, cand.keyword);
  if (ce) index.comparisons.push(ce);
}

// FORMAT FENCE. The 2026-08-04 growth audit ranked "alternatives" the site's
// WORST-performing format (clicks come from fresh niche 3-way comparisons and
// reviews at pos 6-15; migrations are the reliable format). Four such topics were
// Skipped by hand on 2026-08-12. Stop minting them at the source.
const isAlternativesFraming = (text) => /\balternatives?\b|\bcompetitors?\b/i.test(text || '');

// CTA FENCE. A title naming no tool that can carry a /go/ CTA is an essay, not a
// monetisable post: "Why RevOps Budgets Blow Up in Q1" has nothing to link. This
// also catches titles built entirely from dead-status tools, e.g. "Why Gong
// Replaced Outreach for Your SDRs" (both no-program). Seven such topics were
// Skipped on 2026-08-12. Deliberately keyed on the TITLE rather than the anchor:
// the title is what the reader and the SERP actually see.
function namesEarningTool(universe, text) {
  return titleTools(universe, text).some((slug) => {
    const tool = universe.find((t) => t.slug === slug);
    return tool && !isNoAnchor(tool);
  });
}

// REGISTRY FENCE, any title position. The anchor fence only guards the tool the
// post is built around, but a comparison COLUMN needs a /go/ CTA too, and a column
// with no affiliate-links.ts entry renders a link that 404s (a hard lint failure on
// master, the exact class that broke /go/findymail). Eight of the 2026-08-12 scrub
// were comparisons whose anchor was fine and whose third column was unregistered:
// Savvycal, UpLead, Lead Forensics, Dripify, Airtable, Freshsales, Salesmate,
// Insightly, Zendesk Sell. Reject on ANY named tool lacking a registry entry.
// Deliberately narrower than the anchor fence: a no-program tool (Gong, Outreach)
// is still a legal comparison foil because /go/<slug> resolves via homepageFallback.
// UNKNOWN-OPERAND FENCE. The registry fence below can only see tools that exist in
// our universe, so it is blind to the failure mode that actually happened: the
// proposer invents a comparison column we have never heard of (Savvycal, UpLead,
// Lead Forensics, Dripify, Airtable, Freshsales, Salesmate, Insightly, Zendesk
// Sell). Those reach the calendar, then the post ships a /go/ CTA for a tool with
// no registry entry. A "vs" title states its operands explicitly, so require every
// one of them to resolve. Nine of the 2026-08-12 scrub were exactly this.
function unknownComparisonOperands(universe, title) {
  if (!isComparison(title)) return [];
  const resolve = makeResolver(universe);
  const clause = (title.split(':')[0] || '').trim(); // "A vs B vs C: angle" -> "A vs B vs C"
  const operands = clause.split(/\s+vs\.?\s+|\s+versus\s+/i).map((s) => s.trim()).filter(Boolean);
  if (operands.length < 2) return [];
  return operands.filter((o) => !resolve(o));
}

function unregisteredNamed(universe, text) {
  return titleTools(universe, text)
    .map((slug) => universe.find((t) => t.slug === slug))
    .filter((t) => t && affiliateStatusOf(t) === null)
    .map((t) => t.name);
}

function dedup(proposals, universe, covered) {
  const resolve = makeResolver(universe);
  const index = buildIndex(universe, covered); // grows as we keep, so within-batch dupes also collide
  const coveredAnchors = new Map(); // slug -> [titles] for partial-overlap warnings
  for (const c of covered) for (const s of c.toolset) (coveredAnchors.get(s) || coveredAnchors.set(s, []).get(s)).push(c.title);

  const kept = [];
  const dropped = [];

  for (const p of proposals) {
    const topic = dedash(p.topic || '');
    const anchor = resolve(p.anchorTool || '');
    const toolSlugs = [anchor?.slug, ...(p.alsoCovers || []).map((n) => resolve(n)?.slug)].filter(Boolean);
    const kw = norm(p.targetKeyword || '') || norm(topic);
    const cand = { title: topic, keyword: kw, toolset: toolSlugs };

    const text = `${topic} ${p.targetKeyword || ''}`;
    if (!anchor) { dropped.push({ topic, reason: 'anchor not in universe' }); continue; }
    // FENCE: never anchor on a tool that cannot carry a /go/ CTA (registry-derived).
    const fenced = noAnchorReason(anchor);
    if (fenced) { dropped.push({ topic, reason: `fence: ${fenced}` }); continue; }
    const unknown = unknownComparisonOperands(universe, topic);
    if (unknown.length) { dropped.push({ topic, reason: `unknown comparison operand(s): ${unknown.join(', ')} not in the tool universe` }); continue; }
    const unreg = unregisteredNamed(universe, topic);
    if (unreg.length) { dropped.push({ topic, reason: `registry fence: ${unreg.join(', ')} has no affiliate-links.ts entry, so its /go/ CTA would 404` }); continue; }
    // TITLE ONLY, never the target keyword. A migration guide legitimately TARGETS
    // an "x alternatives" query while being a migration post, and migrations are the
    // site's most reliable format. Testing topic+keyword rejected four of them in the
    // first live dry run ("Migrate from Lusha to Prospeo", "Migrate from Pipedrive to
    // Attio", ...) purely because the proposer picked an alternatives keyword. The
    // audit's finding is about the post FORMAT, which the title states, not the query
    // it chases.
    if (isAlternativesFraming(topic)) { dropped.push({ topic, reason: 'format fence: "alternatives/competitors" is the worst-performing format (audit 2026-08-04)' }); continue; }
    if (!namesEarningTool(universe, text)) { dropped.push({ topic, reason: 'CTA fence: title names no tool that can carry a /go/ CTA' }); continue; }
    const reason = collide(universe, index, cand);
    if (reason) { dropped.push({ topic, reason }); continue; }
    addToIndex(universe, index, cand); // dedup subsequent proposals against this one too

    const overlapWith = toolSlugs.flatMap((s) => coveredAnchors.get(s) || []);
    kept.push({
      topic,
      anchorTool: anchor.name,
      alsoCovers: (p.alsoCovers || []).map(dedash),
      targetKeyword: dedash(p.targetKeyword || ''),
      tag: ['comparison', 'tools', 'automation', 'revops', 'guide'].includes(p.tag) ? p.tag : 'comparison',
      priority: ['High', 'Medium', 'Low'].includes(p.priority) ? p.priority : 'Medium',
      firstMover: !!p.firstMover || anchor.firstMover,
      needsLP: anchor.hasLP ? false : true,
      rationale: dedash(p.rationale || ''),
      overlapWarning: overlapWith.length ? `shares a tool with: ${[...new Set(overlapWith)].slice(0, 3).join('; ')}` : '',
    });
  }

  const rank = { High: 0, Medium: 1, Low: 2 };
  kept.sort((a, b) => (rank[a.priority] - rank[b.priority]) || (Number(b.firstMover) - Number(a.firstMover)));
  return { kept, dropped };
}

// ---------- 5. OUTPUT ----------
function writeOutputs(kept, dropped, meta) {
  writeFileSync(join(HERE, 'backlog-batch.json'), JSON.stringify({ meta, topics: kept, dropped }, null, 2));
  const md = [
    `# Topic backlog batch (${kept.length} topics)`,
    '',
    `Generated by build-backlog.mjs. Model: ${meta.model}. Universe: ${meta.universe} tools. Dedup corpus: ${meta.covered} covered topics. Dropped as duplicate/invalid: ${dropped.length}.`,
    '',
    'Eyeball this, then (Phase 2) the n8n workflow stages the approved rows in Notion as Suggested. Nothing here is queued or published automatically.',
    '',
    '| # | Priority | Topic | Anchor (LP?) | Also covers | Target keyword | Tag | First-mover | Note |',
    '|---|---|---|---|---|---|---|---|---|',
    ...kept.map((t, i) =>
      `| ${i + 1} | ${t.priority} | ${t.topic} | ${t.anchorTool}${t.needsLP ? ' (needs LP)' : ''} | ${t.alsoCovers.join(', ')} | ${t.targetKeyword} | ${t.tag} | ${t.firstMover ? 'yes' : ''} | ${t.rationale}${t.overlapWarning ? ` [${t.overlapWarning}]` : ''} |`
    ),
    '',
    dropped.length ? '## Dropped (not silently truncated)' : '',
    ...dropped.map((d) => `- ${d.topic} - ${d.reason}`),
  ].join('\n');
  writeFileSync(join(HERE, 'backlog-batch.md'), md);
}

// ---------- main ----------
// Load + de-dup the tool universe (tools.ts wins over the pipeline doc, keeps hasLP).
// Shared by main() and the --audit-queue dispatch.
function buildUniverse() {
  const universeRaw = [...parseToolsTs(), ...parsePipelineBacklog()];
  const seen = new Map();
  for (const t of universeRaw) if (!seen.has(norm(t.name))) seen.set(norm(t.name), t);
  return [...seen.values()];
}

async function main() {
  const universe = buildUniverse();

  // Dedup corpus: published posts (always, local) + calendar rows. When a Notion
  // token is present, query the LIVE calendar (covers queued/generating/published
  // too); otherwise fall back to the committed CONTENT_CALENDAR.md snapshot.
  const calendar = NOTION_TOKEN ? await fetchNotionCalendar(universe) : parseCalendarRows(universe);
  const covered = [...parsePublishedPosts(universe), ...calendar];

  console.log(`Universe: ${universe.length} tools (${universe.filter((t) => t.hasLP).length} with LP, ${universe.filter((t) => t.firstMover).length} first-mover).`);
  console.log(`Dedup corpus: ${covered.length} covered topics (${covered.filter((c) => c.source === 'published').length} published, ${calendar.length} calendar via ${NOTION_TOKEN ? 'live Notion' : 'local snapshot'}).`);

  const demand = await mineGscDemand(covered);
  if (demand.length) console.log(`Observed demand: ${demand.length} unserved queries from GSC (top: "${demand[0].query}" ${demand[0].impressions} impr).`);
  if (MINE_ONLY) {
    console.log('\n--mine-only: unserved GSC queries (impressions / avg position):');
    for (const d of demand) console.log(`  ${String(d.impressions).padStart(4)}  pos ${String(d.position).padStart(3)}  ${d.query}`);
    if (!demand.length) console.log('  (none â€” either GSC creds missing or every query is served)');
    return;
  }
  console.log(`Proposing ${COUNT} topics via ${MODEL}...`);

  const proposals = await propose(universe, covered, COUNT, demand);
  const { kept, dropped } = dedup(proposals, universe, covered);

  writeOutputs(kept, dropped, { model: MODEL, universe: universe.length, covered: covered.length, proposed: proposals.length, staged: STAGE });
  console.log(`\nProposed ${proposals.length} -> kept ${kept.length}, dropped ${dropped.length} as duplicate/invalid.`);
  console.log(`Wrote backlog/backlog-batch.json and backlog/backlog-batch.md`);
  if (dropped.length) console.log('Dropped:', dropped.map((d) => `${d.topic} (${d.reason})`).join(' | '));

  if (STAGE) {
    console.log(`\nStaging ${kept.length} topics to Notion Content Calendar (Status: Suggested)...`);
    const { created, failed } = await stageToNotion(kept);
    console.log(`Staged ${created}/${kept.length} as Suggested. ${failed.length} failed.`);
    if (failed.length) { console.error('Failed:', failed.join(' | ')); process.exit(1); }
  } else {
    console.log('(dry run - not staged to Notion; pass --stage with NOTION_TOKEN to push)');
  }
}

// ---------- SELFTEST ----------
// Regression fixture for the 2026-08-12 queue scrub: every topic Ian Skipped by
// hand must now be rejected at generation time, and a control set must survive so
// the fences are not simply blocking everything. Runs offline (published posts are
// the dedup corpus; no Notion, no API key).
//   node backlog/build-backlog.mjs --selftest
const SCRUBBED_2026_08_12 = [
  'Your HubSpot Implementation Is Failing: The Five Silent Reasons and How to Fix Them',
  'Apollo Alternatives When Enrichment Costs Explode',
  'Apollo vs Smartlead vs Instantly: 2026',
  'Best CRM for Outbound Teams Under $250',
  'Calendly vs Chili Piper vs Savvycal',
  'Chili Piper Alternatives for Inbound Lead Routing in 2026',
  'Clay vs Apollo vs Smartlead: 2026',
  'Dripify vs Apollo: Which LinkedIn Outreach Tool Wins for B2B in 2026',
  'HubSpot to Beehiiv: Revenue Stack 2026',
  'HubSpot vs Competitors: Why Teams Switch and What They Move To in 2026',
  'HubSpot vs Zapier: Why RevOps Teams Use Both and When to Drop One',
  'HubSpot Workflows Failing? Migrate to Kit in 2026',
  'Iterable Competitors in 2026: Which Email Platform Should You Switch To',
  'Kit vs Beehiiv vs Loops: B2B Revenue Stack',
  'Lusha vs UpLead vs Prospeo: Best B2B Contact Data for Outbound in 2026',
  'Migrate from Lusha to Prospeo Without Losing Your Enrichment Workflows',
  'Outbound Data Spend Blowup: Apollo vs Clay',
  'Pipedrive vs ActiveCampaign: Which Tool Actually Owns Your Pipeline',
  'Pipedrive vs Airtable: Why One Is a CRM and the Other Is Not',
  'Pipedrive vs Freshsales vs Salesmate: Best CRM for Outbound Under $100',
  'Pipedrive vs Insightly: Which CRM Actually Fits a Small GTM Team',
  'Pipedrive vs Zendesk Sell: Which CRM Actually Fits a Sales-First Team',
  'RB2B vs Lead Forensics vs Warmly: Best Visitor ID Tool for Outbound',
  'Reply.io vs Lemlist vs Instantly: 2026',
  'SharpSpring vs HubSpot: Is the Cheaper Marketing Automation Worth It',
  'Smartlead Alternatives When Pricing Jumps',
  'Smartlead vs Reply.io vs Instantly: 2026',
  'The $1200/mo Enterprise GTM Stack: 2026',
  'The $800/mo Enterprise Outbound Stack',
  'What Your Outbound Stack Actually Costs Per Lead in 2026: A Tool-by-Tool Breakdown',
  'Why Gong Replaced Outreach for Your SDRs',
  'Why RevOps Budgets Blow Up in Q1',
  'Why RevOps Teams Are Abandoning Loops',
  'Why RevOps Teams Hate Their Automation Stacks',
  'Why Your Automation Stack Costs 3x More Than It Should',
  'Your Pipedrive Sequences Are Silent',
];
// Must SURVIVE. Guards against over-blocking: a review, a migration, a workflow
// tutorial, a pricing page, and a comparison that shares a tool pair with a
// published post but carries a genuinely different angle.
const CONTROLS = [
  'Profound Review 2026: The GEO and AI Search Tool Built for B2B Content Teams',
  'Migrate from Aircall to JustCall Without Disrupting Your SDR Team',
  'Connect PandaDoc to HubSpot for Proposal Automation Without Custom Code',
  'What JustCall Actually Costs in 2026: Per-Seat Pricing, AI Add-ons, and Hidden Fees',
  'Apollo vs Lusha: Best Contact Data for Healthcare Outbound',
  // REGRESSION LOCK. A migration guide may legitimately target an "x alternatives"
  // query. The first live dry run rejected four migrations because the format fence
  // read topic+targetKeyword instead of the title. Migrations are the site's most
  // reliable format, so this must never be blocked again.
  {
    topic: 'Migrate from GetResponse to ActiveCampaign Without Losing Your Sequences',
    targetKeyword: 'getresponse alternatives',
  },
];

// The 8 the fences deliberately do NOT catch. Each needs a semantic judgment a
// deterministic gate cannot make without becoming brittle and over-blocking, so
// they stay a human-review job rather than a bad rule. Kept explicit so a future
// change that DOES catch one is visible (the test tells you to shrink this list).
//   - HubSpot vs Zapier / Pipedrive vs ActiveCampaign: real tools, but the pairing
//     is cross-category. "Is this a fair comparison?" is not mechanical.
//   - HubSpot Workflows -> Kit: CRM automation vs newsletter tool, same problem.
//   - Kit vs Beehiiv vs Loops: a 3rd permutation of the newsletter family, but it
//     carries enough distinct framing to clear the bare-permutation gate. Tightening
//     that threshold would over-block legitimate re-angles.
//   - Migrate from Lusha to Prospeo: duplicates a QUEUED row, not a published one.
//     Production catches this (main() puts the live calendar in the dedup corpus);
//     the selftest runs offline against published posts only.
//   - The remaining three are vague/thin framings ("Your Pipedrive Sequences Are
//     Silent"), which is an editorial call, not a detectable property.
const ACCEPTED_JUDGMENT_LEAKS = new Set([
  'HubSpot vs Zapier: Why RevOps Teams Use Both and When to Drop One',
  'HubSpot Workflows Failing? Migrate to Kit in 2026',
  'Kit vs Beehiiv vs Loops: B2B Revenue Stack',
  'Migrate from Lusha to Prospeo Without Losing Your Enrichment Workflows',
  'Outbound Data Spend Blowup: Apollo vs Clay',
  'Pipedrive vs ActiveCampaign: Which Tool Actually Owns Your Pipeline',
  'Why RevOps Teams Are Abandoning Loops',
  'Your Pipedrive Sequences Are Silent',
]);

function selfTest() {
  const universe = buildUniverse();
  const covered = parsePublishedPosts(universe);
  const resolve = makeResolver(universe);
  // Mimic the proposer: anchor on the first tool the title names, else a live-status
  // tool, so the anchor fence does not mask the fence actually under test.
  // Accepts a bare title, or { topic, targetKeyword } when the keyword is the thing
  // under test.
  const asProposal = (fixture) => {
    const topic = typeof fixture === 'string' ? fixture : fixture.topic;
    const targetKeyword = typeof fixture === 'string' ? '' : (fixture.targetKeyword || '');
    const named = titleTools(universe, topic).map((s) => universe.find((t) => t.slug === s)).filter(Boolean);
    const anchor = named.find((t) => !isNoAnchor(t)) || named[0];
    return {
      topic,
      anchorTool: anchor ? anchor.name : 'Clay',
      // Faithful to a real proposal: the proposer fills alsoCovers, and the tool
      // SET is what drives signature/collision dedup. Leaving it empty made the
      // fixture understate the dedup layer.
      alsoCovers: named.filter((t) => t !== anchor).map((t) => t.name),
      targetKeyword,
    };
  };

  const bad = dedup(SCRUBBED_2026_08_12.map(asProposal), universe, covered);
  const good = dedup(CONTROLS.map(asProposal), universe, covered);

  const leaked = bad.kept.map((k) => k.topic);
  const blocked = good.dropped;

  console.log(`SCRUBBED fixture: ${SCRUBBED_2026_08_12.length} topics, ${bad.dropped.length} rejected, ${leaked.length} leaked.`);
  for (const d of bad.dropped) console.log(`  reject  ${d.topic}\n            -> ${d.reason}`);

  // Anything NOT on the accepted list is a regression.
  const unexpected = leaked.filter((t) => !ACCEPTED_JUDGMENT_LEAKS.has(t));
  const nowCaught = [...ACCEPTED_JUDGMENT_LEAKS].filter((t) => !leaked.includes(t));

  if (leaked.length) {
    console.log(`\nLEAKED ${leaked.length} (all expected: ${unexpected.length === 0}):`);
    leaked.forEach((t) => console.log(`  - ${t}${ACCEPTED_JUDGMENT_LEAKS.has(t) ? '' : '   <-- UNEXPECTED'}`));
  }
  if (nowCaught.length) {
    console.log('\nNo longer leaking (shrink ACCEPTED_JUDGMENT_LEAKS):');
    nowCaught.forEach((t) => console.log(`  - ${t}`));
  }

  console.log(`\nCONTROLS: ${CONTROLS.length} topics, ${good.kept.length} survived, ${blocked.length} over-blocked.`);
  if (blocked.length) { console.log('OVER-BLOCKED (should have survived):'); blocked.forEach((d) => console.log(`  - ${d.topic}\n      -> ${d.reason}`)); }

  const pass = unexpected.length === 0 && nowCaught.length === 0 && blocked.length === 0;
  console.log(`\n${bad.dropped.length}/${SCRUBBED_2026_08_12.length} caught deterministically; ${ACCEPTED_JUDGMENT_LEAKS.size} left to human review.`);
  console.log(`selftest: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

const runFatal = (e) => { console.error('\nFatal:', e.message || e); process.exit(1); };
if (process.argv.includes('--selftest')) { try { selfTest(); } catch (e) { runFatal(e); } }
else if (AUDIT_QUEUE) auditQueue(buildUniverse()).catch(runFatal);
else main().catch(runFatal);
