# Off-Site SEO & Distribution Checklist

Last updated: 2026-05-03 EOD

## Search Engine Submission

- [x] Submit `https://theautomationsguide.com/sitemap-index.xml` in Google Search Console (2026-04-24)
- [x] Set up Bing Webmaster Tools (2026-04-24)
- [ ] Run URL Inspection → Request Indexing on homepage in GSC (after next push)
- [ ] Run URL Inspection → Request Indexing on `/blog`, `/tools`, `/about`

## Social & Brand Signals

- [ ] **Create LinkedIn Company Page for The Automations Guide.** Send URL — gets added to `sameAs` in `src/layouts/BaseLayout.astro`.
  - Note: company pages have ~3-5× lower organic reach than personal accounts. Consider also posting from Ian's personal LinkedIn (`/in/ianchamberland/`) for amplification.
- [ ] **Create Twitter/X account** (optional) — same drill, send URL when ready
- [ ] Add site URL to LinkedIn bio, GitHub profile, email signature

## Analytics

- [x] Install PostHog (cloud free tier, 1M events/mo) — wired via `src/components/Analytics.astro`
- [ ] Verify analytics fires correctly on production after next deploy (incognito test)
- [ ] Set up PostHog dashboard: top pages by traffic, affiliate_click events by tool, signup funnel

## Newsletter

- [x] Beehiiv account created, form embedded
- [x] Attribution.js loaded globally in `BaseLayout`
- [x] CSP updated to allow Beehiiv
- [ ] Verify form renders + a test signup attributes to source page

## Apple Touch Icon

- [x] Added at `public/apple-touch-icon.png` (HGC's icon)
- [x] Link active in `BaseLayout.astro`

## Content Distribution (ongoing)

- [ ] **LinkedIn posting** — 3-5× per week minimum. Use Daily Briefing Slack ping as your queue.
- [ ] **Pitch podcasts (2-3 per month):** RevOps Podcast (Sweep), Modern Sales, Sales Hacker Podcast, GTM Now
- [ ] **Join + participate in communities:** RevOps Co-op (Slack, free), Modern Sales Pros, Pavilion (paid)
- [ ] **Newsletter swaps:** find 3-5 small adjacent newsletters once you're at 100+ subs; do swaps. Beehiiv Boost program available at 500+
- [ ] Submit to: r/RevOps (be careful — read rules first), Indie Hackers, Hacker News (Show HN for big launches only)

## GEO Baseline Test (run once, then monthly)

Run these searches in **ChatGPT, Perplexity, Claude, and Gemini**. Log whether the site is cited. This is your "before" snapshot — re-run monthly and track improvement.

- [ ] "best RevOps automation blogs"
- [ ] "Make vs Zapier comparison for GTM teams"
- [ ] "how to automate sales handoff HubSpot Slack"
- [ ] "best RevOps automation tools 2026"
- [ ] "RevOps automation stack budget"

## Affiliate Program Applications

- [ ] **Tier 1** (apply this week — see `AFFILIATE_PROGRAMS.md`): HubSpot (email), Make, n8n, Apollo, Clay, Beehiiv, Smartlead, Pipedrive
- [ ] **Tier 2** (next 2 weeks): Webflow, ClickUp, Brevo, Hunter, Snov
- [ ] **Tier 3** (week 3): Cal.com, Plausible, Tally, Mailshake, Reply.io
- [ ] **Bonus list** (apply when content naturally mentions): Customer.io, LemonSqueezy, Mixmax, Mailerlite, Jotform

When approved: edit `src/data/affiliate-links.ts` → set `url` and change `status: 'pending'` to `'live'` → commit + push.

## Lead Magnets (when ready)

- [ ] Build first lead magnet — recommended: free Notion template like "RevOps Stack Audit Template"
- [ ] Build second — comparison spreadsheet, e.g., "All RevOps tools compared at $X/mo budget tier"
- [ ] Capture via Beehiiv-gated download
