# Content Calendar — fresher-content / newer-tools ("E")

Ranked posting calendar anchored on the 20 Wave 1/2 tools in [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md). Every tool here already has an unlisted `/tools/<slug>` landing page, so each post gets a built-in internal-link target and an affiliate hook the day its program is approved. The strategy is the pipeline's: be the early (ideally first) neutral comparison before the category crowds, then ride branded + category search.

Ranking favors the newest categories (AI SDR agents, AI voice, visitor ID, AI agent builders, GEO) where there is little comparison content to compete with today.

**Status:** all rows staged in the Notion Content Calendar DB at `Status: Suggested` (the engine only fires on `Queued`). Flip a row to `Queued` to let the engine generate + publish it. Pub dates are suggestions spaced ~3/week; reorder freely.

> Instantly (Wave 1 #1) is intentionally absent: it is already covered by [instantly-alternatives](src/content/blog/2026-06-02-instantly-alternatives-2026-what-to-use-when-you-outgrow-it.mdx) and [lemlist-vs-smartlead-vs-instantly](src/content/blog/2026-05-27-lemlist-vs-smartlead-vs-instantly-2026-cold-email-showdown.mdx). Its LP is supported.

| # | Topic | Anchor tool(s) (LP) | Also covers | Target keyword | Priority | Suggested pub | Angle / hook |
|---|---|---|---|---|---|---|---|
| 1 | Best AI SDR tools in 2026: AiSDR vs 11x vs Artisan | AiSDR | 11x, Artisan (Ava) | ai sdr tools | High | 2026-06-09 | Brand-new autonomous-agent category, almost no neutral comparison content. Note Artisan lost auto LinkedIn early 2026. |
| 2 | AI voice agents for sales: Synthflow vs Bland AI vs Vapi | Synthflow | Bland AI, Vapi | synthflow vs bland ai | High | 2026-06-11 | AI voice infra is brand-new; first-to-compare upside is highest here. |
| 3 | Website visitor identification: RB2B vs Warmly vs Vector | RB2B, Warmly | Vector, Factors.ai | rb2b alternatives | High | 2026-06-13 | "RB2B vs Warmly" and "RB2B vs Vector" both have search demand and thin content. |
| 4 | AI agent builders for GTM: Relevance AI vs Lindy vs n8n | Relevance AI, Lindy | n8n | relevance ai vs lindy | High | 2026-06-16 | Ties newer AI agents back to the site's core n8n authority. Strong internal-link play. |
| 5 | AI content optimization in the GEO era: Surfer vs Frase vs Clearscope | Surfer | Frase, Clearscope | surfer vs frase | High | 2026-06-18 | GEO / AI-visibility framing is fresh; Surfer LP is Wave 1. |
| 6 | B2B contact data: Lusha vs Apollo vs ZoomInfo | Lusha | Apollo, ZoomInfo | lusha vs apollo | Medium | 2026-06-20 | Links to the live Apollo program; positions Lusha as the lighter-weight pick. |
| 7 | Scheduling for revenue teams: Cal.com vs Calendly vs Chili Piper | Cal.com | Calendly, Chili Piper | cal.com vs calendly | Medium | 2026-06-23 | Cal.com open-source angle pairs with the site's automation audience. |
| 8 | Reply.io vs Smartlead vs Instantly: sequencing in 2026 | Reply.io | Smartlead, Instantly | reply.io vs smartlead | Medium | 2026-06-25 | Links the live Smartlead program; complements existing cold-email posts. |
| 9 | Close vs Pipedrive vs HubSpot: a CRM built for outbound | Close | Pipedrive, HubSpot | close crm vs pipedrive | Medium | 2026-06-27 | Close's built-in calling/sequencing is the differentiator for SDR teams. |
| 10 | Affordable sales CRMs: Nutshell vs Pipedrive vs Close | Nutshell | Pipedrive, Close | nutshell vs pipedrive | Medium | 2026-06-30 | Overlaps #9 on tools; keep the angle distinct (price-led, SMB) or merge if #9 covers it. |
| 11 | Business phone for SDR teams: KrispCall vs JustCall vs Aircall | KrispCall | JustCall, Aircall | krispcall vs justcall | Medium | 2026-07-02 | Dialer category, SMB-priced; KrispCall ~30% lifetime is a strong hook. |
| 12 | AI meeting notetakers compared: Laxis vs Fireflies vs Otter | Laxis | Fireflies, Otter.ai | laxis vs fireflies | Medium | 2026-07-04 | Notetaker category is crowded but "Laxis vs" is thin. |
| 13 | Email marketing platforms: GetResponse vs Brevo vs Mailchimp | GetResponse, Brevo | Mailchimp | getresponse vs brevo | Medium | 2026-07-07 | Covers two Wave-2 LPs in one post; pairs with existing newsletter content. |
| 14 | Budget automation: Pabbly vs Zapier vs Make | Pabbly | Zapier, Make | pabbly vs zapier | Low | 2026-07-09 | Pabbly's lifetime/recurring deal is the hook; links the live Make program. |
| 15 | AI ad creative: AdCreative.ai vs Canva vs Creatify | AdCreative.ai | Canva, Creatify | adcreative.ai alternatives | Low | 2026-07-11 | Slightly off the core RevOps lane; keep if demand-gen readers warrant it. |
| 16 | AI calendar and task managers: Motion vs Reclaim vs Akiflow | Motion | Reclaim, Akiflow | motion vs reclaim | Low | 2026-07-14 | Founder-productivity adjacency; Motion pays ~$50/paid sub. |

## How to run a row
1. Confirm the anchor tool's affiliate program is applied/approved (track in AFFILIATE_PIPELINE.md). The post can publish before approval; the `/go/<slug>` redirect already falls back to homepage+UTM.
2. In Notion, flip the row from `Suggested` to `Queued`. The engine generates a draft (now emitting `<DecisionTree>` + 2-3 visuals), opens a PR, runs QA, and auto-merges per the daily GHA.
3. After publish, set `listed: true` in [src/data/tools.ts](src/data/tools.ts) for the anchor tool so it joins the homepage strip + `/tools` grid.

## Coverage check
All 20 Wave 1/2 tools are represented: AiSDR(1), Synthflow(2), RB2B+Warmly(3), Relevance AI+Lindy(4), Surfer(5), Lusha(6), Cal.com(7), Reply.io(8), Close(9), Nutshell(10), KrispCall(11), Laxis(12), GetResponse+Brevo(13), Pabbly(14), AdCreative.ai(15), Motion(16). Instantly is covered by existing posts.
