// Deterministic MOBILE-OVERFLOW gate — the layer render-acceptance can't cover.
//
// render-acceptance.mjs parses the built HTML with linkedom, which has NO layout
// engine, so it can see "the DecisionTree branch rendered" but not "the branch is
// clipped off the right edge at 390px". That visual/responsive class is exactly
// what reached Ian on PR #74's flowchart (nested-tree content running off-screen
// on mobile). The Vision bot could see it but runs after the flaky Netlify wait
// and can only edit MDX, not component CSS — so it doesn't reliably catch this.
//
// This renders the BUILT post (or homepage) in headless Chromium and HARD-FAILS on
// two independent overflow classes, each at 390px (mobile) and 1280px (desktop,
// matching the tools.astro QA breakpoint):
//   1. Viewport-edge overflow — an element laid out past the right edge of the
//      viewport (the original PR #74 class of bug).
//   2. Card-containment overflow — a child laid out past the right OR bottom edge
//      of its own .post-card/.step-card/.ci-card/.stat-card container. This is
//      the class the component-formatting-bugs fix PR added: a StepRow body with
//      an unbreakable long token overflows its own card horizontally without ever
//      crossing the viewport edge (masked by the next card's opaque background),
//      and a card grid growing unpredictably is a vertical-overflow variant of
//      the same defect. Scoped to card-grid areas explicitly (.card-grid,
//      .step-row, .chooseif-grid) since these sit in page templates (e.g. the
//      homepage) that render outside .post-content/article/main.
// Elements inside an intentionally-scrollable ancestor (overflow-x: auto|scroll,
// e.g. a wide ComparisonTable that scrolls internally) are exempt, as is anything
// inside <pre>/<code> (long URLs and code are expected to wrap/scroll). Runs with
// no API key and no Netlify dependency, so it gates in the cheap deterministic tier.
//
//   node qa/mobile-overflow.mjs --slug <slug>    # one post (CI)
//   node qa/mobile-overflow.mjs --post <path>
//   node qa/mobile-overflow.mjs --all            # every post + the homepage
//   node qa/mobile-overflow.mjs --home           # just the homepage
//
// Requires `npm run build` first (serves dist/).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'dist';
const BLOG_DIR = 'src/content/blog';
const VIEWPORTS = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 1280, height: 900, label: 'desktop' },
];
// Viewport-edge check: only fail on SEVERE overflow, 25% of that viewport's width
// past the edge. A genuinely-clipped component (PR #74's flowchart overflowed
// ~190px, half the screen) hard-fails, but a price string or table cell poking out
// a few px does not turn this into a nuisance gate. Tune up/down as needed.
const EDGE_THRESHOLD_RATIO = 0.25;
// Card-containment check: a much tighter tolerance, since ANY overflow past a
// card's own border (not the viewport) is a real layout defect regardless of
// magnitude — a few px covers rounding/antialiasing only.
const CARD_TOLERANCE = 4;
const CARD_SELECTOR = '.post-card, .step-card, .ci-card, .stat-card';

const args = process.argv.slice(2);
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.ico': 'image/x-icon' };

// Minimal static server over dist/. Maps directory URLs (.../) to index.html so
// the trailing-slash post routes resolve exactly as Netlify serves them.
function serveDist() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      let fp = path.join(DIST, p);
      try { if ((await stat(fp)).isDirectory()) fp = path.join(fp, 'index.html'); } catch {}
      const buf = await readFile(fp);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      res.end(buf);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

// Runs in the page. Returns elements laid out more than `threshold` px past the
// right edge of the viewport, scoped to prose + card-grid containers, excluding
// those inside a deliberately scrollable ancestor (overflow-x:auto/scroll) or
// inside <pre>/<code>.
function edgeDetectFor(threshold) {
  return `(${(t) => {
    const vw = window.innerWidth;
    const scopeSelectors = ['.post-content', 'article', 'main', '.card-grid', '.step-row', '.chooseif-grid'];
    const roots = new Set();
    for (const sel of scopeSelectors) document.querySelectorAll(sel).forEach((el) => roots.add(el));
    if (roots.size === 0) roots.add(document.body);
    const isExempt = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const tag = n.tagName;
        if (tag === 'PRE' || tag === 'CODE') return true;
        const ox = getComputedStyle(n).overflowX;
        // auto/scroll: intentionally scrollable (e.g. a wide ComparisonTable).
        // hidden: intentionally clipped (e.g. the homepage logo-strip marquee,
        // which renders its track at 2x width and animates it — the browser
        // never paints pixels past this edge, so it is not a visible defect).
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
        n = n.parentElement;
      }
      return false;
    };
    const seen = new Set();
    const out = [];
    for (const scope of roots) {
      for (const el of scope.querySelectorAll('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        const txt = (el.textContent || '').trim();
        if (!txt) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + t && !isExempt(el)) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
            right: Math.round(r.right),
            over: Math.round(r.right - vw),
            text: txt.replace(/\\s+/g, ' ').slice(0, 50),
          });
        }
      }
    }
    out.sort((a, b) => b.over - a.over);
    return { vw, count: out.length, top: out.slice(0, 6) };
  }})(${threshold})`;
}

// Runs in the page. Returns descendants of a .post-card/.step-card/.ci-card/
// .stat-card that spill past THAT CARD's own right or bottom edge — catches
// overflow masked by a sibling card's opaque background (never crosses the
// viewport edge) and vertical growth past the card boundary.
const CARD_DETECT = `(${(tolerance, cardSelector) => {
  const isExempt = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const tag = n.tagName;
      if (tag === 'PRE' || tag === 'CODE') return true;
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
      n = n.parentElement;
    }
    return false;
  };
  const out = [];
  for (const card of document.querySelectorAll(cardSelector)) {
    const cardRect = card.getBoundingClientRect();
    if (cardRect.width === 0 || cardRect.height === 0) continue;
    for (const el of card.querySelectorAll('*')) {
      const txt = (el.textContent || '').trim();
      if (!txt) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (isExempt(el)) continue;
      const overRight = r.right - cardRect.right;
      const overBottom = r.bottom - cardRect.bottom;
      if (overRight > tolerance || overBottom > tolerance) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
          cardCls: (typeof card.className === 'string' ? card.className : '').slice(0, 40),
          overRight: Math.round(overRight),
          overBottom: Math.round(overBottom),
          text: txt.replace(/\\s+/g, ' ').slice(0, 50),
        });
      }
    }
  }
  out.sort((a, b) => Math.max(b.overRight, b.overBottom) - Math.max(a.overRight, a.overBottom));
  return { count: out.length, top: out.slice(0, 6) };
}})(${CARD_TOLERANCE}, ${JSON.stringify(CARD_SELECTOR)})`;

async function checkPage(page, port, urlPath, label) {
  await page.goto(`http://localhost:${port}${urlPath}`, { waitUntil: 'networkidle', timeout: 60000 });
  let anyFail = false;
  const lines = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const threshold = Math.round(vp.width * EDGE_THRESHOLD_RATIO);
    const edge = await page.evaluate(edgeDetectFor(threshold));
    const card = await page.evaluate(CARD_DETECT);
    if (edge.count > 0) {
      anyFail = true;
      lines.push(`  [${vp.label} ${vp.width}px] ${edge.count} element(s) overflow the ${edge.vw}px viewport:`);
      for (const o of edge.top) lines.push(`    ✗ +${o.over}px  <${o.tag}${o.cls ? ' class="' + o.cls + '"' : ''}>  "${o.text}"`);
    }
    if (card.count > 0) {
      anyFail = true;
      lines.push(`  [${vp.label} ${vp.width}px] ${card.count} element(s) overflow their own card:`);
      for (const o of card.top) lines.push(`    ✗ +${o.overRight}px right / +${o.overBottom}px bottom  <${o.tag} class="${o.cls}"> in <.${o.cardCls.split(' ')[0]}>  "${o.text}"`);
    }
  }
  if (anyFail) console.log(`\n${label}\n${lines.join('\n')}`);
  return anyFail;
}

async function main() {
  let slugs = [];
  let checkHome = false;
  if (getArg('--post')) slugs = [path.basename(getArg('--post')).replace(/\.mdx?$/, '')];
  else if (getArg('--slug')) slugs = [getArg('--slug')];
  else if (args.includes('--all')) { slugs = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')); checkHome = true; }
  else if (args.includes('--home')) checkHome = true;
  else { console.error('Usage: --post <path> | --slug <slug> | --all | --home   (run `npm run build` first)'); process.exit(2); }

  const { server, port } = await serveDist();
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });

  let failed = 0, checked = 0;
  if (checkHome) {
    checked++;
    try { if (await checkPage(page, port, '/', 'homepage')) failed++; }
    catch (e) { console.log(`\nhomepage\n  (skipped: ${e.message.split('\n')[0]})`); }
  }
  for (const slug of slugs) {
    checked++;
    try { if (await checkPage(page, port, `/blog/${slug}/`, slug)) failed++; }
    catch (e) { console.log(`\n${slug}\n  (skipped: ${e.message.split('\n')[0]})`); }
  }

  await browser.close();
  server.close();
  console.log(`\nmobile-overflow: ${checked} page(s) checked at ${VIEWPORTS.map((v) => v.width + 'px').join('/')}, ${failed} with overflow.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e.message || e); process.exit(1); });
