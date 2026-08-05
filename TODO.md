# theautomationsguide to-dos

Tracked by todo-sync (see ../todo-sync/CONVENTION.md). **Open tasks only, most important first — delete items when done** (history lives in [docs/SESSION_LOG.md](docs/SESSION_LOG.md)). Keep each item ≤3 lines; detail belongs in the linked doc. `npm run qa:docs` enforces both rules.

## TODO

- [ ] **[Brand-term 4c] Indie Hackers product page — UNBLOCKED, submit now** (new-account wait cleared ~2026-07-31). Paste-ready fields in [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) §Directory listings. @high @ian
- [ ] **[Brand-term 4e] AlternativeTo listing (DA 80) — UNBLOCKED, submit now** (account aged past 7 days ~2026-07-31). Paste-ready fields in [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) §Directory listings. @high @ian
- [ ] **Authority sprint (audit 8/04 §10 — the binding constraint):** LinkedIn 3-5x/wk from engine drafts; brand-search nudge in next newsletter/LinkedIn post (brand-term step 5); one linkable asset this month pitched to 5-10 RevOps newsletters/communities. @high @ian [audits/AUDIT-GROWTH-2026-08-04.md](audits/AUDIT-GROWTH-2026-08-04.md)
- [ ] **Merge PR #226** (waterfall-twins consolidation + Apollo cluster interlink + live `/go/findymail` 404 fix). QA green at open; classifier-gated so needs Ian. @high @ian
- [ ] **First GEO citation baseline (15 min):** run the 5 queries in ChatGPT/Perplexity/Claude/Gemini, log whether theautomationsguide.com is cited; repeat monthly. Never run; needed as the before/after marker for the authority work. @med @ian [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] **Backlink visibility (audit N-2):** export GSC → Links → Top linking sites CSV into the repo (API doesn't expose the Links report). 5 min, UI-only. @med @ian [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Apollo-cluster read (~2026-09-01):** re-pull GSC for the 5 interlinked Apollo pages (PR #226); success = "apollo vs pipedrive" avg pos < 20. Also check substack-to-kit impressions recovered post-title-rewrite (173→24 crash, see audit §2); if still cratered by ~8/20, revert that title to its pre-7/09 form. @med [audits/AUDIT-GROWTH-2026-08-04.md](audits/AUDIT-GROWTH-2026-08-04.md)
- [ ] **Split PostHog project 408442 (shared with FlyrAI)** so TAG pageviews/conversion read clean. `phx_` key + dashboard + `affiliate_click` funnel all work (7 clicks/21d as of 8/04); only the shared-project pollution remains. @med [analytics/README.md](analytics/README.md)
- [ ] **Cannibalization (audit C-1) remainder:** differentiate the 3 distinct-query clusters (Outreach pair, n8n-vs-Make trio, CRM trio) via titles/cross-links, or Ian confirms consolidation. Waterfall twins consolidated in PR #226; true-dup pair consolidation shipped PR #158. @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Make the weekly Content Calendar review BAU.** Census 8/04: 23 Queued / 41 Suggested (3 dups auto-Skipped by the new queue self-clean) — re-fill from Suggested, don't bulk-promote. `node --env-file=<token-env> backlog/build-backlog.mjs --status`. @med [backlog/README.md](backlog/README.md)
- [ ] **`updatedDate` upkeep mechanism (audit S-3):** lint-nudge or engine rule that bumps `updatedDate` on substantive edits so the freshness signal doesn't decay (bootstrap shipped PR #180; manual bumps in PR #226). Pairs with C-2 below. @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Volume-ramp cadence — HOLD at 1/day** (decided 2026-07-09; re-checked 8/04: 3-4 clicks/wk, gate = first 10-click week + indexation holding ≥95%). @med
- [ ] **Apply to affiliate Wave 2 (tools 11-20)** — include Findymail (registered pending 8/04, `/go/findymail` was a live 404). Paste-ready blocks in [APPLICATIONS.md](APPLICATIONS.md). @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Re-apply Pipedrive when PartnerStack Network approves.** @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Next GSC index re-check (~2026-09-01):** 179/188 indexed at 8/04 sweep; 8 unknown `/tools/` hubs + 1 crawled-not-indexed post submitted via IndexNow 8/04 — confirm they clear. @low [audits/AUDIT-GROWTH-2026-08-04.md](audits/AUDIT-GROWTH-2026-08-04.md)
- [ ] **Content for the remaining 5 orphan `/tools/` hubs** (LP-only, no linking prose exists): they need posts, not links. CI orphan-flow auto-links new hubs (PR #193). @low [audits/AUDIT-SEO-2026-07-13.md](audits/AUDIT-SEO-2026-07-13.md)
- [ ] **Freshness/decay policy (audit C-2):** quarterly pricing re-verification sweep cadence + date-or-consolidate the 2 undated legacy posts + the 5/08 cheap-outbound-stack post (only crawled-not-indexed straggler). @low [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Hubs for high-impression no-program tools (audit C-4):** decide whether gong/outreach/salesloft/zapier get `/tools/` hubs routing to adjacent live-affiliate tools. @low [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Audit lows remaining:** L-9 (8 logoless compared tools), L-10 (inline-style DRY-up), deferred Astro 4→6 major. @low [audits/AUDIT-FULL-2026-06-17.md](audits/AUDIT-FULL-2026-06-17.md)
- [ ] **Import the two Beehiiv newsletter templates — ON HOLD per Ian 2026-07-03** (fix readership before signups). Content blocks in [LINKEDIN_BEEHIIV.md](LINKEDIN_BEEHIIV.md) §B. @low
- [ ] **Verify Beehiiv signup form + test-signup attribution — ON HOLD** (traffic first). @low
- [ ] **Re-apply HubSpot and n8n affiliate programs** once traffic reaches ~1K visits/mo. @low [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Upgrade best-effort auto-registered logos** (justcall/aircall/krispcall) when convenient. @low
- [ ] **MoltSets hands-on accuracy follow-up** once Ian drops `MOLTSETS_API_KEY` into `.env`: run the coverage benchmark, upgrade the post to a hands-on review. @low
- [ ] **Build second lead magnet** ("all RevOps tools at $X/mo budget tier" spreadsheet, Beehiiv-gated) — gated on ~100 subscribers. @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
