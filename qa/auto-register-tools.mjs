// qa/auto-register-tools.mjs
//
// Pre-lint step: auto-registers tools a post references but that aren't yet in
// the registries, so a content PR doesn't hard-fail the affiliateSlug gate (a
// /go/<slug> with no affiliate-links.ts entry 404s at build) or render logo-less.
//
// For each unknown tool it:
//   1. Resolves the homepage by probing common TLDs and VERIFYING the page
//      identifies as that tool (the normalized name appears in <title> /
//      og:site_name / og:title, or in the resolved host). Wrong-domain guesses
//      are rejected — we never register a /go/ target we couldn't confirm.
//   2. Sources a logo from the site's own icons (apple-touch-icon -> rel=icon ->
//      og:image) with a Google-favicon fallback, saved to public/brand/tools/.
//   3. Appends a `pending` affiliate-links.ts entry (homepage fallback) and a
//      tools.ts entry (listed:false) — or just back-fills a logo on an existing
//      tools.ts entry.
//
// Anything it CANNOT confidently resolve is left untouched, so the deterministic
// lint gate still catches it for manual review. No external API keys; Node fetch.
//
// Usage:
//   node qa/auto-register-tools.mjs --post <path/to/post.mdx>   # one post
//   node qa/auto-register-tools.mjs --changed                   # git-changed posts vs origin/master
//   node qa/auto-register-tools.mjs --post <p> --dry-run        # report only, no writes
//   node qa/auto-register-tools.mjs --post <p> --url-hint slug=https://...  # skip TLD probe for slug

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const AFF_PATH = path.join(ROOT, 'src/data/affiliate-links.ts');
const TOOLS_PATH = path.join(ROOT, 'src/data/tools.ts');
const LOGO_DIR = path.join(ROOT, 'public/brand/tools');

const TLDS = ['com', 'io', 'ai', 'co', 'app', 'so', 'dev'];
// Markers of parked / for-sale / marketplace landing pages (Atom, Dan, Sedo,
// GoDaddy, Afternic…). Matched against title + og:title + description.
// A broker's title often puts the DOMAIN where the word "domain" would go
// ("Surfer.app is for sale") — the first alternative covers that form, which a
// `domain (?:is )?for sale`-only pattern missed.
const PARKED_RE = /\b(?:(?:domain|[a-z0-9-]+\.[a-z]{2,}) (?:is |may be )?for sale|buy this domain|purchase this domain|own (?:this domain|[a-z0-9.-]+ today)|make an offer|domain broker|guided transfer|premium domain|parked (?:free|domain)|this domain is available)\b/i;
const UA = 'Mozilla/5.0 (compatible; AutomationsGuideBot/1.0; +https://theautomationsguide.com)';
const FETCH_TIMEOUT = 9000;

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');

// --url-hint slug=url (repeatable): human-confirmed URL for a slug the TLD probe
// can't resolve (e.g. customer.io uses a dotted domain, not customerio.com).
// Populated by the handle-tool-reply.yml workflow from PR comment replies.
const urlHints = new Map();
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url-hint' && args[i + 1]) {
    const eq = args[i + 1].indexOf('=');
    if (eq > 0) {
      // Strip trailing markdown/quote wrappers (backtick, quotes, angle
      // brackets, closing paren/bracket) that survive a copy-paste of a
      // backtick-wrapped reply. Defense-in-depth: the reply-handler workflow
      // already excludes these from its capture, but a dirty URL reaching
      // here would fail the fetch and register nothing.
      const url = args[i + 1].slice(eq + 1).replace(/[`'"<>)\]]+$/, '');
      urlHints.set(args[i + 1].slice(0, eq), url);
    }
    i++;
  }
}

// ---------- helpers ----------

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const decodeEntities = (s) => (s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;|&#0*39;|&#x0*27;/gi, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
const titleCase = (slug) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    if (!res.ok) return null;
    return { html: await res.text(), finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuffer(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    if (!res.ok) return null;
    return { buf: Buffer.from(await res.arrayBuffer()), ctype: res.headers.get('content-type') || '', finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---------- parse a post for tool references ----------

function parsePost(text) {
  const slugName = new Map(); // slug -> display name (best-effort)

  // component-object form:  name: "JustCall" ... affiliateSlug: "justcall"
  for (const m of text.matchAll(/name:\s*["']([^"']+)["'][\s\S]{0,600}?affiliateSlug:\s*["']([a-z0-9-]+)["']/g)) {
    slugName.set(m[2], m[1]);
  }
  // attr form:  pick="KrispCall" ... affiliateSlug="krispcall"  (either order)
  for (const m of text.matchAll(/pick=["']([^"']+)["'][\s\S]{0,200}?affiliateSlug=["']([a-z0-9-]+)["']/g)) {
    if (!slugName.has(m[2])) slugName.set(m[2], m[1]);
  }
  for (const m of text.matchAll(/affiliateSlug=["']([a-z0-9-]+)["'][\s\S]{0,200}?pick=["']([^"']+)["']/g)) {
    if (!slugName.has(m[1])) slugName.set(m[1], m[2]);
  }
  // any remaining affiliateSlug with no paired name -> title-case the slug
  for (const m of text.matchAll(/affiliateSlug\s*[:=]\s*["']([a-z0-9-]+)["']/g)) {
    if (!slugName.has(m[1])) slugName.set(m[1], titleCase(m[1]));
  }
  // markdown-link form:  [Aloware](/go/aloware/) — an inline body mention that
  // never appears as a component affiliateSlug prop. The lint gate checks EVERY
  // /go/<slug> in the body, so discovery must cover the same scope or an
  // inline-linked tool skips registration and hard-fails the PR (PR #191).
  for (const m of text.matchAll(/\[([^\]]+)\]\(\/go\/([a-z0-9-]+)\/?\)/g)) {
    if (!slugName.has(m[2])) slugName.set(m[2], m[1]);
  }
  // any bare /go/<slug> left (no markdown link text) -> title-case the slug
  for (const m of text.matchAll(/\/go\/([a-z0-9-]+)/g)) {
    if (!slugName.has(m[1])) slugName.set(m[1], titleCase(m[1]));
  }
  return slugName;
}

// ---------- existing registries ----------

function existingAffiliateKeys(src) {
  const keys = new Set();
  for (const m of src.matchAll(/^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{/gm)) keys.add(m[1]); // quote-agnostic, mirrors lint-content
  return keys;
}

// slug -> the homepage affiliate-links.ts ALREADY records for it. A tool can be
// half-registered (affiliate entry present, logo missing), and then this is a
// known-good answer the TLD probe must not try to re-derive: `surfer` carried
// homepageFallback surferseo.com and the probe still "resolved" it to a domain
// broker. Only homepageFallback — a live `url` is a tracking link, not a site.
function registryHomepages(src) {
  const map = new Map();
  const keys = [...src.matchAll(/^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{/gm)];
  keys.forEach((m, i) => {
    const body = src.slice(m.index, i + 1 < keys.length ? keys[i + 1].index : src.length);
    const hp = (body.match(/homepageFallback:\s*['"]([^'"]+)['"]/) || [])[1];
    if (hp) map.set(m[1], hp);
  });
  return map;
}

function existingToolSlugs(src) {
  const map = new Map(); // slug -> { hasLogo, category }
  for (const m of src.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)) map.set(m[1], { hasLogo: false, category: '' });
  for (const block of src.split(/\r?\n  \{\r?\n/)) { // CRLF-tolerant block split
    const slug = (block.match(/slug:\s*['"]([a-z0-9-]+)['"]/) || [])[1];
    if (!slug) continue;
    map.set(slug, {
      hasLogo: /logo:\s*['"]/.test(block),
      category: (block.match(/category:\s*['"]([^'"]+)['"]/) || [])[1] || '',
    });
  }
  return map;
}

// ---------- resolve homepage ----------

// Page identity, read from the WHOLE document. Neither a fixed byte slice nor
// the <head> is a safe bound: frase.io closes </head> at byte ~4k but emits its
// real <title> at byte ~172k (client-rendered page), so both windows read an
// EMPTY identity, failed the identity check, and rejected the tool's own
// homepage. Collect every <title> (a page can carry several — inline SVGs have
// them) and let the caller pick the one that names the tool.
function metaOf(html) {
  const doc = html.length > 400000 ? html.slice(0, 400000) : html;
  const meta = (re) => (doc.match(re) || [])[1] || '';
  return {
    titles: [...doc.matchAll(/<title[^>]*>([^<]+)<\/title>/gi)].map((m) => m[1].trim()),
    ogSite: meta(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i),
    ogTitle: meta(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
    ogDesc: meta(/<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
    generator: meta(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i),
    hasOgImage: /<meta[^>]+property=["']og:image["']/i.test(doc),
    hasAppleIcon: /rel=["'][^"']*apple-touch-icon/i.test(doc),
  };
}

// Fetch a homepage we already TRUST (human-supplied or registry-recorded) and
// shape it like a probe candidate. No identity/parked checks: the URL is given,
// not guessed. We still fetch it for the og:description + html the blurb and
// logo steps need downstream.
async function fromKnownUrl(url) {
  const r = await fetchText(url);
  if (!r) return null;
  const u = new URL(r.finalUrl);
  return { score: 1000, homepage: `${u.protocol}//${u.host}/`, host: u.host, html: r.html, blurb: metaOf(r.html).ogDesc.trim() };
}

// Probe every candidate domain, keep the ones whose PAGE IDENTITY (not just the
// host string) names the tool, then score by how strongly the page looks like
// the real product homepage. This is what stops `justcall.com` ("Just Call", an
// unrelated site) from beating the real `justcall.io`.
async function resolveHomepage(name, slug, registryHomepage) {
  // Human-confirmed URL from a PR comment reply — skip the TLD probe entirely.
  if (urlHints.has(slug)) {
    const hintUrl = urlHints.get(slug);
    const known = await fromKnownUrl(hintUrl);
    if (known) return known;
    console.error(`[auto-register] url-hint provided for ${slug} but fetch failed: ${hintUrl}`);
    return null;
  }
  // Already half-registered: affiliate-links.ts knows this tool's homepage (we
  // are here only to source its missing logo). Trust it over a fresh guess.
  if (registryHomepage) {
    const known = await fromKnownUrl(registryHomepage);
    if (known) return known;
    console.error(`[auto-register] registry homepage for ${slug} failed to fetch, falling back to probe: ${registryHomepage}`);
  }
  const bases = [...new Set([slug.replace(/-/g, ''), norm(name)])].filter(Boolean);
  // Dotted-domain reading of the slug: a brand whose name bakes in a TLD
  // ("Factors.ai", "Customer.io", "Reply.io") slugs to "factors-ai" /
  // "customer-io", whose de-hyphenated base ("factorsai") only ever probes
  // factorsai.<tld> and NEVER the real factors.ai. Read the trailing
  // "-ai"/"-io"/"-co" as the TLD to recover the real host + the bare-brand
  // identity stem ("factors"), so these resolve without a human URL hint.
  const segs = slug.split('-');
  const dotted = segs.length >= 2 && TLDS.includes(segs[segs.length - 1])
    ? { host: `${segs.slice(0, -1).join('')}.${segs[segs.length - 1]}`, stem: norm(segs.slice(0, -1).join('')) }
    : null;
  // Identity targets: match the page against the CLEAN slug as well as the name.
  // Brand names that bake in a TLD ("Otter.ai", "Reply.io") normalize to
  // "otterai"/"replyio", but the site's <title> usually says the bare brand
  // ("Otter Meeting Agent…"), so a name-only check fails. The slug ("otter") is
  // the canonical clean identifier and matches. For a dotted-domain slug the
  // bare stem ("factors") is added too, since the site titles itself "Factors".
  const targets = [...new Set([norm(slug.replace(/-/g, '')), norm(name), dotted?.stem].filter((t) => t && t.length >= 2))];
  const matchesIdentity = (ident) => targets.some((t) => ident.includes(t));
  // Every base × common TLD, plus the dotted-domain host if the slug implies one.
  const hosts = new Set();
  for (const base of bases) for (const tld of TLDS) hosts.add(`${base}.${tld}`);
  if (dotted) hosts.add(dotted.host);
  const candidates = [];
  for (const host of hosts) {
      const r = await fetchText(`https://${host}/`);
      if (!r) continue;
      const u = new URL(r.finalUrl);
      // A parked domain redirects to the BROKER's own host (surfer.app lands on
      // www.fortune.domains). Whatever the landing page's copy claims, a host
      // carrying none of the brand's identity stems is not this tool's homepage.
      // Real redirects keep the brand (surfer.ai -> surferseo.com).
      if (!matchesIdentity(norm(u.host))) continue;
      const { titles, ogSite, ogTitle, ogDesc, generator, hasOgImage, hasAppleIcon } = metaOf(r.html);
      const ident = norm(`${titles.join(' ')} ${ogSite} ${ogTitle}`);
      if (!matchesIdentity(ident)) continue; // identity must name the tool — host match alone is not enough
      // The document can carry several <title>s; score against the one that
      // actually names the tool, not whichever came first.
      const title = titles.find((t) => matchesIdentity(norm(t))) || titles[0] || '';
      // Parked/for-sale pages pass the identity check trivially (their title IS
      // the domain, e.g. "artisan.so") and can outscore the real product site.
      if (PARKED_RE.test(`${titles.join(' ')} ${ogTitle} ${ogDesc}`)) continue;
      // Site-builder placeholder pages carry no for-sale copy, so PARKED_RE
      // misses them: calendly.ai served a stock GoDaddy Website Builder page
      // titled just "calendly.ai" and outscored the real calendly.com (a
      // bare-domain title startsWith the brand, earning the +100 bonus).
      if (/godaddy|go ?daddy|starfield|sedo|parking|parked/i.test(generator)) continue;
      // A title that is just the raw domain, on a page with no social card, is a
      // placeholder. (Real homepages that title themselves "Brand.ai" ship one.)
      if (norm(title) === norm(host) && !hasOgImage) continue;
      // Same shape, bare-brand variant: an app-login shell titles itself with
      // JUST the brand and ships no social card and no description. aloware.io
      // (the login SPA) outscored the real aloware.com this way on PR #191 —
      // the bare-brand title earns the +100 startsWith bonus while the
      // marketing homepage's descriptive title doesn't name the brand at all.
      if (targets.some((t) => norm(title) === t) && !hasOgImage && !ogDesc) continue;

      let score = 0;
      if (targets.some((t) => norm(title).startsWith(t)) || targets.some((t) => norm(ogSite) === t)) score += 100;
      else score += 50;
      if (hasOgImage) score += 20; // real product sites ship social cards
      if (hasAppleIcon) score += 20;
      if (ogDesc) score += 10;
      if (title.length > 25) score += 10;                                 // descriptive, not a parked "Just Call"
      score += Math.max(0, 6 - TLDS.indexOf(host.split('.').pop()));      // gentle TLD tiebreak only
      candidates.push({ score, homepage: `${u.protocol}//${u.host}/`, host: u.host, html: r.html, blurb: ogDesc.trim() });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ---------- source a logo ----------

const EXT_BY_CTYPE = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

function pickIcon(html, baseUrl) {
  const candidates = [];
  for (const tag of [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0])) {
    const rel = ((tag.match(/rel=["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1] || '';
    if (!href) continue;
    const px = parseInt(((tag.match(/sizes=["']([^"']+)["']/i) || [])[1] || '').match(/(\d+)x\d+/)?.[1] || '0', 10);
    let score = 0;
    // NEVER a mask-icon (Safari pinned tab): the spec makes it a single flat
    // colour, so the file is a black silhouette, never the brand mark. It used
    // to score 60 +50-for-svg = 110 and beat a sizeless apple-touch-icon (100),
    // which is how `surfer` got a black blob for a logo.
    if (rel.includes('mask-icon')) continue;
    if (rel.includes('apple-touch-icon')) score = 100 + px;
    else if (rel === 'icon' || rel.includes('shortcut icon')) score = 40 + px;
    else continue;
    if (/\.svg(\?|$)/i.test(href)) score += 50;
    try { candidates.push({ url: new URL(href, baseUrl).toString(), score }); } catch { /* skip */ }
  }
  const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1];
  if (og) { try { candidates.push({ url: new URL(og, baseUrl).toString(), score: 10 }); } catch { /* skip */ } }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.map((c) => c.url);
}

// Validate (and if needed fix) a sourced raster logo BEFORE it is committed.
// The lint-logos CI gate hard-fails any raster logo whose 4 corners are all
// opaque (a baked-in background renders as a box on the cream cards), and a
// dark webclip whose background is knocked out can leave a near-invisible pale
// mark (the mailreach trap). Sourcing icons without either check just ships a
// red PR (chili-piper.png, PR #174) or an invisible/wrong mark. Returns
// { buf, ext } (ext 'png' after a knockout) or null to reject this candidate.
async function validateRasterLogo(buf) {
  let sharp;
  try { sharp = (await import('sharp')).default; } catch { return null; } // can't validate -> don't ship it
  let data, info;
  try { ({ data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })); } catch { return null; }
  // Reject OpenGraph social banners. pickIcon falls back to og:image when a site
  // exposes no usable favicon, and an og:image is a 1200x630 captioned banner —
  // it can pass every transparency/luminance test and still render as a
  // stretched screenshot on a tool card (measured 2026-08-20: voiceos + runable
  // both served 1200x630, 489KB in runable's case). Big AND wide = not a mark.
  if (info.width >= 600 && info.width / info.height > 1.5) return null;
  const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const corners = [px(0, 0), px(info.width - 1, 0), px(0, info.height - 1), px(info.width - 1, info.height - 1)];
  if (corners.some((c) => c[3] < 8)) return { buf, ext: null }; // transparent corners -> passes the gate as-is
  // All 4 corners opaque: knock out the background (keyed on the corner color).
  const bg = corners[0];
  const out = Buffer.from(data);
  let kept = 0;
  let lumSum = 0;
  for (let i = 0; i < out.length; i += 4) {
    const d = Math.hypot(out[i] - bg[0], out[i + 1] - bg[1], out[i + 2] - bg[2]);
    if (d < 40) out[i + 3] = 0;
    else { kept++; lumSum += 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2]; }
  }
  if (kept < info.width * info.height * 0.02) return null; // nothing meaningful survived the knockout
  if (lumSum / kept > 215) return null; // near-white mark: invisible on the cream cards
  const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return { buf: png, ext: 'png' };
}

async function sourceLogo(slug, html, homepage, host) {
  const urls = pickIcon(html, homepage);
  urls.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`); // deterministic fallback
  for (const url of urls) {
    const r = await fetchBuffer(url);
    if (!r || r.buf.length < 100) continue;
    let ext = EXT_BY_CTYPE[r.ctype.split(';')[0].trim()];
    if (!ext) {
      const m = url.match(/\.(svg|png|jpe?g|webp)(\?|$)/i);
      ext = m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
    }
    let buf = r.buf;
    if (ext !== 'svg') {
      // Raster: must pass the same corner-transparency bar as the lint-logos
      // gate, or get a background knockout here. An unvalidatable candidate is
      // skipped (the next icon URL may pass); a tool can always ship logo-less
      // (WARN, not HARD) and a human drops a better mark in later.
      const v = await validateRasterLogo(buf);
      if (!v) continue;
      buf = v.buf;
      if (v.ext) ext = v.ext;
    }
    const rel = `/brand/tools/${slug}.${ext}`;
    if (!DRY) {
      mkdirSync(LOGO_DIR, { recursive: true });
      writeFileSync(path.join(LOGO_DIR, `${slug}.${ext}`), buf);
    }
    return { rel, bytes: buf.length, from: url };
  }
  return null;
}

// ---------- mutate registries ----------

const eolOf = (src) => (src.includes('\r\n') ? '\r\n' : '\n');

function insertAffiliate(src, slug, name, homepage) {
  const EOL = eolOf(src);
  // Slugs like `11x` aren't valid bare identifiers — emit them quoted or the
  // registry stops compiling (the lint parse is quote-agnostic either way).
  const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(slug) ? slug : `'${slug}'`;
  const entry =
`  ${key}: {
    name: '${name.replace(/'/g, "\\'")}',
    url: '',
    homepageFallback: '${homepage}',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },`.replace(/\n/g, EOL);
  // object close that precedes resolveDestination(); CRLF-tolerant
  const m = /\r?\n\};\r?\n\r?\n\/\*\*/.exec(src);
  if (!m) throw new Error('affiliate-links.ts: could not find object close marker');
  return src.slice(0, m.index) + EOL + entry + src.slice(m.index);
}

function addLogoToTool(src, slug, logoRel) {
  // Defensive: never add a second logo: to a tool that already has one,
  // even if hasLogo detection were wrong (would corrupt the entry).
  const blockRe = new RegExp(`slug:\\s*['"]${slug}['"][\\s\\S]{0,1200}?\\r?\\n  \\}`);
  const block = (src.match(blockRe) || [])[0] || '';
  if (/logo:\s*['"]/.test(block)) return null;
  const re = new RegExp(`(\\r?\\n( *)slug:\\s*['"]${slug}['"],)`);
  const m = src.match(re);
  if (!m) return null;
  const EOL = eolOf(src);
  return src.replace(re, `$1${EOL}${m[2]}logo: '${logoRel}',`);
}

function appendTool(src, { slug, name, category, blurb, ctaLabel, logoRel }) {
  const EOL = eolOf(src);
  const safeName = name.replace(/'/g, "\\'");
  const safeBlurb = decodeEntities(blurb || `${name} is featured in a comparison on The Automations Guide.`)
    .replace(/\s+/g, ' ').trim().replace(/'/g, "\\'").slice(0, 280);
  const entry =
`  {
    slug: '${slug}',
    name: '${safeName}',
    category: '${category}',
    badge: 'Paid',
    ctaLabel: '${ctaLabel.replace(/'/g, "\\'")}',
    ctaPrimary: false,
    listed: false,${logoRel ? `\n    logo: '${logoRel}',` : ''}
    aliases: ['${safeName}'],
    blurb:
      '${safeBlurb}',
  },`.replace(/\n/g, EOL);
  const start = src.indexOf('export const tools');
  const m = /\r?\n\];/.exec(src.slice(start)); // array close that ends `export const tools`
  if (!m) throw new Error('tools.ts: could not find array close');
  const close = start + m.index;
  return src.slice(0, close) + EOL + entry + src.slice(close);
}

// ---------- main ----------

function changedPosts() {
  try {
    const base = execSync('git merge-base HEAD origin/master', { cwd: ROOT }).toString().trim();
    return execSync(`git diff --name-only ${base} HEAD`, { cwd: ROOT }).toString()
      .split('\n').filter((f) => /^src\/content\/blog\/.+\.mdx$/.test(f)).map((f) => path.join(ROOT, f));
  } catch {
    return [];
  }
}

// --logo-for <slug[,slug...]>: source a logo for tools ALREADY in the registries
// (approved affiliates whose hub shipped logo-less). Reuses the exact sourceLogo
// + validateRasterLogo path the post flow uses, so a logo added here clears the
// same lint-logos bar. Never touches affiliate-links.ts and never registers
// anything new. Homepage comes from the affiliate registry, or --url-hint.
//
// --replace: also re-source tools that ALREADY carry a logo, swapping the
// registry path and deleting the old file if its extension changed. Used by the
// retro audit (qa/audit-logos-retro.mjs) to redo logos registered before the
// 2026-08-20 banner rule existed; without it a bad old logo is "skipped".
const REPLACE = args.includes('--replace');

function replaceLogoInTool(src, slug, logoRel) {
  const slugIdx = src.search(new RegExp(`slug:\\s*['"]${slug}['"]`));
  if (slugIdx === -1) return null;
  const endIdx = src.indexOf('\n  },', slugIdx);
  const block = endIdx === -1 ? src.slice(slugIdx) : src.slice(slugIdx, endIdx);
  const m = block.match(/logo:\s*(['"])[^'"]*\1/);
  if (!m) return null;
  return src.slice(0, slugIdx) + block.replace(m[0], `logo: '${logoRel}'`) + src.slice(slugIdx + block.length);
}

async function logoOnlyMode(slugs) {
  let toolsSrc = readFileSync(TOOLS_PATH, 'utf8');
  const homepages = registryHomepages(readFileSync(AFF_PATH, 'utf8'));
  const report = { added: [], replaced: [], failed: [], skipped: [] };

  for (const slug of slugs) {
    // Entry bounds by index, not a bounded regex: LP-builder entries carry body
    // + FAQs and run well past any fixed character window (a {0,2000} window
    // reported six present tools as "not in tools.ts").
    const slugIdx = toolsSrc.search(new RegExp(`slug:\\s*['"]${slug}['"]`));
    if (slugIdx === -1) { report.failed.push({ slug, why: 'not in tools.ts' }); continue; }
    const endIdx = toolsSrc.indexOf('\n  },', slugIdx);
    const block = endIdx === -1 ? toolsSrc.slice(slugIdx) : toolsSrc.slice(slugIdx, endIdx);
    const oldRel = (block.match(/logo:\s*['"]([^'"]+)['"]/) || [])[1] || null;
    if (oldRel && !REPLACE) { report.skipped.push({ slug, why: 'already has a logo (pass --replace to re-source)' }); continue; }

    const homepage = urlHints.get(slug) || homepages.get(slug);
    if (!homepage) { report.failed.push({ slug, why: 'no homepage in affiliate registry; pass --url-hint' }); continue; }
    const host = new URL(homepage).host;
    // A homepage that blocks our UA (Cloudflare: findymail, pandadoc) is not a
    // dead end — sourceLogo always appends the Google favicon service as a
    // deterministic fallback, which needs only the host. Carry on with no HTML.
    const html = (await fetchText(homepage))?.html || '';
    const logo = await sourceLogo(slug, html, homepage, host);
    if (!logo) { report.failed.push({ slug, why: 'no icon passed transparency/luminance validation' }); continue; }
    if (oldRel) {
      const next = replaceLogoInTool(toolsSrc, slug, logo.rel);
      if (!next) { report.failed.push({ slug, why: 'could not replace logo in entry' }); continue; }
      toolsSrc = next;
      if (oldRel !== logo.rel && !DRY) {
        const oldPath = path.join(ROOT, 'public', oldRel);
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
      report.replaced.push({ slug, from: oldRel, ...logo });
      continue;
    }
    const next = addLogoToTool(toolsSrc, slug, logo.rel);
    if (!next) { report.failed.push({ slug, why: 'could not splice logo into entry' }); continue; }
    toolsSrc = next;
    report.added.push({ slug, ...logo });
  }

  if (!DRY && (report.added.length || report.replaced.length)) writeFileSync(TOOLS_PATH, toolsSrc);
  console.log(JSON.stringify(report, null, 2));
  console.log(DRY ? '\nDRY RUN (no files written).' : `\nWrote ${report.added.length} new + ${report.replaced.length} replaced logo(s) + tools.ts entries.`);
  process.exit(0);
}

async function main() {
  const lIdx = args.indexOf('--logo-for');
  if (lIdx !== -1 && args[lIdx + 1]) {
    return logoOnlyMode(args[lIdx + 1].split(',').map((s) => s.trim()).filter(Boolean));
  }

  let posts = [];
  const pIdx = args.indexOf('--post');
  if (pIdx !== -1 && args[pIdx + 1]) posts = [path.resolve(args[pIdx + 1])];
  else if (args.includes('--changed')) posts = changedPosts();
  if (!posts.length) { console.error('No post specified. Use --post <path> or --changed.'); process.exit(2); }

  let affSrc = readFileSync(AFF_PATH, 'utf8');
  let toolsSrc = readFileSync(TOOLS_PATH, 'utf8');
  const affKeys = existingAffiliateKeys(affSrc);
  const affHomepages = registryHomepages(affSrc);
  const toolSlugs = existingToolSlugs(toolsSrc);

  const wanted = new Map(); // slug -> name (unique across all posts)
  for (const p of posts) {
    if (!existsSync(p)) { console.error(`post not found: ${p}`); continue; }
    for (const [slug, name] of parsePost(readFileSync(p, 'utf8'))) if (!wanted.has(slug)) wanted.set(slug, name);
  }

  // A post that reaches auto-register is a head-to-head comparison, so its tools
  // are the same KIND of tool. Inherit the category from whichever compared tool
  // is already registered; a flat 'Sales Engagement' default filed the SEO tools
  // Frase and Clearscope under sales on their /tools hubs.
  const siblingCategory = [...wanted.keys()].map((s) => toolSlugs.get(s)?.category).find(Boolean) || 'Sales Engagement';

  const report = { registered: [], loggedLogos: [], skipped: [], unresolved: [] };
  let affDirty = false, toolsDirty = false;

  for (const [slug, name] of wanted) {
    const needAff = !affKeys.has(slug);
    const tool = toolSlugs.get(slug);
    const needLogo = !tool || !tool.hasLogo;
    if (!needAff && !needLogo) { report.skipped.push(slug); continue; }

    const resolved = await resolveHomepage(name, slug, affHomepages.get(slug));
    if (!resolved) { report.unresolved.push({ slug, name }); continue; }

    let logoRel = null;
    if (needLogo) {
      const logo = await sourceLogo(slug, resolved.html, resolved.homepage, resolved.host);
      if (logo) { logoRel = logo.rel; report.loggedLogos.push({ slug, ...logo }); }
    }

    if (needAff) { affSrc = insertAffiliate(affSrc, slug, name, resolved.homepage); affDirty = true; }
    if (needLogo) {
      if (tool) {
        if (logoRel) { const patched = addLogoToTool(toolsSrc, slug, logoRel); if (patched) { toolsSrc = patched; toolsDirty = true; } }
      } else {
        toolsSrc = appendTool(toolsSrc, { slug, name, category: siblingCategory, blurb: resolved.blurb, ctaLabel: `Try ${name}`, logoRel });
        toolsDirty = true;
      }
    }
    report.registered.push({ slug, name, homepage: resolved.homepage, logo: logoRel });
  }

  if (!DRY) {
    if (affDirty) writeFileSync(AFF_PATH, affSrc);
    if (toolsDirty) writeFileSync(TOOLS_PATH, toolsSrc);
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.unresolved.length) {
    console.error(`\n[auto-register] could NOT resolve ${report.unresolved.length} tool(s); they will still trip the lint gate for manual review:`);
    for (const u of report.unresolved) console.error(`  - ${u.slug} (${u.name})`);
    // Drop a machine-readable breadcrumb so the QA-failed PR comment / Slack ping
    // can name the exact tool(s) in plain English ("couldn't confirm <tool>;
    // reply with its URL") instead of a generic "a QA step failed". One
    // `slug\tname` per line; not committed (auto-register only stages registries).
    if (!DRY) writeFileSync(path.join(ROOT, 'qa-unresolved-tools.txt'),
      report.unresolved.map((u) => `${u.slug}\t${u.name}`).join('\n') + '\n');
  }
  process.exit(0); // best-effort pre-step; the lint gate is the source of truth
}

main();
