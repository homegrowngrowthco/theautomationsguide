# Findings-led pitch angles, 2026-09-25 (Ian sends; nothing has been sent)

Supersedes the "same pitch everywhere" approach in [PITCH-LIST-2026-09-06.md](PITCH-LIST-2026-09-06.md) (that file still holds the outlet list and contact paths). Why: measured 9/25, the index page has 226 GSC impressions and 7 pageviews in 60 days, so "here is a table" gives an editor no reason to link. A finding is something they can run.

All figures below are computed from `public/data/revops-pricing-index.json` (read date 2026-08-12, 93 tools checked, 65 readable). Recompute after the ~11/12 rebuild before reusing.

## The findings (each verifiable from the JSON)

| # | Finding | Figure |
|---|---|---|
| A | Seat pricing is the minority model | Of the 64 readable tools with a classified billing unit, 20 bill purely per seat. 36 bill by credits (10), usage (12) or a mix (14). 8 are flat monthly. |
| B | Enterprise pricing is hidden | 49 of 65 readable tools (75%) make their enterprise tier quote-only. Only 4 publish it. |
| C | Half have no permanent free tier | 29 of 65 have none, 31 do, 5 do not say. |
| D | Sales engagement is the most opaque category | 9 of 23 sales engagement vendors could not be read at all (blocked, client-rendered or unreachable). Overall 28 of 93 could not be read. |
| E | API access is usually a paid feature | Of the 26 tools that state it, 19 put API access on paid tiers only. |
| F | Annual billing discount | Median about 20% across the 27 tools that publish both a monthly and an annual entry price. |

Caveats to keep in any pitch: "mixed" is our classification, not the vendor's; C, E and F exclude tools where the page did not state the figure; the data is dated, not live.

## Pitches (findings first, table second)

### RevOps Roundup and Revenue Operations Alliance (contact paths: rows 5 and 4 of the 9/06 list)

Subject: 20 of 64 RevOps tools bill per seat. The rest bill by credits or usage.

Hi, I read the pricing pages of 93 RevOps and GTM automation tools and recorded what each one actually says. The result that surprised me: only 20 of the 64 with a classifiable model bill purely per seat; 36 bill by credits, usage or a mix, which makes a per-rep budget hard to forecast. The full table, with the vendor source and read date on every row, is free under CC BY 4.0 at https://theautomationsguide.com/revops-automation-pricing/. If it suits a curated slot, that is all I am after.

### RevOps Co-op Weekly (contact path: row 1 of the 9/06 list)

Subject: 3 in 4 RevOps tools hide their enterprise price

Hi Matt, I checked 93 automation tools' own pricing pages. Of the 65 I could read, 49 make the enterprise tier quote-only, and 28 tools could not be read at all (sales engagement is the worst: 9 of 23). Every row links to its source with the date read, blanks where a figure was not on the page, CC BY 4.0: https://theautomationsguide.com/revops-automation-pricing/. Happy to answer questions on method. I will not post it in the Slack.

### The RevOps Letter (reply to Janis Zech and Philipp Stelzer)

Hi Janis and Philipp, a data point for the letter: across 65 readable RevOps tools, the median published entry price is $39 a month, and the median annual-billing discount is about 20%, but only 20 of 64 bill purely per seat, so per-rep budgeting misleads. Sources and read dates for each row, CC BY 4.0, at https://theautomationsguide.com/revops-automation-pricing/.

### r/revops (text post)

Title: I read 93 RevOps tools' pricing pages. 28 would not let me, and only 20 of the rest bill per seat.
Body: Method: I read each vendor's own pricing page on one date and left a blank wherever a figure was not literally there. Findings: 49 of 65 keep enterprise pricing quote-only, 29 have no free tier, 19 of the 26 that state it put API access on paid plans only. Sales engagement was the hardest category to read (9 of 23 failed). Table and JSON are linked in a comment if anyone wants them; tell me which row looks wrong and I will re-check the source.

### Vendors (new list, cheapest to try)

Each of the 65 has a row citing its own pricing page. Email a vendor's marketing or partnerships contact: "Your entry plan appears in our RevOps pricing index (row link). Please tell us if it is out of date." Corrections build goodwill and some will link or share. Start with the tools where affiliate status is live (registry: `src/data/affiliate-links.ts`) since a relationship exists.

## Send notes

- Send A/B/C to the newsletters first (order per the 9/06 list: Roundup, Alliance, Co-op, Letter). One angle per outlet; do not send the same email to two.
- Post to r/revops only after reading the current sidebar rules.
- Log sends and replies at the bottom of this file.

## Send log

(none yet)
