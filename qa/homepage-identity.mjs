// qa/homepage-identity.mjs
//
// Pure, offline logic behind auto-register's homepage guess: reads a fetched page
// and decides whether it is the tool the post is writing about. No network and no
// file access, so `auto-register-tools.mjs --selftest` can pin every decision.
//
// Why this exists (op #1498): a brand name in the <title> says the page has that
// name, not that it is that company. An audit of the 40 auto-registered tools found
// 6 wrong, plus creatio.io by hand, and every one had the brand in its title:
//   creatio.io    a Finnish studio, lang=fi, out-scored creatio.com on the
//                 title-starts-with-brand bonus (145 vs 96). creatio.com answered 200.
//   prospeo.app   a French route app, lang=fr, 162 vs prospeo.io at 145.
//   fathom.io     an unrelated company, 165 vs fathom.ai at 154.
//   profound.app  Sedo's "Resources and Information" template.
//   bouncer.com   "bouncer.com - For Sale": PARKED_RE wanted "is for sale".
//   warmforge.com a WordPress "coming soon" page, and the real warmforge.ai was
//                 rejected because its title does not say Warmforge.
//   guru.so       an unrelated consumer app, the only candidate left standing.
// So the winner is now the page that talks about what the post says the tool does.
// When nothing clears the floor, or two domains stay too close to call, the answer
// is "unresolved": the lint gate holds the post and asks a human for the URL.

export const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Markers of parked / for-sale / marketplace landing pages (Atom, Dan, Sedo,
// GoDaddy, Afternic…). Matched against title + og:title + description.
// A broker's title often puts the DOMAIN where the word "domain" would go
// ("Surfer.app is for sale"), and may separate them ("bouncer.com - For Sale").
export const PARKED_RE = /\b(?:(?:domain|[a-z0-9-]+\.[a-z]{2,})(?: -| :|:)? (?:is |may be )?for sale|buy this domain|purchase this domain|own (?:this domain|[a-z0-9.-]+ today)|make an offer|domain (?:broker|inquiry)|guided transfer|premium domain|parked (?:free|domain)|this domain is available|resources and information|first and best source for|may be available for acquisition)\b/i;
// Only trusted on a thin page: a real homepage can carry "coming soon" on a feature.
const THIN_PLACEHOLDER_RE = /\b(?:coming soon|under construction|launching soon|website is on its way)\b/i;
const THIN_WORDS = 200;

// Words too common to say anything about what a tool does, whether in a post or on
// any company's homepage. A hit on these separated nothing in the dry run.
const STOP = new Set(`
about above actually after again against almost also always among another answer answers any around asked because been before being below best better between both built
called came cannot case cases change check choice choose clear click close come comes compare comparison contact could cost costs create current
date days deal deals demo description differ different does doing done during each early easy either else enough even every example
fast feature features feel find first full free from further getting give given gives going good great guide
half hand handle hard have having help helps here high honest however include included includes including inside instead into itself
just keep know large last later learn least less like line list little live long look looking looks
made main make makes making many matter maybe mean means month monthly more most much must name near need needs never next none
often once only open option options other others over paid part people pick plan plans point post price prices pricing product products program provide
question questions quite rather read real really reason review reviews right same scale second seat seats see service services should show shows side simple since
size small software solution solutions some something specific start started starter still stack such support sure switch
take takes team teams tell than that their them then there these they thing things this those three through time tier title today tool tools top true
turn under unlimited until update updated upon used user users uses using value versus very
want wants week well were what when where which while whole wins winner will with within without work working works worth would write year years your
affiliateslug ctalabel bestfor mdx http https www platform platforms company companies business businesses customer customers system systems data
`.trim().split(/\s+/));

const stem = (w) => {
  const s = w.toLowerCase();
  return (s.endsWith('s') && s.length > 4 ? s.slice(0, -1) : s).slice(0, 7);
};
const tokens = (s) => {
  const out = new Set();
  for (const raw of (s || '').toLowerCase().match(/[a-z][a-z-]{3,}/g) || []) {
    for (const w of raw.split('-')) if (w.length >= 4 && !STOP.has(w)) out.add(stem(w));
  }
  return out;
};

// What the post says about this tool: its title, every sentence naming the tool or
// linking its /go/ slug, and the tool card around its affiliateSlug. The tool's own
// name is dropped, or every candidate would "fit" on the brand alone.
export function postTerms(post, slug, name) {
  const title = (post.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1] || '';
  // Both spellings: a tool card can name more than the brand ("Creatio Native
  // Business Process", slug creatio) while the prose just says "Creatio".
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const spellings = [(name || '').replace(/\.[a-z]+$/i, ''), slug.replace(/-/g, ' ')].filter(Boolean).map(esc);
  const nameRe = new RegExp(`\\b(?:${spellings.join('|')})\\b`, 'i');
  const parts = [title];
  for (const sentence of post.split(/(?<=[.!?])\s+|\n+/)) {
    if (nameRe.test(sentence) || sentence.includes(`/go/${slug}`)) parts.push(sentence);
  }
  for (const m of post.matchAll(new RegExp(`affiliateSlug\\s*[:=]\\s*["']${slug}["']`, 'g'))) {
    parts.push(post.slice(Math.max(0, m.index - 400), m.index + 400));
  }
  const brand = new Set([...tokens(slug.replace(/-/g, '')), ...tokens(name || '')]);
  return [...tokens(parts.join(' '))].filter((t) => !brand.has(t));
}

// Page identity, read from the WHOLE document. Neither a fixed byte slice nor the
// <head> is a safe bound: frase.io closes </head> at byte ~4k but emits its real
// <title> at byte ~172k (client-rendered page), so both windows read an EMPTY
// identity, failed the identity check, and rejected the tool's own homepage. Collect
// every <title> (a page can carry several: inline SVGs have them) and let the caller
// pick the one that names the tool.
export function metaOf(html) {
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
    lang: meta(/<html[^>]*\blang=["']([^"']+)["']/i),
  };
}

export function visibleText(html) {
  const doc = html.length > 400000 ? html.slice(0, 400000) : html;
  return doc
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "www.creatio.com" -> "creatio.com". Enough for telling two companies apart; the
// tool grid here never lands on a public-suffix host deeper than these.
const TWO_PART = /\.(?:co|com|org|net|ac)\.[a-z]{2}$/i;
export function registrableDomain(host) {
  const parts = host.toLowerCase().split('.');
  return parts.slice(TWO_PART.test(host) ? -3 : -2).join('.');
}

// Measured on 2026-11-04 against 112 real tools (op #1498). Right pages fit from 0.08
// (nutshell, krispcall) up; a floor of 0.10 refused those. Same-name companies fit
// up to 0.18, so the floor alone cannot separate them: the lead does that.
// Floor: at least this share of the post's terms must be on the page (or of the
// page's terms, when the page is a thin client-rendered shell like prospeo.io).
export const FIT_FLOOR = 0.07;
export const FIT_MIN_HITS = 2;
// The winner must beat the next DIFFERENT domain by this factor, or it is a guess. At
// 1.25 signal-house went to a same-name DTC analytics company; a refusal only holds
// a post until someone replies with the URL, while a wrong /go/ link ships silently.
export const FIT_LEAD = 1.5;
// A page shorter than this is scored as if it were this long, so that 2 hits on a
// 6-word page are not a 33% fit.
const MIN_PAGE_TERMS = 30;

export function fitScore(terms, html, meta) {
  const m = meta || metaOf(html);
  const body = visibleText(html).split(' ').slice(0, 1500).join(' ');
  const page = tokens(`${m.titles.join(' ')} ${m.ogTitle} ${m.ogDesc} ${body}`);
  const hits = terms.filter((t) => page.has(t));
  const denom = Math.max(1, Math.min(terms.length, Math.max(page.size, MIN_PAGE_TERMS)));
  return { hits: hits.length, fit: hits.length / denom, sample: hits.slice(0, 8) };
}

// One fetched page -> { reject: reason } or { fit, hits, ... }.
// page = { host, finalUrl, html }; tool = { targets, terms }.
export function assessPage(page, { targets, terms }) {
  const u = new URL(page.finalUrl);
  const matches = (s) => targets.some((t) => s.includes(t));
  // A parked domain redirects to the BROKER's own host (surfer.app lands on
  // www.fortune.domains). Whatever the landing page's copy claims, a host carrying
  // none of the brand's identity stems is not this tool's homepage. Real redirects
  // keep the brand (surfer.ai -> surferseo.com).
  if (!matches(norm(u.host))) return { reject: 'host carries no brand stem' };
  const m = metaOf(page.html);
  // Every wrong foreign-company hit declared it: creatio.io fi, prospeo.app fr. A
  // missing lang is common on real sites (avoma.com) and is not evidence.
  const lang = m.lang.toLowerCase().split(/[-_]/)[0];
  if (lang && lang !== 'en') return { reject: `lang=${m.lang}` };
  const ident = norm(`${m.titles.join(' ')} ${m.ogSite} ${m.ogTitle}`);
  const text = visibleText(page.html);
  const words = text ? text.split(' ').length : 0;
  // The page must name the tool. Its title usually does; a marketing title may not
  // (warmforge.ai: "Premium Email Warmup & Deliverability Center"), so a host that
  // IS the brand (or use/try/get + brand) also counts when the page text keeps
  // saying the name.
  const hostLabel = norm(u.host.replace(/^www\./, '').split('.')[0]);
  const hostIsBrand = targets.some((t) => hostLabel === t || ['use', 'try', 'get'].some((p) => hostLabel === p + t));
  const brandInText = targets.some((t) => (norm(text.replace(/\s+/g, '-')).split(t).length - 1) >= 3);
  if (!matches(ident) && !(hostIsBrand && brandInText)) return { reject: 'page does not name the tool' };
  const title = m.titles.find((t) => matches(norm(t))) || m.titles[0] || '';
  // Parked/for-sale pages pass the identity check trivially (their title IS the
  // domain, e.g. "artisan.so") and can outscore the real product site.
  if (PARKED_RE.test(`${m.titles.join(' ')} ${m.ogTitle} ${m.ogDesc}`)) return { reject: 'parked or for sale' };
  // A broker page can keep the pitch out of its metadata, as can a placeholder.
  if (words < THIN_WORDS && (PARKED_RE.test(text) || THIN_PLACEHOLDER_RE.test(text))) return { reject: 'placeholder page' };
  // Site-builder placeholder pages carry no for-sale copy, so PARKED_RE misses them:
  // calendly.ai served a stock GoDaddy Website Builder page titled just "calendly.ai".
  if (/godaddy|go ?daddy|starfield|sedo|parking|parked/i.test(m.generator)) return { reject: 'site-builder placeholder' };
  // A title that is just the raw domain, on a page with no social card, is a
  // placeholder. (Real homepages that title themselves "Brand.ai" ship one.)
  if (norm(title) === norm(page.host) && !m.hasOgImage) return { reject: 'raw-domain title, no social card' };
  // Same shape, bare-brand variant: an app-login shell titles itself with JUST the
  // brand and ships no social card and no description. aloware.io (the login SPA)
  // outscored the real aloware.com this way on PR #191.
  if (targets.some((t) => norm(title) === t) && !m.hasOgImage && !m.ogDesc) return { reject: 'bare-brand app shell' };
  const { hits, fit, sample } = fitScore(terms, page.html, m);
  return { fit, hits, sample, title, words, finalHost: u.host, domain: registrableDomain(u.host), blurb: m.ogDesc.trim() };
}

// Assessed candidates -> { winner } or { refused: reason }. Identical titles on two
// domains are one site served twice (qwilr.com / qwilr.dev), not two companies, and
// the caller's probe order (.com first) settles which host to keep.
export function chooseHomepage(candidates) {
  const byDomain = new Map();
  for (const c of candidates) {
    const key = norm(c.title) || c.domain;
    const prior = byDomain.get(key);
    if (!prior || c.fit > prior.fit) byDomain.set(key, c);
  }
  const ranked = [...byDomain.values()].sort((a, b) => b.fit - a.fit);
  const [top] = ranked;
  if (!top) return { refused: 'no candidate names the tool' };
  if (top.fit < FIT_FLOOR || top.hits < FIT_MIN_HITS) {
    return { refused: `best page does not match the post: ${top.domain} fit ${top.fit.toFixed(2)}, ${top.hits} terms` };
  }
  const rival = ranked.find((c) => c.domain !== top.domain);
  if (rival && top.fit < rival.fit * FIT_LEAD) {
    return { refused: `too close to call: ${top.domain} ${top.fit.toFixed(2)} vs ${rival.domain} ${rival.fit.toFixed(2)}` };
  }
  return { winner: top };
}
