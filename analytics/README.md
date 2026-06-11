# analytics/

Setup scripts for the site's analytics. The tracking plumbing itself lives in
[src/components/Analytics.astro](../src/components/Analytics.astro) (PostHog +
GA4, loaded on every page); see [ANALYTICS.md](../ANALYTICS.md) for what is
tracked and how to read it.

## posthog-setup.mjs

Creates the dashboards/insights from ANALYTICS.md ("Dashboards and funnels worth
building") via the PostHog management API and pins them to one **TAG Overview**
dashboard. The data has been flowing into PostHog for weeks (pageviews + the
`affiliate_click` event); this just builds the views to read it.

Idempotent (creates only what is missing, by name) and two-phase (DRY RUN by
default, `--apply` to mutate), matching `backlog/build-backlog.mjs` /
`n8n/deploy-engine.mjs`.

### Insights created

| Insight | ANALYTICS.md item |
|---|---|
| Traffic overview - pageviews & visitors by referrer | Traffic overview |
| Traffic by UTM source | Traffic overview |
| Affiliate funnel - pageview to affiliate_click by tool | Affiliate funnel |
| Affiliate clicks over time by tool | Affiliate funnel |
| Top content - pageviews by blog path | Top content |
| Newsletter / form intent | Newsletter |

### Env (project-root `.env`, loaded by dotenv)

| Var | Required | Notes |
|---|---|---|
| `POSTHOG_PERSONAL_API_KEY` | for `--apply` | A **personal** key (`phx_...`). The `phc_` key in Analytics.astro is write-only ingest and cannot drive the management API. Create at PostHog -> Settings -> Personal API keys; scopes: insight write + dashboard write, project read. |
| `POSTHOG_PROJECT_ID` | no | Auto-discovered via `GET /api/projects/` if unset. |
| `POSTHOG_HOST` | no | Default `https://us.posthog.com` (US-cloud management host; differs from the `us.i.posthog.com` ingest host). |

### Usage (run from the repo root)

```sh
node analytics/posthog-setup.mjs            # DRY RUN -> writes analytics/posthog-insights.json
node analytics/posthog-setup.mjs --apply    # create the dashboard + insights
```

A keyless dry run still builds and writes `posthog-insights.json` (the exact
definitions) for review, so you can eyeball the queries before supplying a key.
With a key, the dry run also reports an accurate create/exists plan against live
PostHog.

`posthog-insights.json` is a git-ignored artifact (definitions on a dry run; the
created dashboard + insight ids after `--apply`).
