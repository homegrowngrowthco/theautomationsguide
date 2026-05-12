# Affiliate Programs

Application status for the tools featured on the site, plus high-value adjacent programs for the RevOps/automation niche.

**Source of truth for live URLs:** [`src/data/affiliate-links.ts`](src/data/affiliate-links.ts) — that file drives every `/go/<slug>` redirect on the site. This doc tracks application state and program details for reference.

---

## Tier 1 — Featured on the site

Status as of 2026-05-12.

| Tool | Status | Live link | Commission | Notes |
|---|---|---|---|---|
| **Make.com** | ✅ Live | `https://www.make.com/en/register?pc=automationsguide` | 35% for 12 months, 30-day cookie | Direct Make partner program (partner code `automationsguide`). Min payout $100 + 3 unique paying users. Wise only. |
| **Apollo.io** | ✅ Live | `https://get.apollo.io/k7n9run0vl50` | 15% monthly / 20% annual, 12 months | Via PartnerStack. 30-day hold for cancel buffer. |
| **Clay** | ✅ Live | `https://me.sh/?via=theautomationsguide` | $50 one-time per Pro customer, 60-day cookie | Via Rewardful. Creator Program (20% revshare for 12 mo) available later once content volume grows. |
| **Beehiiv** | ✅ Live | `https://www.beehiiv.com/?via=the-automations-guide` | 50-60% recurring 12 months (tiered) | Tier-up to 60% with volume. |
| **Smartlead** | ✅ Live | `https://smartlead.ai/?via=theautomationsguide` | 15-35% recurring (tiered by volume) | Tier-up with conversion volume. |
| **Kit** | ✅ Live | `https://partners.kit.com/nt9zrjmnck9y` | 50% for 12 months, then 10-20% recurring at Bronze+ | Via PartnerStack. Newsletter alt to Beehiiv. |
| **HubSpot** | ❌ Rejected (2026-05-12) | n/a — `/go/hubspot` falls back to homepage + UTM | 30% recurring 12mo + welcome bonus | Likely traffic-related rejection. Re-apply once monthly traffic builds (~1K visits/mo). Site cards still work via the redirect. |
| **n8n** | ❌ Rejected (2026-05-12) | n/a — `/go/n8n` falls back to homepage + UTM | 30% for 12 months | Likely traffic-related rejection (PartnerStack-hosted, cloud referrals only, no paid ads). Re-apply once traffic builds. |
| **Pipedrive** | ⏳ Pending | n/a (gated by PartnerStack Network app) | 20-30% recurring 12mo (tiered) | Will be reachable once PartnerStack Network application is approved. |
| **Lemlist** | ⏳ Not applied yet | n/a | Recurring on subscription, % varies | Apply when adding a Smartlead-alt comparison post. |

**PartnerStack Network application:** pending as of 2026-05-12. Approval unlocks Pipedrive + any other PartnerStack-hosted program without per-program re-application.

**Removed from site:** Zapier (no public affiliate program), Gong (enterprise only), Chorus/ZoomInfo (enterprise only). Replaced on site by Beehiiv / Smartlead / Pipedrive.

---

## Application URLs (for reference / re-applications)

| Tool | Where to apply | Cookie window |
|---|---|---|
| HubSpot | Email `affiliates@hubspot.com` with site URL + plan | 180 days |
| Make.com | Sign up for Make → Dashboard → "Affiliate Program" | 30 days |
| n8n | https://n8n.io/affiliates/ (PartnerStack) | n/a |
| Apollo.io | https://www.apollo.io/partners/affiliates | n/a |
| Clay | https://www.clay.com/affiliate (Rewardful) | 60 days |
| Beehiiv | https://partners.beehiiv.com/signup | — |
| Smartlead | https://www.smartlead.ai/affiliate-partners | — |
| Pipedrive | https://www.pipedrive.com/en/affiliate-partnership (PartnerStack) | — |
| Lemlist | https://lemlist.com/affiliate-program | — |
| Kit | https://kit.com/affiliate (PartnerStack) | — |

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

## Where to update links going forward

All affiliate URLs live in one place: [`src/data/affiliate-links.ts`](src/data/affiliate-links.ts).

To change a link:
1. Edit the `url` field for that slug.
2. Update `status` (`live`, `pending`, `rejected`, `applied`, `no-program`).
3. Commit + push to `master`. Netlify auto-deploys within ~2 minutes.

No edits to `tools.astro`, `index.astro`, or blog posts are needed — they all link to `/go/<slug>`, which resolves via the data file at request time. If `url` is empty, the redirect falls back to the tool homepage with a UTM tag so the link still works.

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
