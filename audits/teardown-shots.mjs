#!/usr/bin/env node
// Screenshot the reference sites for audits/DESIGN-TEARDOWN-2026-10.md.
// Copied from ../homecare-leadgen/scripts/teardown-shots.mjs and pointed at
// TAG's references. Writes to OUT (default C:/tmp/tag-shots/teardown). Not a QA
// gate; run by hand when the teardown needs refreshing.
//   node audits/teardown-shots.mjs            all sites, headless
//   node audits/teardown-shots.mjs g2 every   only these
//   HEADED=1 node audits/teardown-shots.mjs g2   sites that block headless
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.OUT || 'C:/tmp/tag-shots/teardown';
mkdirSync(OUT, { recursive: true });

const sites = [
  // Affiliate and review editorial (the model)
  ['wirecutter', 'https://www.nytimes.com/wirecutter/reviews/best-password-managers/'],
  ['zapier', 'https://zapier.com/blog/zapier-vs-make/'],
  ['ahrefs', 'https://ahrefs.com/blog/free-seo-tools/'],
  ['backlinko', 'https://backlinko.com/seo-tools'],
  ['every', 'https://every.to/'],
  ['lenny', 'https://www.lennysnewsletter.com/'],
  ['verge', 'https://www.theverge.com/reviews'],
  ['g2', 'https://www.g2.com/compare/apollo-io-vs-clay-clay'],
  ['capterra', 'https://www.capterra.com/p/132666/Pipedrive/'],
  // Product polish for components
  ['linear', 'https://linear.app/'],
  ['vercel', 'https://vercel.com/pricing'],
  ['stripedocs', 'https://docs.stripe.com/payments/checkout'],
  ['notiontemplates', 'https://www.notion.com/templates'],
  // TAG today, for the before
  ['tag-home', 'https://theautomationsguide.com/'],
  ['tag-post', 'https://theautomationsguide.com/blog/2026-05-06-apollo-vs-clay-vs-linkedin-sales-nav-best-for-outbound-2026/'],
  ['tag-tools', 'https://theautomationsguide.com/tools/'],
  ['tag-pricing', 'https://theautomationsguide.com/revops-automation-pricing/'],
];
const widths = [
  ['1440', { width: 1440, height: 900 }],
  ['390', { width: 390, height: 844 }],
];
const only = process.argv.slice(2);

const EXE = process.env.CHROME_EXE || 'C:/Users/Ian/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const browser = await chromium.launch({
  headless: !process.env.HEADED,
  executablePath: EXE,
  args: ['--disable-blink-features=AutomationControlled'],
});
for (const [name, url] of sites) {
  if (only.length && !only.includes(name)) continue;
  for (const [tag, viewport] of widths) {
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      isMobile: tag === '390',
      hasTouch: tag === '390',
      userAgent:
        tag === '390'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      locale: 'en-US',
    });
    // Keep our own visits out of TAG's analytics.
    await ctx.route(/posthog|googletagmanager|google-analytics|clarity\.ms/, (r) => r.abort());
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);
      for (const sel of ['#onetrust-accept-btn-handler', 'button:has-text("Accept all")', 'button:has-text("Accept All")', 'button:has-text("Accept")', 'button:has-text("I agree")', 'button:has-text("Got it")']) {
        const b = page.locator(sel).first();
        if (await b.isVisible({ timeout: 300 }).catch(() => false)) { await b.click().catch(() => {}); break; }
      }
      await page.screenshot({ path: join(OUT, `${name}-${tag}-fold.png`) });
      // Scroll once so lazy content renders, then cap the full-page height.
      await page.evaluate(async () => { for (let y = 0; y < 6000; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
      const h = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 7000);
      await page.setViewportSize({ width: viewport.width, height: h });
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(OUT, `${name}-${tag}-full.png`) });
      const title = await page.title();
      console.log(`ok   ${name} ${tag}  ${title.slice(0, 70)}`);
    } catch (e) {
      console.log(`FAIL ${name} ${tag}  ${String(e.message).split('\n')[0].slice(0, 100)}`);
    }
    await ctx.close();
  }
}
await browser.close();
