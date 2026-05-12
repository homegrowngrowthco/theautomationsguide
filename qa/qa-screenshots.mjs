// QA screenshot capture — visits all key pages at 4 breakpoints and saves
// full-page PNGs to qa-screenshots/<slug>/<viewport>.png.
//
// USAGE:
//   1. Build + preview the site:    npm run build && npm run preview
//   2. In another terminal:          npm run qa:screenshots
//
// Override the base URL to screenshot a deploy preview instead:
//   QA_BASE_URL=https://deploy-preview-N--theautomationsguide.netlify.app npm run qa:screenshots

import { chromium } from 'playwright';
import { readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:4321';
const OUT_DIR = './qa-screenshots';

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 800  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1280, height: 900  },
  { name: 'wide',    width: 1440, height: 900  },
];

// Anthropic Vision API rejects images with any dimension > 8000px.
// Full-page screenshots of long blog posts blow past that. Cap height
// at 7500px (margin below the limit) — captures the layout-issue-prone
// top of the page, drops below-the-fold content (FAQs, footer, etc.).
const MAX_SCREENSHOT_HEIGHT = 7500;

const STATIC_PAGES = ['/', '/blog', '/tools', '/about', '/search'];

const blogPosts = readdirSync('./src/content/blog')
  .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  .map((f) => `/blog/${f.replace(/\.(mdx|md)$/, '')}`);

const PAGES = [...STATIC_PAGES, ...blogPosts];

function slugify(url) {
  if (url === '/') return 'home';
  return url.replace(/^\//, '').replace(/\//g, '_');
}

async function run() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`→ Base URL: ${BASE_URL}`);
  console.log(`→ Capturing ${PAGES.length} pages × ${VIEWPORTS.length} viewports = ${PAGES.length * VIEWPORTS.length} screenshots`);

  const browser = await chromium.launch();

  for (const url of PAGES) {
    const slug = slugify(url);
    mkdirSync(path.join(OUT_DIR, slug), { recursive: true });

    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();

      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 15000 });

        // Measure full page height. If it would exceed Anthropic Vision's 8000px
        // limit, clip the screenshot to MAX_SCREENSHOT_HEIGHT instead.
        const pageHeight = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        const screenshotOpts = pageHeight > MAX_SCREENSHOT_HEIGHT
          ? {
              path: path.join(OUT_DIR, slug, `${vp.name}.png`),
              clip: { x: 0, y: 0, width: vp.width, height: MAX_SCREENSHOT_HEIGHT },
            }
          : {
              path: path.join(OUT_DIR, slug, `${vp.name}.png`),
              fullPage: true,
            };
        await page.screenshot(screenshotOpts);
        const clipped = pageHeight > MAX_SCREENSHOT_HEIGHT ? ` (clipped from ${pageHeight}px)` : '';
        console.log(`  ✓ ${slug}/${vp.name}.png${clipped}`);
      } catch (err) {
        console.log(`  ✗ ${slug}/${vp.name}.png — ${err.message}`);
      } finally {
        await ctx.close();
      }
    }
  }

  await browser.close();
  console.log(`\n→ Done. Screenshots in ${OUT_DIR}/`);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
