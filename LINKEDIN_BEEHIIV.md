# LinkedIn Company Page + Beehiiv newsletter content (paste-ready)

Two sections: (A) full from-scratch LinkedIn Company Page setup, (B) ready-to-paste copy for a first issue of each Beehiiv template. The Beehiiv HTML shells already live in [brand-kit/beehiiv/](brand-kit/beehiiv/); this supplies the words to drop into them.

> Note for Ian: [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md) records a LinkedIn Company Page as already created (2026-06-12) at linkedin.com/company/the-automations-guide, with the `sameAs` already wired into BaseLayout. [TODO.md](TODO.md) still lists creating it as open. Reconcile when you open LinkedIn: if the page exists, use Section A to fill in / clean up About + Specialties; if it does not, use it for full setup. Either way the public slug stays `the-automations-guide` so the existing `sameAs` keeps resolving.

## IAN MANUAL CHECKLIST (this doc)

- [ ] LinkedIn page setup (paste Section A fields): ~15 min
- [ ] Import the 2 Beehiiv templates + paste Section B first-issue copy: ~20 min (template import steps are in [brand-kit/beehiiv/README.md](brand-kit/beehiiv/README.md))

---

## A. LinkedIn Company Page

Paste field by field in LinkedIn's "Create a company page" flow (or Edit page).

| Field | Value |
|---|---|
| Name | The Automations Guide |
| Public URL slug | the-automations-guide (so the URL is linkedin.com/company/the-automations-guide) |
| Website | https://theautomationsguide.com |
| Industry | Technology, Information and Media (closest fit; alt: Business Consulting and Services) |
| Company size | 1-10 employees |
| Company type | Privately held |
| Tagline (max 120 chars) | The RevOps and GTM automation playbook: honest tool reviews, copy-paste workflows, and ops strategy. |
| Logo | Use the existing site mark in `public/brand/` (do not generate a new one) |
| Cover image | Use an existing brand asset in `public/brand/`; size to LinkedIn's 1128x191 spec |

**About (paste verbatim, fits LinkedIn's 2,000-char limit, no em/en dashes):**

> The Automations Guide is the RevOps and GTM automation playbook for go-to-market teams that want to scale output, not headcount.
>
> We publish honest tool reviews, copy-paste workflows, and revenue operations strategy: the automation layer underneath modern GTM, the middleware, CRM workflows, and data plumbing that make revenue predictable.
>
> Everything here comes from direct experience inside real RevOps teams, not from reading documentation or regurgitating feature lists. We only write about tools we have actually used in production: paid for, hit the limits of, and migrated off when something better came along. We rank tools on fit for the reader, not commission size.
>
> What we cover:
> - Automation platform comparisons (Zapier, Make, n8n) and where each one breaks
> - HubSpot and Salesforce workflow automation, including the edge cases the docs skip
> - Lead routing, scoring, and enrichment with Clay, Apollo, and HubSpot
> - Cold email, sales engagement, and the new AI SDR category
> - RevOps tech stack decisions: what to buy, what to skip, and what order to build
>
> Published by Homegrown Growth Co, a fractional RevOps consultancy founded by Ian Chamberland (eight years in high-growth GTM teams, from data analyst to Head of Global Revenue Operations).
>
> Read the site: theautomationsguide.com
> Questions or topic ideas: ian@theautomationsguide.com

**Specialties (LinkedIn comma-separated list, paste verbatim):**

> RevOps, GTM automation, Revenue Operations, Workflow automation, Make, n8n, Zapier, HubSpot automation, Salesforce automation, Lead routing, Lead enrichment, Cold email, Sales engagement, AI SDR, CRM, Tech stack strategy

**First post (so the page is not empty at launch, paste-ready):**

> The Automations Guide is now on LinkedIn.
>
> We write the RevOps and GTM automation content we wish existed when we were choosing tools and building workflows under deadline: honest comparisons, copy-paste playbooks, and stack decisions from operators who have shipped them in production.
>
> Start here:
> - Make vs Zapier vs n8n in 2026: which should RevOps pick (theautomationsguide.com/blog)
> - The full tool directory with per-tool breakdowns (theautomationsguide.com/tools)
>
> Follow along for new comparisons and workflows every week.

---

## B. Beehiiv newsletter first-issue copy

The HTML templates ("The Briefing - Daily" and "The Guide - Weekly") import once per [brand-kit/beehiiv/README.md](brand-kit/beehiiv/README.md). The copy below fills the section slots for a concrete first send. Swap per the per-send checklist (issue #, date, links, read-time, preview text) on every issue.

Sponsor/CTA links route through the site's tracked redirect, `https://theautomationsguide.com/go/<slug>` (live affiliate slugs include clay, smartlead, instantly, beehiiv, apollo, lemlist).

### B1. Daily "The Briefing" (1 feature + 3 quick links + 1 sponsor, ~3 min)

- **Subject:** The one cold-email metric that actually predicts replies
- **Preview text (separate Beehiiv field):** Plus three links worth your morning coffee.
- **Issue / date line:** Issue #001 - [today's date]
- **Read-time line:** 3 min read

**Feature (the one thing):**
> If you only fix one thing in your outbound this week, fix deliverability before volume. Reply rate follows inbox placement, not send count. Warm the domains, keep daily volume per inbox low, and rotate sending accounts before you scale the list. Everything else is downstream of landing in the primary tab.

**Three quick links:**
> 1. Lemlist vs Smartlead vs Instantly: the 2026 cold email showdown -> /blog/2026-05-27-lemlist-vs-smartlead-vs-instantly-2026-cold-email-showdown/
> 2. The cheap outbound stack for small B2B teams under $200/mo -> /blog/2026-05-08-cheap-outbound-sales-stack-for-small-b2b-teams-under-200mo/
> 3. 5 RevOps automation mistakes killing your pipeline data -> /blog/2026-05-04-5-revops-automation-mistakes-killing-your-pipeline-data/

**Sponsor slot:**
> Today's pick: Smartlead. Unlimited inboxes, built-in warmup, and pricing that does not punish volume. The sending engine we reach for at scale. -> https://theautomationsguide.com/go/smartlead

### B2. Weekly "The Guide" (1 feature + 5 things shipping + 1 tool review + 1 sponsor, ~9 min)

- **Subject:** The $500/mo RevOps stack, and what we'd cut first
- **Preview text (separate Beehiiv field):** Five updates, one tool review, one stack we'd actually build.
- **Issue / date line:** Issue #001 - [Sunday's date]
- **Read-time line:** 9 min read

**Feature:**
> Most RevOps stacks are bloated because tools were bought reactively, one fire at a time. This week we break down the automation stack we would build with a $500/mo budget in 2026: CRM, enrichment, sending, and the middleware that ties them together, plus what to skip until you actually feel the pain. Full breakdown: /blog/2026-05-03-revops-automation-stack-wed-build-with-500mo-in-2026/

**Five things shipping (this week in GTM automation):**
> 1. Make vs Zapier vs n8n: where each one breaks -> /blog/2026-05-03-make-vs-zapier-vs-n8n-in-2026-which-should-revops-pick/
> 2. Apollo vs Clay vs LinkedIn Sales Nav for outbound -> /blog/2026-05-06-apollo-vs-clay-vs-linkedin-sales-nav-best-for-outbound-2026/
> 3. HubSpot vs Pipedrive for outbound sequences -> /blog/2026-06-11-hubspot-vs-pipedrive-for-outbound-sequences/
> 4. Gong alternatives for revenue intelligence that actually fit -> /blog/2026-06-12-gong-alternatives-for-revenue-intelligence-that-actually-fit/
> 5. Instantly alternatives for when you have hit the limits -> /blog/2026-06-10-instantly-alternatives-2026-when-youve-hit-the-limits/

**Tool review (one per issue):**
> Clay. A spreadsheet interface plus 50+ enrichment sources for building targeted, personalized lists at scale. If your SDRs are still researching accounts by hand, this is the highest-leverage tool you are probably not using yet. Read the breakdown at /tools/clay/ or try it: https://theautomationsguide.com/go/clay

**Sponsor slot:**
> This week's sponsor: Beehiiv. The newsletter platform we publish The Automations Guide on, with a real free tier, native referrals, and built-in monetization. -> https://theautomationsguide.com/go/beehiiv

---

## Per-send editing checklist (from brand-kit/beehiiv/README.md)

1. Issue number (`#NNN`)
2. Date (the dateline)
3. Headlines and copy (keep structure, swap text)
4. Affiliate / sponsor link (replace any `#` href with the live URL)
5. Read-time estimate (`X min read`)
6. Preview header text (Beehiiv's separate preview field; write a fresh line each send)

Test before going live: Gmail (light + dark), Apple Mail iPhone, Outlook desktop. Gmail dark mode re-themes the teal aggressively, confirm it stays legible.
