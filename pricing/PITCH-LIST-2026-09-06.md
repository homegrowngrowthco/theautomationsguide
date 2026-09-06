# Pricing index pitch list, 2026-09-06 (Ian sends; nothing has been sent)

Closes TODO "Pitch the pricing index to 5-10 RevOps newsletters/communities."

## The asset, as it stands today

- URL: https://theautomationsguide.com/revops-automation-pricing/
- Headline on the page: "RevOps automation tool pricing index". Intro: "What 65 RevOps and GTM automation tools actually cost to start using, in one table. Entry price, what the free tier gives you, and what you are billed per: seat, flat, credits, or usage."
- 65 tools in the main table; 93 checked in total. The 28 that could not be read are listed on the page by name with the reason (client-side rendered, vendor blocks automated requests, unreachable), because which tools hide their pricing is itself information.
- Columns: tool and category, free tier (and its limit), entry paid plan and price, billing unit (seat / flat / credits / usage / mixed), top published tier, source link with read date.
- Read date on every row: 2026-08-12. Next rebuild ~2026-11-12.
- License CC BY 4.0; raw JSON at https://theautomationsguide.com/data/revops-pricing-index.json
- Method, in one sentence: an extractor reads each vendor's own pricing page on a stated date and records a blank rather than a guess when a figure is not literally on the page. Nothing is inferred or carried over.

The pitch is the same everywhere: a maintained, cited price table, free to reuse, no sponsorship angle. The ask is a link in a curated slot, not a feature.

## Outlets

| # | Outlet | URL | Contact path | Why it fits |
|---|---|---|---|---|
| 1 | RevOps Co-op Weekly (Matt Volm) | https://www.revopscoop.com/ (newsletter archive: https://revopscoop.substack.com) | community@revopscoop.com (the address on their community guidelines page); partner inquiries at /who-we-are/become-a-revops-co-op-partner. Slack has a "no self-promotion" rule, so do not post it there yourself | The Weekly is explicitly curated ("collected tweets, posts and thoughts"); community is 7,000+ on the Substack about page, 15K+ Slack per their site |
| 2 | RevOps Impact Newsletter (Jeff Ignacio) | https://revengine.substack.com/ | Substack message or LinkedIn DM (https://www.linkedin.com/in/jeffbethechange/); sponsorship is sold via Limelight, but this is an editorial ask, not a paid one | Practitioner Substack, ~6K subscribers per third-party lists; writes about tooling and operating models, links out |
| 3 | Wizards of Ops (WizOps) Slack | https://wizops.org/ | Join via "Join WizOps Today" on the site; members are vetted, ops-only, zero tolerance for pitching. Share it as an answer in a tooling/pricing thread, or ask a question with the table attached; never as a post about the site | Practitioners compare tool costs in-channel all the time; 9,000+ members per Arovy's write-up (WizOps' own guide page still says 800+, stale) |
| 4 | Revenue Operations Alliance newsletter | https://www.revenueoperationsalliance.com/revenue-operations-newsletter/ ; contribute page https://www.revenueoperationsalliance.com/create-and-contribute/ | content@revenueoperationsalliance.com. Monthly newsletter has a resource-links section. Contributed articles must be 1,000+ words, no product promotion, no backlinks in the body, canonical link allowed for previously published work | Two paths: a resource link in the monthly, or a data-driven article built on the index with a canonical back to the page |
| 5 | RevOps Roundup (RevOps.io, now part of Maxio) | https://www.revops.io/newsletter | hello@revops.io | Monthly, and its first section is literally "Curated Content: top RevOps articles sourced from the internet"; 1,000+ subscribers per the page |
| 6 | The RevOps Letter (Weflow; Janis Zech and Philipp Stelzer) | https://www.weflow.ai/revopsletter | Reply to any issue after subscribing ("Question? We'll reply, personally"), or LinkedIn to either author | 2,500+ operators, "data-driven insights ... no spam, no selling"; a cited price table matches their format |
| 7 | MarketingOps.com (MO Pros) | https://marketingops.com/ | Join the Slack; share into the Member Vault or a tools channel; site contact form for the community team | 3,500+ members, 78% weekly engagement per the site; MOps buys most of the tools in the table (Zapier, Make, n8n, enrichment, email) |
| 8 | RevGenius / Revenue Creator newsletter | https://www.revgenius.com/ (newsletter: revenuecreator.com) | Contributor form https://revgenius.typeform.com/contributor for RevGenius Magazine; Slack for community sharing | Weekly newsletter of "news, articles, and resources"; 50-60K members per the site. Big, less targeted, cheap to try |
| 9 | r/revops (and r/salesops) | https://www.reddit.com/r/revops/ | Text post, not a link post. Read the sidebar rules first (reddit blocked my fetch, so member count and current rules are unverified); put the link in a comment only if someone asks | Practitioner threads on "what does X cost" are common; a post that shares the table as data, with method and gaps, is on-topic |
| 10 | The GTM Index, RevOps page (Rome Thorndike) | https://thegtmindex.com/revops/ | No submit link on the page; it says listings are reviewed quarterly, no payment accepted, criteria are educational value, active maintenance, peer recommendation. Contact Rome via the site footer or LinkedIn | A curated directory that already lists RevOps Co-op and RevOps Impact; a quarterly-maintained CC BY dataset meets all three stated criteria |

Backups not in the ten: GTMnow (formerly Sales Hacker, 50K+ subscribers) takes article pitches but blocked my fetch, so the contribute path is unconfirmed; On the Fly Ops / "Aligned on the Fly" (Brett Hovanec, LinkedIn newsletter, https://ontheflyops.com/) is a single-practitioner outlet worth a LinkedIn note if the first ten go well.

## Pitches (3 sentences each, plain)

### 1. RevOps Co-op Weekly (to community@revopscoop.com, attn Matt Volm)

Hi Matt, I put together a pricing index for 65 RevOps and GTM automation tools: entry price, what the free tier gives you, and what you are billed per (seat, flat, credits, usage), with every figure read from the vendor's own pricing page on a stated date and a blank where it could not be verified. It is free, CC BY 4.0, with a JSON download, at https://theautomationsguide.com/revops-automation-pricing/. If it fits a curated-links slot in the Weekly that is the whole ask; no sponsorship angle, and I will not post it in the Slack.

### 2. RevOps Impact Newsletter (Jeff Ignacio, Substack message or LinkedIn)

Hi Jeff, I read RevOps Impact and thought this might be useful to you or your readers: a price index for 65 RevOps automation tools (entry plan, free tier, billing unit, top published tier), each row sourced to the vendor's pricing page with the read date. The interesting part is the 28 tools that could not be read, listed by name with the reason, since which vendors hide pricing is its own signal. It is CC BY with a raw JSON file, at https://theautomationsguide.com/revops-automation-pricing/, and I rebuild it quarterly.

### 3. Wizards of Ops (in-channel, as a reply or a question, not a post about the site)

For anyone comparing automation tool costs, I built a table of what 65 RevOps and GTM tools charge to start (entry plan, free tier, whether you are billed per seat, flat, credits, or usage), read straight from vendor pricing pages on 2026-08-12 with blanks where a figure could not be verified. Raw JSON is downloadable and it is CC BY, so take what you need: https://theautomationsguide.com/revops-automation-pricing/. If your team has seen a price that differs from a row, tell me and I will re-check the source.

### 4. Revenue Operations Alliance (content@revenueoperationsalliance.com)

Hi, I maintain a free, CC BY 4.0 pricing index for 65 RevOps and GTM automation tools, with every figure traced to the vendor's own pricing page on a stated date and nothing inferred: https://theautomationsguide.com/revops-automation-pricing/. I would be glad to see it in the resource-links section of the monthly newsletter, or if you prefer contributed pieces, I can write a 1,000+ word article on what the index shows about how these tools bill (seats versus credits versus usage), following your no-promotion rule, with a canonical link back to the data. Either way there is a raw JSON download for anyone who wants to reuse the numbers.

### 5. RevOps Roundup (hello@revops.io)

Hi, your Curated Content section is what made me send this: a pricing index for 65 RevOps and GTM automation tools (entry price, free tier, billing unit, top tier), each row sourced to the vendor's pricing page with the read date, plus a named list of the 28 tools whose pricing could not be read and why. It is free and CC BY, with a JSON download, at https://theautomationsguide.com/revops-automation-pricing/. If it is useful for an upcoming issue, that is all I am after.

### 6. The RevOps Letter (reply to Janis Zech and Philipp Stelzer)

Hi Janis and Philipp, since the letter is built around data and not selling, this may fit: a price index of 65 RevOps automation tools, every figure read from the vendor's pricing page on a stated date, with blanks instead of guesses where the number was not on the page. The billing-unit column (seat, flat, credits, usage) is the part operators seem to find most useful when budgeting a stack. It is CC BY with raw JSON at https://theautomationsguide.com/revops-automation-pricing/, and I would be happy for you to link it or use the data in an issue.

### 7. MarketingOps.com (Member Vault or tools channel, or the community contact form)

For the tools channel: I built a table of what 65 RevOps and marketing automation tools cost to start (Zapier, Make, n8n, enrichment, email, and others), showing entry plan, free tier, and whether billing is per seat, flat, credits, or usage, all read from vendor pricing pages on 2026-08-12. It is free and CC BY with a JSON download, so it can go in the Member Vault if that is useful: https://theautomationsguide.com/revops-automation-pricing/. Corrections welcome; every row links to its source so anyone can check it.

### 8. RevGenius (contributor form, and Revenue Creator newsletter)

Hi, I maintain a free pricing index of 65 RevOps and GTM automation tools, each row sourced to the vendor's own pricing page with a read date, published CC BY 4.0 with a JSON download: https://theautomationsguide.com/revops-automation-pricing/. It would fit a resources slot in Revenue Creator, and I can also write a short Magazine piece on what the data shows about how these tools bill (seats versus credits versus usage) if that is more useful. No product to sell here; the site is an independent guide and the index is rebuilt quarterly.

### 9. r/revops (text post; link in a comment if asked)

Title: I read the pricing pages of 93 RevOps automation tools and put the numbers in one table (65 readable, 28 not). Body: Entry plan, free tier and its limit, billing unit (seat, flat, credits, usage), and top published tier, each with the vendor URL and the date read; where a figure was not literally on the page it is left blank rather than guessed, and the 28 tools that could not be read are listed with the reason (client-side rendered, blocking bots, unreachable). Happy to share the raw JSON (CC BY) if anyone wants it, and if a row looks wrong tell me which one and I will re-check the source.

### 10. The GTM Index (Rome Thorndike, footer contact or LinkedIn)

Hi Rome, your RevOps page lists resources on educational value, active maintenance, and peer recommendation, so I wanted to put one in front of you: a pricing index for 65 RevOps and GTM automation tools, every figure sourced to the vendor's pricing page with a read date, rebuilt quarterly, CC BY 4.0 with raw JSON. It lives at https://theautomationsguide.com/revops-automation-pricing/ and it is not vendor-funded. If it does not meet the bar, I would still appreciate a line on what is missing.

## Send notes

- Order: 5, 4, 1, 6 first (they have a stated curated or resource slot and a public inbox), then 2 and 10 (single-person editorial calls), then the communities (3, 7, 8, 9) once you are a member for a week or two and have answered a couple of threads.
- Do not cross-post the same text into more than one community; RevOps Co-op's guidelines call that out, and WizOps vets members.
- Subscriber counts are as published on the outlets' own pages or the third-party lists cited; treat them as order-of-magnitude.
- Log sends and replies in this file so the next pitch round starts from what actually happened.

## Sources

- Live asset: https://theautomationsguide.com/revops-automation-pricing/ ; build notes: pricing/README.md
- RevOps Co-op: https://www.revopscoop.com/ , https://revopscoop.substack.com/about , https://www.revopscoop.com/resources/community-guidelines
- RevOps Impact: https://revengine.substack.com/about ; subscriber estimate: https://croclub.com/career/best-revops-newsletters/
- Wizards of Ops: https://wizops.org/ , https://wizops.org/wizards-of-ops-community-guide/ , https://www.arovy.com/resources/blog/the-wonderful-wizards-of-ops
- Revenue Operations Alliance: https://www.revenueoperationsalliance.com/revenue-operations-newsletter/ , https://www.revenueoperationsalliance.com/create-and-contribute/
- RevOps Roundup: https://www.revops.io/newsletter
- The RevOps Letter: https://www.weflow.ai/revopsletter
- MarketingOps.com: https://marketingops.com/
- RevGenius: https://www.revgenius.com/
- The GTM Index: https://thegtmindex.com/revops/
- Community and newsletter round-ups used for candidates: https://croclub.com/career/best-revops-communities/ , https://www.everstage.com/blog/5-free-newsletters-everyone-in-revenue-operations-should-subscribe-to , https://www.flowla.com/blog/resources-for-revops-professionals , https://bizsystemsnews.com/revops-communities/
- GTMnow (backup): https://gtmnow.com/ ; On the Fly Ops (backup): https://ontheflyops.com/
