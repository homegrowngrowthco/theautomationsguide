# Affiliate Pipeline

A working list of GTM-space affiliate/partner programs to apply for, weighted toward newer and AI-native tools. The strategy is to be the early (ideally first) neutral comparison and source-of-truth for tools before their category gets crowded, then ride branded + category search as they grow.

Single affiliate tracker (AFFILIATE_PROGRAMS.md was merged in here 2026-07-17). Live/applied/rejected **status lives in [src/data/affiliate-links.ts](src/data/affiliate-links.ts)** (the source of truth for every `/go/<slug>` link); this doc tracks the pipeline, program terms, and application URLs.

## How to use this

1. Apply to a program (use the self-serve platforms first: PartnerStack, Rewardful, Tolt, FirstPromoter, Impact).
2. When approved, paste the real link into `src/data/affiliate-links.ts` (`url` field) and flip `status` to `live`. The `/go/<slug>` redirect picks it up on the next deploy.
3. Once a tool has an approved link OR a published article, set `listed: true` in [src/data/tools.ts](src/data/tools.ts) and add a logo to `public/brand/tools/` so it joins the homepage strip + `/tools` grid.
4. Move the row's status here as you go.

**Legend:** ✅ program confirmed (research or well-known self-serve) · 🔎 has/likely a program, verify on application · ⭐ high first-mover value (new/AI, little comparison content yet) · **LP** = landing page already built at `/tools/<slug>` (unlisted until approved/written).

> Commission figures are from June-2026 research and are indicative only. Verify exact terms, cookie window, and platform on application. Pricing and programs change.

---

## Priority pipeline (apply first) — 20 tools, landing pages already live

All 20 have a confirmed self-serve program (no sales call) and an unlisted landing page at `/tools/<slug>` with a working `/go/<slug>` CTA.

### Wave 1 — apply this week (top 10)

| # | Tool | Program / platform | Est. commission (verify) | Landing page | Applied? | Approved? |
|---|---|---|---|---|---|---|
| 1 | **Instantly** | Referral (refer.instantly.ai) | Verify | `/tools/instantly` LP | ☑ | ☑ (live 2026-06-11) |
| 2 | **AiSDR** | PartnerStack | ~20% first-year rev share | `/tools/aisdr` LP | ☑ | ☐ |
| 3 | **RB2B** | 3rd-party affiliate | ~20% on referred deals | `/tools/rb2b` LP | ☑ | ☑ (live 2026-06-09) |
| 4 | **Warmly** | Affiliate (verify platform) | Verify | `/tools/warmly` LP | ☑ | ☐ |
| 5 | **Relevance AI** | Affiliate (no upfront) | Verify | `/tools/relevance-ai` LP | ☑ | ☑ (live 2026-06-09) |
| 6 | **Pabbly** | Affiliate (per-product) | Recurring/lifetime | `/tools/pabbly` LP | ☑ | ☑ (live 2026-06-11, Pabbly Connect) |
| 7 | **Lusha** | PartnerStack | ~20% first 12 mo | `/tools/lusha` LP | ☑ | ☑ (live 2026-06-11) |
| 8 | **Synthflow** | PartnerStack | ~20% for 12 mo | `/tools/synthflow` LP | ☑ | ☐ |
| 9 | **Surfer** | PartnerStack | CPA-based (up to ~125% CPA) | `/tools/surfer` LP | ☑ | ☑ (live 2026-08-21, +3 deep links) |
| 10 | **Cal.com** | Direct (cal.com/affiliate-program) | 20% recurring 12 mo | `/tools/cal-com` LP | ☑ | ☑ (live 2026-06-09) |

### Wave 2 — next (11-20)

| # | Tool | Program / platform | Est. commission (verify) | Landing page | Applied? | Approved? |
|---|---|---|---|---|---|---|
| 11 | **Lindy** | Affiliate | Verify | `/tools/lindy` LP | ☑ (2026-08-19) | ☐ |
| 12 | **Reply.io** | Affiliate/partner | ~20% recurring | `/tools/reply-io` LP | ☑ | ☑ (live 2026-08-19, +2 deep links) |
| 13 | **KrispCall** | PartnerStack | ~30% lifetime | `/tools/krispcall` LP | ☑ | ☑ (live 2026-08-21, +1 deep link) |
| 14 | **Laxis** | PartnerStack | up to ~35% (30% first 12 mo) | `/tools/laxis` LP | ☑ | ☑ (live 2026-08-19) |
| 15 | **Close** | PartnerStack | ~30% first 12 mo | `/tools/close` LP | ☑ | ☑ (live 2026-08-21, +2 deep links) |
| 16 | **Nutshell** | PartnerStack | ~20-40% first year | `/tools/nutshell` LP | ☑ | ☑ (live 2026-08-21, +4 deep links) |
| 17 | **GetResponse** | Affiliate | ~40-60% recurring 12 mo, or bounty | `/tools/getresponse` LP | ☑ (2026-08-19) | ☐ |
| 18 | **AdCreative.ai** | Affiliate | ~30% recurring rev share | `/tools/adcreative` LP | ☑ (2026-08-19) | ☐ |
| 19 | **Motion** | Affiliate | ~$50 per paid sub | `/tools/motion` LP | ☑ | ☑ (live 2026-08-19) |
| 20 | **Brevo** | Affiliate | Verify | `/tools/brevo` LP | ☑ (2026-08-19) | ☐ |

---

## Full backlog (~72 more), by category

Build landing pages + apply as content warrants. ⭐ = strongest first-mover opportunities.

### AI SDR / autonomous outbound agents ⭐
| Tool | Program | Notes |
|---|---|---|
| Artisan (Ava) | 🔎 verify | Note: lost automated LinkedIn outreach in early 2026 |
| 11x | 🔎 likely partner-only | Enterprise; comparison value even without affiliate |
| Salesforge | 🔎 verify | Pairs with Mailforge/Warmforge |
| Regie.ai | 🔎 verify | AI sales agent + content |
| Qualified (Piper) | 🔎 partner | Inbound AI SDR for Salesforce sites |
| Outplay | 🔎 verify | Multichannel, SMB |

### Cold email infra / deliverability / inboxes
| Tool | Program | Notes |
|---|---|---|
| MailReach | 🔎 affiliate | Deliverability/warmup |
| Maildoso | 🔎 verify ⭐ | Inbox/domain infra (new category) |
| Mailforge | 🔎 verify ⭐ | Domains/inboxes (Salesforge ecosystem) |
| Warmforge | 🔎 verify | Free warmup play |
| Quickmail | 🔎 affiliate | Established sender |
| Saleshandy | 🔎 affiliate | Sequencing + deliverability |
| Mailshake | 🔎 affiliate | (your old Tier 3) |
| Bouncer | 🔎 affiliate | Email verification |
| ZeroBounce | 🔎 affiliate | Verification |

### Lead data / enrichment ⭐ (waterfall tools are new)
| Tool | Program | Notes |
|---|---|---|
| Surfe | 🔎 verify ⭐ | LinkedIn to CRM, newer |
| LeadMagic | 🔎 verify ⭐ | Waterfall enrichment |
| FullEnrich | ☑ LIVE 2026-08-21 | Waterfall; strong "vs Clay" angle. PartnerStack, 15-25% tiered |
| BetterContact | 🔎 verify ⭐ | Waterfall |
| Findymail | 🔎 affiliate | Email finder |
| Prospeo | 🔎 affiliate | Email/phone finder |
| Ocean.io | 🔎 verify | Lookalike/company data |
| Seamless.ai | 🔎 affiliate | Contact data |
| Cognism | 🔎 partner | EU phone data (enterprise) |
| Hunter | 🔎 affiliate | (your old Tier 2) |
| Snov.io | 🔎 affiliate | (your old Tier 2) |

### Website visitor ID / intent / signals ⭐
| Tool | Program | Notes |
|---|---|---|
| Vector | 🔎 verify ⭐ | "RB2B vs Vector" has demand |
| Trigify | 🔎 verify ⭐ | Social/LinkedIn signals, new |
| Default | 🔎 verify | Inbound routing + forms + signals |
| Common Room | 🔎 verify | Signal aggregation |
| Factors.ai | 🔎 verify | Account intelligence/visitor ID |
| Dealfront (Leadfeeder) | 🔎 partner | EU visitor ID |
| ~~Koala~~ | excluded | Shut down after Cursor acquisition |

### AI dialers / calling / voice ⭐ (AI voice is brand new)
| Tool | Program | Notes |
|---|---|---|
| CloudTalk | 🔎 affiliate | Call center |
| JustCall | 🔎 affiliate | AI dialer, SMB-priced |
| Aircall | 🔎 partner | Established |
| PhoneBurner | 🔎 affiliate | Power dialer |
| Bland AI | 🔎 verify ⭐ | AI voice infra, very new |
| Vapi | 🔎 verify ⭐ | AI voice infra, very new |
| Aloware | 🔎 verify | Dialer |

### Meeting intelligence / notetakers
| Tool | Program | Notes |
|---|---|---|
| Fireflies | 🔎 affiliate | Popular notetaker |
| tl;dv | 🔎 affiliate | Free tier |
| Otter.ai | 🔎 affiliate | Transcription |
| Avoma | 🔎 verify | Notetaker + revenue intel |
| Fathom | 🔎 verify | Free-heavy, popular |
| Read.ai | 🔎 verify | Meeting intel |
| Circleback | 🔎 verify ⭐ | New AI notetaker |

### CRM (modern / AI)
| Tool | Program | Notes |
|---|---|---|
| Attio | 🔎 partner ⭐ | Modern AI-native CRM, fast-growing |
| folk | 🔎 affiliate | Lightweight CRM |
| Salesflare | 🔎 affiliate | SMB CRM |
| Capsule | 🔎 verify | SMB CRM |

### Scheduling / forms / routing
| Tool | Program | Notes |
|---|---|---|
| Chili Piper | 🔎 partner | Inbound routing/scheduling |
| Tally | 🔎 affiliate | Forms (your old Tier 3) |
| Fillout | 🔎 verify ⭐ | New forms tool |
| Calendly | none/weak | Comparison value only, no strong public program |

### Proposals / CPQ / deal rooms / e-sign
| Tool | Program | Notes |
|---|---|---|
| PandaDoc | 🔎 affiliate (PartnerStack) | Docs/e-sign/CPQ |
| Qwilr | 🔎 affiliate | AI proposals |
| GetAccept | 🔎 verify | Digital sales rooms |
| Proposify | 🔎 verify | Proposals |
| Storydoc | 🔎 verify ⭐ | AI decks, new |

### AI SEO / GEO / content
| Tool | Program | Notes |
|---|---|---|
| Frase | 🔎 affiliate ⭐ | GEO/AI-visibility focus |
| Writesonic | 🔎 affiliate | AI content + GEO |
| Jasper | 🔎 affiliate | AI content |
| Clearscope | 🔎 verify | Content optimization |
| Semrush | ✅ affiliate | Big program |
| Profound / AthenaHQ | 🔎 verify ⭐ | GEO/AI-search analytics, brand-new category |

### Workflow automation / AI agents (core-topic adjacency)
| Tool | Program | Notes |
|---|---|---|
| Bardeen | 🔎 verify | AI browser automation |
| Gumloop | 🔎 verify ⭐ | New AI workflow builder |
| Relay.app | 🔎 verify ⭐ | New automation tool |
| Activepieces | 🔎 verify | Open-source (n8n-adjacent) |

### Marketing automation / email / creator
| Tool | Program | Notes |
|---|---|---|
| ActiveCampaign | ☑ LIVE 2026-08-21 | Automation. PartnerStack, 30% recurring 12 mo, +4 deep links |
| Webflow | 🔎 affiliate | (your old Tier 2) |
| Taplio | 🔎 affiliate ⭐ | LinkedIn growth (AI) |
| Loops | 🔎 verify ⭐ | New SaaS email tool |
| Customer.io | 🔎 verify | (bonus) |
| Mailerlite | ✅ affiliate | (bonus) |

---

## Already in the main registry (not part of this pipeline)
- **Live:** Make, Apollo, Clay, Beehiiv, Smartlead, Kit, Lemlist (live 2026-06-11, get.lemlist.com)
- **Pending:** Pipedrive (PartnerStack Network approval)
- **Rejected (re-apply at ~1K visits/mo):** HubSpot, n8n

## Pabbly — other product links (use when a relevant post lands)
`/go/pabbly` points at **Pabbly Connect (Recurring)** — the automation product our content compares. Pabbly issues a distinct affiliate link per product (same `affurl` base, different `?target=`). Park these here and wire a product-specific `/go/<slug>` slug only when a post covers that product:
- Pabbly Connect (Recurring) — `?target=9Z2AHyhSldo6KI1Fn` ← **in use as `/go/pabbly`**
- Pabbly Connect (One-Time) — `?target=nMfdbf0I90K3UdJn`
- Pabbly Connect Agency (Recurring) — `?target=P7X6LsuPmxWoqqRp`
- Pabbly Subscription Billing (Recurring) — `?target=w4UQrrgZ05qQUQa5n`
- Pabbly Subscription Billing (One-Time) — `?target=GdNZ27XC4L7d1Z1umo`
- Pabbly Email Marketing (Recurring) — `?target=vqgM0VwdWh6GoJgn`
- Pabbly Chatflow (Recurring) — `?target=3WkXqse1cUZ2J9Gqq`
- Pabbly Form Builder (Recurring) — `?target=JWZ1eBi6KuFVa4Kfn`
- Pabbly Email Verification — `?target=q1BHyhSldoCFO1Fn`
- Pabbly Plus (Recurring) — `?target=b1BHyhSldo6RN1Fn`
- Pabbly Hook (One-Time) — `?target=5RL6LsuPmxWkTfRp`
- Pabbly Chat (One-Time) — `?target=WPbgtsZ1YXMjxTfRp`
- Black Friday Pabbly — `?target=gvvAZ1woDCGnckqiq`
- Pabbly Free Account Signup — `?target=R90zZ1MAwZ1ruZ2wfPo`
- Pabbly Homepage — `?target=tm576znNj1Z0Tagzn`
- Base: `https://payments.pabbly.com/api/affurl/RVYZ07kQyUZ0Z1HUKZ1m/LbwNxEMRwQxp5wyq?target=<id>`

---

## Program terms + application URLs (reference; absorbed from AFFILIATE_PROGRAMS.md, 2026-07-17)

Status is deliberately NOT tracked here (it goes stale) — read it from `affiliate-links.ts`. These are the program terms and application entry points for the original Tier-1 set:

| Tool | Program / where to apply | Commission | Cookie / notes |
|---|---|---|---|
| Make.com | Make dashboard "Affiliate Program" (partner code `automationsguide`) | 35% for 12 mo | 30-day cookie; min payout $100 + 3 unique paying users; Wise only |
| Apollo.io | https://www.apollo.io/partners/affiliates (PartnerStack) | 15% monthly / 20% annual, 12 mo | 30-day hold for cancel buffer |
| Clay | https://www.clay.com/affiliate (Rewardful) | $50 one-time per Pro customer | 60-day cookie; Creator Program (20% revshare 12 mo) available once content volume grows |
| Beehiiv | https://partners.beehiiv.com/signup | 50-60% recurring 12 mo (tiered) | Tier-up to 60% with volume |
| Smartlead | https://www.smartlead.ai/affiliate-partners | 15-35% recurring (tiered) | Tier-up with conversion volume |
| Kit | https://kit.com/affiliate (PartnerStack) | 50% for 12 mo, then 10-20% recurring at Bronze+ | — |
| HubSpot | Email `affiliates@hubspot.com` with site URL + plan | 30% recurring 12 mo + welcome bonus | 180-day cookie; re-apply at ~1K visits/mo (see TODO.md) |
| n8n | https://n8n.io/affiliates/ (PartnerStack) | 30% for 12 mo | Cloud referrals only, no paid ads; re-apply at ~1K visits/mo |
| Pipedrive | https://www.pipedrive.com/en/affiliate-partnership (PartnerStack) | 20-30% recurring 12 mo (tiered) | Gated on PartnerStack Network approval (see TODO.md) |
| Lemlist | https://lemlist.com/affiliate-program | Recurring %, varies | Live since 2026-06-11 (`get.lemlist.com`) |

**Later-tier candidates (from the old Tier-3 list):** ClickUp (Impact, 20-25% recurring), Webflow (PartnerStack, 50% x 12 mo), Tally/Typeform (forms angle). Skip: Airtable ($10 referral credit only), Notion (referral closed), Salesforce/Outreach/Salesloft (enterprise partner programs only). Zapier/Gong/Chorus have no public affiliate program (no-program `/go/` fallbacks exist).

**Link-change procedure:** edit `url` + `status` for the slug in `src/data/affiliate-links.ts`, commit + push — every surface links through `/go/<slug>` so nothing else needs edits. Empty `url` falls back to the tool homepage + UTM.

**FTC disclosure:** live sitewide (inline under-byline microcopy + `/disclosure`), shipped Sessions 20/59.

## Notes
- Prefer self-serve platforms first; many AI startups host on **PartnerStack, Rewardful, Tolt, or FirstPromoter**, which approve without a sales call.
- Tools with no/weak public programs (**Calendly, Ahrefs, Zapier**) are still worth comparison content; they just are not commissionable.
- Verify everything on application: commission %, recurring vs one-time, cookie window, and whether paid-ads or brand-bidding are allowed.
