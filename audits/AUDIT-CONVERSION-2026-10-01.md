# Conversion + reach audit: affiliate clicks, newsletter signups, reach

**Date:** 2026-10-01 (Session 99).
**Status:** findings frozen here. What gets built and how it is verified are tracked only in TODO.md.

**Goal (Ian, 10/01):** more affiliate links clicked, more newsletter signups, more reach.

**Evidence base:**
- PostHog 408442 (host-scoped), Beehiiv (MCP, read-only) and GSC, for windows ending 2026-09-28 to 2026-10-01.
- A live-site walk at 375 and 1280 with Playwright, with analytics blocked.
- A script pass over all 164 posts against `src/data/affiliate-links.ts`.
- Re-verified by hand before writing:
  - the mobile overflow on the ActiveCampaign post (488px page at a 375px viewport);
  - `/guides/` returning 404;
  - the share line with nothing to click;
  - the lead magnet not linked anywhere in `src/`;
  - the `/go/` beacon losing the source page (`src/pages/go/[tool].astro:114`).

**Out of scope:**
- Off-site link building. Pitching the pricing index was dropped 10/01.
- Title rewrites for CTR. The 8/04 test read flat.
- OG cards, which stay as they are (S97).
- Anything that adds fake urgency, exit-intent walls or invented social proof.

**What this audit cannot fix:**
- Authority (zero independent referring domains) still caps traffic.
- Everything below works on the roughly 63 post pageviews a week the site already gets.

---

## 1. Baseline (measured 2026-10-01)

Queries are saved verbatim in the session scratch (`posthog_queries.sql`, Q1-Q12). Every PostHog query runs against project 408442 and filters `properties.$host IN ('theautomationsguide.com','theautomationsguide.com.')`.

### Traffic (PostHog)

| | 90d | 28d |
|---|---|---|
| Pageviews (all) | 965 | 424 |
| Post pageviews (`/blog/<slug>/`) | 650 | 286 |
| Home | 137 | 54 |
| Tool hubs (`/tools/<slug>/`) | 51 | 33 |
| `/tools/` index | 18 | 8 |
| Pricing index | 7 | 1 |
| `/guides/` | 0 | 0 |
| Unique visitors / sessions | 732 / 802 | 313 / 341 |

- **Volume:** about 63 post pageviews per week, a flat line (63, 58, 63, 60, 62, 73 over the last six full weeks).
- **Device:** desktop 90%, mobile 10%.
- **Session source (90d):** direct 70%, Google 162 sessions, AI assistants 24 (ChatGPT 11, Perplexity 5, Gemini 4), LinkedIn 8, Bing 1.
- The direct share is probably inflated. Analytics loads only on the first interaction or when the browser goes idle, so bounces under about 3s are never counted (`Analytics.astro`).
- **Top entry pages (90d sessions):**
  - `/` 111
  - apollo-vs-clay-vs-linkedin-sales-nav 52
  - gong-vs-outreach-vs-salesloft 27
  - adcreativeai-vs-canva-vs-creatify 21
  - activecampaign-vs-hubspot-vs-brevo 19
  - moltsets 16
  - fullenrich-vs-bettercontact-vs-surfe 12
  - pipedrive-costs 12
- **Scroll on posts:** median 43%, p75 92%. Only 33% of post pageviews report it (`$pageleave` only).

### Affiliate clicks (PostHog `affiliate_click`)

- 65 clicks in 90d and 43 in 28d. Only 25 (90d) and 17 (28d) resolved to a real affiliate URL; the rest went to tools with no live program.
- **Per 100 post pageviews:** 10.0 (90d) and 15.0 (28d) counting all clicks; 3.8 and 5.9 counting real affiliate URLs only.
- **Top slugs (90d):** aloware 13 (no program), bland-ai 6, rb2b 3, then several at 2.
- **The clicks are not trustworthy as a funnel measure.**
  - About 20 of the 65 arrived in two bursts (8/27 and 9/16), one click per tool from fresh anonymous ids. They look automated, which is unverified.
  - Duplicates also appear: bland-ai fired 3 times in 18 seconds.
- **The source page is unknown for 61 of 65 clicks** (see finding F1).

### Newsletter

- **0 real subscribers.** Beehiiv has 3 subscriptions, all Ian's own addresses. Free (launch) plan.
- No welcome email, no automation, no lead magnet. 0 recommendations in or out. The referral program is on but has no milestones.
- **The site cannot see a signup.** The form is a cross-origin Beehiiv iframe.
  - The only `submit` events PostHog has are the site search form (7 in 90d).
  - So the "Newsletter / form intent" tile built by `posthog-setup.mjs` counts searches.

### Search (GSC, window ending 2026-09-28)

| | 28d | 90d |
|---|---|---|
| Clicks | 54 | 94 |
| Impressions | 24,296 | 56,118 |
| CTR | 0.22% | 0.17% |
| Avg position | 17.5 | 29.8 |

- **Weekly clicks:** 5, 7, 4, 9, 8, 17, 10, 20, rising.
- **Near-win set (average position 5-15):** 96 pages and 13.9k impressions over 28d.
- **High-impression, zero-click pages (28d):**

| page | impressions | avg position |
|---|---|---|
| `/tools/close/` | 1,708 | 5.1 |
| `/tools/pipedrive/` | 1,234 | 36.7 |
| beehiiv-vs-substack-vs-hubspot | 908 | 5.4 |
| aisdr-hubspot-workflow | 814 | 5.6 |
| `/tools/hubspot/` | 713 | 38.1 |
| rb2b-pricing | 608 | 7.9 |

### Volume check: why no A/B tests

Detecting a 30% relative lift in clicks per post pageview (two-sided two-proportion test, alpha 0.05, power 0.8), at about 63 post pageviews per week:

| baseline | needed per arm | weeks |
|---|---|---|
| Raw 15.8% | 1,036 | 33 |
| Excluding the suspect bursts, 9.8% | 1,823 | 58 |
| Post-originated clicks only, about 3.7% | 5,190 | 164 |

**No split test in this audit can reach significance in useful time.** Each change below is judged instead by:
- best practice;
- a pre-registered before/after funnel rate over a fixed window of at least 8 weeks;
- Clarity (live, `Analytics.astro`) for scroll and click maps on individual pages.

The before/after rates are only readable once F1 and F2 land.

---

## 2. Findings

### Measurement (nothing else here can be verified until these land)

**F1. Affiliate clicks lose their source page, and many cannot be told apart from bots.**
- **What happens:**
  - `affiliate_click` fires from the standalone `/go/` page.
  - Every `/go/` link carries `rel="noopener noreferrer sponsored"`, so `document.referrer` is empty on 61 of 65 clicks.
  - 45 of 65 clicks (69%) use a fallback `anon_*` id because no PostHog cookie existed yet. Analytics loads lazily, so a fast clicker never gets a cookie.
  - The event carries no user agent, device or session.
- **Consequences:**
  - Which page, component or position drives clicks is unknowable.
  - Two bursts (8/27, 9/16), about 20 of the 65 clicks, look automated but cannot be filtered.
- **Size:** every affiliate click.

**F2. Newsletter signups are invisible on-site, and one dashboard tile is mislabelled.**
- **What the site can see:**
  - The form is a cross-origin Beehiiv iframe.
  - The only `submit` events in PostHog are the site search form (7 in 90d).
  - So the "Newsletter / form intent" tile from `analytics/posthog-setup.mjs` is counting searches.
- **What Beehiiv records:**
  - Beehiiv does record `acquisition_source` per subscription (for example "embed / theautomationsguide.com / referral").
  - So the measurable number already exists at Beehiiv: real (non-Ian) subscriptions per week.
- **Current state:** 0 real subscribers.

### Lost clicks

**F3. No button CTA above the fold on posts.**
- Above the fold there is only the TL;DR and the TOC.
- **First button-style CTA (y position):**

| post | desktop | mobile |
|---|---|---|
| apollo-vs-clay | 1,116 | 2,225 |
| rb2b-pricing | 2,558 | 5,574 (6.9 screens down) |
| activecampaign-vs-hubspot-vs-brevo | 2,528 | 5,271 |

- **Why it matters:** median post scroll is 43%, so roughly half of readers never reach the first button.
- **Size:** every post. Posts are 67% of pageviews.

**F4. 165 mentions of live-program tools are never linked through `/go/`.**
- 165 mentions across 92 posts:
  - 133 have no link at all;
  - 32 link only to the `/tools/` hub.
- **Top tools:** Apollo 31, Smartlead 28, Clay 25, Instantly 12, lemlist 11, Make 11.
- **Top posts:**
  - vector-n8n-website-visitor-signal-workflow
  - linkedin-outbound-loop-clay-lemlist-hubspot
  - cold-email-deliverability-audit-fix-flagged-sequences
  - clay-smartlead-n8n-cold-email-automation-stack (a `.md` file with 0 `/go/` links)
- **Size:** 56% of posts.

**F5. More than half of CTAs point at programs that pay nothing.**
- **Across all posts:**
  - Of 1,456 `/go/` references, 663 (46%) go to live programs. The rest are pending, applied, rejected or no-program.
  - 59 of 130 BottomLine CTAs recommend a non-live program; n8n (rejected) is the pick in 15.
- **In the 7 top entry posts:** 29 of 54 `/go/` links are non-live.
- **On hubs:**
  - 79 of 123 hub CTAs go to a non-commission homepage.
  - The HubSpot hub's primary teal button earns nothing (status `rejected`).
- **Constraint:** the verdicts are editorial and must not bend toward commission. The honest lever is narrower: where a post already recommends a live tool for a stated case, that tool gets a CTA too.

**F6. Mobile horizontal scroll on about 76 of 164 posts.**
- **Cause:**
  - `.figure.post-screenshot .figure-body img { max-width: 600px }` (`global.css:1940`) overrides `max-width: 100%`.
  - A screenshot wrapped in a link renders 600px wide in a 375px viewport.
- **Confirmed on activecampaign-vs-hubspot-vs-brevo:** page width 488px at 375px.
- **The overflow gate misses it:**
  - `qa/mobile-overflow.mjs` was meant to catch exactly this class but did not.
  - Either it checks before lazy images lay out, or it never exercises these figures. This is not yet diagnosed.
- **Size:** about 10% of traffic (mobile), on nearly half the posts. Two of them are top-entry posts.

**F7. Tool-hub meta descriptions are one boilerplate line.**
- **The line:** "Every article on The Automations Guide that covers X, plus where it fits..." (`src/pages/tools/[tool].astro:18`).
- **The hubs it hurts most:**

| hub | 28d impressions | avg position | clicks |
|---|---|---|---|
| `/tools/close/` | 1,708 | 5.1 | 0 |
| `/tools/pipedrive/` | 1,234 | | 0 |
| `/tools/hubspot/` | 713 | | 0 |

- **What would fix it:** a description built from the tool's own `blurb`/`bestFor` says what the tool is and who it fits. This changes descriptions only, not titles. The 8/04 flat result was for titles.
- **Caveat:** Google may rewrite snippets anyway, so this is a low-cost bet, not a sure win.
- **Size:** about 3.6k impressions/28d on the three worst hubs alone.

### Lost signups

**F8. The only newsletter ask is late, generic and broken on mobile.**
- **Placement:** one `EmailSignup` per post, after the FAQs, at 76-82% of page height. Most readers stop around 43%.
- **Offer:** "new posts by email", nothing else.
- **On mobile** the Beehiiv email field is squeezed to about 60px ("Ente...").
- **The header "Newsletter" button** goes to `/#newsletter`, which takes a post reader off the post they are reading.
- **Lead magnet:**
  - `OFF_SITE_SEO_CHECKLIST.md` marks the "RevOps Stack Audit" Notion template DONE (2026-06-11).
  - It is not linked anywhere on the site, so the one incentive that exists is never offered.
- **In Beehiiv:**
  - No welcome email.
  - 0 recommendations in or out. The free recommendations network works on the Launch plan.

### Reach and navigation

**F9. "Share it with your team." has nothing to click** (`BlogPostLayout.astro:181`).
- There are 0 share controls on any post.
- Plain share links (LinkedIn share URL, email, copy link) need no third-party script and no CSP change.

**F10. Comparisons are hard to find.**
- **Nav vs content:**
  - The nav item "Comparisons" goes to `/reviews/`, which is H1 "Reviews" with 8 single-tool reviews.
  - The 60 "X vs Y" posts, which are most of the top entry pages, live at `/guides/tool-vs-tool/`, linked only from the footer.
- **`/guides/` returns 404.** Nothing links to it, so impact is low, but it is a dead URL a reader can type.

**F11. Top entry posts get almost no internal links.**
- Links from other post bodies (not counting the auto "Keep reading" block):

| top entry post | posts linking in |
|---|---|
| gong-vs-outreach-vs-salesloft | 0 |
| adcreativeai-vs-canva-vs-creatify | 0 |
| moltsets | 0 |
| rb2b-pricing | 0 |
| apollo-vs-clay | 1 |

- The posts that already earn entries get no help from the rest of the site.

**F12. The affiliate disclosure sits at the very bottom of posts.**
- **Posts:**
  - The disclosure is about 5,500px (desktop) or 13,600px (mobile) below the first affiliate link.
  - FTC guidance is "clear and conspicuous", near the links.
  - Its meaning stays exactly the same; it is only placed earlier, as a one-line note under the byline.
- **Hubs:** they carry a sponsored CTA with only the footer link as disclosure.

### Checked and fine (do not re-audit)

- **Speed:**
  - Mobile LCP is 0.86-1.64s (4x CPU, slow 3G-ish), with CLS near 0.
  - Only about 270KB loads at first; the Beehiiv embed (22 requests) loads lazily.
- **Links and tags:**
  - 0 broken `/go/` links on the top posts.
  - `rel=sponsored` is present on every `/go/` link.
  - OG and Twitter cards are on every post.
  - RSS is fine: 164 items, advertised.
- **Hub linking:** 157 of 164 posts link to their `/tools/` hubs.
- **`/tools/` orphans:** 18 listed tools never rendered on `/tools/`. Fixed by PR #325, not merged as of this writing.

---

## 3. Recommendations, ranked by impact x effort

Effort key: **QW** = quick win, CSS/markup/copy under about 1h. **M** = about half a day. Every metric is pre-registered here, and every "verify" date assumes the change merges within a week of 10/01.

| # | Change | Fixes | Effort | Files | Metric that should move | Verify |
|---|---|---|---|---|---|---|
| R1 | **Click attribution.** (1) Every page writes its own path to first-party `localStorage` (`tag_last_page`). `sessionStorage` would not survive `target=_blank` + `noopener`. (2) The `/go/` beacon sends `source_path`, `$raw_user_agent`, `$device_type` and a bot flag (`navigator.webdriver`). (3) Optionally, CTAs append `?from=<component>` so the component is known. No new third party, no CSP change. | F1 | QW-M | `BaseLayout.astro`, `go/[tool].astro`, CTA components | Share of `affiliate_click` with a non-null `source_path`: from 6% to over 90%. Bot-flagged clicks become filterable. | 2 weeks after merge |
| R2 | **Signup metric + tile fix.** Define the KPI as Beehiiv subscriptions per week, excluding Ian's addresses, read via the Beehiiv MCP/API. Relabel or replace the PostHog "form intent" tile, which counts site search. | F2 | QW | `analytics/posthog-setup.mjs`, `ANALYTICS.md` | The KPI exists and reads 0 now. | Weekly |
| R3 | **Mobile screenshot overflow.** `max-width: min(600px, 100%)`, plus find out why `qa:overflow` missed it and make it fail on this fixture. | F6 | QW | `global.css:1940`, `qa/mobile-overflow.mjs` | Posts with horizontal scroll at 375px: 76 to 0. | On the deploy preview |
| R4 | **Quick-win batch (one PR).** (a) Header Newsletter button scrolls to the on-page signup when one exists. (b) Signup stacks on mobile so the email field is full width. (c) Plain share links (LinkedIn, email, copy) replace the empty "Share it" line. (d) "Comparisons" nav points to `/guides/tool-vs-tool/`, and `/guides/` gets a redirect or index. (e) One-line disclosure under the post byline and next to the hub CTA, same wording and meaning. | F8 (partial), F9, F10, F12 | QW | `BaseLayout.astro`, `BlogPostLayout.astro`, `EmailSignup.astro`, `tools/[tool].astro`, `_redirects` | Signups by `acquisition_source` (R2); clicks on share links (`$autocapture`); `/guides/tool-vs-tool/` pageviews (90d baseline 0). | 8 weeks |
| R5 | **Hub meta descriptions** built from `bestFor`/`blurb` (fallback: the current line). Descriptions only, no titles. | F7 | QW | `tools/[tool].astro` | GSC CTR on `/tools/*` hubs, 28d. Baseline: close/pipedrive/hubspot at 0 clicks on 3.6k impressions. | 6 weeks after recrawl |
| R6 | **Link unlinked live-tool mentions.** A deterministic script links the first unlinked mention of each live-program tool per post through `/go/<slug>/` (`rel=sponsored`). It skips headings, FAQs, code and existing links. It runs dry first with a diff Ian reviews. A lint warning catches new posts. | F4 | M | new `qa/link-live-mentions.mjs`, `qa/lint-content.mjs`, 92 posts | Real-affiliate clicks per 100 post pageviews. Baseline 3.8 (90d) / 5.9 (28d), but read it only after R1. | 8 weeks |
| R7 | **Above-the-fold "Tools compared here" strip** on comparison posts: logos plus "Try X" links for the live-program tools the post compares, under the TL;DR. Only tools the post already covers; no ranking change. Must pass the design audit's guardrails (no new "AI tells"). | F3, F5 (partly) | M | new `src/components/post/ToolStrip.astro`, `BlogPostLayout.astro` | Share of clicks with `source_path` on a post, and clicks from the strip's `from=` tag (needs R1). | 8 weeks |
| R8 | **A real reason to subscribe.** Offer the existing RevOps Stack Audit template (needs Ian's link). Add one lighter mid-post ask after the comparison table or the first H2, not a popup. Turn on a Beehiiv welcome email that delivers the template. Join the Beehiiv recommendations network (free). | F8 | M (+Ian in the Beehiiv UI) | `EmailSignup.astro`, `BlogPostLayout.astro`, Beehiiv | Real signups per week (R2), baseline 0. | 8 weeks |
| R9 | **Internal links into the top entry posts:** run the existing mesh for the 7 top posts, adding 2-3 links in from cluster siblings each. | F11 | M | `internal-link-mesh.mjs`, posts | Entries plus GSC position on those 7 posts. | 8 weeks |
| R10 | **Live alternative CTAs where the post already recommends them.** For posts whose BottomLine pick is non-live, add a CTA for the live tool the post itself names as the pick for a stated case. Never change a verdict. This is editorial, so each post needs a human check. | F5 | M-L | posts | Real-affiliate clicks per 100 post pageviews. | 8 weeks |

**Not recommended:**
- **A/B tests:** about 33-164 weeks to significance (section 1).
- **Exit-intent or scroll-triggered popups:** they conflict with the guardrails and the brand.
- **Routing pricing-index vendor links through `/go/`:** the index's value is neutrality. It is a CC BY dataset meant to be cited.
- **Subscriber counts or "join N readers" copy:** there are 0 real subscribers.

**Suggested build order:**
- R1 and R2 first, because every later metric depends on them.
- Then R3 and R4 (quick wins).
- Then R5, R6 and R7.
- R8 needs Ian's template link and a few minutes in Beehiiv.
