// Performance signals for the topic backlog builder (added 2026-10-08, Session 110).
//
// WHY
//   Until S110 the builder fed Claude only GSC unserved QUERIES (28d, 3+ impressions)
//   and ranked proposals by the model's own High/Medium/Low. Nothing measured about the
//   site (page impressions, position, near-wins, which formats earn, which live
//   programs have no post) reached the prompt or the stager. This module turns those
//   measurements into ONE deterministic score per proposal so the weekly Queued pick is
//   a ranked shortlist, not a flat pile.
//
// VOLUME RULE (audit 2026-10-01 section 1, re-measured 2026-10-08: 60 GSC clicks and
//   28k impressions in 28d; the best tool has 3 human affiliate clicks in 90d):
//   impressions, position and near-wins RANK topics. Clicks and affiliate clicks are
//   printed as a sanity line and never enter the score. No split test on this site
//   reaches significance in under 33 weeks, so the score is judged by the
//   pre-registered before/after metric in TODO.md, not by clicks.
//
// SCORE (0..100)
//   demand        0..50  unserved query clusters the topic serves (log-scaled impressions,
//                        x1.2 when the site already ranks 5..15 for the cluster)
//   nearWin       0..20  a published post on the same anchor tool ranks 5..15 with 100+
//                        page+query-attributed impressions (sibling link equity)
//   monetisation  0..20  anchor program live 15 (+5 when no post names it yet),
//                        pending/applied 8, anything else 0
//   format        1..10  measured, age-adjusted 90d impressions-per-post by format,
//                        best format = 10 (replaces the old hard-coded quotas)
//   overlap      -15     partial title overlap with a covered topic (jaccard 0.5..0.72;
//                        0.72+ is a hard dedup drop in build-backlog.mjs)
//
// Everything here is pure and offline except fetchGscRows(); selfTestSignals() replays
// synthetic fixtures and runs inside build-backlog.mjs --selftest (CI, before any write).

// ---- shared text helpers (single definition; build-backlog.mjs imports these) ----
export const STOPWORDS = new Set(['the', 'a', 'an', 'for', 'of', 'in', 'on', 'to', 'vs', 'versus', 'and', 'or', 'best', 'top', 'with', 'is', 'are', 'what', 'which', 'how', 'why', 'when', 'you', 'your', 'my', 'it', 'that', '2024', '2025', '2026', '2027', 'tool', 'tools', 'software']);
export const tokenSet = (s) => new Set(
  (s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w))
);
export function tokenCoverage(qTokens, cTokens) {
  if (!qTokens.size) return 1;
  let hit = 0;
  for (const w of qTokens) if (cTokens.has(w)) hit++;
  return hit / qTokens.size;
}
export function jaccard(a, b) {
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  const union = a.size + b.size - hit;
  return union ? hit / union : 0;
}
// Search-intent class of a title/keyword (null = general). Single-anchor intents exist
// at most once per anchor tool (the dedup gate in build-backlog.mjs keys on this).
export function intentOf(text) {
  const s = (text || '').toLowerCase();
  if (/\bmigrat|switch(ing)?\s+(from|to|off)\b/.test(s)) return 'migration';
  if (/\bpricing\b|\bprice\b|\bcosts?\b/.test(s)) return 'pricing';
  if (/\balternativ/.test(s)) return 'alternatives';
  if (/\breview\b/.test(s)) return 'review';
  return null;
}
export const isComparison = (text) => /\bvs\.?(\s|$)|\bversus\b/i.test(text || '');
// Post format for the per-format table: an intent, else comparison, else "other"
// (guides, stacks, recipes).
export const formatOf = (text) => intentOf(text) || (isComparison(text) ? 'comparison' : 'other');

// Human queries only: no rank-tracker operator strings, no URLs or phone numbers.
// (Operator strings are what inflate "near-win" pages: the beehiiv-vs-substack post had
// 949 page impressions on 2026-10-05 and 119 attributable to real queries.)
export function isHumanQuery(q) {
  if (!q) return false;
  if (q.length > 80 || q.includes('"') || q.includes('site:') || /https?:\/\//.test(q)) return false;
  if (/^[%+-]/.test(q.trim())) return false; // "+substack hubspot ..." / "%aisdr ..." rank-tracker syntax
  if (/^[\d\s()+-]+$/.test(q)) return false;
  return true;
}

// ---- GSC fetch (paged) ----
// endLagDays: GSC data settles about 3 days late, so the window ends 3 days back.
export async function fetchGscRows(access, site, { days, dimensions, rowLimit = 5000, endLagDays = 3, now = Date.now() } = {}) {
  const end = new Date(now - endLagDays * 864e5).toISOString().slice(0, 10);
  const start = new Date(now - (endLagDays + days - 1) * 864e5).toISOString().slice(0, 10);
  const rows = [];
  for (let startRow = 0; ; startRow += rowLimit) {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit, startRow }),
      }
    );
    if (!res.ok) throw new Error(`GSC searchAnalytics failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const chunk = (await res.json()).rows || [];
    rows.push(...chunk);
    if (chunk.length < rowLimit) break;
  }
  return { rows, start, end };
}

// ---- 1. demand clusters ----
// Group human queries by (universe tools named, intent) when that pair pins a topic down:
// two or more tools ("moltsets vs apollo", "how does moltsets compare to apollo?", "which
// is better for enrichment, moltsets or apollo?" become ONE cluster) or one tool plus an
// intent ("rb2b pricing" + "rb2b cost"). A single tool with no intent pins nothing (40
// Pipedrive queries from "pipedrive to json" to "pipedrive marketing automation" are not
// one demand), so those and tool-less queries group by their sorted token set.
// A cluster whose key is a tool pair or tool+intent is "pinned" (matched wholesale by a
// topic over those tools); every other cluster matches a topic only by query tokens.
export function clusterQueries(rows, universe, aliasHit) {
  const clusters = new Map();
  for (const r of rows) {
    const q = r.keys[0] || '';
    if (!isHumanQuery(q) || (r.impressions || 0) < 3) continue;
    const toks = tokenSet(q);
    if (toks.size < 2) continue; // single-token queries are brand/navigation noise
    const tools = universe.filter((t) => aliasHit(t.aliases, q)).map((t) => t.slug).sort();
    const intent = intentOf(q);
    const pinned = tools.length >= 2 || (tools.length === 1 && intent !== null);
    const key = pinned ? `${tools.join('+')}::${intent || 'general'}` : `q::${[...toks].sort().join(' ')}`;
    const c = clusters.get(key) || { key, tools, intent, pinned, queries: [], impressions: 0, clicks: 0, bestPosition: Infinity };
    c.queries.push({ query: q, impressions: r.impressions, clicks: r.clicks || 0, position: Math.round((r.position || 0) * 10) / 10 });
    c.impressions += r.impressions;
    c.clicks += r.clicks || 0;
    c.bestPosition = Math.min(c.bestPosition, r.position || Infinity);
    clusters.set(key, c);
  }
  const out = [...clusters.values()];
  for (const c of out) {
    c.queries.sort((a, b) => b.impressions - a.impressions);
    c.top = c.queries[0].query;
    c.bestPosition = Number.isFinite(c.bestPosition) ? Math.round(c.bestPosition * 10) / 10 : null;
  }
  return out.sort((a, b) => b.impressions - a.impressions);
}

// Keep the demand no covered topic serves. A query is served when 60%+ of its tokens
// appear in a covered title+keyword (the pre-S110 rule, unchanged). A whole cluster is
// served when it carries an intent and a covered topic has that intent over the same
// tools ("rb2b cost" is served by the RB2B pricing post even though "cost" is not in its
// title). Otherwise a cluster keeps only its unserved queries' impressions, so a
// half-served cluster shrinks instead of hiding.
export function unservedClusters(clusters, covered, { minImpressions = 3, limit = 60 } = {}) {
  const coveredTokens = covered.map((c) => tokenSet(`${c.title} ${c.keyword || ''}`));
  const coveredIntents = covered.map((c) => ({ intent: intentOf(`${c.title} ${c.keyword || ''}`), toolset: c.toolset || [] }));
  const out = [];
  for (const c of clusters) {
    if (c.pinned && c.intent && coveredIntents.some((k) => k.intent === c.intent && c.tools.every((s) => k.toolset.includes(s)))) continue;
    const unserved = c.queries.filter((q) => {
      const qt = tokenSet(q.query);
      const best = Math.max(0, ...coveredTokens.map((ct) => tokenCoverage(qt, ct)));
      return best < 0.6;
    });
    const impressions = unserved.reduce((s, q) => s + q.impressions, 0);
    if (!unserved.length || impressions < minImpressions) continue;
    out.push({ ...c, queries: unserved, impressions, clicks: unserved.reduce((s, q) => s + q.clicks, 0),
      bestPosition: Math.min(...unserved.map((q) => q.position)), top: unserved[0].query, served: c.queries.length - unserved.length });
  }
  return out.sort((a, b) => b.impressions - a.impressions).slice(0, limit);
}

// ---- 2. near-wins (position 5..15), split hub vs post ----
// pageRows: GSC rows with dimensions ['page']; pageQueryRows: dimensions ['page','query'].
// posts: [{ path, title, toolset, titleToolset?, ... }] from parsePublishedPosts. Attributed
// impressions (human queries only) decide the cut, not the raw page total. A near-win's
// tools are the ones its TITLE names (titleToolset when present): a tag or a body mention
// does not make a post a sibling of every topic on that tool.
export function nearWins(pageRows, pageQueryRows, posts, { minAttributed = 100, minPos = 5, maxPos = 15 } = {}) {
  const attributed = new Map(); // page url -> { impressions, top }
  for (const r of pageQueryRows) {
    const [page, q] = r.keys;
    if (!isHumanQuery(q)) continue;
    const a = attributed.get(page) || { impressions: 0, clicks: 0, top: null, topImpr: 0 };
    a.impressions += r.impressions; a.clicks += r.clicks || 0;
    if (r.impressions > a.topImpr) { a.top = q; a.topImpr = r.impressions; }
    attributed.set(page, a);
  }
  const byPath = new Map(posts.map((p) => [p.path, p]));
  const hubs = [], postsOut = [];
  for (const r of pageRows) {
    const pos = r.position || 0;
    if (pos < minPos || pos > maxPos) continue;
    const a = attributed.get(r.keys[0]);
    if (!a || a.impressions < minAttributed) continue;
    const path = r.keys[0].replace(/^https?:\/\/[^/]+/, '');
    const base = { path, impressions: r.impressions, attributed: a.impressions, clicks: r.clicks || 0, position: Math.round(pos * 10) / 10, topQuery: a.top };
    const hub = path.match(/^\/tools\/([^/]+)\/$/);
    if (hub) { hubs.push({ ...base, slug: hub[1] }); continue; }
    const post = byPath.get(path);
    if (post) postsOut.push({ ...base, title: post.title, toolset: post.titleToolset || post.toolset, format: formatOf(post.title) });
  }
  const desc = (a, b) => b.attributed - a.attributed;
  return { hubs: hubs.sort(desc), posts: postsOut.sort(desc) };
}

// ---- 3. measured format prior ----
// Age-adjusted: only posts at least minAgeDays old on asOf count, so a young cohort
// (September's migrations, August's pricing posts) is not judged on a partial window.
// Formats with fewer than minPosts qualified posts get the mean prior (unknown, not bad).
export function formatPrior(pageRows, posts, { asOf, minAgeDays = 60, minPosts = 3 } = {}) {
  const cutoff = new Date(new Date(asOf).getTime() - minAgeDays * 864e5).toISOString().slice(0, 10);
  const byPath = new Map(posts.map((p) => [p.path, p]));
  const groups = new Map();
  for (const p of posts) {
    if (!p.pubDate || p.pubDate > cutoff) continue;
    const g = groups.get(formatOf(p.title)) || { format: formatOf(p.title), posts: 0, impressions: 0, clicks: 0 };
    g.posts++; groups.set(g.format, g);
  }
  for (const r of pageRows) {
    const p = byPath.get(r.keys[0].replace(/^https?:\/\/[^/]+/, ''));
    if (!p || !p.pubDate || p.pubDate > cutoff) continue;
    const g = groups.get(formatOf(p.title));
    if (g) { g.impressions += r.impressions; g.clicks += r.clicks || 0; }
  }
  const table = [...groups.values()].map((g) => ({ ...g, imprPerPost: g.posts ? g.impressions / g.posts : 0 }));
  const qualified = table.filter((g) => g.posts >= minPosts);
  const best = Math.max(0, ...qualified.map((g) => g.imprPerPost));
  for (const g of table) g.prior = g.posts >= minPosts && best > 0 ? Math.max(1, Math.round(10 * g.imprPerPost / best)) : null;
  const known = table.filter((g) => g.prior !== null).map((g) => g.prior);
  const mean = known.length ? Math.max(1, Math.round(known.reduce((s, x) => s + x, 0) / known.length)) : 5;
  for (const g of table) if (g.prior === null) g.prior = mean;
  table.sort((a, b) => b.imprPerPost - a.imprPerPost);
  const priorOf = (format) => table.find((g) => g.format === format)?.prior ?? mean;
  return { table, priorOf, cutoff, mean };
}

// ---- 4. score one topic ----
// topic: { topic, targetKeyword, keyword (normalized, as the dedup index keys it), toolset
//          (slugs), anchorSlug, anchorStatus, anchorHasPosts }
// ctx:   { clusters (unserved), nearWinPosts, priorOf, coveredTokens: [{title, toks}], clicksByTool: Map }
export function scoreTopic(topic, ctx) {
  const title = topic.topic || '';
  const text = `${title} ${topic.targetKeyword || ''}`;
  const toks = tokenSet(text);
  // Overlap uses the SAME recipe as the dedup index (title + normalized keyword), so a
  // covered row that IS this topic reads jaccard 1.0 (dedup territory), never 0.5..0.72.
  const toksIndex = tokenSet(`${title} ${topic.keyword || ''}`);
  const intent = intentOf(text);
  const toolset = new Set(topic.toolset || []);

  // demand: a pinned cluster (tool pair, or tool + intent) matches wholesale when its tools
  // all sit in the topic's tool set and the intents agree; any other cluster matches query
  // by query, when 60%+ of a query's tokens appear in the title + target keyword.
  let impr = 0, bestPos = Infinity;
  const served = [];
  for (const c of ctx.clusters || []) {
    if (c.pinned) {
      if (!(c.tools.every((s) => toolset.has(s)) && (c.intent === null || c.intent === intent))) continue;
      impr += c.impressions; bestPos = Math.min(bestPos, c.bestPosition ?? Infinity); served.push({ top: c.top, impressions: c.impressions });
      continue;
    }
    const hits = (c.queries || [{ query: c.top, impressions: c.impressions, position: c.bestPosition }])
      .filter((q) => tokenCoverage(tokenSet(q.query), toks) >= 0.6);
    if (!hits.length) continue;
    const hitImpr = hits.reduce((s, q) => s + q.impressions, 0);
    impr += hitImpr; bestPos = Math.min(bestPos, ...hits.map((q) => q.position ?? Infinity)); served.push({ top: hits[0].query, impressions: hitImpr });
  }
  served.sort((a, b) => b.impressions - a.impressions);
  let demand = impr > 0 ? 50 * Math.log10(1 + impr) / Math.log10(1 + 500) : 0;
  if (bestPos <= 15) demand *= 1.2;
  demand = Math.min(50, Math.round(demand));

  // near-win sibling: strongest published post on the same anchor tool at position 5..15.
  const sib = (ctx.nearWinPosts || []).filter((p) => topic.anchorSlug && p.toolset.includes(topic.anchorSlug));
  const sibBest = sib.length ? sib.reduce((a, b) => (b.attributed > a.attributed ? b : a)) : null;
  const nearWin = sibBest ? Math.min(20, Math.round(20 * sibBest.attributed / 300)) : 0;

  const st = topic.anchorStatus || 'none';
  const monetisation = st === 'live' ? 15 + (topic.anchorHasPosts ? 0 : 5) : (st === 'pending' || st === 'applied') ? 8 : 0;

  const format = formatOf(title);
  const prior = ctx.priorOf ? ctx.priorOf(format) : 5;

  let overlapJ = 0, overlapTitle = '';
  for (const c of ctx.coveredTokens || []) {
    const j = jaccard(toksIndex, c.toks);
    if (j > overlapJ) { overlapJ = j; overlapTitle = c.title; }
  }
  const overlap = overlapJ >= 0.5 && overlapJ < 0.72 ? -15 : 0;

  const score = Math.max(0, Math.min(100, demand + nearWin + monetisation + prior + overlap));
  const clicks = topic.anchorSlug && ctx.clicksByTool ? ctx.clicksByTool.get(topic.anchorSlug) || 0 : 0;
  const parts = [
    `demand ${demand}` + (served.length ? ` ("${served[0].top}" ${impr} impr/28d, best pos ${bestPos === Infinity ? '-' : bestPos})` : ' (no unserved query)'),
    `near-win ${nearWin}` + (sibBest ? ` (${sibBest.path.replace(/^\/blog\//, '').slice(0, 40)} ${sibBest.attributed} impr @${sibBest.position})` : ''),
    `monetisation ${monetisation} (${st}${st === 'live' && !topic.anchorHasPosts ? ', no post yet' : ''})`,
    `format ${prior} (${format})`,
    overlap ? `overlap ${overlap} (near "${overlapTitle.slice(0, 40)}", jaccard ${overlapJ.toFixed(2)})` : '',
  ].filter(Boolean);
  return { score, demand, nearWin, monetisation, format, prior, overlap, breakdown: parts.join('; '), sanity: `28d GSC clicks on posts naming the anchor: ${clicks}` };
}

// Tertiles within a batch: top third High, middle Medium, rest Low. Stable on ties.
export function assignTiers(items) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const n = sorted.length;
  return sorted.map((t, i) => ({ ...t, priority: i < n / 3 ? 'High' : i < (2 * n) / 3 ? 'Medium' : 'Low' }));
}

// ---- selftest (offline fixtures) ----
export function selfTestSignals() {
  const lines = [], fails = [];
  const check = (name, ok, detail = '') => { lines.push(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' ' + detail : ''}`); if (!ok) fails.push(name); };
  const aliasHit = (aliases, hay) => {
    const h = ' ' + (hay || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
    return aliases.some((a) => { const n = (a || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); return n.length >= 3 && h.includes(' ' + n + ' '); });
  };
  const universe = [
    { slug: 'moltsets', aliases: ['MoltSets'] }, { slug: 'apollo', aliases: ['Apollo'] },
    { slug: 'rb2b', aliases: ['RB2B'] }, { slug: 'close', aliases: ['Close'] },
  ];
  const q = (query, impressions, position, clicks = 0) => ({ keys: [query], impressions, clicks, position });

  // 1. clustering: three phrasings of one demand sum; operator strings and brand-only drop.
  const clusters = clusterQueries([
    q('moltsets vs apollo', 30, 5.8), q('how does moltsets compare to apollo?', 32, 3.0), q('which is better for enrichment, moltsets or apollo?', 28, 5.0),
    q('moltsets pricing', 34, 4.3, 1), q('rb2b pricing', 334, 9.0), q('rb2b cost', 9, 8.9), q('moltsets', 56, 7.1),
    q('"aisdr" "hubspot" "salesforce"', 7, 7.7), q('+substack hubspot integration free paid', 36, 1.8), q('nutshell pipeline management', 186, 10.1),
  ], universe, aliasHit);
  const byKey = Object.fromEntries(clusters.map((c) => [c.key, c]));
  check('cluster moltsets+apollo sums 3 phrasings', byKey['apollo+moltsets::general']?.queries.length === 3 && byKey['apollo+moltsets::general'].impressions === 90, `(${byKey['apollo+moltsets::general']?.impressions})`);
  check('cluster best position is the min', byKey['apollo+moltsets::general']?.bestPosition === 3);
  check('cluster rb2b pricing merges cost', byKey['rb2b::pricing']?.impressions === 343);
  check('operator strings dropped', !clusters.some((c) => c.queries.some((x) => /"|^\+/.test(x.query))));
  check('single-token brand query dropped', !clusters.some((c) => c.queries.some((x) => x.query === 'moltsets')));
  check('tool-less query clusters by tokens', !!byKey['q::management nutshell pipeline']);
  const single = clusterQueries([q('pipedrive to json', 37, 28), q('pipedrive marketing automation', 93, 30), q('pipedrive automation', 55, 22)],
    [{ slug: 'pipedrive', aliases: ['Pipedrive'] }], aliasHit);
  check('single tool + no intent is NOT one cluster', single.length === 3 && single.every((c) => !c.pinned), `(${single.length})`);
  check('tool pair and tool+intent clusters are pinned', byKey['apollo+moltsets::general']?.pinned === true && byKey['rb2b::pricing']?.pinned === true);

  // 2. unserved: a covered pricing post serves the rb2b cluster; moltsets stays.
  const covered = [{ title: 'RB2B Pricing in 2026: Free Tier Limits and When to Pay', keyword: 'rb2bpricing', toolset: ['rb2b'] }];
  const unserved = unservedClusters(clusters, covered);
  check('served cluster removed (intent + tools match covers "rb2b cost" too)', !unserved.some((c) => c.key === 'rb2b::pricing'));
  check('unserved cluster kept', unserved.some((c) => c.key === 'apollo+moltsets::general'));
  check('intent mismatch stays unserved', unserved.some((c) => c.key === 'moltsets::pricing'));

  // 3. near-wins: hub vs post split, operator-only pages excluded, attribution cut.
  const H = 'https://example.test';
  const posts = [
    { path: '/blog/moltsets-cheap-api/', title: 'MoltSets: Cheap B2B Contact Data API', toolset: ['moltsets'], pubDate: '2026-07-23' },
    { path: '/blog/beehiiv-vs-substack/', title: 'Beehiiv vs Substack vs HubSpot', toolset: ['beehiiv', 'substack', 'hubspot'], pubDate: '2026-05-13' },
    { path: '/blog/deep-page/', title: 'Apollo vs Clay', toolset: ['apollo', 'clay'], pubDate: '2026-05-06' },
  ];
  const pageRows = [
    { keys: [`${H}/tools/close/`], impressions: 3675, clicks: 0, position: 5.7 },
    { keys: [`${H}/blog/moltsets-cheap-api/`], impressions: 487, clicks: 6, position: 5.5 },
    { keys: [`${H}/blog/beehiiv-vs-substack/`], impressions: 949, clicks: 0, position: 5.4 },
    { keys: [`${H}/blog/deep-page/`], impressions: 400, clicks: 1, position: 20.0 },
  ];
  const pq = [
    { keys: [`${H}/tools/close/`, 'close crm'], impressions: 3571, clicks: 0, position: 5.5 },
    { keys: [`${H}/blog/moltsets-cheap-api/`, 'moltsets vs apollo'], impressions: 239, clicks: 0, position: 5.8 },
    { keys: [`${H}/blog/beehiiv-vs-substack/`, '+substack hubspot integration free paid'], impressions: 119, clicks: 0, position: 1.8 },
    { keys: [`${H}/blog/deep-page/`, 'apollo vs clay'], impressions: 300, clicks: 1, position: 20.0 },
  ];
  const nw = nearWins(pageRows, pq, posts);
  check('hub near-win split out', nw.hubs.length === 1 && nw.hubs[0].slug === 'close' && nw.hubs[0].topQuery === 'close crm');
  check('post near-win kept with attributed impressions', nw.posts.length === 1 && nw.posts[0].attributed === 239);
  check('operator-only page excluded', !nw.posts.some((p) => p.path === '/blog/beehiiv-vs-substack/'));
  check('position 20 excluded', !nw.posts.some((p) => p.path === '/blog/deep-page/'));

  // 4. format prior: age-adjusted, best = 10, thin formats get the mean.
  const fp = formatPrior([
    { keys: [`${H}/blog/c1/`], impressions: 300, clicks: 0, position: 8 }, { keys: [`${H}/blog/c2/`], impressions: 200, clicks: 0, position: 8 },
    { keys: [`${H}/blog/c3/`], impressions: 100, clicks: 0, position: 8 }, { keys: [`${H}/blog/o1/`], impressions: 50, clicks: 0, position: 8 },
    { keys: [`${H}/blog/o2/`], impressions: 50, clicks: 0, position: 8 }, { keys: [`${H}/blog/o3/`], impressions: 50, clicks: 0, position: 8 },
    { keys: [`${H}/blog/p1/`], impressions: 175, clicks: 0, position: 8 }, { keys: [`${H}/blog/young/`], impressions: 9999, clicks: 0, position: 8 },
  ], [
    { path: '/blog/c1/', title: 'A vs B', pubDate: '2026-05-01' }, { path: '/blog/c2/', title: 'C vs D', pubDate: '2026-05-01' }, { path: '/blog/c3/', title: 'E vs F', pubDate: '2026-05-01' },
    { path: '/blog/o1/', title: 'Connect A to B', pubDate: '2026-05-01' }, { path: '/blog/o2/', title: 'Build a stack', pubDate: '2026-05-01' }, { path: '/blog/o3/', title: 'Guide to X', pubDate: '2026-05-01' },
    { path: '/blog/p1/', title: 'A pricing explained', pubDate: '2026-05-01' }, { path: '/blog/young/', title: 'Migrate from A to B', pubDate: '2026-09-20' },
  ], { asOf: '2026-10-05' });
  check('best format prior is 10', fp.priorOf('comparison') === 10, `(${fp.priorOf('comparison')})`);
  check('weak format scales down', fp.priorOf('other') === 3, `(${fp.priorOf('other')})`);
  check('thin format gets the mean, not a penalty', fp.priorOf('pricing') === fp.mean && fp.mean === 7, `(${fp.priorOf('pricing')}, mean ${fp.mean})`);
  check('young post excluded from the prior', !fp.table.find((g) => g.format === 'migration'));

  // 5. scoring: additive parts, caps, overlap band, tiers.
  const ovTitle = 'MoltSets vs Apollo vs Clay: waterfall enrichment compared';
  const ctx = { clusters: unserved, nearWinPosts: nw.posts, priorOf: fp.priorOf, clicksByTool: new Map([['moltsets', 6]]),
    coveredTokens: [{ title: ovTitle, toks: tokenSet(ovTitle) }] };
  const s1 = scoreTopic({ topic: 'MoltSets vs Apollo: Which Enrichment API Wins', targetKeyword: 'moltsets vs apollo', toolset: ['moltsets', 'apollo'], anchorSlug: 'moltsets', anchorStatus: 'live', anchorHasPosts: true }, ctx);
  // 90 impressions: 50 * log10(91) / log10(501) = 36.3, x1.2 for best position 3 = 44.
  check('demand from the matched cluster, position bonus applied', s1.demand === 44, `(${s1.demand})`);
  check('pricing cluster not matched by a general-intent title', !s1.breakdown.includes('moltsets pricing'));
  check('near-win from the sibling post', s1.nearWin === 16, `(${s1.nearWin})`);
  check('live anchor with posts = 15', s1.monetisation === 15);
  check('comparison takes the best prior', s1.prior === 10);
  check('sanity line carries clicks but score does not', s1.sanity.endsWith('6') && s1.score === s1.demand + s1.nearWin + s1.monetisation + s1.prior + s1.overlap);
  const s2 = scoreTopic({ topic: 'Connect RB2B to HubSpot', toolset: ['rb2b', 'hubspot'], anchorSlug: 'rb2b', anchorStatus: 'live', anchorHasPosts: false }, ctx);
  check('no cluster = demand 0; live with no post = 20', s2.demand === 0 && s2.monetisation === 20, `(${s2.demand}, ${s2.monetisation})`);
  const big = scoreTopic({ topic: 'Nutshell Pipeline Management Guide', toolset: [], anchorSlug: 'nutshell', anchorStatus: 'pending' }, { ...ctx, clusters: [{ key: 'x', tools: [], intent: null, pinned: false, top: 'nutshell pipeline management', impressions: 100000, bestPosition: 40 }] });
  check('demand caps at 50', big.demand === 50 && big.monetisation === 8, `(${big.demand}, ${big.monetisation})`);
  const loose = scoreTopic({ topic: 'Why Outbound Teams Are Ditching Salesforce for Pipedrive', toolset: ['pipedrive', 'salesforce'], anchorSlug: 'pipedrive', anchorStatus: 'pending' }, { ...ctx, clusters: single });
  check('unpinned single-tool queries need token coverage, not just the tool name', loose.demand === 0, `(${loose.demand})`);
  const selfRow = scoreTopic({ topic: ovTitle, keyword: ovTitle.toLowerCase().replace(/[^a-z0-9]/g, ''), toolset: ['moltsets', 'apollo', 'clay'], anchorSlug: 'moltsets', anchorStatus: 'live', anchorHasPosts: true },
    { ...ctx, coveredTokens: [{ title: ovTitle, toks: tokenSet(`${ovTitle} ${ovTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`) }] });
  check('a covered row that is this topic (index recipe) is not a partial overlap', selfRow.overlap === 0);
  // 4 of 6 covered tokens shared: jaccard 0.67, inside the 0.5..0.72 band (0.72+ is a dedup drop).
  const ov = scoreTopic({ topic: 'MoltSets vs Apollo vs Clay: enrichment', toolset: ['moltsets', 'apollo', 'clay'], anchorSlug: 'moltsets', anchorStatus: 'live', anchorHasPosts: true }, ctx);
  check('partial title overlap costs 15', ov.overlap === -15, `(${ov.breakdown.match(/overlap[^;]*/)?.[0] || 'no overlap part'})`);
  const dup = scoreTopic({ topic: ovTitle, toolset: ['moltsets', 'apollo', 'clay'], anchorSlug: 'moltsets', anchorStatus: 'live', anchorHasPosts: true }, ctx);
  check('full duplicate is the dedup guard\'s job, not a score penalty', dup.overlap === 0);
  const tiers = assignTiers([{ score: 10 }, { score: 90 }, { score: 50 }, { score: 70 }, { score: 30 }, { score: 60 }, { score: 20 }]);
  check('tiers: top third High, middle Medium, rest Low', tiers.map((t) => t.priority).join(',') === 'High,High,High,Medium,Medium,Low,Low', `(${tiers.map((t) => t.priority).join(',')})`);

  return { pass: fails.length === 0, lines, fails };
}
