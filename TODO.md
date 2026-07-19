# theautomationsguide to-dos

Tracked by todo-sync (see ../todo-sync/CONVENTION.md). **Open tasks only, most important first — delete items when done** (history lives in [docs/SESSION_LOG.md](docs/SESSION_LOG.md)). Keep each item ≤3 lines; detail belongs in the linked doc. `npm run qa:docs` enforces both rules.

## TODO

- [ ] **Wire `--audit-queue --prune-apply` into the weekly topic-backlog GHA** (after the staging step) so stale duplicates self-clean before they can auto-publish. Shipped in PR #202 (`efd7c25`); NOTION_TOKEN is already a repo secret. @med [.github/workflows/topic-backlog.yml](.github/workflows/topic-backlog.yml)
- [ ] **PostHog personal API key (`phx_`) + full VS Code restart (Ian)** so sessions can pull `affiliate_click` conversion data — the only revenue-true success metric (impressions/position are proxies). Blocked S68. @med @ian
- [ ] **Win the brand term "The Automations Guide" — remaining steps:** (4) directory listings 4c/4d/4e below, (5) brand-search nudge in the next newsletter/LinkedIn post. Steps 1-3 + 4a (Crunchbase) + 4b (Product Hunt) done; diagnosis + history in the session log (S41). @high [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] **[Brand-term 4c] Indie Hackers product page** (~5 min, DA 75). Paste-ready fields in [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) §Directory listings. @high @ian
- [ ] **[Brand-term 4d] BetaList listing** (~5 min, DA 75; skip the $129 fast-track). Paste-ready fields in [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) §Directory listings. @high @ian
- [ ] **[Brand-term 4e] AlternativeTo listing** (~5 min, DA 80). Paste-ready fields in [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) §Directory listings. @high @ian
- [ ] **Re-run `gsc-index-status.py` ~2026-07-27** to confirm the last "Crawled - currently not indexed" post clears (140/145 indexed at the 2026-07-13 audit; the 7 URLs from 7/07 transitioned). @med [audits/AUDIT-SEO-2026-07-13.md](audits/AUDIT-SEO-2026-07-13.md)
- [ ] **Make the weekly Content Calendar review BAU.** Queue was data-triaged S68 (2026-07-15) to 14 Queued / 18 Suggested / 126 Skipped — re-fill from the Suggested bench, don't bulk-promote. Census: `node --env-file=<token-env> backlog/build-backlog.mjs --status`. @med [backlog/README.md](backlog/README.md)
- [ ] **Read the title/CTR result in GSC (audit S-5), due ~2026-07-30:** re-run `gsc-search-analytics.py`, compare the 4 rewritten titles (PR #180) against the 7/09 baseline (8 clicks / 5,994 impr / CTR 0.13% / pos 51). CTR moved → extend the pass; flat → stop rewriting titles, invest in authority. @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Cannibalization (audit C-1) remainder:** differentiate the 3 distinct-query clusters (Outreach pair, n8n-vs-Make trio, CRM trio) via titles/cross-links, or Ian confirms full consolidation. Consolidation of the true duplicates shipped (PR #158). @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **`updatedDate` upkeep mechanism (audit S-3):** lint-nudge or engine rule that bumps `updatedDate` on substantive edits so the freshness signal doesn't decay (bootstrap shipped in PR #180). Pairs with C-2 below. @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Backlink visibility (audit N-2):** export GSC → Links → Top linking sites CSV into the repo (API doesn't expose the Links report). @med [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Volume-ramp cadence — HOLD at 1/day** (decided 2026-07-09). Gate 2/day on: indexation keeping pace + first real clicks + CTR off the floor. @med
- [ ] **Apply to affiliate Wave 2 (tools 11-20).** Paste-ready application blocks per tool in [APPLICATIONS.md](APPLICATIONS.md). @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Re-apply Pipedrive when PartnerStack Network approves.** @med [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Editorial pass on the 34 posts/hubs with raw titles >62 chars** (re-counted 2026-07-13) (list via `npm run qa:seo`). Long headlines, so per-post rewrites; batch-trim opportunistically when touching a post. @low
- [ ] **Content for the remaining 5 orphan `/tools/` hubs** (down from 16/67): LP-only hubs with no article, so they cannot be linked from prose that does not exist — they need posts, not links. The CI orphan-flow auto-links new hubs going forward (PR #193). @low [audits/AUDIT-SEO-2026-07-13.md](audits/AUDIT-SEO-2026-07-13.md)
- [ ] **Freshness/decay policy (audit C-2):** decide cadence for a quarterly pricing re-verification sweep + date-or-consolidate the 2 undated legacy posts. @low [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Hubs for high-impression no-program tools (audit C-4):** decide whether gong/outreach/salesloft/zapier get `/tools/` hubs routing to adjacent live-affiliate tools (gong-alternatives = top-impression page). @low [audits/AUDIT-GROWTH-2026-07-03.md](audits/AUDIT-GROWTH-2026-07-03.md)
- [ ] **Audit lows remaining:** L-9 (8 logoless compared tools), L-10 (inline-style DRY-up), deferred Astro 4→6 major (clears last 2 high + 7 moderate advisories). @low [audits/AUDIT-FULL-2026-06-17.md](audits/AUDIT-FULL-2026-06-17.md)
- [ ] **Import the two Beehiiv newsletter templates — ON HOLD per Ian 2026-07-03** (fix readership before signups). Content blocks in [LINKEDIN_BEEHIIV.md](LINKEDIN_BEEHIIV.md) §B. @low
- [ ] **Verify Beehiiv signup form + test-signup attribution — ON HOLD** (traffic first); fold into whichever session next touches the newsletter. @low
- [ ] **Re-apply HubSpot and n8n affiliate programs** once traffic reaches ~1K visits/mo. @low [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Upgrade best-effort auto-registered logos** (justcall/aircall/krispcall): drop higher-res marks into `public/brand/tools/` when convenient. @low
- [ ] **GEO baseline test (~15 min, monthly):** run the 5 queries in ChatGPT/Perplexity/Claude/Gemini, log whether theautomationsguide.com is cited. @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] **Launch content distribution cadence:** LinkedIn 3-5x/week (Daily Briefing ping = queue), monthly RevOps Co-op Slack + IH, r/RevOps / Show HN for launches; swaps at 100+ subs, podcasts/Boost at 500+. @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
- [ ] **Build second lead magnet** ("all RevOps tools at $X/mo budget tier" spreadsheet, Beehiiv-gated) — gated on ~100 subscribers. @low [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md)
