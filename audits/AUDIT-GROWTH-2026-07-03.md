# Growth Audit — theautomationsguide.com — 2026-07-03

Full-spectrum growth audit of the live site + content engine, prioritized for the three goals: **organic traffic growth**, **affiliate conversion**, **email signups**. Companion to [AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md) (technical SEO) and [AUDIT-FULL-2026-06-17.md](AUDIT-FULL-2026-06-17.md) (site quality); those audits' findings are resolved except the tracked lows (L-9/L-10, Astro 4→6). This audit focuses on what neither covered: search performance, affiliate link health, content-model economics (cannibalization, freshness, internal linking), EEAT/GEO, off-site, and programmatic-scaling readiness.

**Positioning note (asked explicitly):** the "HR/people-ops ICP" in external notes was never this site's positioning. All 59 posts from the first (2026-05-03) onward are RevOps/GTM; llms.txt, About, PH listing, and the engine prompt all say RevOps/GTM. **Not a pivot, not scope creep — the other note was wrong.** There IS a real scope question, but it's different: see Content Decision C-3 (topic drift into adjacent niches).

---

## 0. Baseline snapshot ("before" state, captured 2026-07-03)

### Search Console (property `sc-domain:theautomationsguide.com`)

| Window | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| Last 28 days | **7** | **5,040** | 0.14% | 51.3 |
| Last 90 days | 12 | 5,720 | 0.21% | 48.3 |

- **Impressions are ramping hard**: ~70/day in early June → 300+/day by 7/01 (peak 367 on 6/30). ~88% of all 90-day impressions came in the last 28 days.
- **Clicks are flat at ~0**: never more than 2 in a day. The site is *appearing* but not *earning clicks* — partly genuine (avg position 51), partly a CTR problem on the pages that DO rank (below).
- **Branded split: 0 branded impressions in 28d** ("automations guide" contains-filter). The brand term still has zero search demand AND zero visibility; the brand-term project (TODO @high) remains the right call.
- **Impression-quality caveat**: a meaningful share of top "queries" are rank-tracker/scraper strings (`"aircall" -site:reddit.com -site:twitter.com …`). Real human impressions are lower than 5,040; treat the trend (ramp) as real, the absolute number as inflated.

**Top pages by 28-day impressions** (all 0 clicks): gong-alternatives 215 @ pos 74 · lemlist-vs-clay 186 @ 23 · migrate-substack-to-kit 119 @ **9.5** · best-salesforce-automation-tools 112 @ 25 · gong-vs-outreach-vs-salesloft 106 @ 17 · apollo-vs-clay-vs-linkedin-nav 72 @ **8.5** · clay-smartlead-n8n stack 58 @ **7.1**. Three pages rank page-1 with zero clicks.

### Indexation (GSC URL Inspection, all sitemap URLs, run this session)

126 sitemap URLs (was 105 at the S47 check). **116 indexed / 10 not indexed** — a real improvement (S47: 96/105; the June request-indexing round worked: aircall/justcall/otter/vector/surfe all flipped to indexed). The 10 remaining: 7 of the newest auto-registered tool hubs (zerobounce, bouncer, mailreach, folk, salesflare, taplio, fireflies — all <2 weeks old, zero content inlinks), 2 of the newest posts (outreach-alternatives-under-300, storydoc tutorial), and 1 long-standing "Crawled - currently not indexed" (cheap-outbound-stack post, 5/08 — thin-content candidate for C-1/C-2 treatment). Re-run anytime with `python gsc-index-status.py`.

### Lighthouse (local runs, Lighthouse 13.4, simulated mobile unless noted)

| Page | Perf | SEO | A11y | BP | LCP | CLS |
|---|---|---|---|---|---|---|
| Home (mobile) | 0.95 | 1.00 | 1.00 | 0.77 | 2.4s | 0 |
| Home (desktop) | 1.00 | 1.00 | 1.00 | 0.77 | 0.6s | 0.001 |
| Blog post | 0.93 | 1.00 | 0.96 | 0.77 | 2.7s | 0 |
| /tools/ index | 0.97 | 1.00 | 1.00 | 0.77 | 2.2s | 0 |
| Tool hub (/tools/clay/) | 0.97 | 1.00 | 1.00 | 0.77 | 2.3s | 0 |
| /teams/sales/ | 0.97 | 1.00 | 1.00 | 0.77 | 2.1s | 0 |
| /reviews/ | 0.98 | 1.00 | 1.00 | 0.77 | 2.1s | 0 |

- **Performance is a solved problem** — do not spend more effort here. CLS 0 everywhere, mobile LCP 2.1–2.7s.
- Best-practices 0.77 sitewide = 9 third-party cookies (beehiiv/GTM chain) + inspector issues. Cosmetic; not worth chasing.
- **No CrUX field data** (traffic below threshold) — lab-only baseline; PSI API keyless quota was exhausted today, raw Lighthouse JSONs archived in the session scratchpad.

### Affiliate link health (all 60 registry slugs, /go/ page + outbound destination, run this session)

- **All 60 `/go/<slug>/` pages return 200** on prod, including the 5 newest auto-registered slugs (zerobounce, bouncer, mailreach, folk, salesflare).
- **All 13 revenue (live-affiliate) destinations resolve correctly** — apollo/clay/beehiiv/smartlead/lemlist/kit/instantly/rb2b/relevance-ai/pabbly/cal-com land on partner-tagged pages; make + lusha return 403 to bots but redirect through the partner chain correctly (verified partner keys survive the redirect). **No dead affiliate links. No revenue leak from routing.**
- One real defect: **circleback** fallback points at `https://www.circleback.ai/` whose TLS cert only covers the apex → browser cert error on click (finding A-1).

### Off-site

- **Product Hunt**: live (launched this week), 3 upvotes, 5 followers, **1 unanswered maker question** ("how fresh is the workflow library?").
- Built links: HGC footer brand anchor, Crunchbase, Product Hunt, LinkedIn company page, X profile. Brand-term steps 4c/4d/4e (Indie Hackers, BetaList, AlternativeTo) still open.
- Backlink profile + Beehiiv subscriber data: not API-accessible from here — flagged "needs my input" (N-2, N-3).

---

## 1. SHIP NOW (I can do these without input)

**S-1. Internal-link mesh: posts → tool hubs + posts → posts (M effort, ~half day · organic traffic + affiliate conversion). The single highest-leverage code change in this audit.**
The link graph is one-directional. Tool hubs auto-list their related posts, and each post shows 3 auto-related posts, but **in-body contextual links are near zero: only 4 of 53 local posts link to any /tools/ hub, only 7 link to another post, and 42 have neither.** Consequence: all **23 LP-builder tool hubs have zero inbound links from content** (reachable only through the /tools index). Indexation eventually catches up — but only via manual GSC request-indexing rounds (that's how the June batch got in), and today's 10 unindexed URLs are again the newest inlink-less hubs. Worse than the indexing lag: hubs with no contextual inlinks accumulate no authority and pass none to their `/go/` CTAs, and posts never route readers to the hub layer at all. Fix in two parts: (a) a one-time backfill script (same pattern as `backfill-tldr.mjs`) that inserts 2–4 in-body links per post to the tool hubs for tools the post already names + 1–2 sibling comparison posts; (b) the engine-side "link 2–3 recent posts + covered tool hubs" slug feed that S52 punted — this audit re-prioritizes it from residual to ship-now, since every new daily post is currently born linkless.

**S-2. SoftwareApplication JSON-LD on /tools/ hub pages (S effort, ~1h · organic + GEO).**
Blog posts emit rich schema (BlogPosting + FAQPage + Breadcrumb + up to 14 SoftwareApplication entries), but the tool hub pages — the site's product pages — emit only FAQPage + BreadcrumbList. Add SoftwareApplication (name, url, category, offers where pricing is known) to `/tools/[tool].astro`. Pairs with S-1 to make hubs worth indexing.

**S-3. Start populating `updatedDate` (XS effort — the plumbing already exists · organic/EEAT).**
The schema field, JSON-LD `dateModified`, and a visible "Updated" byline are ALL already wired in `BlogPostLayout.astro` — but zero of 59 posts set `updatedDate`, so `dateModified` always equals `datePublished` and the byline never renders. For a fast-decaying SaaS-pricing/comparison catalog this is the cheapest EEAT signal available. Fix is process: any substantive edit (including C-1 consolidations and future freshness sweeps) must bump `updatedDate`; add a lint nudge when a post's file changes without it.

**S-4. Tutorial-format monetization floor (S effort, engine prompt + lint · affiliate conversion).**
The engine's newer workflow/tutorial posts ship almost no affiliate surface: the GEO-workflow post (7/02) has **zero** `/go/` links; the Storydoc and Fillout tutorials have 2 bare prose links each — vs ~10–14 CTA surfaces on comparison posts. Tutorials that name registered tools should carry a minimum CTA density (a ToolBreakdown or ChooseIf block + linked first-mentions). Add to the engine prompt + a lint warning for a post naming ≥2 registered tools with <2 `/go/` references. Also: prose `/go/` links in these posts lack the trailing slash (`/go/hubspot` → 301 hop); make the sanitizer append it.

**S-5. Title/CTR pass on the page-1-but-zero-clicks posts (S effort · organic traffic).**
migrate-substack-to-kit (pos 9.5, 119 impr), apollo-vs-clay-vs-linkedin-nav (8.5, 72), clay-smartlead-n8n (7.1, 58), revops-stack-500mo (4.3, 13) all rank and never get clicked. Rewrite titles/descriptions toward the click (year + concrete outcome + differentiator), watch GSC for 2–3 weeks. Cheap test of whether the CTR problem is packaging or just low-volume queries.

**S-6. circleback fallback URL `www.` → apex (XS effort · affiliate).**
`https://www.circleback.ai/` serves a cert that only covers `circleback.ai` → visitors clicking `/go/circleback` get a browser TLS interstitial. One-line registry change.

**S-7. ItemList JSON-LD on /reviews/, /teams/* and /playbooks/ hubs (XS-S effort · organic/GEO).**
These hubs emit only BreadcrumbList today. Low priority within ship-now, do alongside S-2.

---

## 2. NEEDS MY INPUT (blocked on access or a 5-minute action)

**N-1. Content-calendar queue runs dry ~2026-07-08 — five days from now (5 min · everything downstream).**
Last documented top-up (6/12) queued through 7/08. The backlog builder stages Suggested rows weekly; flip the best to Queued (TODO already tracks this @med — it's now time-critical). Otherwise the daily engine starts skipping days right as impressions ramp.

**N-2. Backlink profile (10 min).** No Ahrefs/Majestic access here and the GSC API doesn't expose the Links report. Export GSC → Links → "Top linking sites" (CSV) and drop it in the repo, or just say the word and I'll work from the known-built list only. Needed to answer "any toxic sources" definitively — nothing suggests a problem, but it's unverified.

**N-3. Beehiiv subscriber count + signup attribution (10 min).** No Beehiiv API key configured. Either add a read key or screenshot the subscriber graph. The open TODO "verify a test signup attributes to source page" is part of this: every post renders the signup embed, but we have never confirmed the funnel end-to-end. Email-signups goal is currently **unmeasurable** from where I sit.

**N-4. Reply to the Product Hunt comment (5 min).** One community question about workflow-library freshness sitting unanswered on the listing. PH listings keep indexing/ranking on engagement; an unanswered maker question is a bad look for an EEAT-sensitive review site.

**N-5. Socials cadence decision (your call).** Site publishes daily; LinkedIn/X posting is manual and effectively dormant (distribution TODO still open @low). The engine already drafts social copy per post into Slack (S52 fixed the URLs). Decide: start posting the drafts 3×/week, or consciously defer until the brand-term work lands. Mismatch between daily publishing and zero distribution is the biggest off-site gap.

**N-6. Brand-term steps 4c/4d/4e (15 min total).** Indie Hackers, BetaList, AlternativeTo listings — paste-ready fields already in TODO.md. Only human-verifiable signup flows block these.

---

## 3. NEEDS A CONTENT DECISION

**C-1. Cannibalization: 5 same-intent clusters (biggest content-side risk as volume scales · organic traffic).**
Tool-overlap analysis across all posts found 231 pairs sharing ≥3 tools — most are fine (different intents). But five clusters target the *same query*:

| Cluster | Posts | Risk |
|---|---|---|
| "Instantly alternatives" | 6/02 **and** 6/10 — near-identical titles, 8 days apart | Direct duplicate. GSC shows both stuck (pos 70 + 59, 72 combined impressions, 0 clicks) — classic split-signal |
| "Outreach alternatives" | 5/28 (mid-market) and 6/19 (under $300/mo) | Same head term; the qualifiers may not differentiate for Google |
| "RevOps stack" | 500/mo stack (5/03), revops-automation-stack-2026, revops-tech-stack-2025 (both undated legacy) | Three pages on one topic; the 2025 one is also the only stale-dated content on the site |
| n8n vs Make | make-vs-zapier-vs-n8n (5/03), n8n-vs-make-cold-outbound (5/25), why-revops-chose-n8n-over-make (6/20) | Third post adds no distinct intent over the second |
| CRM comparisons | hubspot-vs-pipedrive (6/11), close-vs-pipedrive-vs-hubspot (6/27), nutshell-vs-pipedrive-vs-close (6/25) | Pairwise overlap of every combination of 4 CRMs |

Decision per cluster: consolidate + 301 the weaker post into the stronger, or differentiate (retitle/refocus + cross-link with distinct H1/intent). My recommendation: **consolidate the Instantly pair and the RevOps-stack trio; differentiate the rest.** *Root cause fix regardless of the call:* the backlog builder/engine dedup checks Notion rows, not published slugs — add a "reject topic if title-similarity vs published post > threshold" gate so the engine stops minting these.

**C-2. Freshness/decay policy (needed before it's a problem, not after · organic + trust).**
The catalog is young (oldest post 2026-05-03) so nothing is factually stale *yet* — but every comparison post embeds pricing (~15–30 `$X/mo` strings each) that decays on vendors' schedules, and there is no re-verification mechanism. Propose: a quarterly sweep script that extracts pricing claims per post, checks vendor pricing pages, flags drift for review, and bumps `updatedDate` (S-3) on fixes. Decide cadence + whether fixes auto-PR (like the QA auto-fix loop) or queue for review. The two undated legacy posts (`revops-tech-stack-2025`, `automate-sales-handoff-hubspot-slack`) should get dates or be folded into C-1's consolidation.

**C-3. Topic drift guardrail (the REAL positioning question · organic authority).**
Positioning was never HR (see header) — but the engine has been drifting off the RevOps core into adjacent one-off niches: AI ad creative (AdCreative/Canva/Creatify), GEO/content-SEO tools (Frase/Profound/Surfer), proposal software (Storydoc), newsletter-creator content (Kit/Substack/Mailchimp cluster). Each dilutes topical authority the site badly needs while its domain is young (avg position 51). GSC agrees: the adcreative post's queries all sit at pos 67–82. Decide the topic fence (e.g., "tools a RevOps/GTM operator administers or buys") and encode it in the backlog builder's suggestion prompt. The newsletter cluster arguably earns its place (beehiiv/kit are live affiliates); ad-creative and GEO-tools posts don't yet.

**C-4. Build hubs for high-impression no-program tools? (organic play, ~1h each via LP builder).**
`gong-alternatives` is the site's top-impression page (215/28d) but there's no `/tools/gong/` hub, and gong/outreach/salesloft/zapier are all no-program slugs without hubs. Hubs would capture the comparison-shopping traffic and route it to adjacent live-affiliate tools ("teams leaving Gong evaluate X"). Costs a content decision because these pages can't directly monetize.

**C-5. Volume ramp (existing TODO, now with data).** Supply is solved; the governor was always indexation + domain trust. Current data: 101/126 indexed, impressions ramping 4x month-over-month, clicks ~0, avg position 51. My read: **fix S-1/S-5/C-1 first, hold 1/day; revisit at first sustained 10-click week.** Ramping volume now would mint more page-60 posts.

---

## 4. Programmatic scaling assessment (the reverse-Copperline question)

**Verdict: this IS already the engine, and it generalizes.** The pipeline is: Notion queue → n8n daily generate (Sonnet, 2-stage draft+humanize, ~$0.17/article, truncation-guarded) → GitHub PR → deterministic QA (build, lint-content, render-acceptance, mobile-overflow, logo gate) + Vision QA → tool auto-registration (+ human reply-handler fallback) → 2-day loud auto-merge → Netlify deploy → social drafts to Slack. Templates are fully componentized (17 post components, LP builder for tool hubs, backlog builder for topics). To clone into a new niche you'd parameterize: brand kit, tools.ts + affiliate registry seed, engine prompt (ICP + component specs), backlog-builder seed queries. The moat is the QA/auto-registration/auto-merge scaffolding — that's niche-agnostic and took ~50 sessions to harden.

**Manual bottlenecks that break at higher volume, in order of first-to-break:**
1. **Notion queue top-up** — breaks 7/08 (N-1). Automatable: auto-promote top-N Suggested → Queued weekly with a Slack veto window.
2. **Tool-hub LP build rate** — hubs are built by hand-running `build-tool-lp.mjs`; new tools auto-register into the /go/ registry but get **no hub page**, so the hub layer falls behind the post layer (23 orphaned hubs is partly this). Wire LP generation into the auto-register path or a weekly batch.
3. **Screenshot library** — 9 tools covered; posts about uncovered tools ship imageless. Needs a repeatable capture process (Playwright against vendor docs/help centers per the screenshot-sourcing convention).
4. **Social distribution** — drafts are generated but posting is manual and dormant (N-5).
5. **Internal linking** — engine has no slug feed (S-1b); at 2×volume the orphan problem compounds.
6. Not bottlenecks: merge gate (2d loud auto-merge now), Anthropic cost (~$5/mo at 1/day), CI minutes, Netlify.

---

## 5. Coverage gaps (inputs for the backlog, no decision needed — just noting)

- **Missing X-vs-Y pairs among live-affiliate tools** (highest-value comparisons the site hasn't written): Instantly vs Smartlead head-to-head (only 3-ways exist), Clay vs Apollo direct, Kit vs Beehiiv exists but no Beehiiv vs ConvertKit-successor angle, RB2B vs Warmly (visitor-ID, both in registry), Cal.com vs Calendly (calendly impressions already appearing in GSC with NO calendly content).
- **"Calendly" is the free keyword hint in the GSC data** — impressions arriving for a tool with zero coverage and a live Cal.com affiliate link to route to.
- **Teams pages** (6) are indexed but earn ~0 impressions — they're navigation, not search assets; fine as-is, don't invest.
- 14 of 57 tool hubs still lack FAQs (the S49 fix covered the 9 oldest; the auto-registered `justcall/aircall`-era hubs remain).

---

## Verification & method

GSC Search Analytics + URL Inspection APIs (cached OAuth, `~/.gsc/`); Lighthouse 13.4 local (raw JSONs in session scratchpad); affiliate sweep = scripted GET of all 60 `/go/` prod pages + outbound destinations with browser UA (results archived: `affiliate-sweep.json`); content analysis = scripted frontmatter/link-graph parse of all local posts (`content-analysis.json`) cross-checked against origin/master for the 6 posts published since the local checkout; prod HTML spot-checks via curl (JSON-LD types per template, /go/ trailing-slash behavior, robots/sitemap/llms.txt); Product Hunt/circleback via web fetch. Baseline artifacts kept in the session scratchpad; re-runnable scripts noted inline.
