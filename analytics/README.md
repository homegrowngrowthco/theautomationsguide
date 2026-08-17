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
| `POSTHOG_PERSONAL_API_KEY` | for `--apply` | A **personal** key (`phx_...`). The `phc_` key in Analytics.astro is write-only ingest and cannot drive the management API. Create at PostHog -> Settings -> Personal API keys with scopes **`dashboard:read`, `dashboard:write`, `insight:read`, `insight:write`** (read is needed for the idempotency check; write to create). A key scoped to a single project is fine, and Ian's deliberately stays that way. |
| `POSTHOG_PROJECT_ID` | no | Defaults to the pinned `TAG_PROJECT_ID` (408442). **It is NOT auto-discovered:** `GET /api/projects/` returns 403 for a project-scoped key, and the `@current` alias follows whichever project was last opened in the PostHog UI, which returned two different ids inside one session on 2026-08-13. Set this only to point the script at a different project on purpose. |
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

### Project 408442 WAS shared with FlyrAI — split 2026-08-13

FlyrAI now ingests into its own project, **516881 ("flyrai")**. Its `phc_` token is in
Vercel `NEXT_PUBLIC_POSTHOG_KEY` for `contentengine/flyrai`, and production was
redeployed, so `flyrai.vercel.app` stopped writing here from that deploy onward.

**The `$host` scoping below is PERMANENT, not transitional.** Splitting the projects does
not move history: every pre-split FlyrAI event still sits in 408442, so any query that
looks back past 2026-08-13 still has to scope by host.

Two traps worth knowing before you touch this file:

- **A `phc_` ingest token does not reveal which project it belongs to** (not via
  `/decide`, not via `/array/<token>/config`). The receiving project was first recorded
  here as 555096, inferred from `@current`, and that was WRONG — 555096 ("Flyr") is a
  separate empty project. The only way to identify it is to see where events land.
- **Never resolve `@current`** in anything that writes. It follows whichever project was
  last opened in the PostHog UI and returned two different ids inside one session. This
  script pins `TAG_PROJECT_ID`.

All-time event split as measured 2026-08-12, the day before the split:

| Source | Events | Share |
|---|---|---|
| FlyrAI production (`flyrai.vercel.app`) | 4,441 | 63.5% |
| TAG production | 1,560 | 22.3% |
| TAG Netlify deploy previews | 894 | 12.8% |
| localhost | 81 | 1.2% |

Every insight here scopes its `$pageview` / `$autocapture` series to the TAG production
host. Filter on **both** spellings: a browser resolving the fully-qualified domain sends
the root-dotted `theautomationsguide.com.`, which an `exact` filter on the bare string
drops silently (3 events against 1,620). PostHog treats an array under `exact` as IN,
which is what `PROD_HOSTS` uses. Without host scoping the dashboard overstated TAG by
**3.6x on pageviews and 79x on form submits**
(the newsletter-intent tile was counting FlyrAI signups), and listed `github.com` as a
top TAG referrer when those 24 sessions were FlyrAI's.

`affiliate_click` series are deliberately **not** host-scoped: FlyrAI has no `/go/`
pages, so the event is TAG-exclusive by construction, and events captured before
2026-08-12 carry no `$host` at all — filtering would silently drop them.

**The key in `.env` is project-scoped and always will be** (Ian's standing decision,
2026-08-13, for a smaller blast radius). It gets `403 permission_denied` from
`/api/organizations/` and `/api/projects/`, so no script can create a project or read
any project it is not scoped to. Treat that as a permanent constraint to plan around,
not a blocker to raise again: anything cross-project needs Ian in the UI.

FlyrAI's project has **no insights or dashboards** and that is deliberate for now; it
collects raw events only.

A keyless dry run still builds and writes `posthog-insights.json` (the exact
definitions) for review, so you can eyeball the queries before supplying a key.
With a key, the dry run also reports an accurate create/exists plan against live
PostHog.

`posthog-insights.json` is a git-ignored artifact (definitions on a dry run; the
created dashboard + insight ids after `--apply`).
