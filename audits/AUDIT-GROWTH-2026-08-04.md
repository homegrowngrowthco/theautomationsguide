# Growth Audit — Content, SEO/GEO, and 4-Week Time Allocation — 2026-08-04

> Findings frozen at write time (repo convention). Remediation tracked ONLY in [TODO.md](../TODO.md).
> Header note: same-day execution (Ian's green light) — queue self-clean wired into the weekly GHA + pair-wise/intent-aware dedup hardening (master `9168247`); Notion queue pruned (3 dups Skipped); waterfall twins consolidated + Apollo cluster interlinked + live `/go/findymail` 404 fixed (PR #226); 9 non-indexed URLs pushed via IndexNow. Remaining items are in TODO.md.
> Data: GSC 28d window 2026-07-05..2026-08-01 (+90d weekly trend), fresh URL Inspection sweep, PostHog `affiliate_click`, Notion queue census, live llms.txt/robots checks, web-mention search. Prior baselines: [AUDIT-GROWTH-2026-07-03.md](AUDIT-GROWTH-2026-07-03.md), [AUDIT-SEO-2026-07-13.md](AUDIT-SEO-2026-07-13.md).

## 1. Headline numbers (vs the 7/03 growth audit)

| Metric (28d) | 7/09 baseline | Now (8/01) | Read |
|---|---|---|---|
| Clicks | 8 | **11** | First sustained non-zero weeks ever: 4 / 3 / 4 clicks the last 3 weeks (was 0-2) |
| Impressions | 5,994 | **10,767** | +80%; weekly trend still climbing (2,318 → 2,778 last 4 wks) |
| CTR | 0.13% | 0.10% | Flat/floor |
| Avg position | 51 | **38.1** | +13 positions site-wide |

Ramp gate check (C-5: "revisit 2/day at first sustained 10-click week"): at 3-4 clicks/week. **Gate not met — HOLD 1/day stands.**

## 2. S-5 title/CTR read (was due ~7/30 — run today): VERDICT = FLAT → STOP

The 4 rewritten-title posts (PR #180, rewritten 7/09), post-rewrite window 7/10..8/01 vs prior 28d:

| Post | Pre (impr @ pos) | Post (impr @ pos) | Clicks post |
|---|---|---|---|
| apollo-vs-clay-vs-linkedin-nav | 45 @ 7.6 | 15 @ 8.5 | 1 |
| clay-smartlead-n8n | 36 @ 9.4 | 16 @ 10.3 | 0 |
| migrate-substack-to-kit | **173 @ 9.1** | **24 @ 16.2** | 0 |
| revops-stack | 19-22 @ ~8.7 | 20 @ 10.4 | 0 |

CTR did not move; the pre-registered decision rule says **stop rewriting titles, invest in authority**. Worse: substack-to-kit lost ~85% of impressions and 7 positions post-rewrite (could be demand seasonality, but the rewrite is the obvious suspect). The 34-post >62-char title editorial pass (@low in TODO) should stay parked; consider reverting the substack-to-kit title if it doesn't recover by ~8/20.

## 3. Where the clicks actually come from

All 11 clicks came from fresh comparison/review posts ranking pos 6-15 within days of publish: moltsets (2, pos 6.9 — "moltsets" 3.7% CTR), circleback-vs-fathom-vs-tldv (2, pos 7.8), loops-vs-customerio-vs-brevo (2 — **"loops vs brevo" pos 1.7, 10% CTR**), plus 1 each on apollo-sequences, beehiiv-kit-stack, apollo-vs-clay, and the two waterfall-enrichment twins. Pattern: **fresh, niche, low-competition 3-way comparisons and single-tool reviews convert; the engine's post-triage output mix is correct.**

Biggest unharvested impression pools (all clickless):
- **Apollo cluster**: "apollo vs pipedrive" 198 impr @ 26.5, "apollo vs hubspot" 68 @ 37.7, "apollo vs lusha" 19 @ 48, "apollo vs cognism" 13 @ 25.7; `/tools/apollo/` 277 impr @ 37.8. One directed push (interlink the 5 apollo pages, refresh the pipedrive-vs-apollo post, dated comparison table) could turn the site's largest demand pool into its first steady clicks.
- **Aircall cluster**: ~100 impr across pricing/alternatives/review queries but pos 57-81 — too far off; leave to compound.
- **"relevance ai" review/alternatives**: 91 impr @ pos 86-99 — page 9; not actionable by content alone (authority problem).

## 4. NEW cannibalization found (C-1 class, live)

`2026-07-13-fullenrich-vs-bettercontact-vs-surfe` and `2026-07-16-bettercontact-vs-fullenrich-vs-leadmagic` are both "waterfall enrichment" trios sharing 2 of 3 anchor tools (the 7/13 description even names LeadMagic), published 3 days apart. GSC: 46 impr @ 25.7 vs 62 impr @ 35.0 — classic split signal. The 0.72 near-dup threshold misses reordered tool lists. Fix: consolidate (301 weaker → stronger) or hard-differentiate; and make the dedup index order-insensitive on the tool-set.

Prior C-1 remainder (Outreach pair, n8n-vs-Make trio, CRM trio) still open.

## 5. Indexation (re-check was due ~7/27 — run today)

Full URL Inspection sweep of all 188 sitemap URLs (run 2026-08-04):

- **179/188 Submitted and indexed (95%)** — indexation is keeping pace with 1/day publishing; the ramp-gate's indexation condition is comfortably met.
- 1 × "Crawled - currently not indexed": `2026-05-08-cheap-outbound-sales-stack-for-small-b2b-teams-under-200mo/` (a different straggler than the 7/13 audit's; that one cleared). Candidate for the C-2 date-or-consolidate sweep rather than urgent action.
- 8 × "URL is unknown to Google": all `/tools/` hubs (calendly, cognism, gumloop, mailshake, moltsets, quickmail, saleshandy, zoominfo) — mostly LP-only orphan hubs plus the newer moltsets/zoominfo registrations. **All 9 non-indexed URLs submitted via IndexNow (HTTP 200) during this audit**; the durable fix for the orphans is still content that links them (existing @low TODO).

## 6. GEO state

- **Surface: good.** `llms.txt` live and current (includes the 8/04 post, full article list + descriptions); robots.txt explicitly allows GPTBot/ChatGPT-User/OAI-SearchBot/ClaudeBot/PerplexityBot; FAQPage + Article JSON-LD wired; trailing-slash canonicals consistent.
- **Citations: unmeasured.** The monthly 5-query GEO baseline (ChatGPT/Perplexity/Claude/Gemini — does the site get cited?) has never been run; it predates measurable GEO traffic anyway, but the first baseline should be logged this month so there's a before/after when authority work lands.
- GEO outcomes are downstream of the same bottleneck as SEO: **third-party authority signals.** No shortcut exists on-site; the off-site work below is the GEO work.

## 7. Off-site / authority: the confirmed bottleneck

- Web search for `"theautomationsguide.com"` excluding the domain itself returns **zero third-party mentions**. GSC links export (N-2) still pending, but the picture is unambiguous: ~0 referring domains.
- Brand SERP: inner pages surface for the exact-phrase brand query but the homepage does not own position 1 for "The Automations Guide".
- The two gated directory listings (Indie Hackers 4c, AlternativeTo 4e — DA 80) **became submittable 7/31 and are now unblocked.** Paste-ready copy sits in [OFF_SITE_SEO_CHECKLIST.md](../OFF_SITE_SEO_CHECKLIST.md).
- Distribution cadence (LinkedIn 3-5x/wk) is just starting (Ian began posting; the engine's LinkedIn-draft truncation bug was fixed S73, so drafts are now complete with CTA + URL).

## 8. Monetization

`affiliate_click`: 7 clicks across 6 tools in the 21 days since tracking went live (PR #212). Non-zero and diversified, but revenue-immaterial at current traffic. Wave 2 affiliate applications (@med) are correctly sequenced behind traffic. No change.

## 9. Content pipeline health

- Queue census: **23 Queued / 41 Suggested / 92 Published / 147 Skipped** — ~3 weeks runway, healthy bench. (Local note: no `NOTION_TOKEN` env exists on this machine; census ran via todo-sync's `NOTION_API_KEY`.)
- Post-triage output mix verified on the last 21 posts: migrations + connect/workflow tutorials + 3-way comparisons, **zero "alternatives" posts**. The engine is following the 7/15 playbook.
- `--audit-queue --prune-apply` still not wired into the weekly GHA (top TODO) — the queue self-cleaning gap that let the waterfall twins through is exactly this class.

## 10. Four-week time allocation (8/04 → 9/01)

**The data says: content supply is solved and correctly formatted; packaging (titles) is proven not to be the lever; authority is the binding constraint for both SEO and GEO.** Direct time accordingly:

**~60% — Authority & distribution (the only lever that moves position 38 → page 1):**
1. Submit Indie Hackers + AlternativeTo listings **this week** (both now unblocked; ~30 min total, paste-ready). [Ian]
2. LinkedIn cadence 3-5x/wk from the engine's now-untruncated drafts; monthly RevOps Co-op Slack + IH post. [Ian, ~2h/wk]
3. Brand-search nudge in the next newsletter/LinkedIn post (brand-term step 5). [Ian]
4. One linkable asset this month (e.g. original data: "we ran the 5 GEO queries across 4 assistants" or the waterfall-enrichment hit-rate data already in the twins) pitched to 5-10 RevOps newsletters/communities. [Ian + Claude]
5. Export GSC → Links CSV into the repo (N-2) so referring-domain growth is trackable. [Ian, 5 min]

**~30% — Harvest near-wins on-site (Claude-executable):**
6. Apollo cluster push: interlink `/tools/apollo/` + the 4 apollo comparison posts, refresh pipedrive-vs-apollo with a dated comparison table + `updatedDate` bump. Largest clickless impression pool on the site.
7. Resolve the waterfall-enrichment twins (consolidate or differentiate) + make dedup order-insensitive; then the C-1 remainder clusters.
8. Wire `--audit-queue --prune-apply` into the weekly GHA (top TODO, ~15 min).

**~10% — Measurement hygiene:**
9. Run the first GEO citation baseline (5 queries × 4 assistants, log results). [Ian, 15 min]
10. `updatedDate` upkeep mechanism (S-3) so freshness doesn't decay silently.

**Explicitly NOT this month:** title rewrites (S-5 verdict: flat), volume ramp to 2/day (gate unmet: need a 10-click week), newsletter templates/Beehiiv work (on hold pending readership), the 34-title editorial pass, PostHog project split (do when convenient, it's not blocking any decision this month).

**Success check ~9/01:** first 10-click week; ≥2 referring domains visible; brand SERP #1; apollo cluster average position < 20; GEO baseline logged.
