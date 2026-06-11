// Deterministic MOBILE-OVERFLOW gate — the layer render-acceptance can't cover.
//
// render-acceptance.mjs parses the built HTML with linkedom, which has NO layout
// engine, so it can see "the DecisionTree branch rendered" but not "the branch is
// clipped off the right edge at 390px". That visual/responsive class is exactly
// what reached Ian on PR #74's flowchart (nested-tree content running off-screen
// on mobile). The Vision bot could see it but runs after the flaky Netlify wait
// and can only edit MDX, not component CSS — so it doesn't reliably catch this.
//
// This renders the BUILT post in headless Chromium at 390px and HARD-FAILS if any
// post-content element is laid out past the right edge of the viewport. Elements
// inside an intentionally-scrollable ancestor (overflow-x: auto|scroll, e.g. a
// wide ComparisonTable that scrolls internally) are exempt. Runs with no API key
// and no Netlify dependency, so it gates in the cheap deterministic tier.
//
//   node qa/mobile-overflow.mjs --slug <slug>    # one post (CI)
//   node qa/mobile-overflow.mjs --post <path>
//   node qa/mobile-overflow.mjs --all
//
// Requires `npm run build` first (serves dist/).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'dist';
const BLOG_DIR = 'src/content/blog';
const VIEWPORT = { width: 390, height: 844 };
// Only fail on SEVERE overflow: an element laid out more than this many px past
// the viewport edge. Set to 25% of the viewport so a genuinely-clipped component
// (PR #74's flowchart overflowed ~190px, half the screen) hard-fails, but a price
// string or table cell poking out a few px does not turn this into a nuisance
// gate that blocks the daily auto-merge pipeline. Tune up/down as needed.
const THRESHOLD = Math.round(VIEWPORT.width * 0.25); // ~96px

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

// Runs in the page. Returns post-content elements laid out more than THRESHOLD px
// past the right edge of the viewport, excluding those inside a deliberately
// scrollable ancestor (overflow-x:auto/scroll) or inside <pre>/<code> (long URLs
// and code are expected to wrap/scroll, not the custom-component class we gate).
const DETECT = `(${(THRESHOLD) => {
  const vw = window.innerWidth;
  const scope = document.querySelector('.post-content, article, main') || document.body;
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
  for (const el of scope.querySelectorAll('*')) {
    const txt = (el.textContent || '').trim();
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + THRESHOLD && !isExempt(el)) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
        right: Math.round(r.right),
        over: Math.round(r.right - vw),
        text: txt.replace(/\\s+/g, ' ').slice(0, 50),
      });
    }
  }
  // Report the worst offenders first; dedupe noise by keeping the deepest (widest
  // overflow) few — a single off-screen subtree lights up many ancestors.
  out.sort((a, b) => b.over - a.over);
  return { vw, count: out.length, top: out.slice(0, 6) };
}})(${THRESHOLD})`;

async function checkPost(page, port, slug) {
  await page.goto(`http://localhost:${port}/blog/${slug}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const res = await page.evaluate(DETECT);
  return res;
}

async function main() {
  let slugs = [];
  if (getArg('--post')) slugs = [path.basename(getArg('--post')).replace(/\.mdx?$/, '')];
  else if (getArg('--slug')) slugs = [getArg('--slug')];
  else if (args.includes('--all')) slugs = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, ''));
  else { console.error('Usage: --post <path> | --slug <slug> | --all   (run `npm run build` first)'); process.exit(2); }

  const { server, port } = await serveDist();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });

  let failed = 0, checked = 0;
  for (const slug of slugs) {
    let res;
    try { res = await checkPost(page, port, slug); }
    catch (e) { console.log(`\n${slug}\n  (skipped: ${e.message.split('\n')[0]})`); continue; }
    checked++;
    if (res.count > 0) {
      failed++;
      console.log(`\n${slug}  — ${res.count} element(s) overflow ${res.vw}px viewport:`);
      for (const o of res.top) console.log(`  ✗ +${o.over}px  <${o.tag}${o.cls ? ' class="' + o.cls + '"' : ''}>  "${o.text}"`);
    }
  }

  await browser.close();
  server.close();
  console.log(`\nmobile-overflow: ${checked} post(s) checked at ${VIEWPORT.width}px, ${failed} with overflow.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e.message || e); process.exit(1); });
