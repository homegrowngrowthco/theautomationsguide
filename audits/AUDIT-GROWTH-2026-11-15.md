# Growth audit: what earns clicks, the stale queue, and what to publish next

**Date:** 2026-11-15 (Session 122, op #1633).
**Status:** findings frozen here. What gets built is tracked only in TODO.md. Ian ruled on recommendations 1, 2, 3 to 5, 6 and 7 the same day (one post a day; builder fixed then run; new-tool intake, MoltSets plus refreshes, then the benchmark; migration and best-of fenced).

**Asked (Ian, 11/15):** scope the to-dos and the stale queue, find which topics and posts perform, read the traffic trend, and recommend new content. Open to new tools to cover and new content types.

**Evidence base (all read-only):**
- Search Console, `sc-domain:theautomationsguide.com`. "Last 28 days" is 10/16 to 11/12, "previous" is 9/18 to 10/15, "older" is 8/21 to 9/17.
- PostHog 408442, human pageviews only (`isLikelyBot` false, host-scoped).
- The live Notion Content Calendar, builder runs 34 to 36 (11/08, 11/11, 11/15), ops issue #130, Beehiiv.
- Two web-research passes by reader subagents, saved beside this file with their source URLs: `growth-2026-11-15/research_content_formats.md` and `growth-2026-11-15/research_new_tools.md`. Their sources were not re-read by the top level, and many 2026 studies in them are vendor or secondhand; each claim is labelled there.
- The scripts that produced every Search Console number are in `growth-2026-11-15/` (`gsc_pull.py` first, then the others; they need the `~/.gsc` token and the `C:\Users\Ian\.venvs\gsc` venv).

**Post formats in this audit** are assigned by a title regex in `gsc_analyze.py`, not by the builder's own classifier, so counts differ slightly from the builder's.

---

## 1. Headline

1. **Clicks doubled on paper (62 to 137 in 28 days), but one tool explains the real gain.** The MoltSets pages went from 10 clicks to 44. Another 50 clicks sit on four Pipedrive posts and cannot be matched to visits (section 3). Everything else, which is about 240 posts and 113 hubs, got 43 clicks, against 52 the period before and 39 the one before that.
2. **134 posts were published in those 12 weeks and the rest of the site did not move.** Volume is not the lever.
3. **About half the impressions are not people.** 44% come from outside the US, UK, Canada and Australia at positions that look like rank trackers, and 20% of query impressions are long question prompts with 5 clicks between them.
4. **The queue is short because the tool universe is spent, and the builder's own duplicate rule is making it worse.** It dropped 30 pricing topics in three runs for the wrong reason (section 6).
5. **Outside evidence points the same way:** nearly every commercial software query now shows an AI Overview, and templated comparison, "best" and alternatives pages published at scale are what 2026's updates hit (section 8).

| | Older 28 d | Previous 28 d | Last 28 d |
|---|---|---|---|
| Search clicks, all pages | 45 | 62 | 137 |
| MoltSets pages (4 posts + hub) | 6 | 10 | 44 |
| Four Pipedrive-cluster posts | 0 | 0 | 50 (unverified) |
| Everything else | 39 | 52 | 43 |
| Impressions, all pages | 24,612 | 30,887 | 35,785 |
| Human pageviews landing from Google (PostHog; windows end 10/17 and 11/14) | | 94 | 118 |
| Human affiliate clicks (pageview-join rule) | | | 3 since 10/02, none since 11/03 |
| Beehiiv subscribers | | | 3 active, all tests; 0 new in 3 months |

Posts live: 245. Posts with at least one click in the last 28 days: 34. Posts with an impression: 207.

## 2. Traffic trend

Weekly Search Console clicks, split three ways (W46 is four days):

| ISO week | MoltSets pages | Four Pipedrive posts | Everything else | All impressions |
|---|---|---|---|---|
| W35 | 1 | 0 | 8 | 6,746 |
| W36 | 1 | 0 | 7 | 6,185 |
| W37 | 3 | 0 | 15 | 6,398 |
| W38 | 2 | 0 | 8 | 4,930 |
| W39 | 0 | 0 | 20 | 6,203 |
| W40 | 3 | 0 | 7 | 10,119 |
| W41 | 3 | 0 | 14 | 8,415 |
| W42 | 4 | 0 | 12 | 7,131 |
| W43 | 7 | 0 | 13 | 5,849 |
| W44 | 5 | 21 | 4 | 5,635 |
| W45 | 24 | 28 | 11 | 14,694 |
| W46 (4 d) | 7 | 1 | 13 | 7,007 |

- "Everything else" has sat between 4 and 20 clicks a week since late August while the post count went from about 110 to 245.
- The W45 impression spike is MoltSets: the review went from about 30 impressions a day to 1,118 on 11/02 and 717 on 11/03 on "moltsets" and "what is moltsets", then decayed. Something outside the site drove people to search the name. At position 7 the review took 21 clicks in those two days.
- PostHog human pageviews run 70 to 135 a week, with one week at 214 (the MoltSets week). Google-referred landings are about 4 a day.
- Device split of clicks is 80 desktop, 55 mobile.

## 3. Two things that inflate the picture

**3a. The Pipedrive burst is not proven human.**
- Search Console: 51 clicks on URLs containing "pipedrive", 48 from the US, 29 mobile and 19 desktop. 49 of the 51 fall between 10/31 and 11/06. "pipedrive vs nutshell" shows 14 clicks on 66 impressions at position 9.1, a 21% click rate from the bottom of page one.
- The pages: Nutshell vs Pipedrive vs Close 22, Pipedrive for Marketing Teams 15, Pipedrive Segmentation Guide 7, Pipedrive Automated Emails 6.
- PostHog recorded 2 Google landings on those four pages in the same window, one from Canada and one from Ecuador.
- Tracking works: the MoltSets review shows 38 Search Console clicks and 50 PostHog Google landings, 42 of them from the four English-speaking markets.
- After 11/06 the clicks stop while impressions and position hold.
- Reading: something that does not run JavaScript clicked those results for a week. Do not build a Pipedrive plan on it. If it recurs, check PostHog before counting it.
- This matters for the 12/10 topic-score read: three of the four posts are in the scored cohort, so that read must use PostHog-matched clicks.

**3b. Impressions overstate demand.**
- The US is 14,363 of 31,108 impressions (46%). With the UK, Canada and Australia it is 56% of impressions and 105 of 136 clicks.
- The other 44% is spread over about 155 countries with better average positions than the US (Italy 4.7, Spain 5.0, US 18.7), which is the tracker pattern from the 10/08 Close hub finding.
- 737 of 2,226 queries are question prompts or run to 7 words or more ("does surfe use waterfall enrichment across multiple data providers?"). They hold 3,959 impressions and 5 clicks.
- 638 impressions are the domain name itself, including "theautomationsguide.com alternatives" at position 1.1.
- Posts whose impressions are mostly not US: Nooks vs Orum (864 impressions, 13% US), Profound vs Surfer vs Frase (803, 5%), Relevance AI vs Lindy vs n8n (671, 18%), Pipedrive vs Attio (435 at position 2.1, 13%, 0 clicks).
- The builder reads these as demand. `backlog/signals.mjs` drops operator strings but has no country filter and no question-prompt filter. Three of today's highest-scored Suggested rows cite a question prompt as their demand (Flocksy Pricing, Surfer vs Frase, Clay vs Apollo for Signal-Based Outbound).

## 4. What earns human clicks

**4a. One page.** The MoltSets review ("Is MoltSets Legit?", published 10/13) has 38 clicks, 28% of the site. With the pricing post, MoltSets vs Apollo and the hub, the cluster is 44. No other page has more than 3 clicks that PostHog can match.

Why it works, from the queries: "moltsets" (1,836 impressions), "what is moltsets" (564), "moltsets company" (169), "moltsets review", "moltsets pricing", "moltsets vs apollo". It is a new tool, people search the name to find out what it is, and few independent pages exist. The same shape shows in miniature on `/tools/appy-ai/` (2 clicks on "appy ai") and `/tools/watermelon/` (2 clicks).

Two leaks in that cluster:
- "moltsets pricing" has 132 US impressions at position 4.7 and 0 clicks.
- The hub and the review both sit at about position 7 for "moltsets" (1,042 and 733 impressions).

**4b. By format.** Posts at least 14 days old, clicks per 100 post-weeks inside the window. The last column removes the MoltSets review and the four burst posts.

| Format | Posts | Posts with a click | Clicks | US impressions per post-week | Clicks per 100 post-weeks | Same, adjusted |
|---|---|---|---|---|---|---|
| Review | 15 | 3 | 40 | 29.7 | 77.1 | 4.2 |
| Comparison | 67 | 14 | 36 | 7.1 | 13.5 | 5.2 |
| Pricing | 14 | 4 | 5 | 9.8 | 9.1 | 9.1 |
| Alternatives | 12 | 3 | 3 | 5.3 | 6.4 | 6.4 |
| How-to and integration | 43 | 3 | 14 | 6.7 | 8.7 | 0.6 |
| Other | 27 | 1 | 15 | 4.0 | 14.1 | 0.0 |
| Best-of | 11 | 1 | 1 | 1.0 | 2.3 | 2.3 |
| Migration | 29 | 1 | 1 | 0.6 | 0.9 | 0.9 |

- Adjusted, no format clears 10 clicks per 100 post-weeks, which is under half a click per post per month. Format is not what separates the winner from the rest; the tool is.
- **Migration is now the weakest format:** 29 posts, 1 click, 74 US impressions in total, median US position 22. The July finding that migration guides were the only page-one format no longer holds. 12 were published since 9/15.
- **Best-of** is next: 11 posts, 1 click.
- **Pricing** gets seen but not clicked. It has the most US impressions per post of the broad formats, and the whole pricing query class had 1,686 impressions and 0 clicks.
- **Alternatives:** real US searches exist (rb2b alternatives 84, activecampaign alternatives 66, instantly alternatives 51, mailreach alternatives 45) but the site ranks 30 to 60 for them. The fence is right for now.
- **Integration how-tos** have real US impressions at positions 8 to 20 and no clicks (list in 4d).

**4c. By publish month.** Clicks in the last 28 days:

| Month | Posts | With 50+ impressions | Clicks |
|---|---|---|---|
| May | 22 | 5 | 4 |
| June | 25 | 11 | 25 (22 are the Nutshell burst) |
| July | 37 | 14 | 4 |
| August | 31 | 6 | 4 |
| September | 45 | 9 | 1 |
| October | 58 | 27 | 77 (66 are the MoltSets review and three burst posts) |
| November | 25 | 6 | 6 |

September's 45 posts have one click between them.

**4d. Real US searches where a page already ranks 4 to 20.** These are the refresh candidates. All are US-only rows.

| US impressions | Position | Query | Page |
|---|---|---|---|
| 179 | 13.5 | lemlist integrations | Lemlist Integrations Guide |
| 132 | 4.7 | moltsets pricing | MoltSets Pricing |
| 115 | 11.1 | google sheets lemlist integration | Google Sheets Lemlist Integration |
| 106 | 9.0 | getresponse pricing | GetResponse Pricing |
| 98 | 11.6 | pipedrive to json | Pipedrive to JSON |
| 91 + 90 | 8 to 9.6 | connect gmail kixie pipedrive | Connect Gmail, Kixie and Pipedrive |
| 74 | 13.4 | lusha vs zoominfo | Lusha vs Apollo vs ZoomInfo |
| 60 | 12.5 | 6sense vs lusha | 6sense vs Lusha |
| 44 + 48 | 15 to 21 | kajabi convertkit integration | Connect Kit to Kajabi |
| 43 | 15.1 | lead411 vs lusha | Lead411 vs Lusha |
| 41 | 8.3 | reply io vs lemlist | Reply.io vs Lemlist |
| 40 | 15.0 | lusha vs uplead | Lusha vs UpLead |

**4e. Hubs.** 103 hubs had impressions: 10,665 impressions and 13 clicks.
- **Nutshell hub read (title and meta changed 10/13):** 84 impressions, 68 of them US, 0 clicks, position 18.8. "nutshell pipeline management" is 30 impressions at 9.6. The 358-impression baseline is gone and no click came. Closed: no effect, and the demand is too small to chase.
- FullEnrich hub: 34 impressions at 31.9. Nothing to split.
- Appy.AI hub: 286 impressions at 6.9, 2 clicks, mostly India. Leave.
- JustCall hub: "justcall promo code" 49 impressions at 8.2 and "justcall coupon" 22 at 6.1, 0 clicks.

## 5. Monetisation and audience

- **3 human affiliate clicks in six and a half weeks,** all on live programs (Loops, VoiceOS, MoltSets). At this rate the 5-click threshold for the path-share metric is weeks away.
- **5 of the 6 Queued rows are for tools whose program is pending,** and all 6 score "demand 0".
- **Pipedrive is named in 25 post titles and its program is still pending** (PartnerStack, ops #66).
- **LinkedIn sent 6 pageviews from 2 visitors in 28 days.** AI assistants sent 0 (7 the period before).
- **Not counted as people:** 87 single-pageview visits from `www.aocr.org` (referral spam) and most of the 290 "direct" pageviews (273 visitors, one page each).
- **Beehiiv:** 3 active subscribers, all Ian's tests, 0 new in 3 months.

## 6. The queue and the builder

**State (live Notion, 11/15 about 21:00Z):** 248 Published, 6 Queued, 12 Suggested, 262 Skipped. At 2 a day the queue is dry about 11/18 21:00Z. The Sunday top-up promoted 4 rows and opened ops #130; Ian answered option 1, run the builder.

**Yield:** runs 34 to 36 kept 10, 6 and 6 of 30. Of the 22 kept, 10 are pricing, 5 comparison, 3 review, 2 how-to and 2 other.

**The top-up's holds are right.** It held 9 of the 12 Suggested rows as duplicates of published posts after reading the bodies, and the other 3 are unscored trend pieces from August to October. The known tools have been covered in every format the fences allow.

**Bug: the intent rule keys on every tool in the title, not the anchor.** `intentKeys()` in `backlog/build-backlog.mjs` returns one `pricing::<slug>` key per tool named in the title or keyword. The builder writes pricing titles as "X Pricing in 2026: ... and When Y Is Cheaper", so:
- "Bookyourdata Pricing ... When It Beats Lusha" was dropped as `pricing::lusha`. Bookyourdata has no pricing post.
- Every published pricing post also registers its comparison tool. The Pabbly pricing post names Make, so "Gumloop Pricing ... When Make Is Cheaper" was dropped as `pricing::make`.
- A review can trip it too: "Factors.ai Review ... Without the Warmly Price Tag" was dropped as `pricing::warmly`.

Across the three runs, 30 of the 68 drops used this rule. None of the 30 anchor tools has a published pricing post. 26 were dropped on the other tool's key and 4 on their own key (Smartlead and Clay, twice each), which most likely comes from a comparison title containing a cost word or from a calendar row that never published.

Dropped this way: Apollo, Clay, Instantly, Smartlead, Cognism, Lindy, Gumloop, Surfe, BetterContact, Vector, Factors.ai, Warmforge, Bookyourdata, Salesflare, Creatio, Dripify and Aloware pricing. Apollo, Clay, Instantly and Smartlead have live programs. What survived instead were pricing posts for pending-program tools with no measured demand (Fillout, Prospeo, folk).

**The demand signal counts tracker prompts** (section 3b).

**Verdict.** Fixing the intent key would add perhaps 5 to 10 valid rows a run for a while. It does not change the larger fact: more passes over the same 113 tools produce duplicates or zero-demand rows. New supply has to come from tools the site does not cover yet (section 9).

## 7. To-do list, scoped

Line numbers are TODO.md as of 11/15.

| Item | Verdict |
|---|---|
| Read the builder and top-up on the 11/08 runs (L7) | Read here (section 6). Replace with the two builder fixes. |
| Nutshell hub read, other hub fixes (L14) | Read here (4e). Close. |
| Content gaps: 16 live-program hubs with no post (L35) | Stale. The builder has reported 0 live programs with no post since 11/11. Close. |
| Audit lows: deferred Astro 4 to 6 major (L31) | Stale. Astro is 7.4.7 since #459. Keep only the faint-logo note. |
| 37 posts with no `updatedDate` (L30) | Not a task. Delete. |
| Rebuild the pricing index (L27) | Overdue since 11/12. Next session, about an hour. |
| Engine link guard, read on first runs (L11) | A month overdue. Read 5 executions or close it. |
| MoltSets hands-on follow-up (L42) | Raise from low to high. It is the one page with proven demand. Needs Ian to add `MOLTSETS_API_KEY`. |
| Alternatives fence (L15) | Data in 4b. Recommend keeping the fence. |
| Topic-score metric, 12/10 read (L10) | Keep. Add: use PostHog-matched clicks and US impressions. |
| Conversion audit metrics, 11/26 read (L16) | Keep. Expect "not measurable": 3 human clicks. |
| Human affiliate click count (L12) | Keep. Still 3 of 5. |
| Authority sprint (L24) | Keep, but LinkedIn has sent 2 visitors in 28 days. Rethink in section 10. |
| Beehiiv signup steps, lead magnets (L20, L21, L43) | Park until the site has readers. About 100 Google visits a month cannot fill a newsletter. |
| Affiliate applications, Leadfeeder credit (L23, L25) | Waiting on Ian in ops #66. Pipedrive is the one that matters. |
| GEO re-run 12/04 (L28) | Keep. |
| First-ring reads: red alarm, sweep, qa-fix path (L8, L9, L34) | Keep. Each waits on an event that has not happened. |
| Hub fence first-mover question (L13) | Fold into the new-tool work. |
| Small items (L22, L26, L29, L32, L33, L39, L40, L41) | Keep at low. No change. |

## 8. What outside evidence says about content types

From `growth-2026-11-15/research_content_formats.md`. Labels there separate measured studies from vendor claims.

- **AI Overviews cover nearly all commercial software queries.** One 2026 panel puts it at 88% of commercial keywords, 96% for "best X for Y" and 100% for software "alternatives". No study names a software query class without one.
- **Google's spam policy names this pattern.** "Using generative AI tools ... to generate many pages without adding value" is the first example of scaled content abuse, and good affiliate pages are described as adding price information, original reviews, testing and comparisons.
- **A 220-site study of AI-content customers** found 54% lost 30% or more of peak traffic, typically after 6 to 12 months of growth. Its list of declining templates includes comparison pages at scale, "best X for Y" and "alternatives".
- **No credible source supports two AI-drafted posts a day on a young domain.**
- **What still gets cited by Google's AI answers:** independent lists, YouTube (the most cited domain for CRM-type queries in one study) and LinkedIn posts by named individuals. ChatGPT is moving toward vendor pages and sends pricing questions to the vendor.
- **Dead ends with evidence:** llms.txt and special schema, pages per question variant, generic calculators (Google can generate them in results), integration pages written without testing.
- **No evidence either way:** newsletter-first distribution for affiliate sites, coupon and free-trial pages, template libraries as lead magnets, link yield from data studies for small sites.
- **A competitor already tracks SaaS prices:** SaaS Price Pulse lists 271 tools with daily crawls, so a price tracker is not an empty niche.

## 9. New tools to cover

From `growth-2026-11-15/research_new_tools.md`: 40 ranked candidates the site does not cover, each with program terms and source links. Limits: demand is inferred from launches, funding and review-site presence, not measured (the reader could not reach Reddit), so check each name in Search Console or Trends before writing. About 23 programs were read on the vendor's or network's own page; the rest are aggregator figures or unknown.

| Tool | What it is | Independent reviews today | Program |
|---|---|---|---|
| Valley | LinkedIn-first AI outbound agent | Thin: mostly the vendor's own pages | Read on vendor page: 20% recurring, 60-day cookie, open |
| Gojiberry AI | Intent and LinkedIn signal lead gen | Moderate | Read on vendor page: 30% recurring |
| Bitscale | Clay alternative | Moderate to crowded | Read on PartnerStack: 20% lifetime, 40% on signups to end of December |
| Enginy | AI prospecting agent, EU | Moderate | Read on vendor page, gated by a call: up to 25% recurring |
| SyncGTM | Waterfall enrichment with an MCP server | Thin, and it competes for "X review" queries | Read on vendor page: 20% for 12 months, 90-day cookie |
| Mystrika | Cold email, sold as a lifetime deal | Moderate | Vendor page says up to 75% recurring; confirm before relying on it |
| OmniSEO | AI-visibility tool | Thin to moderate | Read on PartnerStack: 50% first year |
| Bullseye | Person-level visitor ID | Thin to moderate | Read on vendor page: 20% recurring |
| Orange Slice | Agentic enrichment spreadsheet (YC S25) | Thin: one competitor's review | None found |
| Zero | AI-native CRM, seed round 2026-09-15 | Thin | None found |

The rest of the list covers AI-visibility trackers (AIclicks, Promptwatch, Otterly, Rankscale), notetakers (Claap, Bluedot), outreach (Buzz.ai, Salesflow, Warmbox) and about 15 Product Hunt and funding-round names with no program checked yet.

The same file lists feature-level query families for seven mainstream tools. Given section 3a, treat those as untested.

## 10. Recommendations, in order

1. **Publish less, and only rows with a reason.** Go from 2 a day to 1 a day now, and stop promoting "demand 0" rows to hold a cadence. The site added 134 posts in 12 weeks with no change in clicks outside one tool, and the outside evidence says this cadence is the risk. The cron change is an n8n deploy, so it needs Ian's go.
2. **Fix the builder before running it again.** Key the single-anchor intents on the first tool in the title. Count demand from US rows only and drop question prompts. Both are small changes with fixtures in the existing selftest.
3. **Point the engine at new tools.** The one proven pattern is being the early independent page for a tool people are starting to search by name. Add a new-tool intake that feeds the builder candidates from section 9, with a hub plus one "what it is, what it costs, is it legit" post each, and no second post until the first shows US impressions.
4. **Work the page that wins.** MoltSets: run the hands-on benchmark once the API key is in `.env`, fold the "who owns it" questions into the review instead of a fifth post, fix the pricing page's title and snippet, and settle the hub and review overlap.
5. **Refresh the 12 pages in 4d before writing new ones.** Each has real US searches and a position between 4 and 20.
6. **Stop migration and best-of topics in the builder prompt.** Keep the alternatives fence.
7. **One new content type with first-hand data: an enrichment benchmark.** Run one contact list through the enrichment APIs the site already covers and publish match rate and cost per valid email, with the date and the method. It suits the site's strongest theme, it is data nobody else has, and it can be re-run each quarter. It needs API keys and a small credit spend, both Ian's.
8. **Make the pricing index a dated record.** After the overdue rebuild, keep a change log of verified price changes. Skip a generic calculator.
9. **Authority:** LinkedIn posts are not sending visitors. If Ian keeps posting, articles under his own name are the form AI answers cite; screen recordings of the hands-on tests on YouTube are the other cheap surface. Neither is proven to bring revenue.
10. **Change how reads are done.** Every dated read uses US impressions and PostHog-matched Google landings, not raw Search Console totals.
