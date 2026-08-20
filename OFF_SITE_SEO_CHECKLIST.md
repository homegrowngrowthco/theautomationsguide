# Off-Site SEO & Distribution Checklist

> RUNBOOK (per todo-sync CONVENTION: no per-step TODO items required; actionable queue items live in TODO.md)

Last updated: 2026-07-17

## Search Engine Submission

- [x] Submit `https://theautomationsguide.com/sitemap-index.xml` in Google Search Console (2026-04-24)
- [x] Set up Bing Webmaster Tools (2026-04-24)
- [x] Run URL Inspection → Request Indexing on homepage in GSC (after next push)
- [x] Run URL Inspection → Request Indexing on `/blog`, `/tools`, `/about`

## Social & Brand Signals

- [x] **Create LinkedIn Company Page for The Automations Guide.** Created 2026-06-12: `https://www.linkedin.com/company/the-automations-guide/`, already in the org `sameAs` in `src/layouts/BaseLayout.astro` + live in the built JSON-LD (`dist/index.html` + `/about/`).
  - Note: company pages have ~3-5× lower organic reach than personal accounts. Consider also posting from Ian's personal LinkedIn (`/in/ianchamberland/`) for amplification.
- [x] **Create Twitter/X account** (optional) — same drill, send URL when ready. Created 2026-05-30 but was apparently missed so I added it here on 2026-06-23: `https://x.com/the_automations`
- [ ] Add site URL to LinkedIn bio, GitHub profile, email signature

## Directory listings (brand-term Step 4 — paste-ready)

Done: 4a Crunchbase (2026-07-01, https://www.crunchbase.com/organization/the-automations-guide) · 4b Product Hunt (2026-07-01, https://www.producthunt.com/products/the-automations-guide).

**Status (2026-07-23):** 4c IH account created but posting is gated for new accounts (wait). 4e AlternativeTo new free accounts must age 7 days before submitting → **submit on/after 2026-07-31** (same session as 4c). **4d BetaList DROPPED** — it is now paid-only with no free submission tier, not worth the fee for a single DA-75 link. Every field below is copy-paste ready; brand term appears verbatim in the first line of each description for the branded-search play, and the tool entities (HubSpot/Clay/n8n/Zapier/Make/Apollo) are seeded for GEO citation.

**4c — Indie Hackers — DROPPED 2026-08-20** (Ian attempted: now requires paid membership / activity gates; not worth it for one link). Fields kept below in case the calculus changes.
(DA 75). URL: https://www.indiehackers.com/product/new → creates `indiehackers.com/product/the-automations-guide`.
- **Product name:** `The Automations Guide`
- **Website URL:** `https://theautomationsguide.com`
- **Tagline / one-liner:** `Independent RevOps automation reviews and workflow playbooks`
- **Revenue model:** Other (Affiliate)
- **Description:** `The Automations Guide is an independent review site for RevOps and GTM automation tools. It publishes hands-on tool reviews, head-to-head comparisons (Zapier vs Make vs n8n, HubSpot vs Salesforce workflows), migration guides, and step-by-step workflow playbooks for teams building their revenue operations stack. Every write-up comes from tools we have actually run in production, not vendor documentation. We cover HubSpot, Clay, n8n, Zapier, Make, Apollo, and 50+ more, and we never rank tools by affiliate commission. Published by Homegrown Growth Co, a fractional RevOps consultancy founded by Ian Chamberland.`
- **Maker bio:** `Ian Chamberland, founder of Homegrown Growth Co, a fractional RevOps consultancy. 8 years building GTM systems and automations inside high-growth teams. I write The Automations Guide to share the playbooks, tool comparisons, and workflow tactics we use in real client engagements.`

**4e — AlternativeTo — DROPPED 2026-08-20** (Ian attempted: paid/activity-gated in practice despite the account aging out). Fields kept below in case the calculus changes.
(DA 80). URL: https://alternativeto.net/software/add/. Position as an alternative to vendor-written documentation.
- **Software name:** `The Automations Guide`
- **Website:** `https://theautomationsguide.com`
- **Short description:** `Independent automation review blog for RevOps and GTM teams. Reviews, head-to-head comparisons, and workflow playbooks for HubSpot, Clay, n8n, Zapier, Make, and Apollo.`
- **Longer description:** `The Automations Guide is an independent resource for choosing and building RevOps and GTM automation. It covers automation platform comparisons (Zapier, Make, n8n, and where each one actually breaks), HubSpot and Salesforce workflow automation including the edge cases the docs skip, lead routing and enrichment with Clay and Apollo, and full migration guides between tools. Every recommendation comes from tools used in a real production environment, and rankings are never based on affiliate commission. A practical alternative to vendor-written documentation and feature-list roundups. Published by Homegrown Growth Co, a fractional RevOps consultancy.`
- **Licensing:** Free · **Platform:** Web / Online
- **Categories / tags:** Productivity, Marketing, Business & Commerce, CRM, Workflow Automation, Sales, RevOps
- **"Alternative to":** vendor documentation, tool-vendor blogs, generic SaaS review sites

**4d — BetaList — DROPPED (paid-only, no free tier as of 2026-07-23).** Kept here only if the calculus changes: **Startup name:** `The Automations Guide` · **Tagline:** `Independent automation reviews for RevOps and GTM teams` · **Description:** `In-depth tool reviews, comparisons, and workflow playbooks for RevOps and GTM automation. Covers HubSpot, Clay, n8n, Zapier, Make, and 50+ more tools.` · **Categories:** Productivity, Marketing.

## Analytics

- [x] Install PostHog (cloud free tier, 1M events/mo) — wired via `src/components/Analytics.astro`
- [ ] Verify analytics fires correctly on production after next deploy (incognito test)
- [x] Set up PostHog dashboard: top pages by traffic, affiliate_click events by tool, signup funnel — DONE Session 29 (posthog-setup.mjs, dashboard 1699394 on project 408442, 2026-06-11)

## Newsletter

- [x] Beehiiv account created, form embedded
- [x] Attribution.js loaded globally in `BaseLayout`
- [x] CSP updated to allow Beehiiv
- [ ] Verify form renders + a test signup attributes to source page

## Apple Touch Icon

- [x] Added at `public/apple-touch-icon.png` (HGC's icon)
- [x] Link active in `BaseLayout.astro`

## Content Distribution (ongoing)

- [ ] **LinkedIn posting** — 3-5× per week minimum. Use Daily Briefing Slack ping as your queue.
- [ ] **Pitch podcasts (2-3 per month):** RevOps Podcast (Sweep), Modern Sales, Sales Hacker Podcast, GTM Now
- [ ] **Join + participate in communities:** RevOps Co-op (Slack, free), Modern Sales Pros, Pavilion (paid)
- [ ] **Newsletter swaps:** find 3-5 small adjacent newsletters once you're at 100+ subs; do swaps. Beehiiv Boost program available at 500+
- [ ] Submit to: r/RevOps (be careful — read rules first), Indie Hackers, Hacker News (Show HN for big launches only)

## Pricing-index pitch targets (verified active 2026-08-19; fetch-checked, not from memory)

Best-fit order. Only ONE concrete email exists on any fetched page: **gtmnow@gtmfund.com** (covers GTMnow + The GTM Newsletter in one pitch). Everything else is DM/form.

| # | Target | Why | Route |
|---|---|---|---|
| 1 | RevOps Impact Newsletter (Jeff Ignacio) | Pure RevOps, posted TODAY 8/19, latest post is about pricing/quoting | Substack DM revengine.substack.com or LinkedIn DM Jeff Ignacio |
| 2 | Growth Unhinged (Kyle Poyar) | SaaS pricing is his beat; 7/22 issue: "Pricing used to last 18 months. Now it's down to 6." Features guest data | Substack DM growthunhinged.com or LinkedIn DM |
| 3 | RevOps Co-op | 19k newsletter / 15k Slack, dead-center audience; blog active 8/17 | Partner call at revopscoop.com/who-we-are/become-a-revops-co-op-partner (Book Time CTA); or join Slack and share as practitioner |
| 4 | r/RevOps | Active (posts 2-8 days old), tool-COST threads thrive there | Direct self-post; READ SIDEBAR RULES logged-in first; dataset-only framing, zero product angle |
| 5 | RevGenius | 60k community, events active this week | "Contribute to Mag" Typeform in revgenius.com footer |
| 6 | WizOps (wizops.org) | 46% SalesOps/31% MktgOps members. NOT wizardofops.co (now an options-trading site, do not contact) | Join free wizops.org/join-wizops, share inside |
| 7 | GTMnow + GTM Newsletter | Both active Aug 2026; one pitch covers both | **gtmnow@gtmfund.com** |
| 8 | MKT1 (Emily Kramer) | 85k subs; 8/12 issue was GTM-stack workflows | Substack DM newsletter.mkt1.co or LinkedIn DM |
| 9 | Elena's Growth Scoop (Elena Verna) | 97k subs, monetization themes | Substack DM elenaverna.com or LinkedIn DM |
| 10 | Exit Five | 40k subs, B2B marketing adjacent | Sponsorship Typeform via exitfive.com |
| — | Superpath | Marginal fit | Low priority |
| — | Pavilion | Paid sponsorship gate only | Skip for now |
| — | r/sales | Self-promo effectively BANNED (5 of 11 rules; off-site funneling = permaban) | Comments-only, never post the link |

**Pitch template (DM/email, adapt the first line per target):**

> Hi <name>, long-time reader. I maintain The Automations Guide, a RevOps automation review site. I recently published something your readers might find genuinely useful: a pricing index of 93 RevOps tools where every figure is extracted from the vendor's own pricing page (no guesses; if a vendor hides pricing the field is null with a reason), rebuilt quarterly, and published CC BY 4.0 so anyone can reuse the data with attribution. theautomationsguide.com/revops-automation-pricing/ No ask beyond a look. If it is useful for a future issue, the whole dataset is downloadable.

## GEO Baseline Test (run once, then monthly)

Run these searches in **ChatGPT, Perplexity, Claude, and Gemini**. Log whether the site is cited. This is your "before" snapshot — re-run monthly and track improvement.

- [ ] "best RevOps automation blogs"
- [ ] "Make vs Zapier comparison for GTM teams"
- [ ] "how to automate sales handoff HubSpot Slack"
- [ ] "best RevOps automation tools 2026"
- [ ] "RevOps automation stack budget"

## Affiliate Program Applications

- [x] **Tier 1** (apply this week — see [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)): HubSpot (email), Make, n8n, Apollo, Clay, Beehiiv, Smartlead, Pipedrive — DONE Wave 1 complete (2026-06-14); see [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)
- [ ] **Tier 2** (next 2 weeks): Webflow, ClickUp, Brevo, Hunter, Snov
- [ ] **Tier 3** (week 3): Cal.com, Plausible, Tally, Mailshake, Reply.io
- [ ] **Bonus list** (apply when content naturally mentions): Customer.io, LemonSqueezy, Mixmax, Mailerlite, Jotform

When approved: edit `src/data/affiliate-links.ts` → set `url` and change `status: 'pending'` to `'live'` → commit + push.

## Lead Magnets (when ready)

- [x] Build first lead magnet — recommended: free Notion template like "RevOps Stack Audit Template" — DONE (RevOps Stack Audit Notion template, 2026-06-11)
- [ ] Build second — comparison spreadsheet, e.g., "All RevOps tools compared at $X/mo budget tier"
- [ ] Capture via Beehiiv-gated download
