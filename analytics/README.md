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
| `POSTHOG_PERSONAL_API_KEY` | for `--apply` | A **personal** key (`phx_...`). The `phc_` key in Analytics.astro is write-only ingest and cannot drive the management API. Create at PostHog -> Settings -> Personal API keys with scopes **`dashboard:read`, `dashboard:write`, `insight:read`, `insight:write`** (read is needed for the idempotency check; write to create). A key scoped to a single project is fine; the script resolves it via the `@current` alias. |
| `POSTHOG_PROJECT_ID` | no | Auto-discovered via `GET /api/projects/` if unset. |
| `POSTHOG_HOST` | no | Default `https://us.posthog.com` (US-cloud management host; differs from the `us.i.posthog.com` ingest host). |

### Usage (run from the repo root)

```sh
node analytics/posthog-setup.mjs                     # DRY RUN -> writes analytics/posthog-insights.json
node analytics/posthog-setup.mjs --apply             # create the dashboard + insights
node analytics/posthog-setup.mjs --update --apply    # ALSO rewrite existing insights that drifted
```

`--apply` alone only creates what is missing, so an insight that already exists can
never be corrected. `--update` diffs each live query against the definition here and
PATCHes the ones that differ. The diff canonicalizes both sides first (recursive key
sort, minus PostHog's server-managed `version` field), otherwise every insight reports
drift on every run.

### Project 408442 is shared with FlyrAI

PostHog project 408442 is named "The Automations Guide" but **FlyrAI ingests into it
too**, and it is the larger writer. All-time event split measured 2026-08-12:

| Source | Events | Share |
|---|---|---|
| FlyrAI production (`flyrai.vercel.app`) | 4,441 | 63.5% |
| TAG production | 1,560 | 22.3% |
| TAG Netlify deploy previews | 894 | 12.8% |
| localhost | 81 | 1.2% |

Until the projects are actually separated, every insight here scopes its
`$pageview` / `$autocapture` series to `$host = theautomationsguide.com`. Without that
scoping the dashboard overstated TAG by **3.6x on pageviews and 79x on form submits**
(the newsletter-intent tile was counting FlyrAI signups), and listed `github.com` as a
top TAG referrer when those 24 sessions were FlyrAI's.

`affiliate_click` series are deliberately **not** host-scoped: FlyrAI has no `/go/`
pages, so the event is TAG-exclusive by construction, and events captured before
2026-08-12 carry no `$host` at all — filtering would silently drop them.

**To finish the split, see [../TODO.md](../TODO.md).** It needs a PostHog UI action or an
org-scoped personal key; the key in `.env` is project-scoped and gets
`403 permission_denied` from `/api/organizations/` and `/api/projects/`, so no script
can create a project with it.

A keyless dry run still builds and writes `posthog-insights.json` (the exact
definitions) for review, so you can eyeball the queries before supplying a key.
With a key, the dry run also reports an accurate create/exists plan against live
PostHog.

`posthog-insights.json` is a git-ignored artifact (definitions on a dry run; the
created dashboard + insight ids after `--apply`).
