// update-engine-internal-links.mjs — S62 (2026-07-09)
//
// Audit S-1(b): give the engine an internal-link SLUG FEED so NEW posts get the
// same contextual mesh the S-1a backfill (internal-link-mesh.mjs) added to the
// existing 59 posts — else the mesh decays as posts publish. The mesh has two
// arms and both are 404-safe by construction:
//
//   TOOL HUBS   [Tool](/tools/<slug>/)  — authority links, SEPARATE from /go/ CTAs
//   RELATED     [phrase](/blog/<slug>/) — sibling-post links
//
// How the 404-risk is eliminated (the reason this was "punted" in S52):
//   1. Two unauthenticated httpRequest nodes fetch the EXACT valid targets from
//      the public repo at generation time (tools.ts slugs + the blog dir listing).
//   2. A pure-parse Code node ("Build Link Targets") turns them into the slug
//      lists + a readable label per recent post.
//   3. Generate Draft is handed ONLY those slugs and told never to invent one.
//   4. Parse Draft deterministically STRIPS any /tools/ or /blog/ link whose slug
//      isn't in the fetched valid set (fail-open per-list if a fetch returned
//      nothing, so a GitHub hiccup can never nuke every internal link).
//
// The fetch nodes carry neverError:true, so a transient GitHub failure degrades to
// "no mesh that day" (Build Link Targets fail-softs to empty lists), never a
// broken engine run.
//
// Idempotent: re-running is a no-op (node-existence + per-edit tokens).
// Run: node n8n/update-engine-internal-links.mjs   (mutates blog-post-engine.json)
// then: node --env-file=../restaurant-outreach/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const node = (name) => wf.nodes.find((x) => x.name === name);
const RAW = 'https://raw.githubusercontent.com/homegrowngrowthco/theautomationsguide/master/src/data/tools.ts';
const API = 'https://api.github.com/repos/homegrowngrowthco/theautomationsguide/contents/src/content/blog?ref=master';

let applied = 0, skipped = 0;
function editStr(label, obj, key, anchor, token, build) {
  const src = obj[key];
  if (src.includes(token)) { console.log(`SKIP (already applied): ${label}`); skipped++; return; }
  if (anchor && !src.includes(anchor)) throw new Error(`anchor missing for ${label}: ${anchor.slice(0, 60)}...`);
  obj[key] = build(src);
  if (!obj[key].includes(token)) throw new Error(`self-check failed for ${label}`);
  console.log(`APPLIED: ${label}`);
  applied++;
}

// ---------------------------------------------------------------------------
// 1. Three new nodes: Fetch Tools Registry -> Fetch Blog List -> Build Link Targets
// ---------------------------------------------------------------------------
const uaHeader = { name: 'User-Agent', value: 'theautomationsguide-engine' };

const fetchToolsNode = {
  parameters: {
    method: 'GET', url: RAW,
    sendHeaders: true, headerParameters: { parameters: [uaHeader] },
    options: { timeout: 30000, response: { response: { neverError: true, fullResponse: true, responseFormat: 'text' } } },
  },
  id: 'fetch-tools-registry', name: 'Fetch Tools Registry',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1120, 120],
};
const fetchBlogNode = {
  parameters: {
    method: 'GET', url: API,
    sendHeaders: true, headerParameters: { parameters: [uaHeader, { name: 'Accept', value: 'application/vnd.github+json' }] },
    options: { timeout: 30000, response: { response: { neverError: true, fullResponse: true } } },
  },
  id: 'fetch-blog-list', name: 'Fetch Blog List',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1320, 120],
};

const BUILD_CODE = [
  "// S-1b engine slug feed: build the EXACT valid internal-link targets for",
  "// Generate Draft. NO network here — reads the two fetch nodes and fail-softs to",
  "// empty lists on any gap (which makes the prompt omit the mesh + the Parse Draft",
  "// guard fail-open for that list).",
  "const tr = (() => { try { return $('Fetch Tools Registry').first().json; } catch (e) { return {}; } })();",
  "const toolsSrc = tr.body ?? tr.data ?? (typeof tr === 'string' ? tr : '');",
  "const br = (() => { try { return $('Fetch Blog List').first().json; } catch (e) { return {}; } })();",
  "const blogArr = Array.isArray(br.body) ? br.body : Array.isArray(br.data) ? br.data : Array.isArray(br) ? br : [];",
  "",
  "// Hub slugs from tools.ts (quote-agnostic; mirrors qa/registry.mjs).",
  "const hubSlugs = [...new Set([...String(toolsSrc).matchAll(/slug:\\s*['\"]([a-z0-9-]+)['\"]/g)].map((m) => m[1]))];",
  "",
  "// Recent post slugs: date-prefixed .mdx/.md filenames, newest first, cap 12.",
  "const files = blogArr.map((f) => f && f.name).filter(Boolean);",
  "const dated = files.filter((n) => /^\\d{4}-\\d{2}-\\d{2}-.+\\.mdx?$/.test(n)).sort().reverse().slice(0, 12);",
  "const postSlugs = dated.map((n) => n.replace(/\\.mdx?$/, ''));",
  "",
  "// Readable topic label from the slug (drop the date, title-case the rest) so the",
  "// model can judge relevance without fetching each file.",
  "const label = (slug) => slug.replace(/^\\d{4}-\\d{2}-\\d{2}-/, '').replace(/-/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());",
  "const recentPostsList = postSlugs.map((s) => `- ${s} (${label(s)})`).join('\\n');",
  "",
  "return [{ json: {",
  "  hubSlugs,",
  "  hubSlugsCsv: hubSlugs.join(', '),",
  "  postSlugs,",
  "  recentPostsList: recentPostsList || '(none available)',",
  "} }];",
].join('\n');

const buildNode = {
  parameters: { jsCode: BUILD_CODE },
  id: 'build-link-targets', name: 'Build Link Targets',
  type: 'n8n-nodes-base.code', typeVersion: 2, position: [1520, 120],
};

if (!node('Fetch Tools Registry')) { wf.nodes.push(fetchToolsNode); console.log('APPLIED: node Fetch Tools Registry'); applied++; } else { console.log('SKIP: node Fetch Tools Registry'); skipped++; }
if (!node('Fetch Blog List')) { wf.nodes.push(fetchBlogNode); console.log('APPLIED: node Fetch Blog List'); applied++; } else { console.log('SKIP: node Fetch Blog List'); skipped++; }
if (!node('Build Link Targets')) { wf.nodes.push(buildNode); console.log('APPLIED: node Build Link Targets'); applied++; } else { console.log('SKIP: node Build Link Targets'); skipped++; }

// ---- rewire: Mark Topic Generating -> [Fetch Tools -> Fetch Blog -> Build] -> Generate Draft ----
const C = wf.connections;
const mtg = C['Mark Topic Generating'].main[0];
if (mtg.some((c) => c.node === 'Generate Draft')) {
  C['Mark Topic Generating'].main[0] = mtg.filter((c) => c.node !== 'Generate Draft').concat([{ node: 'Fetch Tools Registry', type: 'main', index: 0 }]);
  C['Fetch Tools Registry'] = { main: [[{ node: 'Fetch Blog List', type: 'main', index: 0 }]] };
  C['Fetch Blog List'] = { main: [[{ node: 'Build Link Targets', type: 'main', index: 0 }]] };
  C['Build Link Targets'] = { main: [[{ node: 'Generate Draft', type: 'main', index: 0 }]] };
  console.log('APPLIED: rewired Mark Topic Generating -> fetch chain -> Generate Draft');
  applied++;
} else {
  console.log('SKIP: rewire (already routed through fetch chain)');
  skipped++;
}

// ---------------------------------------------------------------------------
// 2. Generate Draft: INTERNAL LINKS section (interpolates the fetched slug lists)
// ---------------------------------------------------------------------------
const gd = node('Generate Draft').parameters;
const GD_ANCHOR = 'AFFILIATE LINKS — on the FIRST mention of ANY SaaS tool';
const GD_TOKEN = 'INTERNAL LINKS (authority mesh';
const INTERNAL_SECTION =
  'INTERNAL LINKS (authority mesh, SEPARATE from the /go/ affiliate CTAs, and drawn ONLY from the exact lists below — an invented slug is a 404 the pipeline strips):\n' +
  '- TOOL HUBS: link 2 to 4 in-body mentions of tools this post genuinely covers to their hub as [Tool](/tools/<slug>/). Use a DIFFERENT occurrence than the /go/ link (first mention gets the /go/ CTA, a later mention can carry the /tools/ hub link). Valid hub slugs, use ONLY these: ${$(\'Build Link Targets\').first().json.hubSlugsCsv}\n' +
  '- RELATED POSTS: where a claim genuinely ties to one of our past articles, link 1 to 3 of them as [natural anchor phrase](/blog/<slug>/), and ONLY when truly relevant to that sentence. Valid post slugs (do not invent any):\n' +
  '${$(\'Build Link Targets\').first().json.recentPostsList}\n\n';
editStr('Generate Draft INTERNAL LINKS section', gd, 'body', GD_ANCHOR, GD_TOKEN, (src) =>
  src.replace(GD_ANCHOR, INTERNAL_SECTION + GD_ANCHOR));

// ---------------------------------------------------------------------------
// 3. Humanize: INTERNAL LINKS verify (preserve, never invent)
// ---------------------------------------------------------------------------
const hm = node('Humanize').parameters;
const HM_ANCHOR = 'If the first mention of any SaaS tool the post covers is missing its /go/<kebab-slug>/ link';
const HM_TOKEN = 'INTERNAL LINKS verify';
editStr('Humanize INTERNAL LINKS verify', hm, 'body', HM_ANCHOR, HM_TOKEN, (src) => {
  const line = src.split('\n').find((l) => l.includes(HM_ANCHOR));
  return src.replace(line, line +
    '\nINTERNAL LINKS verify: keep every [..](/tools/<slug>/) hub link and [..](/blog/<slug>/) related-post link intact; do NOT add new internal links or invent slugs (an invented /tools/ or /blog/ slug is a 404).');
});

// ---------------------------------------------------------------------------
// 4. Parse Draft: deterministic 404 guard (strip unknown /tools/ + /blog/ slugs)
// ---------------------------------------------------------------------------
const pd = node('Parse Draft').parameters;
const PD_ANCHOR = 'const markdown = sanitizeMdx(response.content[0].text.trim());';
const PD_TOKEN = 'function guardInternalLinks';
const GUARD_FN = [
  '// S-1b 404 guard: strip any /tools/ or /blog/ link whose slug is not in the',
  '// fetched valid set. Fail-OPEN per-list: if a fetch returned nothing, that list',
  "// is left untouched (the CI lint gate still backstops), so a GitHub hiccup can't",
  '// nuke every internal link.',
  'function guardInternalLinks(s) {',
  '  let lt = {};',
  "  try { lt = $('Build Link Targets').first().json || {}; } catch (e) { return s; }",
  '  const hubs = new Set(lt.hubSlugs || []);',
  '  const posts = new Set(lt.postSlugs || []);',
  '  let out = s;',
  '  if (hubs.size) out = out.replace(/\\[([^\\]]+)\\]\\(\\/tools\\/([a-z0-9-]+)\\/?\\)/g, (m, txt, slug) => (hubs.has(slug) ? `[${txt}](/tools/${slug}/)` : txt));',
  '  if (posts.size) out = out.replace(/\\[([^\\]]+)\\]\\(\\/blog\\/([a-z0-9-]+)\\/?\\)/g, (m, txt, slug) => (posts.has(slug) ? `[${txt}](/blog/${slug}/)` : txt));',
  '  return out;',
  '}',
  '',
].join('\n');
editStr('Parse Draft 404 guard', pd, 'jsCode', PD_ANCHOR, PD_TOKEN, (src) =>
  src.replace(PD_ANCHOR, GUARD_FN + 'const markdown = guardInternalLinks(sanitizeMdx(response.content[0].text.trim()));'));

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n');
console.log(`\nDone: ${applied} applied, ${skipped} skipped. Wrote ${FILE}`);
console.log('Next: node --env-file=../restaurant-outreach/.env n8n/deploy-engine.mjs --apply');
