// Builds src/data/pricing-index.json — the dataset behind /revops-automation-pricing/.
//
// WHY THIS EXISTS
// The site's linkable asset is a maintained, cited price index for RevOps automation
// tooling. Its entire value is that every number is traceable to the vendor's own
// pricing page on a stated date. That means the one thing this script must never do
// is guess. A missing figure is recorded as null with a reason; it is never inferred,
// carried over from a previous run, or filled in from the model's memory of the brand.
//
// PIPELINE (per tool)
//   1. discover  — find the vendor's pricing page from its homepage
//   2. fetch     — pull that page and reduce it to text
//   3. extract   — Claude reads ONLY that text and returns strict JSON
//   4. verify    — self-test against known-good fixtures before anything is written
//
// Mirrors the repo's script convention (backlog/build-backlog.mjs,
// analytics/posthog-setup.mjs): .mjs, bare global fetch, fail-fast env guards,
// DRY RUN by default with --apply to write, and a --selftest that runs offline.
//
// Env:
//   ANTHROPIC_API_KEY   required for extraction (not for --selftest)
//
// Usage (from the repo root):
//   node pricing/build-pricing-index.mjs --selftest        # extractor regression, no network writes
//   node pricing/build-pricing-index.mjs --only zapier,make  # dry run a couple of tools
//   node pricing/build-pricing-index.mjs                   # dry run every tool
//   node pricing/build-pricing-index.mjs --apply           # write src/data/pricing-index.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'src', 'data', 'pricing-index.json');
const PUBLIC_DIR = join(ROOT, 'public', 'data');
const PUBLIC_OUT = join(PUBLIC_DIR, 'revops-pricing-index.json');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const APPLY = has('--apply');
const SELFTEST = has('--selftest');
const ONLY = (valOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const LIMIT = Number(valOf('--limit') || 0);
const CONCURRENCY = Number(valOf('--concurrency') || 4);

// Extraction quality is the whole product here, so this defaults to a mid-tier model
// rather than the cheapest one. The job runs quarterly over ~80 pages, so the cost
// difference is a rounding error against the cost of publishing a wrong price.
const MODEL = valOf('--model') || 'claude-sonnet-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;

// A plain browser UA. An honest self-identifying UA was tried first and is the nicer
// citizen, but several vendors 403 anything they do not recognise. Note this does NOT
// rescue the hard blockers: make.com returns 403 to every header combination tried
// (real UA, Accept, Sec-Fetch-*), because the block is on TLS/connection fingerprint,
// not headers. Those are recorded as `blocked` and filled from manual-overrides.json.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Registry parsing. Quote-agnostic and CRLF-aware: both registries are hand-edited
// and mix ' and ", which has broken naive parsers in this repo before.
// ---------------------------------------------------------------------------
const readSrc = (...p) => readFileSync(join(ROOT, 'src', 'data', ...p), 'utf8').replace(/\r\n/g, '\n');

function parseTools() {
  const src = readSrc('tools.ts');
  const out = [];
  // Each tool object starts with its slug; capture the block up to the next slug.
  const re = /\bslug:\s*['"]([a-z0-9-]+)['"]([\s\S]*?)(?=\n\s*\{\s*\n\s*slug:|\n\];)/g;
  let m;
  while ((m = re.exec(src))) {
    const [, slug, block] = m;
    const grab = (key) => {
      const mm = block.match(new RegExp(`\\b${key}:\\s*['"]([^'"]*)['"]`));
      return mm ? mm[1] : null;
    };
    out.push({ slug, name: grab('name') || slug, category: grab('category') || 'Uncategorized' });
  }
  return out;
}

function parseAffiliates() {
  const src = readSrc('affiliate-links.ts');
  const region = src.slice(src.indexOf('affiliateLinks'));
  const byslug = new Map();
  const re = /^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{([\s\S]*?)^\s{2}\},/gm;
  let m;
  while ((m = re.exec(region))) {
    const [, slug, block] = m;
    const grab = (key) => {
      const mm = block.match(new RegExp(`\\b${key}:\\s*['"]([^'"]*)['"]`));
      return mm ? mm[1] : null;
    };
    byslug.set(slug, { homepage: grab('homepageFallback'), status: grab('status') });
  }
  return byslug;
}

// ---------------------------------------------------------------------------
// Fetch + HTML reduction
// ---------------------------------------------------------------------------
async function getHtml(url, timeoutMs = 25000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      // A bare fetch with no Accept header gets a persistent 429 from several of these
      // hosts; send a browser-shaped header set. (Same bug class hit the ops repo before.)
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return { ok: false, status: res.status, url: res.url, html: '' };
    return { ok: true, status: res.status, url: res.url, html: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, url, html: '', error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Pull price-bearing values out of embedded JSON payloads.
 *
 * Stripping <script> and reading only visible markup is the obvious way to reduce a
 * page, and it is wrong for most modern vendor sites: n8n's pricing page has ZERO
 * currency symbols in its markup and a 115KB JSON blob carrying every number, and
 * Tally is the same via __NEXT_DATA__. Reading only the markup and reporting "no
 * prices found" would have been a statement about this extractor dressed up as a
 * statement about the vendor.
 *
 * The blobs are 100KB+ and mostly routing/telemetry noise, so this walks the parsed
 * object and keeps only leaf values whose key path or value looks price-related,
 * emitting compact `path: value` lines.
 */
export function jsonBlobText(html, cap = 24000) {
  const KEEP = /price|plan|tier|amount|cost|month|annual|year|seat|user|credit|task|operation|workflow|free|currency|billing|quota|limit/i;
  const blobs = [];
  const re = /<script\b[^>]*type=["'](?:application\/json|application\/ld\+json)["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) blobs.push(m[1]);
  const nd = html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nd) blobs.push(nd[1]);

  const scored = [];
  for (const blob of blobs) {
    let parsed;
    try { parsed = JSON.parse(blob.trim()); } catch { continue; }
    const scalar = (v) => v != null && typeof v !== 'object';
    const hasMoney = (v) => /[$€£]\s?\d|\d\s?[$€£]/.test(String(v));
    const hasBilling = (v) => /\b(per month|per user|per seat|per year|\/mo|\/yr|billed annually|billed monthly|a month)\b/i.test(String(v));
    const interesting = (k, v) => KEEP.test(k) || hasMoney(v) || hasBilling(v);

    // Score each candidate so the cap keeps signal and drops chrome. Without this,
    // vendors that ship their whole i18n dictionary in the same blob (n8n, Tally)
    // fill the budget with nav labels and the prices never make it into the prompt.
    const score = (k, v) => {
      if (hasMoney(v)) return 3;
      if (hasBilling(v)) return 2;
      if (/price|cost|amount|tier|plan|credit|task|operation|quota|seat/i.test(k)) return 2;
      return 1;
    };

    const walk = (node, depth) => {
      if (depth > 12 || scored.length > 6000 || node == null) return;
      if (Array.isArray(node)) { for (const v of node) walk(v, depth + 1); return; }
      if (typeof node !== 'object') return;

      const own = Object.entries(node).filter(([, v]) => scalar(v));
      // Emit an object's other scalars alongside a price only when the object is small
      // enough to plausibly BE a plan record. The point is to keep "name: Starter"
      // attached to "priceMonthly: 24"; applying it to a 900-key i18n dictionary that
      // happens to contain one "month" string is how the budget got eaten.
      const looksLikeRecord = own.length > 0 && own.length <= 25;
      const anyInteresting = own.some(([k, v]) => interesting(k, v));

      for (const [k, v] of own) {
        const val = String(v);
        if (!val || val.length > 200) continue;
        const keep = interesting(k, v) || (looksLikeRecord && anyInteresting);
        if (keep) scored.push([score(k, v), `${k}: ${val}`]);
      }
      for (const [, v] of Object.entries(node)) if (!scalar(v)) walk(v, depth + 1);
    };
    walk(parsed, 0);
  }
  // Highest-signal first, de-duplicated, then truncated — so the cap removes chrome
  // rather than prices.
  scored.sort((a, b) => b[0] - a[0]);
  const seen = new Set();
  let out = '';
  for (const [, line] of scored) {
    if (seen.has(line)) continue;
    seen.add(line);
    if (out.length + line.length + 1 > cap) break;
    out += (out ? '\n' : '') + line;
  }
  return out;
}

/** Strip a page to readable text, dropping script/style/svg noise. */
export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/** Visible text plus the embedded-JSON digest — the full surface an extractor should see. */
export function pageText(html) {
  const visible = htmlToText(html);
  const structured = jsonBlobText(html);
  return structured ? `${visible}\n\n--- EMBEDDED STRUCTURED DATA (from the page's own JSON payloads) ---\n${structured}` : visible;
}

/**
 * Does this text plausibly contain a price table at all? Used to tell
 * "the vendor renders pricing in JS" apart from "the model found nothing",
 * so a null is attributed to the right cause instead of blamed on extraction.
 */
export function looksLikePricing(text) {
  // Two independent shapes count as a price signal, because vendors publish in both:
  //   1. human markup  — "$29 per month"
  //   2. structured    — schema.org Offer / embedded JSON, where the number and the
  //                      currency are SEPARATE fields ("price":"29","priceCurrency":"USD")
  // Requiring a currency symbol adjacent to a digit only detects the first, which is
  // why Brevo — a page carrying 1,115 currency symbols and a full JSON-LD Offer list —
  // was being written off as having no readable pricing.
  const symbolMoney = (text.match(/[$€£]\s?\d/g) || []).length;
  const structuredMoney = (text.match(/\b(?:price|priceCurrency|amount|monthlyPrice|pricePerMonth|priceMonthly)\b\W{0,4}[\d"']/gi) || []).length;
  const words = /\b(per month|\/mo|per user|per seat|billed annually|free plan|pricing|plan)\b/i.test(text);
  return (symbolMoney >= 3 || structuredMoney >= 3) && words;
}

/** Candidate pricing URLs, best guess first. */
export function pricingCandidates(homepage, html = '') {
  const out = [];
  let origin;
  try { origin = new URL(homepage).origin; } catch { return out; }

  // Prefer a real link discovered on the homepage over a guessed path.
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi;
  let m;
  while ((m = linkRe.exec(html))) {
    const [, href, label] = m;
    const text = label.replace(/<[^>]+>/g, ' ').trim();
    if (!/pricing|plans/i.test(href) && !/^\s*(pricing|plans|plans & pricing)\s*$/i.test(text)) continue;
    try {
      const abs = new URL(href, homepage);
      if (abs.origin !== origin) continue;
      if (!out.includes(abs.href)) out.push(abs.href);
    } catch { /* skip unparseable href */ }
  }

  for (const p of ['/pricing', '/pricing/', '/en/pricing', '/plans', '/pricing-plans']) {
    const u = origin + p;
    if (!out.includes(u)) out.push(u);
  }
  return out.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------
const SCHEMA_NOTE = `Return ONLY a JSON object, no prose and no code fence, shaped exactly:
{
  "currency": "USD" | "EUR" | "GBP" | null,
  "hasFreeTier": true | false | null,
  "freeTierLimit": string | null,
  "entryPaidPlan": { "name": string, "monthlyBilledMonthly": number|null, "monthlyBilledAnnually": number|null, "unitIncluded": string|null } | null,
  "pricingUnit": "per seat" | "per month flat" | "usage" | "credits" | "mixed" | null,
  "minimumSeats": number | null,
  "highestPublishedPlan": { "name": string, "monthlyBilledAnnually": number|null } | null,
  "enterpriseIsQuoteOnly": true | false | null,
  "apiOnPaidTierOnly": true | false | null,
  "notes": string | null
}

RULES, in priority order:
1. Report ONLY figures literally present in the text provided. Never use prior knowledge
   of this vendor. If the text does not state it, the value is null.
2. Never estimate, average, convert currencies, or annualise/de-annualise a price yourself.
3. Prices are the per-month number. If only an annual total is shown, leave the monthly
   fields null and put the annual total in notes.
4. "unitIncluded" is what the entry plan includes, verbatim and short, e.g.
   "750 tasks/mo", "10,000 credits", "2 users".
5. If the page is a cookie wall, a login page, or has no prices at all, return every
   field null and set notes to "no pricing visible in page text".
6. notes is at most 160 characters.`;

// 4000, not 1200. At 1200 the response reliably ended with stop_reason `max_tokens`:
// the model spends some budget on thinking blocks and then emits a long JSON body, so
// the object arrived truncated and surfaced as a baffling "no JSON object in model
// output" against an empty string. Truncation is now detected and named explicitly.
async function callClaude(prompt, { maxTokens = 4000 } = {}) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      // No `temperature`: the current models reject it outright
      // ("`temperature` is deprecated for this model", HTTP 400).
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  // Only `text` blocks are output; `thinking` blocks carry no .text and would
  // otherwise silently flatten to an empty string.
  const out = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text || '').join('').trim();
  if (j.stop_reason === 'max_tokens') throw new Error(`model output truncated at max_tokens (${maxTokens}); raise --max-tokens`);
  if (!out) throw new Error(`model returned no text block (stop_reason=${j.stop_reason})`);
  return out;
}

export function parseModelJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error(`no JSON object in model output: ${raw.slice(0, 120)}`);
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Reject values the model should not have been able to produce. This is the
 * backstop for rule 1: a price that does not appear anywhere in the source text is
 * a hallucination regardless of how plausible it looks, so it gets nulled and flagged.
 */
export function validateAgainstSource(data, text) {
  const flags = [];
  const inText = (n) => {
    if (n == null) return true;
    // Match the number with or without thousands separators / decimals.
    const plain = String(n);
    const withCommas = Number(n).toLocaleString('en-US');
    const noCents = plain.replace(/\.00$/, '');
    return [plain, withCommas, noCents].some((v) => text.includes(v));
  };
  const check = (path, n) => { if (!inText(n)) { flags.push(`${path}=${n} not found in source text`); return null; } return n; };

  if (data.entryPaidPlan) {
    data.entryPaidPlan.monthlyBilledMonthly = check('entry.monthlyBilledMonthly', data.entryPaidPlan.monthlyBilledMonthly);
    data.entryPaidPlan.monthlyBilledAnnually = check('entry.monthlyBilledAnnually', data.entryPaidPlan.monthlyBilledAnnually);
  }
  if (data.highestPublishedPlan) {
    data.highestPublishedPlan.monthlyBilledAnnually = check('highest.monthlyBilledAnnually', data.highestPublishedPlan.monthlyBilledAnnually);
  }
  return { data, flags };
}

async function extractPricing(text, toolName) {
  const clipped = text.slice(0, 60000);
  const prompt = `You are extracting pricing facts for a public, citable price index. Accuracy matters more than completeness: a null is correct and useful, a guessed number is a defect.

Vendor: ${toolName}

${SCHEMA_NOTE}

--- BEGIN PAGE TEXT ---
${clipped}
--- END PAGE TEXT ---`;
  const raw = await callClaude(prompt);
  return parseModelJson(raw);
}

// ---------------------------------------------------------------------------
// Self-test: the extractor must survive known-positives and known-negatives.
// Runs fully offline, so CI can gate on it without an API key or network.
// ---------------------------------------------------------------------------
const FIXTURES = [
  {
    name: 'prices present -> validator keeps them',
    text: 'Professional plan $19.99 per month billed annually, 750 tasks/mo. Free plan includes 100 tasks.',
    data: { entryPaidPlan: { name: 'Professional', monthlyBilledMonthly: null, monthlyBilledAnnually: 19.99, unitIncluded: '750 tasks/mo' }, highestPublishedPlan: null },
    expect: (r) => r.data.entryPaidPlan.monthlyBilledAnnually === 19.99 && r.flags.length === 0,
  },
  {
    name: 'hallucinated price -> validator nulls it and flags',
    text: 'Core plan starts at $12 per month. Contact us for Enterprise.',
    data: { entryPaidPlan: { name: 'Core', monthlyBilledMonthly: 12, monthlyBilledAnnually: 9 }, highestPublishedPlan: null },
    expect: (r) => r.data.entryPaidPlan.monthlyBilledAnnually === null && r.flags.length === 1,
  },
  {
    name: 'comma-formatted price in source is recognised, not flagged',
    text: 'Scale plan $2,199 per month billed annually.',
    data: { entryPaidPlan: { name: 'Scale', monthlyBilledMonthly: null, monthlyBilledAnnually: 2199 }, highestPublishedPlan: null },
    expect: (r) => r.data.entryPaidPlan.monthlyBilledAnnually === 2199 && r.flags.length === 0,
  },
  {
    name: 'JS-rendered shell is detected as unreadable, not as "free"',
    text: 'Pricing Loading... Enable JavaScript to view this site.',
    kind: 'looksLikePricing',
    expect: (r) => r === false,
  },
  {
    name: 'real price table is detected as readable',
    text: 'Free $0 Core $12 per month Pro $21 per month billed annually 10,000 credits',
    kind: 'looksLikePricing',
    expect: (r) => r === true,
  },
  {
    // Regression lock for the symbol-only detector. schema.org Offers keep the number
    // and the currency in separate fields, so a page can be fully machine-readable
    // while containing no "$29" anywhere.
    name: 'schema.org Offer prices count as readable pricing (no currency symbol present)',
    kind: 'looksLikePricing',
    text: '"@type":"Offer","name":"Free","price":"0","priceCurrency":"USD" "price":"29","priceCurrency":"USD" "price":"69","priceCurrency":"USD" per month',
    expect: (r) => r === true,
  },
  {
    name: 'prose with no prices is still rejected',
    kind: 'looksLikePricing',
    text: 'Our pricing is simple and fair. Contact sales to discuss a plan that fits your team.',
    expect: (r) => r === false,
  },
  {
    name: 'model output wrapped in a code fence still parses',
    kind: 'parseModelJson',
    raw: '```json\n{"currency":"USD","hasFreeTier":true}\n```',
    expect: (r) => r.currency === 'USD' && r.hasFreeTier === true,
  },
  {
    name: 'html reduction drops scripts and tags',
    kind: 'htmlToText',
    raw: '<div><script>var x="$999";</script><p>Core $12/mo</p></div>',
    expect: (r) => r.includes('Core $12/mo') && !r.includes('999'),
  },
  {
    // Regression lock. The first version of this extractor stripped every <script>
    // and so reported n8n, Tally, ActiveCampaign and Brevo as having no published
    // pricing, when in fact their numbers live in an embedded JSON payload. Without
    // this fixture that failure is invisible: the run "succeeds" and simply produces
    // an index full of confident blanks.
    name: 'prices inside an embedded JSON payload are recovered, not lost',
    kind: 'pageText',
    raw: '<html><body><h1>Pricing</h1><script type="application/json">{"plans":[{"name":"Starter","priceMonthly":24,"currency":"USD"}]}</script></body></html>',
    expect: (r) => r.includes('priceMonthly: 24') && r.includes('name: Starter'),
  },
  {
    name: 'a page with prices only in JSON still reads as pricing',
    kind: 'looksLikePricingOnPageText',
    raw: '<html><body><p>Plans</p><script type="application/json">{"tiers":[{"label":"Pro","pricePerMonth":"$29 per month billed annually"},{"label":"Free","pricePerMonth":"$0"},{"label":"Max","pricePerMonth":"$99"}]}</script></body></html>',
    expect: (r) => r === true,
  },
  {
    name: 'homepage pricing link beats the guessed path',
    kind: 'pricingCandidates',
    homepage: 'https://example.com/',
    html: '<a href="/plans-and-pricing">Pricing</a>',
    expect: (r) => r[0] === 'https://example.com/plans-and-pricing',
  },
  {
    name: 'offsite pricing link is ignored',
    kind: 'pricingCandidates',
    homepage: 'https://example.com/',
    html: '<a href="https://other.com/pricing">Pricing</a>',
    expect: (r) => !r.some((u) => u.includes('other.com')),
  },
];

function runSelftest() {
  let pass = 0;
  const fails = [];
  for (const f of FIXTURES) {
    let got;
    try {
      if (f.kind === 'looksLikePricing') got = looksLikePricing(f.text);
      else if (f.kind === 'pageText') got = pageText(f.raw);
      else if (f.kind === 'looksLikePricingOnPageText') got = looksLikePricing(pageText(f.raw));
      else if (f.kind === 'parseModelJson') got = parseModelJson(f.raw);
      else if (f.kind === 'htmlToText') got = htmlToText(f.raw);
      else if (f.kind === 'pricingCandidates') got = pricingCandidates(f.homepage, f.html);
      else got = validateAgainstSource(structuredClone(f.data), f.text);
      if (f.expect(got)) { pass++; console.log(`  PASS  ${f.name}`); }
      else { fails.push(f.name); console.log(`  FAIL  ${f.name} -> ${JSON.stringify(got).slice(0, 160)}`); }
    } catch (e) {
      fails.push(f.name);
      console.log(`  ERROR ${f.name} -> ${e.message}`);
    }
  }
  console.log(`\nselftest: ${pass}/${FIXTURES.length} passed.`);
  if (fails.length) { console.error(`FAILED: ${fails.join('; ')}`); process.exit(1); }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function buildOne(tool, aff, overrides) {
  const base = { slug: tool.slug, name: tool.name, category: tool.category };
  if (!aff?.homepage) return { ...base, status: 'skipped', reason: 'no homepage in affiliate-links.ts' };

  const home = await getHtml(aff.homepage);
  const candidates = pricingCandidates(aff.homepage, home.html);

  let page = null;
  let sawBlock = false;
  for (const url of candidates) {
    const r = await getHtml(url);
    if (!r.ok) { if (r.status === 403 || r.status === 429) sawBlock = true; continue; }
    const text = pageText(r.html);
    if (looksLikePricing(text)) { page = { url: r.url, text }; break; }
    if (!page) page = { url: r.url, text, weak: true };
  }

  // A vendor that refuses automated requests is a different fact from a vendor whose
  // page we read and found no prices on. Keeping them apart is what lets the published
  // page say WHY a cell is empty instead of implying the tool has no published pricing.
  if (!page && sawBlock) {
    const ov = overrides.get(tool.slug);
    if (ov) return { ...base, status: 'ok', extraction: 'assisted', ...ov };
    return { ...base, status: 'blocked', reason: 'vendor refuses automated requests (HTTP 403/429 on every candidate URL)', triedUrls: candidates };
  }
  if (!page) {
    const ov = overrides.get(tool.slug);
    if (ov) return { ...base, status: 'ok', extraction: 'assisted', ...ov };
    return { ...base, status: 'unreachable', reason: 'no pricing page responded', triedUrls: candidates };
  }
  if (page.weak) {
    return { ...base, status: 'not-machine-readable', sourceUrl: page.url,
      reason: 'pricing page reachable but prices are not present in server-rendered text (client-side rendering or a paywall)' };
  }

  const raw = await extractPricing(page.text, tool.name);
  const { data, flags } = validateAgainstSource(raw, page.text);
  return { ...base, status: 'ok', extraction: 'automated', sourceUrl: page.url, ...data, validationFlags: flags };
}

/**
 * Rows for vendors that block automated fetching, read from their pricing page by
 * hand and committed with the same provenance fields the automated path records:
 * a sourceUrl and the date it was read. Kept in a separate file so a hand-entered
 * figure can never be mistaken for a scraped one, and so this script stays the only
 * thing that writes pricing-index.json.
 */
function loadOverrides() {
  const p = join(HERE, 'manual-overrides.json');
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    return new Map(Object.entries(j.tools || {}));
  } catch { return new Map(); }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); }
      catch (e) { out[idx] = { slug: items[idx].slug, name: items[idx].name, status: 'error', reason: String(e.message || e) }; }
      console.log(`  [${idx + 1}/${items.length}] ${items[idx].name}: ${out[idx]?.status || 'error'}`);
    }
  }));
  return out;
}

async function main() {
  if (SELFTEST) { console.log('Extractor self-test (offline)\n'); runSelftest(); return; }

  const tools = parseTools();
  const affiliates = parseAffiliates();
  let targets = tools.filter((t) => affiliates.has(t.slug));
  if (ONLY.length) targets = targets.filter((t) => ONLY.includes(t.slug));
  if (LIMIT) targets = targets.slice(0, LIMIT);

  console.log(`Pricing index -> ${APPLY ? 'APPLY' : 'DRY RUN'}  model=${MODEL}  tools=${targets.length}\n`);
  if (!API_KEY) { console.error('ANTHROPIC_API_KEY not set; extraction cannot run.'); process.exit(1); }

  // Never publish on a broken extractor.
  console.log('Self-test first:');
  runSelftest();
  console.log('');

  const overrides = loadOverrides();
  if (overrides.size) console.log(`Loaded ${overrides.size} manual override(s) for vendors that block automated fetching.\n`);
  const rows = await pool(targets, CONCURRENCY, (t) => buildOne(t, affiliates.get(t.slug), overrides));

  const byStatus = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  const flagged = rows.filter((r) => r.validationFlags?.length);
  console.log(`\nStatus: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join('  ')}`);
  if (flagged.length) {
    console.log(`\n${flagged.length} row(s) had a figure the source text did not contain (nulled):`);
    for (const f of flagged) console.log(`  ${f.name}: ${f.validationFlags.join('; ')}`);
  }

  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    model: MODEL,
    method: 'Each figure is read from the vendor\'s own public pricing page on the date shown, by an extractor forbidden from using prior knowledge. Any figure not literally present in that page is recorded as null rather than estimated.',
    counts: byStatus,
    tools: rows.sort((a, b) => a.name.localeCompare(b.name)),
  };

  if (!APPLY) {
    console.log(`\nDRY RUN. Re-run with --apply to write ${OUT}.`);
    console.log(JSON.stringify(payload.tools.slice(0, 2), null, 2));
    return;
  }
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${OUT} (${rows.length} tools).`);

  // A second copy under public/ so the dataset has a stable, citable download URL.
  // Publishing the raw data is most of why anyone links to a table like this, and it
  // is also what lets a reader check any figure without trusting the rendering.
  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(PUBLIC_OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${PUBLIC_OUT} (public download).`);
}

main().catch((e) => { console.error('\nFatal:', e.message || e); process.exit(1); });
