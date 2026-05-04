# Affiliate Programs to Apply To

Direct application URLs for the tools featured on the site, plus high-value adjacent programs for the RevOps/automation niche.

**Apply order:** Tier 1 first (already on the site), then Tier 2 (high commission, easy approval).

---

## Tier 1 — Already featured on the site

These need to be live before launch promotion. All 8 currently use `AFFILIATE_LINK_PLACEHOLDER` in `src/pages/index.astro` and `src/pages/tools.astro`.

| Tool | Apply | Commission | Cookie | Notes |
|---|---|---|---|---|
| **HubSpot** | Email `affiliates@hubspot.com` with site URL + plan | 30% recurring up to 12 months + welcome bonus up to $80 | 180 days | Manual review, 2-3 business days. Highest tier potential of the bunch. |
| **Make.com** | Sign up for Make → Dashboard → "Affiliate Program" | 35% for 12 months | 30 days | Min payout $100 + 3 unique paying users. Wise only. |
| **n8n** | https://n8n.io/affiliates/ → click apply (PartnerStack) | 30% for 12 months | n/a | No paid ads allowed. Cloud referrals only. |
| **Apollo.io** | https://www.apollo.io/partners/affiliates → "Apply now" | 15% monthly / 20% annual, for 12 months | n/a | Through PartnerStack. 30-day hold for cancel buffer. |
| **Clay** | https://www.clay.com/affiliate (powered by Rewardful) | One-time $50 per Pro plan customer | 60 days | Lower commission but easy approval. Creator Program (20% revshare for 12 mo) available later. |
| **Zapier** | NO public affiliate program | n/a | n/a | Only Solution Partner (consultancy) and Integration Partner (build apps). Skip — replace the Zapier card on the site with another tool. |
| **Gong** | No public affiliate program | n/a | n/a | Enterprise sales motion only. Drop from site. |
| **Chorus** (ZoomInfo) | No public affiliate program | n/a | n/a | Same — enterprise. Drop from site. |

**Action:** Replace Zapier, Gong, and Chorus cards on the site with tools that actually have programs. See Tier 2.

---

## Tier 2 — High-value programs to add

Worth featuring on the site because they pay well, your audience needs them, and the program is open to anyone.

| Tool | Apply | Commission | Why feature it |
|---|---|---|---|
| **Beehiiv** | https://partners.beehiiv.com/signup | 50-60% recurring for 12 months (tiered) | You'll use it for your own newsletter — easy authentic recommendation. Tier-up to 60% fast. |
| **Smartlead** | https://www.smartlead.ai/affiliate-partners | 15-35% recurring (tiered by conversion volume) | The cold email tool RevOps teams actually use. Strong fit. |
| **Lemlist** | https://lemlist.com/affiliate-program | Recurring on subscription, % varies | Good alt to Smartlead, more visual workflows. |
| **Pipedrive** | https://www.pipedrive.com/en/affiliate-partnership (PartnerStack) | 20-30% recurring for 12 months (tiered) | The CRM HubSpot-skeptics pick. SMB-friendly. |
| **Kit (ConvertKit)** | https://kit.com/affiliate (PartnerStack) | 50% for 12 months, then 10-20% recurring at Bronze+ | Newsletter alt to Beehiiv. Use whichever you actually run. |

---

## Tier 3 — Add later, when you have authority in their niche

Apply once you have 10+ posts that mention the tool, or when relevant content goes live.

- **ClickUp** — affiliate via Impact, 20-25% recurring, project mgmt angle
- **Webflow** — affiliate via PartnerStack, 50% commission for 12 months, design/CMS angle
- **Airtable** — referral only ($10 credit), no real affiliate program — not worth it
- **Notion** — referral closed. Skip.
- **Tally / Typeform** — both have affiliate programs, useful for "how to build forms that..." posts
- **Salesforce / Outreach / Salesloft** — enterprise partner programs only, not affiliate. Skip unless you go consultancy route.

---

## Where to put the links once approved

Each tool's link replaces every `AFFILIATE_LINK_PLACEHOLDER` instance for that tool. Currently:

- `src/pages/index.astro` — Make, Clay, HubSpot, n8n
- `src/pages/tools.astro` — all 8 in tiers (Make, Clay, HubSpot, n8n, Apollo, Zapier, Gong, Chorus)

When you swap Zapier/Gong/Chorus for Beehiiv/Smartlead/Pipedrive, also update:
- `src/components/EmailSignup.astro` — once Beehiiv embed is live, the affiliate context is implicit
- Blog posts that mention the tool (use Grep to find `Zapier|Gong|Chorus` in `src/content/blog/`)

## FTC disclosure

Once any affiliate links go live, add a disclosure line to:
- `src/pages/about.astro` (already has space for it — first-person About page)
- `src/pages/tools.astro` (top of page)
- Any blog post that recommends a tool with an affiliate link (footer of post)

Suggested wording: _"Some links on this site are affiliate links. If you sign up through them, I may earn a commission at no extra cost to you. I only recommend tools I'd use myself."_

---

## Tracking what works

Once 3+ programs are live, add a simple Notion DB:
- Tool · Program URL · My Affiliate Link · Status (Pending/Approved/Live) · First Click Date · First Sale Date · Total Earned

This becomes the source-of-truth for which tools to feature more prominently.
