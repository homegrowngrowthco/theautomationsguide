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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const AFF_PATH = path.join(ROOT, 'src/data/affiliate-links.ts');
const TOOLS_PATH = path.join(ROOT, 'src/data/tools.ts');
const LOGO_DIR = path.join(ROOT, 'public/brand/tools');

const TLDS = ['com', 'io', 'ai', 'co', 'app', 'so', 'dev'];
const UA = 'Mozilla/5.0 (compatible; AutomationsGuideBot/1.0; +https://theautomationsguide.com)';
const FETCH_TIMEOUT = 9000;

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');

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
  return slugName;
}

// ---------- existing registries ----------

function existingAffiliateKeys(src) {
  const keys = new Set();
  for (const m of src.matchAll(/^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{/gm)) keys.add(m[1]); // quote-agnostic, mirrors lint-content
  return keys;
}

function existingToolSlugs(src) {
  const map = new Map(); // slug -> { hasLogo }
  for (const m of src.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)) map.set(m[1], { hasLogo: false });
  for (const block of src.split(/\r?\n  \{\r?\n/)) { // CRLF-tolerant block split
    const slug = (block.match(/slug:\s*['"]([a-z0-9-]+)['"]/) || [])[1];
    if (slug && /logo:\s*['"]/.test(block)) map.set(slug, { hasLogo: true });
  }
  return map;
}

// ---------- resolve homepage ----------

// Probe every candidate domain, keep the ones whose PAGE IDENTITY (not just the
// host string) names the tool, then score by how strongly the page looks like
// the real product homepage. This is what stops `justcall.com` ("Just Call", an
// unrelated site) from beating the real `justcall.io`.
async function resolveHomepage(name, slug) {
  const bases = [...new Set([slug.replace(/-/g, ''), norm(name)])].filter(Boolean);
  // Identity targets: match the page against the CLEAN slug as well as the name.
  // Brand names that bake in a TLD ("Otter.ai", "Reply.io") normalize to
  // "otterai"/"replyio", but the site's <title> usually says the bare brand
  // ("Otter Meeting Agent…"), so a name-only check fails. The slug ("otter") is
  // the canonical clean identifier and matches.
  const targets = [...new Set([norm(slug.replace(/-/g, '')), norm(name)])].filter((t) => t.length >= 2);
  const matchesIdentity = (ident) => targets.some((t) => ident.includes(t));
  const candidates = [];
  for (const base of bases) {
    for (const tld of TLDS) {
      const r = await fetchText(`https://${base}.${tld}/`);
      if (!r) continue;
      const head = r.html.slice(0, 20000);
      const title = (head.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
      const ogSite = (head.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
      const ogTitle = (head.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
      const ogDesc = (head.match(/<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i)
        || head.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
      const ident = norm(`${title} ${ogSite} ${ogTitle}`);
      if (!matchesIdentity(ident)) continue; // identity must name the tool — host match alone is not enough

      let score = 0;
      if (targets.some((t) => norm(title).startsWith(t)) || targets.some((t) => norm(ogSite) === t)) score += 100;
      else score += 50;
      if (/<meta[^>]+property=["']og:image["']/i.test(head)) score += 20; // real product sites ship social cards
      if (/rel=["'][^"']*apple-touch-icon/i.test(head)) score += 20;
      if (ogDesc) score += 10;
      if (title.length > 25) score += 10;                                 // descriptive, not a parked "Just Call"
      score += Math.max(0, 6 - TLDS.indexOf(tld));                        // gentle TLD tiebreak only
      const u = new URL(r.finalUrl);
      candidates.push({ score, homepage: `${u.protocol}//${u.host}/`, host: u.host, html: r.html, blurb: ogDesc.trim() });
    }
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
    if (rel.includes('apple-touch-icon')) score = 100 + px;
    else if (rel.includes('mask-icon')) score = 60;
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
    const rel = `/brand/tools/${slug}.${ext}`;
    if (!DRY) {
      mkdirSync(LOGO_DIR, { recursive: true });
      writeFileSync(path.join(LOGO_DIR, `${slug}.${ext}`), r.buf);
    }
    return { rel, bytes: r.buf.length, from: url };
  }
  return null;
}

// ---------- mutate registries ----------

const eolOf = (src) => (src.includes('\r\n') ? '\r\n' : '\n');

function insertAffiliate(src, slug, name, homepage) {
  const EOL = eolOf(src);
  const entry =
`  ${slug}: {
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

async function main() {
  let posts = [];
  const pIdx = args.indexOf('--post');
  if (pIdx !== -1 && args[pIdx + 1]) posts = [path.resolve(args[pIdx + 1])];
  else if (args.includes('--changed')) posts = changedPosts();
  if (!posts.length) { console.error('No post specified. Use --post <path> or --changed.'); process.exit(2); }

  let affSrc = readFileSync(AFF_PATH, 'utf8');
  let toolsSrc = readFileSync(TOOLS_PATH, 'utf8');
  const affKeys = existingAffiliateKeys(affSrc);
  const toolSlugs = existingToolSlugs(toolsSrc);

  const wanted = new Map(); // slug -> name (unique across all posts)
  for (const p of posts) {
    if (!existsSync(p)) { console.error(`post not found: ${p}`); continue; }
    for (const [slug, name] of parsePost(readFileSync(p, 'utf8'))) if (!wanted.has(slug)) wanted.set(slug, name);
  }

  const report = { registered: [], loggedLogos: [], skipped: [], unresolved: [] };
  let affDirty = false, toolsDirty = false;

  for (const [slug, name] of wanted) {
    const needAff = !affKeys.has(slug);
    const tool = toolSlugs.get(slug);
    const needLogo = !tool || !tool.hasLogo;
    if (!needAff && !needLogo) { report.skipped.push(slug); continue; }

    const resolved = await resolveHomepage(name, slug);
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
        toolsSrc = appendTool(toolsSrc, { slug, name, category: 'Sales Engagement', blurb: resolved.blurb, ctaLabel: `Try ${name}`, logoRel });
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
  }
  process.exit(0); // best-effort pre-step; the lint gate is the source of truth
}

main();
