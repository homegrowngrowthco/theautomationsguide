# Off-Site SEO & Submission Checklist

## Search Engine Submission

- [ ] Submit `https://theautomationsguide.com/sitemap-index.xml` in Google Search Console → Sitemaps
- [ ] Set up Bing Webmaster Tools → use "Import from GSC" option after GSC is live
- [ ] Run URL Inspection → Request Indexing on homepage in GSC
- [ ] Run URL Inspection → Request Indexing on `/blog`, `/tools`, `/about`

## Social & Brand Signals

- [ ] Create LinkedIn Company Page; add website URL; copy the page URL into the `sameAs` array in `src/layouts/BaseLayout.astro`
- [ ] Create Twitter/X account (or connect existing); add URL to `sameAs` in `BaseLayout.astro`
- [ ] Add site URL to LinkedIn bio, GitHub profile, email signature, Twitter/X bio

## Analytics

- [ ] Install Plausible Analytics (privacy-friendly, no cookie banners) — preferred for audience narrative
  - OR install Google Analytics 4 (more data, requires cookie consent banner in EU)
- [ ] Verify analytics script fires on all pages before enabling paid distribution

## Apple Touch Icon

- [ ] Add a 180×180px PNG at `public/apple-touch-icon.png`
- [ ] Uncomment the `<link rel="apple-touch-icon" ...>` line in `src/layouts/BaseLayout.astro`

## Beehiiv Newsletter (when ready)

- [ ] Swap `BEEHIIV_EMBED_URL_PLACEHOLDER` in `src/components/EmailSignup.astro` with real embed URL
- [ ] Update `Content-Security-Policy` in `public/_headers` to allow Beehiiv iframe:
  - Add `frame-src https://embeds.beehiiv.com` to the CSP directive
  - Add `form-action 'self' https://embeds.beehiiv.com` if the form posts to Beehiiv

## Content Distribution

- [ ] Submit to: r/RevOps, r/SaaS, Indie Hackers, DEV.to, Hashnode, Hacker News (Show HN)
- [ ] Reach out to: Pavilion, RevOps Co-op, Modern Sales Pros, Sales Hacker for guest posts or mentions

## GEO Baseline Test

Run these searches manually in ChatGPT, Perplexity, Claude, and Gemini. Log whether the site is cited — this is your before-picture.

- "best RevOps automation blogs"
- "Zapier vs Make comparison for GTM teams"
- "how to automate sales handoff HubSpot Slack"
- "RevOps tech stack 2025"

Re-run monthly and track improvement.

## Domain & Monetization (when 90+ days of consistent traffic)

- [ ] Register domain for resale at Sedo, Afternic, or Dan.com if applicable
- [ ] Apply to affiliate programs: Make, Zapier, n8n, HubSpot, Apollo, Clay
- [ ] Replace all `AFFILIATE_LINK_PLACEHOLDER` values in `src/pages/index.astro` and `src/pages/tools.astro`
