#!/usr/bin/env node
// Lighthouse (mobile) on the built site (design program 2026-10, adapted from
// homecare-leadgen). Serves dist/ on a throwaway port, runs the key templates and
// exits 1 if any gate fails: Performance >= 95, Accessibility = 100, SEO = 100,
// CLS = 0, on the median of RUNS (default 3) runs per route.
// Usage: npm run build && npm run qa:lighthouse [route ...]
// Lighthouse scores SEO on a local host the same as production, except that
// `is-crawlable` is skipped when a page is deliberately noindex (/search/ etc.).
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const EXE = process.env.CHROME_EXE || 'C:/Users/Ian/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json' };
const server = createServer((req, res) => {
  let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/html' }); res.end(readFileSync(join(dist, '404.html'))); return; }
  const ext = extname(file);
  const headers = { 'content-type': types[ext] || 'application/octet-stream' };
  // Mirror Netlify: hashed assets and fonts are immutable.
  if (file.includes(join('dist', '_astro')) || ext === '.woff2' || ext === '.woff') headers['cache-control'] = 'public, max-age=31536000, immutable';
  res.writeHead(200, headers);
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/blog/2026-05-06-apollo-vs-clay-vs-linkedin-sales-nav-best-for-outbound-2026/', '/tools/', '/revops-automation-pricing/'];
const chrome = await chromeLauncher.launch({ chromePath: EXE, chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
for (const r of routes) {
  // Median of RUNS (default 3) by performance score: one local run swings +/-4
  // points (home measured 91, 94, 95 on one build), so a single run cannot gate.
  const runs = [];
  for (let i = 0; i < Number(process.env.RUNS || 3); i++) {
    runs.push((await lighthouse(base + r, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] })).lhr);
  }
  runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
  const lhr = runs[Math.floor(runs.length / 2)];
  const s = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
  const lcp = Math.round(lhr.audits['largest-contentful-paint'].numericValue);
  const cls = Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3));
  const row = { perf: s('performance'), a11y: s('accessibility'), bp: s('best-practices'), seo: s('seo') };
  const ok = row.perf >= 95 && row.a11y === 100 && row.seo === 100 && cls === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.slice(0, 60).padEnd(62)} perf ${row.perf}  a11y ${row.a11y}  bp ${row.bp}  seo ${row.seo}  LCP ${lcp}ms  CLS ${cls}`);
  if (!ok) {
    const bad = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1 && ['accessibility', 'seo', 'performance'].some((c) => lhr.categories[c].auditRefs.some((x) => x.id === a.id && x.weight > 0)));
    bad.slice(0, 10).forEach((a) => {
      console.log(`       ${a.id}: ${a.title} ${a.displayValue ? `(${a.displayValue})` : ''}`);
      // DETAIL=1 lists the failing elements (selector + snippet) for each audit.
      if (process.env.DETAIL) (a.details?.items || []).slice(0, 12).forEach((it) => {
        const n = it.node || it;
        if (n.selector || n.snippet) console.log(`           ${String(n.selector || '').slice(0, 90)}  ${String(n.snippet || '').slice(0, 110)}`);
        else if (it.url) console.log(`           ${String(it.url).slice(0, 110)} ${it.total ?? it.blockingTime ?? ''}`);
      });
    });
  }
}
await chrome.kill();
server.close();
process.exit(failed ? 1 : 0);
