# Index Audit (GSC sweep): 2026-09-06

> **RESOLUTION (2026-09-06):** the ~9/01 re-check that four TODO items were waiting on. Read-only against Google (URL Inspection API for index verdicts, Search Analytics API for clicks/position). Findings freeze here; remediation tracked ONLY in [TODO.md](../TODO.md), and the exact replacement text per TODO line is in the last section. Nothing was edited in TODO.md by this sweep.
> Raw pulls, same directory: [gsc-2026-09-06-inspect-targets.json](gsc-2026-09-06-inspect-targets.json) (31 targeted URL inspections), [gsc-2026-09-06-search-analytics.json](gsc-2026-09-06-search-analytics.json) (daily/weekly clicks, "apollo vs pipedrive" windows, cluster page stats), [gsc-2026-09-06-full-sweep.txt](gsc-2026-09-06-full-sweep.txt) (every sitemap URL, verbatim `gsc-index-status.py` output).
> Windows: Search Analytics ends 2026-09-03 (GSC settles ~3 days back), so "last 28 days" = 2026-08-07..2026-09-03 and "pre-08-12" = 2026-07-16..2026-08-12. URL Inspection is live as of the run time on 2026-09-06.

## Verdict up front

| # | TODO line | Question | Verdict |
|---|---|---|---|
| 1 | 7 | Do the 7 hubs minted 8/12 index? | **All 7 indexed** (crawled 08-16..08-20), and 6 of them are still blurb-only (no body, no FAQs). The "sit unknown like the other 9" scenario did not happen. Item can close. |
| 2 | 16 | Indexation split test | **7 of 8 indexed.** All 6 control hubs (FAQs + prose, zero inbound links) indexed; treatment split 1/2 (zoominfo indexed, calendly "Discovered, currently not indexed", never crawled). The item's "all 8 index" read is the one that applies: links were not required. Whether FAQs or the 08-19 sitemap re-read did it cannot be separated (same 24 hours). |
| 3 | 12 | "apollo vs pipedrive" avg position < 20? | **Not met: 24.0** on the 28d window (147 impr, 0 clicks). But it moved: 27.0 pre-08-12, 22.4 post-08-13, last two full weeks 22.8 and 22.1. The pipedrive post itself sits at 17.3; the `/tools/apollo/` hub also ranks for the query at 44.3 and drags the blended number. |
| 4 | 14 | 10-click week? Indexation >= 95%? | **No 10-click week yet; best is 9** (Mon 08-24..Sun 08-30). Weekly clicks 4, 3, 4, 5, 7, 4, 9, then 4 in the partial current week. Indexation **219 of 233 sitemap URLs = 94.0%** raw (96.5% once the 6 posts published in the last 7 days are excluded as normal lag). Raw figure is below the 95% gate by 2 URLs; the shortfall is 7 May-era or legacy "crawled, not indexed" posts (was 5 on 8/19). HOLD at 1/day stands. |
| 5 | 20, 22 | Request Indexing needed for reply-io, 6 hubs, factors-ai, prospeo? | **No. All 9 are already "Submitted and indexed."** Line 20 can close; line 22's indexation motive is gone. |

Also for the record: the 08-19 audit's sentence "4 of the 7 hubs minted 8/12 (motion, trigify, factors-ai, prospeo)" named the wrong set. Per SESSION_LOG (Session 75, PR #235) the 7 minted 8/12 are canva, creatify, gong, outreach, salesloft, linkedin-sales-navigator, mailchimp. The four the audit named are older hubs. Both sets were inspected today and all 11 are indexed, so the misattribution changes nothing operationally, but the numbers below are keyed to the correct list.

## 1. The 7 hubs minted 2026-08-12 (TODO line 7)

Source of the list: `docs/SESSION_LOG.md` Session 75 ("Executed: 7 new hubs (canva, creatify, gong, outreach, salesloft, linkedin-sales-navigator, mailchimp)"), shipped in PR #235 `a81c820`. Each was linked from its introducing post at mint time via `internal-link-mesh --orphans-only --no-llm`, so none was born orphaned.

| URL | Coverage state | Last crawl | Verdict |
|---|---|---|---|
| /tools/canva/ | Submitted and indexed | 2026-08-20 | PASS |
| /tools/creatify/ | Submitted and indexed | 2026-08-16 | PASS |
| /tools/gong/ | Submitted and indexed | 2026-08-18 | PASS |
| /tools/outreach/ | Submitted and indexed | 2026-08-16 | PASS |
| /tools/salesloft/ | Submitted and indexed | 2026-08-17 | PASS |
| /tools/linkedin-sales-navigator/ | Submitted and indexed | 2026-08-16 | PASS |
| /tools/mailchimp/ | Submitted and indexed | 2026-08-16 | PASS |

The four the 08-19 audit named instead (older mints, checked for completeness): motion indexed 08-24, trigify 08-16, factors-ai 08-30, prospeo 09-06. All "Submitted and indexed."

**What these 7 pages actually contain (checked in `src/data/tools.ts` today):** 6 of the 7 (creatify, gong, outreach, salesloft, linkedin-sales-navigator, mailchimp) are blurb-only entries: no `bestFor`, no `body`, no `faqs`. Only canva has body + FAQs, added in the 8/20 content pass. Six of the seven were crawled 08-16 to 08-18, i.e. before the 08-19 sitemap resubmit and before any FAQ existed on the site's thin hubs.

**Read in the item's own terms:** they did not "sit unknown-to-Google like the other 9." 7 of 7 indexed within 4 to 8 days of the mint. The condition that would have "settled it" against registration did not occur. This also contradicts the 8/20 session-log rule "every hub with FAQs is indexed and every hub without them is not": six blurb-only hubs with a single inbound link from a fresh introducing post indexed in under a week. The one structural difference between these 7 and the 8 that stalled through 8/04 and 8/12 is that each of the 7 was born with a link from a post published the same day (mesh at mint), while the stalled 8 had no fresh discovery signal of any kind until 8/20. Registration per se was never the problem; a hub Google has a fresh reason to fetch gets indexed thin.

## 2. Indexation split test (TODO line 16)

Setup (SESSION_LOG 8/20, `64295c1`): all 8 got bestFor + 2 paragraphs + 3 FAQs on 8/20 and were IndexNow'd; only calendly (3 to 5 inbound) and zoominfo (2 to 10 inbound) also received inbound links. Control 6 verified untouched beyond the content pass.

| Arm | URL | Coverage state | Last crawl | Google-known referring URLs |
|---|---|---|---|---|
| treatment | /tools/calendly/ | **Discovered - currently not indexed** | never | 2 (07-08 calcom-vs-calendly post, 07-13 storydoc post) |
| treatment | /tools/zoominfo/ | Submitted and indexed | 2026-08-20 | 2 |
| control | /tools/canva/ | Submitted and indexed | 2026-08-20 | |
| control | /tools/gumloop/ | Submitted and indexed | 2026-08-22 | |
| control | /tools/mailshake/ | Submitted and indexed | 2026-08-20 | |
| control | /tools/moltsets/ | Submitted and indexed | 2026-08-20 | |
| control | /tools/quickmail/ | Submitted and indexed | 2026-08-23 | |
| control | /tools/saleshandy/ | Submitted and indexed | 2026-08-20 | |

**Score: control 6/6, treatment 1/2, total 7/8.** On 8/19 all 8 were not indexed (moltsets was the last "unknown to Google" URL on the site). Six of the eight were crawled on 08-20 itself, the day the FAQs shipped and IndexNow fired.

**Read in the item's own terms.** The three pre-registered outcomes were "all 8 index = FAQs are the lever; only the 2 = links required; none = neither." The result is closest to the first, and it is decisive on one half of the mechanism: the arm that got no links at all indexed 6 for 6, so **inbound links were not required**, and the only miss is on the arm that DID get links. Calendly's state is a crawl-scheduling miss, not a quality rejection: "Discovered" means Google has the URL (from the sitemap and from two posts it lists as referrers) and has simply never fetched it, so it has never seen the 8/20 FAQs. The live page is healthy (HTTP 200, `index, follow`, self-canonical, present in sitemap-0.xml). The 8/20 confound ("the 2 treatment hubs were already content-richest") is moot, since the poorer control arm fully indexed.

**A confound the test design did not anticipate, stated plainly:** the FAQ pass is not cleanly separable from the sitemap fix. Google re-read the sitemap (217 of 217 URLs, first time since 06-22) at 20:02Z on 08-19, the FAQs plus IndexNow shipped 08-20, and six of the eight hubs were crawled on 08-20. Section 1 shows six blurb-only hubs (no FAQs, no body) indexing off a single fresh post link the same week. So the defensible statement is "these hubs index once Google has a fresh reason to fetch them; links are not that reason, and FAQs may not be either." The 8/20 rule "FAQs are what separates indexed from unindexed hubs" should not be carried forward as established.

Consequences for the linked items: line 17 (6 orphan hubs mentioned in zero posts) loses its indexation rationale; they indexed without a single inbound link. It is now purely a question of whether Ian wants comparison posts for those tools on their own merits. Calendly needs one manual Request Indexing in the GSC UI (no API for it under a read-only token); if still unfetched at the next sweep, that is a crawl-budget signal worth a look, but not a content signal.

## 3. Apollo cluster (TODO line 12)

The 5 pages interlinked in PR #226 (merged 2026-08-05, `2201aab`; file list confirmed via `gh pr view 226`): pipedrive-vs-apollo, apollo-vs-clay-vs-linkedin-sales-nav, apollo-sequences-vs-hubspot-sequences, lusha-vs-apollo-vs-zoominfo, cognism-vs-apollo-vs-lusha. All 5 are "Submitted and indexed" (last crawls 06-09 to 09-03). `/tools/apollo/` shown as context.

**"apollo vs pipedrive", site-wide (query filter = exact):**

| Window | Impressions | Clicks | Avg position |
|---|---|---|---|
| pre-PR baseline quoted in the item | 198 | 0 | 26.5 |
| 28d ending 08-12 (07-16..08-12), the "early read" | 208 | 0 | 27.0 (item recorded 26.7 on a slightly different window) |
| post-merge only, 08-13..09-03 | 103 | 0 | **22.4** |
| last 28d, 08-07..09-03 | 147 | 0 | **24.0** |

Weekly (Mon-Sun), impression-weighted: 07-06 25.9, 07-13 28.8, 07-20 23.8, 07-27 27.7, 08-03 25.4, 08-10 28.8, 08-17 22.8, 08-24 22.1, 08-31 (4 days, 14 impr) 13.3.

By page, last 28d, same query: the pipedrive post 110 impr at **17.3**; `/tools/apollo/` 101 impr at 44.3. The hub is now surfacing for the same query at page 4 or 5, which is why the blended number sits above the post's own position.

**Per-page cluster stats, 28d pre-08-12 vs last 28d:**

| Page | Pre: impr @ pos (clicks) | Now: impr @ pos (clicks) |
|---|---|---|
| pipedrive-vs-apollo | 164 @ 17.4 (0) | 139 @ 15.9 (0) |
| apollo-vs-clay-vs-linkedin-sales-nav | 24 @ 8.3 (0) | **323 @ 7.8 (2)** |
| apollo-sequences-vs-hubspot-sequences | 62 @ 8.1 (3) | 32 @ 8.8 (0) |
| lusha-vs-apollo-vs-zoominfo | 101 @ 19.5 (0) | 80 @ 25.1 (0) |
| cognism-vs-apollo-vs-lusha | 60 @ 20.3 (0) | 56 @ **9.9** (0) |
| /tools/apollo/ (context) | 275 @ 38.0 (0) | 606 @ 37.7 (0) |

Other apollo queries in the 28d: "apollo vs hubspot" 97 impr at 36.0, "apollo vs phantombuster" 75 at 30.6, "dripify vs apollo" 62 at 38.8, "moltsets vs apollo" 35 at 5.3, "lusha vs apollo" 19 at 50.3.

**Read in the item's own terms:** success = avg position under 20. **Not met (24.0).** It is no longer "no movement" though: the post-merge-only figure is 22.4 against 27.0 before, the last two full weeks are 22.8 and 22.1, and the pipedrive post alone is at 17.3. Two cluster pages jumped a page (cognism-vs-apollo-vs-lusha 20.3 to 9.9; apollo-vs-clay went from 24 to 323 impressions at 7.8 with the cluster's only 2 clicks). The lusha-vs-apollo-vs-zoominfo post slipped 19.5 to 25.1. Still zero clicks on the target query after 4 weeks, so the cluster has not yet produced the "first steady clicks" the 8/04 audit was after.

## 4. Volume-ramp re-check (TODO line 14)

**Weekly clicks (Mon-Sun), site-wide:**

| Week starting | Clicks | Impressions | Note |
|---|---|---|---|
| 2026-07-13 | 4 | 2,578 | |
| 2026-07-20 | 3 | 2,322 | |
| 2026-07-27 | 4 | 3,290 | |
| 2026-08-03 | 5 | 3,233 | |
| 2026-08-10 | 7 | 4,353 | the "7" in the 8/19 re-check |
| 2026-08-17 | 4 | 4,485 | |
| 2026-08-24 | **9** | 6,552 | best week ever |
| 2026-08-31 | 4 | 3,757 | partial, 4 of 7 days settled |

Trailing 7-day blocks ending 09-03, newest first: 8, 7, 3, 6, 6, 4, 3, 3. 28d totals (08-07..09-03): **24 clicks / 20,424 impressions / CTR 0.12% / avg position 37.3** (vs 19 / 13,182 / 37.6 in the 8/19 audit's 28d: impressions +55%, clicks +26%, position flat).

**Did any week hit 10 clicks? No.** Peak is 9 (08-24 week); the 8-click trailing block ending 09-03 is the second-highest reading. The sequence since the 8/19 re-check is 7, 4, 9, so it is not monotone but the ceiling is rising.

**Indexation of sitemap URLs (URL Inspection, all 233 sitemap URLs, full output in `gsc-2026-09-06-full-sweep.txt`):**

| Coverage state | Count |
|---|---|
| Submitted and indexed | **219** |
| Crawled - currently not indexed | 7 |
| Discovered - currently not indexed | 6 |
| URL is unknown to Google | 1 |

**219 / 233 = 94.0% raw.** Trajectory: 179/188 (95%) on 8/04, 179/196 (91%) on 8/12, 196/217 (90%) on 8/19, 219/233 (94%) today; +23 indexed URLs in 18 days against +16 new sitemap URLs.

The 14 not indexed, by cause:

| Cause | URLs |
|---|---|
| Publish lag, all 6 published 08-30..09-04 (2 to 7 days old at sweep time) | /blog/2026-08-30-pipedrive-vs-attio..., /blog/2026-08-31-lemlist-review-2026..., /blog/2026-09-01-activecampaign-vs-hubspot-vs-brevo..., /blog/2026-09-02-migrate-from-pipedrive-to-attio..., /blog/2026-09-03-relevance-ai-pricing-in-2026... (all "Discovered"), /blog/2026-09-04-lusha-reviews-2026... ("unknown to Google", 2 days old) |
| May-era or legacy "Crawled - currently not indexed" (the freshness item, TODO line 23) | /blog/2026-05-04-5-revops-automation-mistakes..., /blog/2026-05-08-cheap-outbound-sales-stack..., /blog/2026-05-11-kit-n8n-4-newsletter-automations..., /blog/2026-05-12-newsletter-automation-stack..., /blog/2026-05-14-automated-reactivation-sequence-with-apollo-hubspot/, /blog/2026-05-20-b2b-lead-enrichment-without-clay..., /blog/automate-sales-handoff-hubspot-slack/ |
| Never crawled (section 2) | /tools/calendly/ |

Excluding the 6 publish-lag URLs, which every prior sweep also excluded in its narrative: **219 / 227 = 96.5%.** Note the crawled-not-indexed pool grew from 5 (8/19) to 7: the 05-04, 05-11 and 05-20 posts and the legacy handoff post are in it now, so that pool is the one that actually moves the raw percentage, and it is the line-23 freshness/decay item, not a pipeline problem. Zero `/tools/` hubs other than calendly are outside the index; the 8/19 pool of "8 thin hubs" is gone.

**Read in the item's own terms:** gate = first 10-click week AND indexation holding >= 95%. **Neither half is met on the strict reading: best week 9, raw indexation 94.0%.** The indexation half is met on the lag-adjusted reading (96.5%) and is not the binding constraint; the click gate is. HOLD at 1/day stands. The item's own timing note (re-check after the High backlog has run ~3 weeks, ~9/09) is 3 days out; the 08-24 week's 9 clicks and the trailing 8-click block are the first readings within striking distance, so the next re-check should be a short one (~9/30) rather than another month.

## 5. Request-indexing status (TODO lines 20 and 22)

| URL | Group | Coverage state | Last crawl |
|---|---|---|---|
| /tools/reply-io/ | line 20 | Submitted and indexed | 2026-08-19 |
| /tools/activecampaign/ | line 20, flipped 8/21 | Submitted and indexed | 2026-08-30 |
| /tools/fullenrich/ | line 20, flipped 8/21 | Submitted and indexed | 2026-06-23 |
| /tools/surfer/ | line 20, flipped 8/21 | Submitted and indexed | 2026-07-04 |
| /tools/krispcall/ | line 20, flipped 8/21 | Submitted and indexed | 2026-08-17 |
| /tools/close/ | line 20, flipped 8/21 | Submitted and indexed | 2026-06-28 |
| /tools/nutshell/ | line 20, flipped 8/21 | Submitted and indexed | 2026-09-05 |
| /tools/factors-ai/ | line 22 orphan | Submitted and indexed | 2026-08-30 |
| /tools/prospeo/ | line 22 orphan | Submitted and indexed | 2026-09-06 |

**Read:** 9 of 9 indexed. Three of the "flipped 8/21" hubs (fullenrich, surfer, close) were indexed off crawls from June and July, i.e. before they were listed; the grid flip changed nothing Google needed. Request Indexing would be a no-op for every URL on this list. The only URL on the whole target list that needs a manual Request Indexing is calendly (section 2).

## Method notes

- Index verdicts: URL Inspection API via the cached read-only OAuth token at `~/.gsc/token.json` (no browser flow needed; token refreshed silently). `gsc-index-status.py` has no URL-subset flag, so a scratchpad wrapper inspected the 31 target URLs first (same auth, same endpoint) while the full sweep ran in the background; the full sweep is the source for the section 4 percentage.
- Search Analytics: `searchanalytics.query` with an exact-match query filter for "apollo vs pipedrive"; weekly figures are sums of daily rows bucketed Monday to Sunday. Positions are impression-weighted. The 8/19 audit's weekly series (3, 4, 5, 7) matches this bucketing for the 07-20, 07-27, 08-03, 08-10 weeks, so the series is comparable.
- Not done: no Request Indexing was submitted (read-only token, and by design). No TODO.md edits. No git operations.

## Proposed TODO edits

Exact replacement text per line. Lines refer to TODO.md as of 2026-09-06 (commit state at the start of this sweep).

**Line 7** (7 hubs minted 8/12): DELETE. Resolved: all 7 indexed by 08-20 (this audit, section 1).

**Line 12** (Apollo-cluster read): REPLACE WITH
`- [ ] **Apollo-cluster read, round 2 (~2026-10-01):** "apollo vs pipedrive" avg pos 9/06 = **24.0** on 28d (147 impr, 0 clicks); post-merge-only 22.4 vs 27.0 pre, last two full weeks 22.8 / 22.1, the pipedrive post alone at 17.3 but `/tools/apollo/` now also ranks for the query at 44 and drags the blend. Success still = < 20. If still >= 20 on 10/01, stop investing in the cluster. Cheap lever meanwhile: none needed, the trend is already down. @med [audits/AUDIT-INDEX-2026-09-06.md](audits/AUDIT-INDEX-2026-09-06.md)`

**Line 14** (Volume-ramp cadence): REPLACE WITH
`- [ ] **Volume-ramp cadence, HOLD at 1/day** (decided 2026-07-09; re-checked 9/06: weekly clicks 4, 5, 7, 4, **9**, 4-partial; no 10-click week yet; indexation 219/233 = 94.0% raw, 96.5% excluding the 6 posts under 7 days old; gate = first 10-click week + indexation >= 95%). 28d = 24 clicks / 20.4k impr / pos 37.3. Next re-check ~9/30. @med [audits/AUDIT-INDEX-2026-09-06.md](audits/AUDIT-INDEX-2026-09-06.md)`

**Line 16** (indexation split test): REPLACE WITH
`- [ ] **Split test READ 9/06: links were NOT required; FAQs not separable from the 8/19 sitemap re-read.** Control (FAQs + prose only, zero inbound links) indexed 6/6; treatment 1/2 (zoominfo indexed, calendly "Discovered, never crawled"). Six blurb-only 8/12 hubs also indexed off one fresh post link, so do not carry "FAQs = indexed" forward as a rule. One action left: **Request Indexing `/tools/calendly/` in the GSC UI** (page is 200 / index,follow / in sitemap; Google has just never fetched it), then delete this item. @low @ian [audits/AUDIT-INDEX-2026-09-06.md](audits/AUDIT-INDEX-2026-09-06.md)`

**Line 17** (6 hubs mentioned in zero posts): REPLACE WITH
`- [ ] **6 hubs mentioned in ZERO published posts** (canva, gumloop, mailshake, moltsets, quickmail, saleshandy). 9/06: all 6 indexed without any inbound link, so this is no longer an indexation item; only worth a comparison post each if the tool merits one on its own. Candidate for deletion. @low`

**Line 20** (Request Indexing for reply-io + 6 hubs): DELETE. All 7 already "Submitted and indexed" on 9/06 (three of them off June/July crawls, i.e. before the 8/21 flip); Request Indexing would be a no-op (this audit, section 5).

**Line 23** (freshness/decay policy), OPTIONAL count refresh, no verdict change: the "only crawled-not-indexed straggler" clause is stale; the sweep shows 7 crawled-not-indexed URLs, all May-era or legacy (05-04, 05-08, 05-11, 05-12, 05-14, 05-20, and /blog/automate-sales-handoff-hubspot-slack/). Suggested: replace "the 5/08 cheap-outbound-stack post (only crawled-not-indexed straggler)" with "7 May-era/legacy crawled-not-indexed posts as of 9/06 (list in audits/AUDIT-INDEX-2026-09-06.md section 4)".

**Line 22** (orphan hubs factors-ai, prospeo): REPLACE WITH
`- [ ] **Orphan `/tools/` hubs factors-ai + prospeo: indexed 9/06** (crawled 08-30 and 09-06) despite zero natural anchors, so the indexation motive is gone; the 8/28 mesh dry run already showed no safe anchors remain. Keep only if Ian wants the internal-link equity; otherwise delete. @low`
