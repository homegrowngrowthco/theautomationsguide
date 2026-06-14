#!/usr/bin/env node
/**
 * Deterministic sitewide on-page SEO scan of the BUILT dist/.
 *
 * Run `npm run build` first, then `node qa/seo-scan.mjs` (or `npm run qa:seo`).
 * Parses every dist/**\/index.html and reports per-page invariants that the
 * content linter (source-level) and render-acceptance (DOM structure) gates do
 * NOT cover: title/description length, canonical/og presence, H1 cardinality,
 * duplicate titles.
 *
 * noindex pages (the /go/ affiliate redirects carry `noindex,follow`) are
 * EXCLUDED from indexable-page checks — they legitimately have no description,
 * no H1, and no og:image, so counting them only creates noise.
 *
 * Thresholds reflect SERP rendering: titles truncate ~60 chars, descriptions
 * ~155-165. These are WARN-level (SEO hygiene), not hard build gates — the
 * script always exits 0 so it can run as an advisory step.
 */
import fs from 'fs';
import path from 'path';

const DIST = process.argv[2] || 'dist';
const TITLE_MAX = 62;        // incl. the " — The Automations Guide" brand suffix
const DESC_MAX = 165;
const DESC_MIN = 70;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'index.html') acc.push(p);
  }
  return acc;
}

if (!fs.existsSync(DIST)) {
  console.error(`dist not found at "${DIST}" — run \`npm run build\` first.`);
  process.exit(0);
}

const files = walk(DIST);
const out = { noDesc: [], noCanon: [], noOg: [], multiH1: [], noH1: [], longTitle: [], longDesc: [], shortDesc: [], emDashTitle: [] };
const titles = {};
let indexable = 0, noindex = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(DIST, path.dirname(f)).split(path.sep).join('/') + '/';
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/i) || [])[1] || '';
  if (/noindex/i.test(robots)) { noindex++; continue; }   // skip /go/ etc.
  indexable++;

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '';
  const canon = /<link rel="canonical"/i.test(html);
  const og = /<meta property="og:image"/i.test(html);
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;

  if (!desc) out.noDesc.push(rel);
  else if (desc.length > DESC_MAX) out.longDesc.push(`${rel} [${desc.length}]`);
  else if (desc.length < DESC_MIN) out.shortDesc.push(`${rel} [${desc.length}]`);
  if (!canon) out.noCanon.push(rel);
  if (!og) out.noOg.push(rel);
  if (h1 === 0) out.noH1.push(rel);
  if (h1 > 1) out.multiH1.push(`${rel} (${h1})`);
  if (title.length > TITLE_MAX) out.longTitle.push(`${rel} [${title.length}]`);
  if (/[–—]/.test(title)) out.emDashTitle.push(rel);
  (titles[title] = titles[title] || []).push(rel);
}

const dup = Object.entries(titles).filter(([t, a]) => a.length > 1 && t);
const show = (a, n = 30) => a.length ? '\n   ' + a.slice(0, n).join('\n   ') + (a.length > n ? `\n   ...(+${a.length - n} more)` : '') : ' none';

console.log(`SEO scan — ${indexable} indexable pages (+${noindex} noindex skipped) of ${files.length} total\n`);
console.log(`[HARD]  Missing canonical (${out.noCanon.length}):${show(out.noCanon)}`);
console.log(`[HARD]  No H1 (${out.noH1.length}):${show(out.noH1)}`);
console.log(`[HARD]  Multiple H1 (${out.multiH1.length}):${show(out.multiH1)}`);
console.log(`[HARD]  Missing meta description (${out.noDesc.length}):${show(out.noDesc)}`);
console.log(`[HARD]  Duplicate titles (${dup.length}):${dup.length ? '\n   ' + dup.map(([t, a]) => `${JSON.stringify(t)} ->${a.length}`).slice(0, 20).join('\n   ') : ' none'}`);
console.log(`[WARN]  Title > ${TITLE_MAX} chars (${out.longTitle.length}):${show(out.longTitle)}`);
console.log(`[WARN]  Description > ${DESC_MAX} chars (${out.longDesc.length}):${show(out.longDesc)}`);
console.log(`[WARN]  Description < ${DESC_MIN} chars (${out.shortDesc.length}):${show(out.shortDesc)}`);
console.log(`[WARN]  Missing og:image (${out.noOg.length}):${show(out.noOg)}`);
console.log(`[WARN]  Em/en dash in <title> (${out.emDashTitle.length}):${show(out.emDashTitle)}`);

const hard = out.noCanon.length + out.noH1.length + out.multiH1.length + out.noDesc.length + dup.length;
console.log(`\n${hard === 0 ? 'PASS' : 'REVIEW'} — ${hard} hard-class issues, ${out.longTitle.length + out.longDesc.length + out.shortDesc.length + out.noOg.length + out.emDashTitle.length} warnings (advisory, exit 0).`);
