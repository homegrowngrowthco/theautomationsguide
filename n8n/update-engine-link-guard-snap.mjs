// Idempotent engine updater: the Parse Draft internal-link guard snaps or strips ANY /blog/ href,
// checked against the FULL post list (op #1309).
//
// Why: PR #387 shipped [..](/blog/2026-10-05-woodpecker-vs-instantly-best- ) because
//   1. backlog/signals.mjs clips the near-win sibling slug to 40 chars in the topic Notes, and the
//      model copied that fragment (the real post was not in its 12-newest slug list), and
//   2. the old guard only matched [..](/blog/<[a-z0-9-]+>/?) with nothing before ")", so a href
//      with a trailing space slipped past it untouched, straight into the lint-content HARD fail.
// The old guard also checked against Build Link Targets.postSlugs, which is only the 12 newest
// posts, so a CORRECT link to any older post was silently unlinked.
//
// New guard (Parse Draft, a Code node, so no n8n expression tokenizer concerns):
//   - matches every markdown link whose href starts with /blog/ (spaces, no slash, #anchor ok),
//   - exact existing slug -> canonical /blog/<slug>/ ; else exactly ONE existing slug starting
//     with the fragment (fragment >= 20 chars) -> that slug ; else unlink (anchor text kept),
//   - checks against every .md/.mdx name in Fetch Blog List (the whole src/content/blog dir),
//   - fail-open: an empty Fetch Blog List leaves /blog/ links alone (CI lint-content backstops),
//   - logs every snap/normalise/strip in the Parse Draft output field `linkGuard`.
// The /tools/ hub guard and the 12-newest list given to the model are unchanged.
//
// Usage (from repo root):
//   node n8n/update-engine-link-guard-snap.mjs --selftest                                    # fixtures, no key
//   node --env-file=../growth-engine/.env n8n/update-engine-link-guard-snap.mjs              # dry run (GET only)
//   node --env-file=../growth-engine/.env n8n/update-engine-link-guard-snap.mjs --apply      # backup, PUT, verify, sync JSON
// Re-running is a no-op. Revert: node --env-file=../growth-engine/.env n8n/live-patch.mjs --restore <backup> --apply

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const ID = 'sjZADhZGIuz9tZHK';
const FILE = 'n8n/blog-post-engine.json';
const NODE = 'Parse Draft';
const SENTINEL = 'LINK-GUARD-SNAP';

// ---- the code that goes into the node. Both functions are inserted via toString(), so the
// selftest exercises exactly the source that ships. guardInternalLinks reads n8n's $ and the
// node-level linkGuardLog; it is never called in this script outside the selftest sandbox.

function snapBlogLinks(s, slugs, log) {
  const all = Array.from(new Set(slugs));
  const known = new Set(all);
  const MIN_PREFIX = 20; // shorter fragments are too generic to snap safely
  return s.replace(/(?<!!)\[([^\]\n]+)\]\(\s*\/blog\/([^)\n]*?)\s*\)/g, (m, txt, raw) => {
    const cut = raw.search(/[#?]/);
    const suffix = cut >= 0 ? raw.slice(cut).trim() : '';
    const frag = (cut >= 0 ? raw.slice(0, cut) : raw).trim().replace(/\/+$/, '').trim();
    if (!frag) return m; // the /blog/ index itself
    let slug = '';
    let action = 'strip-unknown';
    if (known.has(frag)) { slug = frag; action = 'normalize'; }
    else if (frag.length >= MIN_PREFIX && /^[a-z0-9-]+$/.test(frag)) {
      const hits = all.filter((x) => x.startsWith(frag));
      if (hits.length === 1) { slug = hits[0]; action = 'snap'; }
      else if (hits.length > 1) action = 'strip-ambiguous';
    }
    if (slug) {
      const fixed = '[' + txt + '](/blog/' + slug + '/' + suffix + ')';
      if (fixed !== m) log.push({ action, from: raw, to: slug });
      return fixed;
    }
    log.push({ action, from: raw, anchor: txt });
    return txt;
  });
}

function guardInternalLinks(s) {
  let lt = {};
  try { lt = $('Build Link Targets').first().json || {}; } catch (e) { lt = {}; }
  const hubs = new Set(lt.hubSlugs || []);
  let out = s;
  if (hubs.size) out = out.replace(/\[([^\]]+)\]\(\/tools\/([a-z0-9-]+)\/?\)/g, (m, txt, slug) => (hubs.has(slug) ? `[${txt}](/tools/${slug}/)` : txt));
  let br = {};
  try { br = $('Fetch Blog List').first().json || {}; } catch (e) { br = {}; }
  const files = Array.isArray(br.body) ? br.body : Array.isArray(br.data) ? br.data : [];
  const allPosts = files.map((f) => f && f.name).filter((n) => typeof n === 'string' && /\.mdx?$/.test(n)).map((n) => n.replace(/\.mdx?$/, ''));
  if (allPosts.length) out = snapBlogLinks(out, allPosts, linkGuardLog);
  else linkGuardLog.push({ action: 'skipped', reason: 'Fetch Blog List returned no posts; /blog/ links left for the CI lint gate' });
  if (linkGuardLog.length) console.log('link guard: ' + JSON.stringify(linkGuardLog));
  return out;
}

const OLD_GUARD = [
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

const NEW_GUARD = [
  '// S-1b 404 guard. /tools/: strip any hub link whose slug is not in the fetched hub set.',
  '// /blog/ (' + SENTINEL + ', op #1309): EVERY markdown link whose href starts with /blog/ is',
  '// checked against the FULL post list from Fetch Blog List (not the 12-newest prompt list):',
  '// exact slug -> canonical /blog/<slug>/ ; exactly one slug starting with a >=20-char fragment',
  '// -> that slug (PR #387: a clipped "/blog/2026-10-05-woodpecker-vs-instantly-best- ") ;',
  '// otherwise unlinked, anchor text kept. Every change is logged in the output field linkGuard.',
  "// Fail-OPEN per list: an empty fetch leaves that list untouched (the CI lint gate backstops).",
  'const linkGuardLog = [];',
  snapBlogLinks.toString(),
  '',
  guardInternalLinks.toString(),
  '',
].join('\n').replace(/\r\n/g, '\n'); // a CRLF checkout (Windows autocrlf) must not leak \r into the node code

const OLD_RET = '  pubDate: today,\n}}];';
const NEW_RET = '  pubDate: today,\n  linkGuard: linkGuardLog,\n}}];';

function edit(wf) {
  const node = wf.nodes.find((n) => n.name === NODE);
  if (!node || typeof node.parameters?.jsCode !== 'string') throw new Error(`node "${NODE}".jsCode not found`);
  let code = node.parameters.jsCode;
  if (code.includes(SENTINEL)) return []; // already patched
  for (const [label, from] of [['guard block', OLD_GUARD], ['return block', OLD_RET]]) {
    if (code.split(from).length !== 2) throw new Error(`"${NODE}": ${label} anchor not found exactly once; live code drifted from what this patch expects`);
  }
  const before = code.length;
  code = code.replace(OLD_GUARD, () => NEW_GUARD).replace(OLD_RET, () => NEW_RET);
  new Function('$input', '$', 'Buffer', 'console', code); // must at least compile
  node.parameters.jsCode = code;
  return [`${NODE}.jsCode: guard block + return block replaced (${before} -> ${code.length} chars)`];
}

// ---- --selftest: run the PATCHED Parse Draft node code (from the committed JSON) in a sandbox
// with stub $input / $(...) data. No network, no key.
if (process.argv.includes('--selftest')) {
  const wf = JSON.parse(readFileSync(FILE, 'utf8'));
  const changes = edit(wf);
  const code = wf.nodes.find((n) => n.name === NODE).parameters.jsCode;
  const SLUGS = [
    '2026-10-05-woodpecker-vs-instantly-best-cold-email-for-small-teams',
    '2026-06-25-nutshell-vs-pipedrive-vs-close-best-affordable-sales-crm',
    '2026-10-09-best-cold-email-stack-under-300-in-2026',
    '2026-10-13-connect-salesflare-to-hubspot-with-n8n-auto-sync-contacts',
    '2026-10-13-connect-salesflare-to-pipedrive-fixture',
    'zapier-vs-make-for-gtm-teams',
  ];
  const run = (body, { posts = SLUGS, hubs = ['instantly', 'woodpecker'] } = {}) => {
    const text = [
      '---', 'title: "Selftest Post"', '---', '',
      "import SideBySide from '@/components/post/SideBySide.astro'", '', body, '',
    ].join('\n');
    const data = {
      'Parse Topic': { blogTopic: 'Selftest' },
      'Build Link Targets': { hubSlugs: hubs, postSlugs: [SLUGS[2]] }, // 12-newest list: deliberately NOT the guard's source
      'Fetch Blog List': { statusCode: 200, body: posts.map((p) => ({ name: p + '.mdx', type: 'file' })) },
    };
    const $ = (n) => ({ first: () => ({ json: data[n] }) });
    const $input = { first: () => ({ json: { content: [{ type: 'text', text }], stop_reason: 'end_turn' } }) };
    const out = new Function('$input', '$', 'Buffer', 'console', code)($input, $, Buffer, { log() {} })[0].json;
    return { md: out.markdown.split('\n').slice(6).join('\n').trim(), log: out.linkGuard };
  };
  const W = '2026-10-05-woodpecker-vs-instantly-best-cold-email-for-small-teams';
  const N = '2026-06-25-nutshell-vs-pipedrive-vs-close-best-affordable-sales-crm';
  const c387 = run('the [Woodpecker vs Instantly comparison](/blog/2026-10-05-woodpecker-vs-instantly-best- ) covers it.');
  const cNut = run('see [the CRM shootout](/blog/2026-06-25-nutshell-vs-pipedrive-vs-clos).');
  const cExact = run('older post [Zapier vs Make](/blog/zapier-vs-make-for-gtm-teams) still links.');
  const cAmb = run('an [ambiguous one](/blog/2026-10-13-connect-salesflare-to-) here.');
  const cNone = run('a [made-up post](/blog/2026-01-01-this-post-does-not-exist/) here.');
  const cShort = run('a [short prefix](/blog/2026-10-05-wood) here.');
  const okLine = `a [valid link](/blog/${W}/) and an [anchored one](/blog/${N}/#pricing) stay.`;
  const cValid = run(okLine);
  const goLine = 'try [Instantly](/go/instantly/) and see [Woodpecker](/tools/woodpecker/), [the blog](/blog/).';
  const cGo = run(goLine);
  const cHub = run('a [bad hub](/tools/not-a-hub/) is stripped.');
  const cFailOpen = run('the [clipped](/blog/2026-10-05-woodpecker-vs-instantly-best- ) link.', { posts: [] });
  const again = edit(wf);
  let real = { md: '(src/content/blog not found)' };
  if (existsSync('src/content/blog')) {
    const repoPosts = readdirSync('src/content/blog').filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, ''));
    real = run('the [Woodpecker vs Instantly comparison](/blog/2026-10-05-woodpecker-vs-instantly-best- ) covers it.', { posts: repoPosts });
  }
  const checks = [
    ['patch applies to the committed JSON, or it is already patched', changes.length === 1 || (changes.length === 0 && wf.nodes.find((n) => n.name === NODE).parameters.jsCode.includes(SENTINEL))],
    ['#387 clipped href with trailing space snaps to the full slug', c387.md === `the [Woodpecker vs Instantly comparison](/blog/${W}/) covers it.` && c387.log[0]?.action === 'snap'],
    ['#387 case snaps against the real src/content/blog list too', real.md === `the [Woodpecker vs Instantly comparison](/blog/${W}/) covers it.`],
    ['40-char nutshell fragment snaps', cNut.md === `see [the CRM shootout](/blog/${N}/).`],
    ['exact slug without trailing slash gets the slash (older-than-12 post kept)', cExact.md === 'older post [Zapier vs Make](/blog/zapier-vs-make-for-gtm-teams/) still links.' && cExact.log[0]?.action === 'normalize'],
    ['ambiguous prefix is unlinked', cAmb.md === 'an ambiguous one here.' && cAmb.log[0]?.action === 'strip-ambiguous'],
    ['nonexistent slug is unlinked', cNone.md === 'a made-up post here.' && cNone.log[0]?.action === 'strip-unknown'],
    ['fragment under 20 chars is not snapped', cShort.md === 'a short prefix here.'],
    ['valid canonical links (incl. #anchor) untouched, nothing logged', cValid.md === okLine && cValid.log.length === 0],
    ['/go/, known /tools/ and the /blog/ index untouched', cGo.md === goLine && cGo.log.length === 0],
    ['unknown /tools/ hub still stripped', cHub.md === 'a bad hub is stripped.'],
    ['empty Fetch Blog List fails open (link untouched, skip logged)', cFailOpen.md.includes('(/blog/2026-10-05-woodpecker-vs-instantly-best- )') && cFailOpen.log[0]?.action === 'skipped'],
    ['re-running the patch is a no-op', again.length === 0],
  ];
  for (const [n, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`);
  if (checks.some(([, ok]) => !ok)) {
    for (const [k, v] of Object.entries({ c387, real, cNut, cExact, cAmb, cNone, cShort, cValid, cGo, cHub, cFailOpen })) console.log(k, JSON.stringify(v));
    process.exit(1);
  }
  process.exit(0);
}

const { patchLive } = await import('./live-patch.mjs');
const APPLY = process.argv.includes('--apply');
const { live, next, verified } = await patchLive(ID, edit, { apply: APPLY });
if (next) {
  const a = live.nodes.find((n) => n.name === NODE).parameters.jsCode;
  const b = next.nodes.find((n) => n.name === NODE).parameters.jsCode;
  console.log(`  ${NODE}.jsCode ${a.length} -> ${b.length} chars; live node count ${live.nodes.length}, active ${live.active}`);
  if (!APPLY) {
    console.log('  --- removed ---\n' + OLD_GUARD.replace(/^/gm, '  - '));
    console.log('  --- added ---\n' + NEW_GUARD.replace(/^/gm, '  + '));
    console.log('  --- return ---\n  + linkGuard: linkGuardLog,');
  }
}
const target = verified || next || live;

// Sync the committed JSON: swap the Parse Draft jsCode JSON-string literal so the rest of the
// file's formatting is untouched. Written only on --apply (or when live is already patched).
let text = readFileSync(FILE, 'utf8');
const local = JSON.parse(text);
const from = local.nodes.find((n) => n.name === NODE).parameters.jsCode;
const to = target.nodes.find((n) => n.name === NODE).parameters.jsCode;
if (from !== to) {
  const lit = JSON.stringify(from);
  if (text.split(lit).length !== 2) throw new Error(`${FILE}: could not locate "${NODE}".jsCode literal exactly once`);
  text = text.replace(lit, () => JSON.stringify(to));
  local.nodes.find((n) => n.name === NODE).parameters.jsCode = to;
  if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(local)) throw new Error(`${FILE}: text swap did not produce the intended object`);
  if (APPLY || !next) writeFileSync(FILE, text);
}
console.log(`  local ${FILE}: ${from !== to ? `${APPLY || !next ? 'synced' : 'would sync'} ${NODE}.jsCode` : 'already in sync'}`);
