# theautomationsguide to-dos

Tracked by todo-sync (see ../todo-sync/CONVENTION.md). Open tasks below, most important first. Detail lives in CLAUDE.md and the linked docs.

## TODO

- [ ] Keep the Content Calendar queue topped up now that the engine posts daily (else the "Slack Queue Empty" alert fires + the day is skipped). COVERED THROUGH ~JULY 2026 as of 2026-06-10 (Ian queued ~3 weeks ahead; may swap some out as the engine produces better content), so not urgent — revisit late June. Backlog builder auto-stages Suggested Sun 2026-06-14; flip the best to Queued when topping up @low [backlog/README.md](backlog/README.md)
- [ ] Apply to affiliate Wave 1 (10 tools, landing pages already live) @high [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Request Indexing in GSC for the 32 not-yet-indexed URLs (9 newest posts + 23 tool LPs, all "URL is unknown to Google"); work top-down by priority, daily-cap limited, start 2026-06-10 @high [gsc-needs-indexing-2026-06-09.csv](gsc-needs-indexing-2026-06-09.csv)
- [ ] Re-run the GSC audit ~2026-06-16 to verify indexing recovery after the trailing-slash (PR #63) + /tools A-Z index (PR #64) fixes, and catch any stragglers still "unknown to Google" — `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-index-status.py` (or ask Claude to run it) @med [gsc-index-status.py](gsc-index-status.py)
- [ ] Merge the QA-hardening PR (mobile-overflow gate + flat-tree engine rule) in the GitHub UI (touches `.github/workflows`, gh token lacks workflow scope), then re-run/merge content PR #74 (its DecisionTree now renders fine post-#76; only the Netlify-wait timeout failed it) @high [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)
- [ ] Point the QA Vision bot at a LOCAL preview build instead of waiting on Netlify, so the Netlify-wait timeout stops skipping the visual-review + auto-fix steps (the overflow gate already removes the dependency for the overflow class; this fixes it for the broader Vision pass) @med [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)
- [x] Add real Anthropic token-usage/cost logging to the engine (Compute Cost + Log Cost to Slack tail off the social branch; ~$0.17/article; LIVE on n8n 2026-06-11) @med [n8n/update-engine-usage-logging.mjs](n8n/update-engine-usage-logging.mjs)
- [x] Build the PostHog dashboards (analytics/posthog-setup.mjs; TAG Overview dashboard + 6 insights incl. the affiliate funnel created LIVE on project 408442, 2026-06-11) @high [analytics/README.md](analytics/README.md)
- [x] Generate LPs for the remaining first-mover star tools via `build-tool-lp.mjs --from-stars` (8 applied in PR #70: Mailforge/Surfe/LeadMagic/BetterContact/Vector/Vapi/Circleback/Fillout; fixed the dedup quote-bug in #69 first) @med [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [ ] Apply to affiliate Wave 2 (tools 11 to 20) @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Review the first auto-staged backlog batch (Sun 2026-06-14) and flip the best to Queued; then make it weekly BAU @med [backlog/README.md](backlog/README.md)
- [ ] Decide the volume-ramp cadence and watch GSC indexation as the governor (supply is solved by the backlog builder; LP build rate + domain trust are the real pacers) @med [CLAUDE.md](CLAUDE.md)
- [ ] Import the two Beehiiv newsletter templates (manual in Beehiiv UI) @med [NEWSLETTER.md](NEWSLETTER.md)
- [ ] Create LinkedIn Company Page, send URL for sameAs @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Verify Beehiiv signup form renders and a test signup attributes to source page @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Re-apply Pipedrive when PartnerStack Network approves; apply Lemlist when Smartlead-alt post lands @med [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md)
- [ ] Verify GA4 Realtime shows a live visit on production @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Set up Microsoft Clarity (free heatmaps/session recordings; complements existing PostHog) @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Re-apply HubSpot and n8n affiliate programs once traffic reaches ~1K visits/mo @low [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md)
- [x] Build the /tools/<slug> LP-builder + ship LPs for the first 5 first-mover tools (Maildoso, Trigify, FullEnrich, Attio, Bland AI) @high [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [x] Bump Node 20 actions in qa-content-pr.yml + auto-merge-content.yml (checkout/setup-node@v6, github-script@v8) before ~2026-06-16 @low [.github/workflows](.github/workflows)
- [x] Build the topic backlog builder (GHA-scheduled, dedup, stages Suggested) @high [backlog/README.md](backlog/README.md)
- [x] Re-import blog-post-engine.json for the light-format update (superseded by deploy-engine.mjs; engine re-deployed live Sessions 18-21) @high [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs)
- [x] Build first lead magnet (RevOps Stack Audit Notion template) @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
