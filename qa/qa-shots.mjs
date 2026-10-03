#!/usr/bin/env node
// Visual QA (design program 2026-10, adapted from homecare-leadgen): serve dist/
// on a throwaway port and screenshot every route at 390, 768 and 1440 px (full
// page). Fails on horizontal overflow or any console error. Screenshots go to OUT
// (default C:/tmp/tag-shots/qa, not committed): LOOK at them before asking anyone
// to review.
//   npm run build && npm run qa:shots            default route set
//   node qa/qa-shots.mjs /blog/<slug>/           only these routes
//   ROOT_FONT=20 node qa/qa-shots.mjs /blog/<slug>/   20 px root font check
// In Git Bash, prefix MSYS_NO_PATHCONV=1 when passing /route/ arguments.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const OUT = process.env.OUT || 'C:/tmp/tag-shots/qa';
mkdirSync(OUT, { recursive: true });
const EXE = process.env.CHROME_EXE || 'C:/Users/Ian/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const ROOT_FONT = Number(process.env.ROOT_FONT || 0);

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json', '.pf_meta': 'application/octet-stream' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  const found = existsSync(file);
  if (!found) file = join(dist, '404.html');
  res.writeHead(found ? 200 : 404, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

export const DEFAULT_ROUTES = [
  '/',
  '/tools/',
  '/tools/apollo/',
  '/tools/clay/',
  '/blog/2026-05-06-apollo-vs-clay-vs-linkedin-sales-nav-best-for-outbound-2026/',
  '/blog/2026-05-14-gong-vs-outreach-vs-salesloft-which-wins-in-2026/',
  '/blog/2026-09-01-activecampaign-vs-hubspot-vs-brevo-which-owns-your-workflows/',
  '/revops-automation-pricing/',
  '/about/',
  '/disclosure/',
  '/search/',
];
const routes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROUTES;
const widths = ROOT_FONT ? [390] : [390, 768, 1440];
const name = (r) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/^blog\/\d{4}-\d{2}-\d{2}-/, 'post-').replace(/[\/?=.]/g, '-').slice(0, 60));

const browser = await chromium.launch({ headless: true, executablePath: EXE });
const report = [];
for (const r of routes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
    // Third-party beacons are not part of the page under test.
    await ctx.route(/posthog|googletagmanager|google-analytics|clarity\.ms|beehiiv\.com/, (rt) => rt.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR_FAILED|ERR_BLOCKED/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + r, { waitUntil: 'networkidle' });
    if (ROOT_FONT) await page.addStyleTag({ content: `html{font-size:${ROOT_FONT}px !important}` });
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((res) => setTimeout(res, 30)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    // Clipped text inside a component is invisible to the page-overflow check (the
    // 10/02 teardown found price lines cut off inside the pick rows at 390).
    const clipped = await page.evaluate(() => [...document.querySelectorAll('main *, article *')]
      .filter((el) => { const cs = getComputedStyle(el); return el.children.length === 0 && el.textContent.trim() && cs.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis'; })
      .slice(0, 3).map((el) => el.textContent.trim().slice(0, 40)));
    const file = join(OUT, `${name(r)}-${w}${ROOT_FONT ? `-root${ROOT_FONT}` : ''}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    report.push({ route: r, w, overflow, clipped: clipped.length, errors: errors.length });
    const bad = overflow > 0 || clipped.length || errors.length;
    console.log(`${bad ? 'FAIL' : 'ok  '}  ${String(w).padStart(4)}  ${r.slice(0, 70).padEnd(72)} h=${h}${overflow > 0 ? `  overflow ${overflow}px` : ''}${clipped.length ? `  clipped: ${clipped.join(' | ')}` : ''}${errors.length ? '  console: ' + errors.join(' | ').slice(0, 160) : ''}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
const bad = report.filter((x) => x.overflow > 0 || x.clipped || x.errors);
console.log(`\n${report.length} screenshots in ${OUT}. ${bad.length} with overflow, clipped text or console errors.`);
process.exit(bad.length ? 1 : 0);
