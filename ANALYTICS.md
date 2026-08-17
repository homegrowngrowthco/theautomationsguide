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
  - `$current_url`, `$host`, `$pathname` — sent explicitly, because this page POSTs
    straight to the ingest API rather than going through the SDK, so nothing is
    auto-derived. `$host` was missing until 2026-08-12; every `affiliate_click`
    before that date has `$host = null` and cannot be filtered by site.

### Google Analytics 4 (live)
- **Measurement ID:** `G-RKWHJ95P3H` (hardcoded as the default in `Analytics.astro`, the same way the PostHog key is).
- Loaded via the standard `gtag.js` snippet, alongside PostHog, on every page.
- Tracks pageviews and GA4 enhanced-measurement defaults (scroll, outbound clicks, site search, file downloads).
- **Override (optional):** set `PUBLIC_GA4_ID` in Netlify env (or local `.env`) to point a given environment at a different property. The component falls back to the hardcoded id when that env var is unset.

## The non-production gate (applies to both)
Neither tool fires on `localhost`, `127.0.0.1`, `*.local`, or `*.netlify.app`, so local
dev and Netlify deploy previews do not pollute real numbers. To test tracking locally,
run this in the browser console and reload:
```js
localStorage.setItem('posthog_track_local', '1')
```
That override enables **both** PostHog and GA4.

> Deploy previews were **not** excluded before 2026-08-12, despite this section
> previously claiming previews were covered. Measured cost: 894 events across 85
> distinct `deploy-preview-N--theautomationsguide.netlify.app` hostnames, 12.8% of
> everything ever recorded in the project, each preview host counting as a separate
> "visitor". Historical numbers before that date are inflated accordingly; scope any
> backward-looking query to `$host = 'theautomationsguide.com'`.

## Project 408442 was shared with FlyrAI — split 2026-08-13
FlyrAI used to ingest into this project and was the larger writer (4,539 events, 63.5% of
all-time). It now has **its own project, 555096**: the new `phc_` token is in Vercel
`NEXT_PUBLIC_POSTHOG_KEY` for `contentengine/flyrai` and production was redeployed, so
flyrai.vercel.app stopped writing here from that deploy onward.

Two things this does NOT do:
- **History is not moved.** Every pre-split FlyrAI event still sits in 408442, so any
  backward-looking query must still scope by `$host` — the filter is permanent, not
  transitional.
- **Preview deploys are unset on purpose.** flyrai's Preview environment has no
  `NEXT_PUBLIC_POSTHOG_KEY` (nor any other var), so previews do not track. Measured
  before deciding: flyrai previews produced **0 events all-time**, so nothing is lost.

Every `$pageview`/`$autocapture` series in the **TAG Overview** dashboard scopes to the
production host. Match that in ad-hoc queries or you are reading a meal-planning app.

**Filter on BOTH host spellings.** A browser resolving the fully-qualified domain sends
the root-dotted form, so `$host` arrives as `theautomationsguide.com.` — measured
2026-08-13 at 3 events against 1,620. An `exact` filter on the bare string drops them
silently. PostHog treats an array under `exact` as IN, which is what
`PROD_HOSTS` in [analytics/posthog-setup.mjs](analytics/posthog-setup.mjs) uses (verified:
732 + 3 = 735).

**`@current` is not safe to resolve against any more.** It means "whichever project this
user last opened in the PostHog UI", so with two projects the same command resolved to
555096 and then 408442 within one session. `posthog-setup.mjs` REWRITES insight
definitions, so it now pins `TAG_PROJECT_ID = '408442'` (override with
`POSTHOG_PROJECT_ID`). See [analytics/README.md](analytics/README.md).

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

### Building them — `analytics/posthog-setup.mjs`
These are codified as a one-shot, idempotent setup script that creates the 4 above as **6 insights** pinned to a **TAG Overview** dashboard via the PostHog management API. See [analytics/README.md](analytics/README.md). To run the live create:
1. PostHog -> Settings -> Personal API keys -> create a key (`phx_...`) with insight + dashboard **write** scopes (the `phc_` key above is write-only ingest and can't drive the management API).
2. Add `POSTHOG_PERSONAL_API_KEY=phx_...` to the repo-root `.env`.
3. `node analytics/posthog-setup.mjs` (dry run, writes the definitions for review), then `node analytics/posthog-setup.mjs --apply`.

## Division of labor
- **PostHog** is the product-analytics source of truth: per-event detail, the `affiliate_click` funnel, autocapture, and custom funnels/dashboards.
- **GA4** is for Google-native reporting and Search Console integration (query data, channel grouping) that Google reports best on.

## No cookie banner
PostHog runs with `identified_only` and no cross-site advertising pixels, and the privacy policy reflects this. GA4 with default settings is analytics-only. Revisit consent if advertising/remarketing tags are ever added.
