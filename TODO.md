# theautomationsguide to-dos

Tracked by todo-sync (see ../todo-sync/CONVENTION.md). Open tasks below, most important first. Detail lives in CLAUDE.md and the linked docs.

## TODO

- [x] Merge PR #86 in the GitHub UI (workflow scope) — auto-fixer now routes component-internal/false-positive Vision verdicts to manual review instead of failing the whole QA job — merged 2026-06-12 `fd5ac9c` @high [TAG PR #86](https://github.com/homegrowngrowthco/theautomationsguide/pull/86)
- [x] Harden the Vision QA bot prompt (`qa/qa-pr-review.mjs` + human-report `qa-claude-review.mjs`) so it stops false-flagging the deliberately-stacked components (ChooseIf/StatRow/DecisionTree vertical list) as cramped/illegible — Session 31 follow-up #2, PR #87 merged 2026-06-12 `acfc62f`: re-scoped the cramped/decision-tree bullets + added "correct by design" carve-outs + a shouldFix-only-on-blocker/major rule; verified before/after on the Gong post (OLD `shouldFix:true` HIGH 4 majors -> NEW `shouldFix:false` 0 issues, 3 stable runs) @med [TAG PR #87](https://github.com/homegrowngrowthco/theautomationsguide/pull/87)
- [x] Keep the Content Calendar queue topped up now that the engine posts daily (else the "Slack Queue Empty" alert fires + the day is skipped). DONE: queued through 2026-07-08 as of 2026-06-12 (Ian). Revisit ~early July; backlog builder auto-stages Suggested Sun 2026-06-14, flip the best to Queued when topping up @low [backlog/README.md](backlog/README.md)
- [x] Apply to affiliate Wave 1 (10 tools, landing pages already live) — all 10 applied; 6 approved/live (Instantly, RB2B, Relevance AI, Pabbly, Lusha, Cal.com), 4 awaiting the programs' approval (AiSDR, Warmly, Synthflow, Surfer) which is on their timeline, not ours @high [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Request Indexing in GSC for the 32 not-yet-indexed URLs (9 newest posts + 23 tool LPs, all "URL is unknown to Google"); work top-down by priority, daily-cap limited, start 2026-06-10 @high [gsc-needs-indexing-2026-06-09.csv](gsc-needs-indexing-2026-06-09.csv)
- [ ] Re-run the GSC audit to verify indexing recovery after the trailing-slash (PR #63) + /tools A-Z index (PR #64) fixes, and catch any stragglers still "unknown to Google" — `C:\Users\Ian\.venvs\gsc\Scripts\python gsc-index-status.py` (or ask Claude to run it). HOLD until the Request-Indexing pass is complete (per Ian 2026-06-12); revisit after @med [gsc-index-status.py](gsc-index-status.py)
- [x] Fix the mobile homepage (Ian: "looks like trash") + harden QA for the class — Session 31, PR #84 merged 2026-06-12 `54b764e`: logo strip equal-width capped cells, beehiiv white-box→transparent, hero flowchart hidden on phones; new `qa/lint-logos.mjs` opaque-background gate wired into CI @high [CLAUDE.md](CLAUDE.md)
- [x] Merge content PR #74 (HubSpot vs Pipedrive Sequences; flattened to `<ChooseIf>` cards, verified clean mobile+desktop; auto-fixer band-aid dropped + hardened fixer merged into the branch) — merged 2026-06-11 `e30f3c3` @high [TAG PR #74](https://github.com/homegrowngrowthco/theautomationsguide/pull/74)
- [x] Ship the QA-hardening PRs: DecisionTree mobile fix (#76), mobile-overflow gate + flat-tree engine rule (#77), Vision bot -> local preview (#78), trailing-slash screenshot fix (#79), auto-fixer structural guard (#80) @high [qa/README.md](qa/README.md)
- [x] Add real Anthropic token-usage/cost logging to the engine (Compute Cost + Log Cost to Slack tail off the social branch; ~$0.17/article; LIVE on n8n 2026-06-11) @med [n8n/update-engine-usage-logging.mjs](n8n/update-engine-usage-logging.mjs)
- [x] Build the PostHog dashboards (analytics/posthog-setup.mjs; TAG Overview dashboard + 6 insights incl. the affiliate funnel created LIVE on project 408442, 2026-06-11) @high [analytics/README.md](analytics/README.md)
- [x] Generate LPs for the remaining first-mover star tools via `build-tool-lp.mjs --from-stars` (8 applied in PR #70: Mailforge/Surfe/LeadMagic/BetterContact/Vector/Vapi/Circleback/Fillout; fixed the dedup quote-bug in #69 first) @med [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [ ] Apply to affiliate Wave 2 (tools 11 to 20) @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] Review the first auto-staged backlog batch (Sun 2026-06-14) and flip the best to Queued; then make it weekly BAU @med [backlog/README.md](backlog/README.md)
- [ ] Decide the volume-ramp cadence and watch GSC indexation as the governor (supply is solved by the backlog builder; LP build rate + domain trust are the real pacers) @med [CLAUDE.md](CLAUDE.md)
- [ ] Import the two Beehiiv newsletter templates (manual in Beehiiv UI) @med [NEWSLETTER.md](NEWSLETTER.md)
- [ ] Create LinkedIn Company Page, send URL for sameAs @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Verify Beehiiv signup form renders and a test signup attributes to source page @med [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] Re-apply Pipedrive when PartnerStack Network approves @med [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md) (Lemlist went live 2026-06-11 `get.lemlist.com`, no longer waiting on a Smartlead-alt post)
- [ ] Verify GA4 Realtime shows a live visit on production @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Set up Microsoft Clarity (free heatmaps/session recordings; complements existing PostHog) @low [ANALYTICS.md](ANALYTICS.md)
- [ ] Re-apply HubSpot and n8n affiliate programs once traffic reaches ~1K visits/mo @low [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md)
- [x] Pointer-ize TAG's open-task tracking to a single source of truth (TODO.md), done 2026-06-11: deprecated the separate "TAG Tasks" Notion DB + repointed the CLAUDE.md "Open / pending" section to TODO.md (cross-project tracking-system roll-out) @low [todo-sync ROADMAP](../todo-sync/ROADMAP.md)
- [x] Build the /tools/<slug> LP-builder + ship LPs for the first 5 first-mover tools (Maildoso, Trigify, FullEnrich, Attio, Bland AI) @high [backlog/build-tool-lp.mjs](backlog/build-tool-lp.mjs)
- [x] Bump Node 20 actions in qa-content-pr.yml + auto-merge-content.yml (checkout/setup-node@v6, github-script@v8) before ~2026-06-16 @low [.github/workflows](.github/workflows)
- [x] Build the topic backlog builder (GHA-scheduled, dedup, stages Suggested) @high [backlog/README.md](backlog/README.md)
- [x] Re-import blog-post-engine.json for the light-format update (superseded by deploy-engine.mjs; engine re-deployed live Sessions 18-21) @high [n8n/deploy-engine.mjs](n8n/deploy-engine.mjs)
- [x] Build first lead magnet (RevOps Stack Audit Notion template) @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
