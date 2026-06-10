# theautomationsguide to-dos

Tracked by todo-sync (see ../todo-sync/CONVENTION.md). Open tasks below, most important first. Detail lives in CLAUDE.md and the linked docs.

## TODO

- [ ] Merge PR #68 in the GitHub UI (QA render gate + stop-silent-failures; workflow scope = UI-only), then it + a content PR exercising the gate = "Part A green" which unblocks daily posting @high [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)
- [ ] Part B: flip engine cron `0 8 * * 1-5`→`0 8 * * *` + add a "no queued topic" Slack alert, deploy via deploy-engine.mjs --apply (do AFTER #68 merged; needs >=7 topics Queued/week) @high [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs)
- [ ] Review/merge PR #70 (8 new first-mover LPs: Mailforge, Surfe, LeadMagic, BetterContact, Vector, Vapi, Circleback, Fillout) @high [src/data/tools.ts](src/data/tools.ts)
- [ ] Apply to affiliate Wave 1 (10 tools, landing pages already live) @high [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Request Indexing in GSC for the 32 not-yet-indexed URLs (9 newest posts + 23 tool LPs, all "URL is unknown to Google"); work top-down by priority, daily-cap limited, start 2026-06-10 @high [gsc-needs-indexing-2026-06-09.csv](gsc-needs-indexing-2026-06-09.csv)
- [ ] Re-run the GSC audit ~2026-06-16 to verify indexing recovery after the trailing-slash (PR #63) + /tools A-Z index (PR #64) fixes, and catch any stragglers still "unknown to Google" — `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-index-status.py` (or ask Claude to run it) @med [gsc-index-status.py](gsc-index-status.py)
- [x] Generate LPs for the remaining first-mover star tools via `build-tool-lp.mjs --from-stars` (8 applied in PR #70: Mailforge/Surfe/LeadMagic/BetterContact/Vector/Vapi/Circleback/Fillout; fixed the dedup quote-bug in #69 first) @med [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [ ] Apply to affiliate Wave 2 (tools 11 to 20) @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Review the first auto-staged backlog batch (Sun 2026-06-14) and flip the best to Queued; then make it weekly BAU @med [backlog/README.md](backlog/README.md)
- [ ] Decide the volume-ramp cadence and watch GSC indexation as the governor (supply is solved by the backlog builder; LP build rate + domain trust are the real pacers) @med [CLAUDE.md](CLAUDE.md)
- [ ] Import the two Beehiiv newsletter templates (manual in Beehiiv UI) @med [NEWSLETTER.md](NEWSLETTER.md)
- [ ] Create LinkedIn Company Page, send URL for sameAs @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Verify Beehiiv signup form renders and a test signup attributes to source page @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Re-apply Pipedrive when PartnerStack Network approves; apply Lemlist when Smartlead-alt post lands @med [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md)
- [ ] Build PostHog dashboards (traffic, affiliate_click funnel, signup) @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Verify GA4 Realtime shows a live visit on production @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Set up Microsoft Clarity (free heatmaps/session recordings; complements existing PostHog) @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Re-apply HubSpot and n8n affiliate programs once traffic reaches ~1K visits/mo @low [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md)
- [x] Build the /tools/<slug> LP-builder + ship LPs for the first 5 first-mover tools (Maildoso, Trigify, FullEnrich, Attio, Bland AI) @high [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [x] Bump Node 20 actions in qa-content-pr.yml + auto-merge-content.yml (checkout/setup-node@v6, github-script@v8) before ~2026-06-16 @low [.github/workflows](.github/workflows)
- [x] Build the topic backlog builder (GHA-scheduled, dedup, stages Suggested) @high [backlog/README.md](backlog/README.md)
- [x] Re-import blog-post-engine.json for the light-format update (superseded by deploy-engine.mjs; engine re-deployed live Sessions 18-21) @high [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs)
- [x] Build first lead magnet (RevOps Stack Audit Notion template) @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
