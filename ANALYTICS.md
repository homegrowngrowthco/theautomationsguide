# Analytics

This site runs two analytics tools side by side. Both are loaded once, on every page, from [src/components/Analytics.astro](src/components/Analytics.astro) (rendered in `BaseLayout`). Both are gated to real traffic only.

## What is tracked

### PostHog (primary, already live)
- **Project key:** `phc_tfEQ3bUgg7uXppT2vXRqzPcnv9PiJWWWYjPGAV7Zaabv`
- **Host:** `https://us.i.posthog.com`
- **Config:** `person_profiles: 'identified_only'` (anonymous visitors do not create profiles, which keeps us under the free tier), `capture_pageview: true`, `autocapture: true`, `disable_session_recording: true`.
- **Captured automatically:** pageviews, plus autocaptured clicks, form submissions, and input changes (so most interactions are recorded without custom code).
- **Captured explicitly:** the `/go/<tool>` redirect pages fire an `affiliate_click` event before redirecting, with payload:
  - `tool` (slug, e.g. `make`)
  - `tool_name` (display name, e.g. `Make`)
  - `destination_url` (final URL)
  - `is_affiliate_url` (boolean: real affiliate link vs homepage fallback)
  - `referrer` (document referrer, or null)

### Google Analytics 4 (live)
- **Measurement ID:** `G-RKWHJ95P3H` (hardcoded as the default in `Analytics.astro`, the same way the PostHog key is).
- Loaded via the standard `gtag.js` snippet, alongside PostHog, on every page.
- Tracks pageviews and GA4 enhanced-measurement defaults (scroll, outbound clicks, site search, file downloads).
- **Override (optional):** set `PUBLIC_GA4_ID` in Netlify env (or local `.env`) to point a given environment at a different property. The component falls back to the hardcoded id when that env var is unset.

## The localhost gate (applies to both)
Neither tool fires on `localhost`, `127.0.0.1`, or `*.local`, so local dev and previews do not pollute real numbers. To test tracking locally, run this in the browser console and reload:
```js
localStorage.setItem('posthog_track_local', '1')
```
That override enables **both** PostHog and GA4.

## GA4 status and follow-ups
GA4 (`G-RKWHJ95P3H`) is live as of the design-refresh deploy. The CSP in [public/_headers](public/_headers) already allows the GA4 domains (`googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com`).
- **Verify after deploy:** open the live site (not localhost), and in GA4 → Reports → Realtime confirm your visit shows up. In devtools Network you should see a request to `googletagmanager.com/gtag/js?id=G-RKWHJ95P3H`.
- **Recommended:** link the GA4 property to Google Search Console (GA4 → Admin → Product links → Search Console) for query-level traffic data.
- **To repoint an environment** at a different property, set `PUBLIC_GA4_ID` in Netlify env (the `PUBLIC_` prefix is required so Astro exposes it client-side); otherwise it uses the hardcoded id.

## How to read traffic sources
- **PostHog → Web Analytics:** sessions by referrer and by UTM source/medium/campaign. Tag your newsletter and social links with `?utm_source=...&utm_medium=...` so they bucket cleanly.
- **GA4 → Reports → Acquisition → Traffic acquisition:** the equivalent channel/source view, plus Search Console queries once linked.

## Dashboards and funnels worth building (PostHog)
1. **Traffic overview** — pageviews and unique visitors by path, broken down by referrer and UTM source. Answers "who is coming and from where."
2. **Affiliate funnel** — a funnel from `pageview` to `affiliate_click`, broken down by `tool_name`. Shows per-tool click-through and which posts drive the most affiliate intent.
3. **Top content** — pageviews grouped by `/blog/<slug>` path, to see which posts earn attention.
4. **Newsletter** — Beehiiv handles signup analytics; in PostHog, watch traffic to `/#newsletter` and autocaptured submits on the signup form for on-site intent.

## Division of labor
- **PostHog** is the product-analytics source of truth: per-event detail, the `affiliate_click` funnel, autocapture, and custom funnels/dashboards.
- **GA4** is for Google-native reporting and Search Console integration (query data, channel grouping) that Google reports best on.

## No cookie banner
PostHog runs with `identified_only` and no cross-site advertising pixels, and the privacy policy reflects this. GA4 with default settings is analytics-only. Revisit consent if advertising/remarketing tags are ever added.
