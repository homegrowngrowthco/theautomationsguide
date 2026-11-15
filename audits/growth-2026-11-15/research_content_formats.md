# Content types and distribution moves for a small B2B software affiliate site (research as of 2026-11-15)

Method: about 42 web searches plus direct page reads. Every claim carries a URL and a date. Evidence labels:
- MEASURED = study with stated sample and numbers
- CASE = single practitioner or agency case
- VENDOR = number published by a company that sells the thing being measured
- OFFICIAL = Google or vendor documentation
- OPINION = commentary

A note on tools: search summaries were produced by a small model. I re-read the primary page wherever a number matters. Items marked "secondhand" were NOT confirmed on the original page. Anything older than mid-2025 is marked STALE.

---

## 1. What gets clicks and citations now

### 1a. AI Overviews are now near-universal on commercial software queries (the opposite of "there is a safe query class")

- MEASURED (Semrush, article dated 2026-10-21). Fixed panel of 400 commercial keywords (banking, ecommerce, software), US desktop, Sept 2025 to Aug 2026.
  - AI Overview (AIO) coverage rose from 45.75% to 88% of keywords. Volume-weighted it is 97.08%.
  - By modifier in Aug 2026: "Best X for Y" 96.12%, "Reviews" nearly 90%, "Brand vs brand" over 86%, "Alternatives" over 82%.
  - Software specifically: 68% in Sept 2025. "Alternatives" and "best X for Y" in software both hit 100% of panel keywords. "Reviews" in software was the lowest at 75%.
  - Price/cost modifier rates were not reported on the page. The article reports no CTR or citation counts.
  - https://www.semrush.com/blog/ai-overviews-commercial-modifiers-study (2026-10-21)
- MEASURED (Seer Interactive v3, published 2026-04-24). 53 brand accounts, 5.47M queries, 2.43B organic impressions, Jan 2025 to Feb 2026.
  - AIO rate by query type: comparison "X vs Y" 95.4%, review 86.3%, question 85.9%, price/cost/buy 83.4%, "best of" 81.3%.
  - Intent labels (assigned by SERP features): informational 36%, commercial 8%, transactional 5%.
  - CONFLICT: Seer's intent split (8% commercial) cannot be reconciled with Semrush's 88% commercial. Seer's AIO label is a static "latest snapshot" label and its intent is inferred from SERP features, so I would trust the query-type table and the Semrush software panel over the intent split.
  - Organic CTR by AIO status (Feb 2026): no AIO 3.82%, AIO shown 2.36%. Informational full-year averages: no AIO 3.35%, brand cited in AIO 2.07%, brand not cited 0.94%. One account makes up 47% of the "not cited" impressions, so that last figure is distorted (about 1.61% without it).
  - Seer says it does not claim causation and gives no breakdown by industry, B2B or software.
  - https://seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update (2026-04-24)
- MEASURED (Ahrefs, via press release 2026-05-18). Top-ranking page CTR is about 58% lower on keywords with an AIO. I read only the summary, not the study itself. https://businesswire.com/news/home/20260518322756/en/New-Research-Googles-AI-Overviews-Now-Cost-Websites-58-of-Their-Clicks
- MEASURED (randomised field experiment, early 2026). AIOs cut organic clicks on triggered queries by 38% (secondhand, from the SEJ headline only). https://www.searchenginejournal.com/ai-overviews-cut-organic-clicks-38-field-study-finds/573145/
- Query classes where CTR "held up": I found no credible 2026 study for software that identifies an AIO-free query class.
  - The only held-up data point is non-AIO SERPs (3.8% CTR in Feb 2026, Seer, above).
  - Branded queries: Amsive found +18.68% CTR on branded queries and AIOs on about 4.8% of them. This is STALE (2025) and conflicts with SE Ranking's claim of AIOs on 82.5% of branded searches (secondhand, undated in my results). Treat branded-query claims as unresolved. https://www.searchenginejournal.com/ai-overviews-big-brand-searches/
  - I found no data on "is X legit" queries. That item is unanswered.
- Implication for this site: nearly every "X vs Y", "best", "alternatives", "pricing" and "review" query it targets now has an AIO. The realistic upside is being cited inside the AIO, not ranking under it. Seer shows cited brands keep roughly 2x the CTR of uncited brands.

### 1b. What Google's AIO cites for commercial software queries

- MEASURED + VENDOR (DerivateX, a GEO agency; 100 "best [category] software" queries across 20 B2B SaaS categories, June 2026, 1,259 AIO citations; updated 2026-08-25). One snapshot, Google AIO only.
  - Third-party "best of" lists 63%, vendor sites 17% (only 12% for the product actually recommended), YouTube 9%, review sites 5%, Reddit and forums 5%, news and trade press 1%.
  - Top domains: youtube.com 105, reddit.com 56, gartner.com 21, zapier.com 15, g2.com 13, forbes.com 9.
  - 67% of cited pages did not rank in the organic results for the same search.
  - YouTube was 26% of citations in CRM and 24% in video hosting. Reddit was 10% in CRM and 8-9% in sales engagement and marketing automation. Third-party lists were up to 78% in iPaaS/workflow automation.
  - https://derivatex.agency/blog/what-content-gets-cited-google-ai-overviews/
- MEASURED + VENDOR (Overthink Group with Amadora, a tracking vendor; published 2026-07-14). 1,000 prompts over 250 niche B2B software categories, run in June 2026 on ChatGPT, Gemini, Perplexity and AIO.
  - 70.8% of citations go to pages with "best" or "top" in the title.
  - G2, Capterra, TrustRadius and Gartner together are 8.6%. Synthetic listicle spam sites are 8.6% (over 14% of ChatGPT citations, 0.16% of AIO citations).
  - Reddit is 1.4% overall. YouTube is 7.4% of AIO citations and under 1% across all channels.
  - https://overthinkgroup.com/b2b-ai-citation-stats-2026-q2/
- MEASURED (Kevin Indig, Growth Memo, with SE Ranking data; 60,000 US desktop queries, 5.32M rows, Aug 2026; published 2026-08-24).
  - Independent publisher listicles beat vendor/brand listicles in 54.0% of 4,026 head-to-head matchups.
  - Listicles lost share at the top. Position 1 fell from 18.9-20.2% in Jan to 15.1-15.6% in Aug.
  - Listicles reach the top 3 in 54.5% of "best/ideas/options" queries, but only about 10-12% of implicit comparison queries.
  - 62% of vendor-authored listicles GAINED traffic since January (median +38%). Indig could not tie declines to self-promotion.
  - Vendor and brand listicles are in the top 10 on 46.2% of B2B software SERPs.
  - The classifier's production holdout validation had not been run.
  - https://www.relevantaudience.com/content-marketing/google-listicle-study-query-phrasing-august-2026/ and https://ppc.land/vendor-listicles-gain-38-median-traffic-since-googles-january-demotion/
- MEASURED (Search Engine Land, summarising Lily Ray; 100 B2B "best [category] software" queries on Apr 15, May 15 and Jun 8 2026). AIOs cited a vendor's own self-ranked listicle while NOT recommending that vendor in 69% of cases. I could not open the original. https://searchengineland.com/google-ai-overviews-cite-self-serving-listicles-recommend-competitors-480573

### 1c. What ChatGPT, Claude, Gemini and Perplexity cite (they differ sharply)

- MEASURED + VENDOR (Discovered Labs, which sells AEO and Reddit marketing; 291,607 ChatGPT citations on a B2B SaaS prompt set, Oct 2025 to Aug 2026; updated Sept 2026).
  - Vendor docs rose from 36.9% to 55.1% of ChatGPT citations. Pricing pages fell from 15.9% to 8.2%. Official pages overall rose from 63% to 74%.
  - Listicles fell from 6.0% to 1.0% on this prompt set. On "best X tools" prompts ChatGPT fell from 11.5% to 1.2%, while Google AI Mode, Gemini and Claude held at 11-22%.
  - Pricing questions cited vendor pages only.
  - The authors say the shift matches a March 2026 retrieval policy change and call it an inference. Visible Reddit citations are about 0.12%.
  - https://discoveredlabs.com/research/reddit-llm-retrieval-research (updated 2026-09)
- MEASURED (Orbit Media / Bill Widmer; 13,184 citations, 72 B2B prompts, data through 2026-08-23, published 2026-09-02). Directional sample.
  - ChatGPT cites primary sources such as Google docs and vendor pricing and help pages. Claude favours review sites and curated listicles (Clutch top). Gemini leans on Reddit and listicle roundups. Perplexity averages 19.2 sources per answer, with LinkedIn, YouTube and Reddit its top all-time sources.
  - All four models agreed on the same domain for the same question only 1.7% of the time.
  - Only 1-5% of cited exact URLs for Gemini and ChatGPT were in Google's top 10 for the query (Perplexity 13-23%).
  - https://www.orbitmedia.com/blog/ai-citation-sources/
- Practical reading: an affiliate site is structurally disadvantaged on ChatGPT, which favours the vendor's own pages, especially for pricing. Its best realistic channels are Google AIO/AI Mode, Gemini and Claude, which still cite third-party lists and comparisons. The site's 1 of 25 cited result is consistent with this.

### 1d. Page types, one by one

| Page type | Evidence for 2026 | Label |
|---|---|---|
| Original data or benchmarks | Every high-performing digital-PR campaign in one agency analysis was built on original data (agency claim). Sites with proprietary data and original testing reportedly survived the March 2026 update (unattributed). No study measures what kind of original data LLMs cite. | VENDOR/OPINION |
| Pricing pages | ChatGPT pricing answers cite vendor pages only; vendor pricing pages are the most reliable citation target for the vendors. Third-party price indexes are not what ChatGPT retrieves. Google AIO may cite them. | MEASURED (Discovered Labs, 2026-09) |
| Calculators / free tools | Ahrefs (2026-07-16) lists single-purpose calculators as a working format, and its own tools are among its top pages (self-report). Google's generated interfaces (Aug 2026) can rebuild any tool that "takes generic inputs and runs public math". Tools on proprietary data are described as defensible. | VENDOR + OFFICIAL research paper, see 3a |
| Comparison tables / "X vs Y" | AIO fires on 95.4% of them (Seer). Also the first template in Lily Ray's list of eight declining AI-content templates (see 2). | MEASURED |
| Forum-style first-hand content | Reddit and YouTube are top AIO domains for CRM queries (DerivateX), but only 1.4% of citations in niche B2B categories (Overthink) and about 0.12% of ChatGPT's (Discovered Labs). | MEASURED, conflicting |
| Glossaries / "what is X" | Second template in Lily Ray's declining list. Definition pages lose clicks first to AIOs. | MEASURED/OPINION |
| Integration pages | See 3d. | |
| Templates | See 3e. | |

---

## 2. Google policy risk for 2 AI-drafted posts a day

### Current wording (OFFICIAL, read directly)
- Scaled content abuse: "many pages are generated for the primary purpose of manipulating search rankings and not helping users... typically focused on creating large amounts of unoriginal content that provides little to no value to users, no matter how it's created." First listed example: "Using generative AI tools or other similar tools to generate many pages without adding value for users." https://developers.google.com/search/docs/essentials/spam-policies (page has no visible date)
- Thin affiliation: affiliate pages are thin when descriptions and reviews are copied from the merchant "without any original content or added value". Good affiliate pages offer "additional information about price, original product reviews, rigorous testing and ratings, navigation of products or categories, and product comparisons." Same URL.
- Affiliate links themselves are explicitly NOT a violation ("Using affiliate links throughout a page, with links treated appropriately").
- Google's AI features guidance (undated page): do not create separate pages for each fan-out query variation, because doing so "primarily to manipulate rankings or generative AI responses in Google Search violates" scaled content abuse. It asks for "unique, expert-led content that provides value beyond common knowledge" and "first-hand" reviews. It also says there is no need for llms.txt, special schema or chunking. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Secondhand: the spam policies were extended to cover AI Overviews and AI Mode on 2026-05-15 (ppc.land). I did not find Google's own post. https://ppc.land/google-spam-policies-now-officially-cover-ai-overviews-and-ai-mode-in-search
- Site reputation abuse (third-party content on a host site): not relevant unless the site hosts others' content. Google changed enforcement for the EEA on 2026-08-30. https://developers.google.com/search/blog/2026/08/update-site-reputation-policy (dated 2026-08-28)

### 2026 enforcement reports

- OFFICIAL timeline. Google ran spam updates in March, June and 2026-08-18 (finished 08-21), each described only as "a normal spam update" with no target list. https://ppc.land/googles-third-spam-update-of-2026-hits-every-language-and-region/ (2026-08)
- CASE (GSQi case studies on the Aug 18-21 update, 2026). A turn-key thin Amazon affiliate site with 97%+ AI-probability text blocks lost 14K+ queries and was tagged under Google's thin affiliation policy. A programmatic, AI-text YMYL site lost over 200K queries. A 1.5M-URL programmatic site fell sitewide. Recovery "usually takes months". https://gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/
- MEASURED (SE Ranking, via Something Inc. summary): in the Aug update window the share of top-10 URLs falling beyond position 100 rose from about 9% to 17% (100,000 US keywords). I did not open SE Ranking's own page. https://somethinginc.com/blog/google-august-2026-spam-update-replacement-signature/
- MEASURED (Lily Ray, SEJ 2026-05-18). 220+ domains taken from AI-content vendors' public customer-story pages and tracked in Ahrefs/Sistrix.
  - 54% lost 30% or more of peak organic traffic, 39% lost 50% or more, 22% lost 75% or more.
  - Typical path: pages grow for 6-12 months, traffic peaks 3-6 months after content peaks, then declines within the next year.
  - Sample is vendor-selected and the declines are correlations. She does not claim AI use itself was penalised.
  - https://lilyraynyc.substack.com/p/it-works-until-it-doesnt-ai-content-risks
  - Her eight declining templates: (1) comparison pages at scale ("/product-A-vs-product-B"); (2) "What is X" glossaries; (3) "Best [X] for [Y]" listicles; (4) self-promotional listicles; (5) competitor "alternatives" pages; (6) programmatic location/language pages; (7) one-question-per-page FAQ farms; (8) off-topic content. This site publishes templates 1, 3 and 5 as its main output.
  - Her pre-publish tests: would a competitor produce a near-identical page from the same prompt, and does the page hold first-party data not in the top results?
- CASE (JumpFly, 2026-10-20). A site with 500+ hand-written posts added just 31 AI-assisted posts (one every ~9 days) starting July 2025. After the 2025-12-11 core update, blog clicks fell 30.7% in 28 days. By Aug 2026 blog clicks were down 67.8% and the homepage was down 77.2% year on year. The last 8 posts were unindexed by May 2026. One agency, one site, other causes not ruled out. https://www.jumpfly.com/blog/a-cautionary-tale-one-sites-ai-assisted-seo-crash/
- Affiliate-specific March 2026 core update numbers ("71% of tracked affiliate domains lost visibility, average 54% for thin affiliate sites"; ">50 AI articles/month averaged -73%") come from unattributed vendor blogs and the pulse.bot page 404'd. Treat as OPINION. Context only: https://neuronwriter.com/march-2026-core-update-aftermath-seo/ (2026-05-28, says "early data analysis", no sample stated)
- Programmatic: reports of 50-80% traffic loss on low-value programmatic sites after March 2026 are secondhand from vendor blogs. https://alexcloudstar.com/blog/programmatic-seo-2026-indie-hackers/

### Cadence and quality signals for a young domain
- I found NO credible source (Google, a study, or a named practitioner case) recommending 2 AI-drafted posts per day on a young, link-poor domain. Cadence advice online (1-2 posts/week for new sites) is from content-marketing vendors (e.g. Averi) and agencies (VENDOR/OPINION), so do not treat it as evidence. The closest evidence is Lily Ray's boom-bust pattern and JumpFly's 31-post case, both above.
- Quality signals that recur in OFFICIAL and CASE sources: first-hand evidence (own screenshots, test dates, measured results), named human authorship, original data, and "added value" over the merchant's own description.
- CASE (Marie Haynes via SEJ, 2026-02-23). Four sites that recovered from the Dec 2025 core update. The affiliate site "bought and photographed the products, added expert authorship and video," restructured text, added quizzes, and noindexed YMYL pages where it lacked expertise. Recovery took "many months". The city-guide affiliate site added team-filmed video and original photography and only partially recovered. No numbers given. https://searchenginejournal.com/4-sites-that-recovered-from-googles-december-2025-core-update/567960/

---

## 3. Formats a small publisher can add cheaply

### 3a. Free tools / calculators
- VENDOR (Stratabeat 2025, 300 B2B SaaS sites; STALE and secondhand via Stacc, which sells tools): sites with free tools had 80% higher organic growth and 3.5x faster referring-domain growth. Original report not found. https://thestacc.com/blog/free-tools-traffic-case-study/
- VENDOR (Ahrefs, 2026-07-16). Names working tools such as Omni Calculator (~2.3M visits/month, estimated), Clockify's military time converter (~31K), HubSpot's email signature generator (~55K), and Gusto's hourly paycheck calculator (~17.8K). Admits the edge is shrinking, tool traffic decays (Kapwing's meme maker fell from 150K to ~10K), and head terms are owned by big brands. Method suggested: filter to KD 30 or lower. https://ahrefs.com/blog/the-free-tools-seo-strategy/
- OFFICIAL/OPINION (SEJ, 2026-08-21, on Google's generative-UI paper). Google's generated interfaces beat the top result in 90% of head-to-head comparisons on the paper's main prompt set. Tools that "take generic inputs and run public math" are easiest to replicate. Tools built on proprietary data or logged-in workflows are described as defensible. https://www.searchenginejournal.com/googles-generated-interfaces-could-compete-with-tool-pages/586589/
- No measured study found on how often AI engines cite calculators. No verified 2026 case of a small affiliate site earning links from one.
- Fit for this site: a generic ROI calculator is exposed. A calculator that runs on the site's own pricing dataset (e.g. "total 12-month cost for N seats across the tools you choose, with last-verified dates") is the only version that matches the "proprietary data" exemption.

### 3b. Original data from the pricing dataset
- MEASURED/CASE (SaaS Price Pulse, Q1 2026). A direct competitor in this niche: it crawls pricing pages daily, tracks 271 tools (footer says 260+), and found 218 of 271 (80%) changed pricing pages, with 6 verified list-price increases. The report is internally inconsistent (6 vs 10 increases, and it uses LLM extraction with a claimed 95% accuracy). https://www.saaspricepulse.com/reports/saas-pricing-q1-2026
  - Meaning: a price tracker is not an empty niche, and the quality bar is dated, verified change logs.
- Link-earning evidence: the sources say original data is the most recommended link asset, with 51.4% of practitioners seeing results in 3-6 months and 95.9% pitching data-led content (BuzzStream survey, secondhand). The numbers are agency and vendor claims. The one concrete case (Preply, 74 referring domains) is a large brand, not a small site. No 2026 case of a small affiliate publisher earning links from a pricing report. https://prosperitymedia.com.au/digital-pr-statistics-2026-what-the-data-shows-about-seo-geo-and-ai-search/
- Evidence that data pages get cited by LLMs: none measured. Pricing queries on ChatGPT go to vendor pages (Discovered Labs, 2026-09).

### 3c. YouTube / short video
- MEASURED + VENDOR: YouTube is the single most-cited domain in AIO for commercial software queries (105 of 1,259 citations; 26% in CRM) in DerivateX (June 2026). Overthink found 7.4% of AIO citations. The Semrush study's example "mailchimp vs klaviyo" AIO cited a vendor guide, a Zapier page, a YouTube video and another third-party site.
- Per engine: a Foundation Inc. study (182,631 answers, secondhand, not verified) reports YouTube cited about 36% of the time in Google AI answers but about 2.1% in ChatGPT. OtterlyAI's study (via summary): Perplexity and AIO account for most YouTube citations, Gemini 0.2%. https://foundationinc.co/lab/youtube-ai-citations
- Click value: an eye-tracking study cited by Overthink says users notice AIO videos about 95% of the time, but only about 20% click (secondhand). So a video citation is visibility, not traffic.
- Affiliate income from software review YouTube: only unsourced guides found, no verified 2026 case. I would treat "YouTube is the highest-earning niche" as OPINION.
- Cheap production: screen-recorded walkthroughs from the hands-on tests (see 3h), not talking-head. See tooling in section 5.

### 3d. Programmatic integration pages
- Counter-example: Zapier. Estimates conflict (1.8M visits per month with 88% blog share per upGrowth, 2026-09; Ahrefs says blog is 67.5%). One consistent point: most of its traffic comes from the blog and editorial pages, not the long tail of app-pair pages, and per-page traffic is very uneven (e.g. one template page has 2,400+ monthly visits while another has none). https://upgrowth.in/how-zapier-programmatic-seo-strategy-delivers-2-6m-monthly-organic-traffic/ ; https://ahrefs.com/blog/es/zapier-seo-case-study/ (older)
- The "thin" test per Alex Cloudstar (2026): a page needs information that exists nowhere else, and near-duplicate detection compares meaning, so swapped-noun templates collapse into one page. Suggested test: hand-write about 20 pages, check impressions after about 3 weeks, then scale in batches of about 100. OPINION. https://alexcloudstar.com/blog/programmatic-seo-2026-indie-hackers/
- Lily Ray's list also flags "FAQ farms" and "alternatives" templates. Google's AI guide treats per-query-variation pages as scaled content abuse. A third-party affiliate site has no real integration data (no setup steps tested, no failure modes), so "connect X to Y" pages written by an LLM would match the thin pattern. No dated evidence supports this for the site.

### 3e. Template / workflow libraries (n8n, Make, Zapier)
- Evidence is thin. Zapier has template pages that rank individually (Ahrefs examples above). Make has an estimated 282.9K organic monthly visits from 175K indexed pages, with a single integration page "Connecting GroupMe on Make" at 6.1K (upGrowth, secondhand estimates). https://upgrowth.in/how-make-programmatic-seo-drives-over-280k-monthly-organic-traffic/
- n8n: no traffic data found. Third-party n8n template shops and GitHub libraries exist but I found no data on search traffic or lead-capture performance.
- The platforms own the strongest template pages (they host the directory), so a third party competes with the vendor, which ChatGPT prefers. Ahrefs (2026-07-16) notes downloadable templates are the lowest-effort tool-style asset but "most aren't interactive". No evidence found that templates are a measured lead magnet for affiliate sites. Status: UNPROVEN.

### 3f. Newsletter-first / community-first
- MEASURED (Semrush, March 2026; 89,000 LinkedIn URLs cited by ChatGPT Search, Google AI Mode and Perplexity, from 325,000 prompts). LinkedIn averages 11% of citations across the three. Per engine: ChatGPT Search 14.3%, AI Mode 13.5%, Perplexity 5.3%. ChatGPT Search and AI Mode cite individual members' content 59% of the time, Perplexity cites company pages 59%. Articles are 50-66% of LinkedIn citations. Claude was not measured. https://ppc.land/semrush-maps-how-linkedin-content-earns-citations-in-ai-search-tools/ (guide 2026-06-09)
  - Meaning: a named human author with a LinkedIn article/newsletter is a measured citation surface. It says nothing about affiliate clicks.
- Reddit: ChatGPT cites it very rarely (about 0.12%), but it is retrieved on about a quarter of search turns and cited when read (Discovered Labs). In DerivateX, Reddit is 5% of AIO citations, 10% for CRM. Self-promotion rules vary by subreddit. Many ban affiliate links and some affiliate programs prohibit certain traffic sources (guides, OPINION). https://redship.io/blog/reddit-self-promotion-rules
- Newsletter for affiliate sites: no evidence found. Beyond the site's own zero-subscriber result, nothing 2026-dated links newsletter-first launches to affiliate revenue or citations. UNANSWERED.

### 3g. Coupon / promo / free-trial pages
- OFFICIAL/CASE: Google's site reputation policy hit publisher coupon sections (2024 onward, STALE) even when the publisher ran its own coupon team. That risk applies to third-party sections on someone else's authority, not to a site's own pages. https://hellopartner.com/googles-parasite-seo-crackdown-hits-europes-coupon-giants/
- Thin-affiliate evidence: NeuronWriter (2026-05-28, unattributed data) lists coupon aggregators among the March 2026 core update's losers.
- No source found on SaaS free-trial or promo pages for B2B. UNANSWERED. Practical inference only: pages restating the vendor's own trial terms add nothing and match the thin-affiliation definition.

### 3h. Hands-on testing vs desk research
- OFFICIAL: Google's reviews guidance asks for "evidence such as visuals, audio, or other links of your own experience", explanation of what sets a product apart, and benefits and drawbacks "based on your own original research". https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-product-reviews (undated page; the underlying guidance dates from 2021-22, so it is older than mid-2025)
- OFFICIAL (undated): Google's AI features guide says "a first-hand review provides a unique perspective based on personal experience". Same URL as in section 2.
- CASE: Marie Haynes' recovered affiliate sites (above) all added first-hand evidence. This is the strongest "what recovery looked like" evidence found.
- I found NO controlled study showing hands-on reviews outrank desk-research reviews, and no measured data on screenshot-heavy pages in AI citations. The case for it rests on Google's own text plus case anecdotes. Also, "[self-promotional listicles] often lack evidence that the publisher tested the other options" is part of Lily Ray's explanation of why they fall (above).

---

## 4. GEO / answer-engine optimisation: measured vs vendor claims

### Measured or officially stated
- llms.txt: Google says Search ignores it and it neither helps nor hurts. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (undated). A 300,000-domain SE Ranking analysis (reported by SEJ, SE Ranking research dated Nov 2025) found no relationship between llms.txt and citation rate. An unnamed experiment in Search Engine Land (Jan 2026) found only 6 of about 18,000 citations pointed to llms.txt files. Both secondhand. https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/
- Markdown copies for bots: a Promptwatch study of 1.6M citations (secondhand) found no lift. https://www.relevantaudience.com/geo/markdown-for-ai-bots-no-citation-lift/
- Structured data: Google says "no special schema.org markup you need to add" for generative AI search (same Google page). I found no measured study of schema vs citations.
- Brand mentions: Ahrefs (75,000 brands, STALE: 2025). Branded web mentions correlate 0.664 with AIO brand visibility, versus 0.218 for backlinks, 0.295 for referring domains and 0.326 for Domain Rating. Correlation only, and about AIO brand visibility, not site citation. https://ahrefs.com/blog/ai-overview-brand-correlation/
- Freshness: Scrunch and Stacker (3.5M citation events, Sept 2025 to Mar 2026; secondhand): median citation half-life 4.5 weeks, half of citations to content under 13 weeks old. Seer (July 2026, 7,683 pages; secondhand): 72% of cited pages look fresh by last-updated date but 42% by publish date. Ahrefs (17M citations, July 2025, STALE): cited URLs average 1,064 days old versus 1,432 for organic. Sources conflict on how much freshness matters. https://www.radiantelephant.com/?p=51451
- Listicles on other domains: see 1b/1c. They are the dominant AIO format (63% DerivateX; 70.8% Overthink) but ChatGPT cites them rarely. Self-ranked vendor listicles are often cited while the vendor goes unrecommended (69%, SEL).
- Cited pages mostly do not rank: 67% of AIO-cited pages were outside the organic results (DerivateX); cross-engine exact-URL overlap with Google's top 10 is 1-5% for ChatGPT and Gemini (Orbit Media). This means AI citation is its own contest and traditional ranking is not a precondition.
- Seer: brand-citation inside an AIO is associated with higher CTR (2.07% vs 0.94%, with the distortion noted above).

### Vendor marketing (do not act on without testing)
- "Seven structure tweaks that double citations", "answer-first formatting", "FAQ schema for GEO", "citation conference" claims from GEO agencies. Most 2026 GEO studies come from companies that sell tracking or services (Discovered Labs, DerivateX, Overthink/Amadora, Foundation Inc., Peec, Otterly, AuthorityTech). Their own disclosures in the pages read above say samples are directional.
- Mentions are not the same as citations: only 17 of 1,052 runs cited a brand's page without mentioning the brand, and big brands are mentioned from training data while their citation rate varies 0-83% (Orbit Media, 2026-09-02). This is a caution against over-reading citation dashboards.

### Google's May 2026 tightening
- Reported (secondhand, ppc.land) that Google's spam policies now explicitly apply to attempts to manipulate AI Overviews and AI Mode, including per-fan-out-query pages. Selling or buying "AI citations" falls in scope per one SEO agency's reading (OPINION). https://ppc.land/google-spam-policies-now-officially-cover-ai-overviews-and-ai-mode-in-search

---

## 5. Tooling (only items I confirmed on a current product or pricing page)

I made no API calls or sign-ups. The prices below were read from the vendor pages on 2026-11-15. None show an effective date beyond the copyright year.

| Need | Tool | Current price / note | URL |
|---|---|---|---|
| Search demand (own site) | Google Search Console, now with a Search Generative AI performance report (impressions only, no queries or clicks; all properties by 2026-08-31) | Free | https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports |
| AI visibility for Microsoft Copilot | Bing Webmaster Tools AI Performance report (citations by page and grounding query; no clicks; launched Feb 2026, secondhand) | Free | https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/ |
| Backlinks and organic keywords for own site | Ahrefs free webmaster tools (own verified sites only; Site Audit 5K crawl credits per month; backlinks and keywords 1K visible at once) | Free | https://ahrefs.com/webmaster-tools |
| Cheap keyword volume | Keywords Everywhere credits | Bronze $7/mo billed annually ($84/yr), 100,000 credits/yr; Silver $14/mo, 400,000 credits | https://keywordseverywhere.com/pricing.html |
| Pay-per-call SERP and keyword data | DataForSEO | SERP API from $0.0006 per SERP, Keywords Data API from $0.0012 per task, $50 minimum top-up, balances don't expire. LLM Mentions endpoints exist, no rates on that page. (Repo memory says ask Ian before any DataForSEO spend; I only read the page.) | https://dataforseo.com/pricing |
| AI-visibility tracking | Otterly.AI | Lite EUR 29/mo (16 prompts, daily), Standard EUR 189 (120 prompts), Premium EUR 489; covers ChatGPT, AIO, Perplexity, Copilot, AI Mode, Gemini, Claude (Claude costs 3 credits per answer) | https://otterly.ai/pricing |
| AI-visibility tracking | Peec AI | Starter $95/mo (50 prompts, 3 models of 8, daily), Pro $245, Advanced $495; Claude only on Enterprise | https://peec.ai/pricing |
| Screenshot capture | ScreenshotOne | Free 100/month; Basic $17/mo (2,000), Growth $79 (10,000, adds scrolling screenshots and video generation) | https://www.screenshotone.com/pricing/ |
| Programmatic video / image from templates (API) | Creatomate | Free 50 credits (480px previews); Essential $45/mo = 2,000 credits, about 289 thirty-second 720p vertical videos; API on all plans | https://creatomate.com/pricing |
| Journalist requests | Featured | Free plan ($0, journalist-request matching); Lite $29/mo billed annually ($39 monthly); Pro $79/mo annual ($99) | https://www.featured.com/pricing |
| Journalist requests | Qwoted | Free: 2 pitches per month, 2-hour delay; Pro $149.99/mo ($1,188/yr), 35 pitches per month | https://www.qwoted.com/pricing |
| Journalist requests | Source of Sources (Peter Shankman, HARO's founder) | Free, up to 3 emails a day of journalist queries | https://sourceofsources.com |
| Affiliate link management | ThirstyAffiliates (WordPress) | Basic $99.60/yr introductory (normally $249), 1 site, 404 checker listed; Plus $149.60/yr for 5 sites | https://thirstyaffiliates.com/pricing |

Journalist-request platforms, current state: HARO folded into Connectively, which reportedly shut down on 2024-12-09 and Featured relaunched helpareporter.com in April 2025 (secondhand, conflicting). I could not confirm either from a primary page. No evidence found on the link-per-pitch hit rate of any of these for a small affiliate site. These are not link-selling and are not spam, but outcomes are unmeasured. https://blckalpaca.at/en/knowledge-base/seo-geo/off-page-seo-link-building/haro-alternatives-2026-featured-qwoted-and-source-of-sources

Not confirmed (page 404 or blocked): Mangools pricing, Lasso pricing, SEL's CTR-recovery study (403). I did not name them in the table.

### On the site's own Search Console data (relevant to the stated question-style impressions)
- Heuristic from SEJ and Growth Memo (not a native filter): queries of 10+ words with more than one impression and zero clicks are probably bots (rank trackers and AI platforms). https://www.searchenginejournal.com/gsc-data-is-75-incomplete/566425/
- Google logged inflated impressions from 2025-05-13 to 2026-04-27 (secondhand, ppc.land), so impressions from that window overstate. https://ppc.land/google-search-console-impressions-bug-ran-for-nearly-a-year-unnoticed/
- AI Mode data is merged into the "Web" totals. The new generative AI report is a filtered view of that same data, so do not add the two.

---

## Ranked: what the evidence supports for this site (most supported first)

1. Stop the 2 per day AI-drafted cadence and consolidate. Strongest evidence of all: Google's scaled content abuse wording, Lily Ray's 220-site study (54% lost 30%+), GSQi's Aug 2026 cases (thin AI affiliate sites lost 14K+ queries), and JumpFly's 31-post case. Merge or noindex the "X vs Y", "alternatives" and "best X" pages that have no unique content, because those three are on Lily Ray's declining-template list.
2. Rebuild a small set of money pages around first-hand testing: own screenshots, test dates, measured results, named author, explicit "what we did not test". Basis: Google's reviews guidance (OFFICIAL), Google's AI features guide (OFFICIAL), Marie Haynes' recovered affiliate cases (CASE). Caveat: no controlled study proves the ranking effect.
3. Turn the pricing index into dated first-party data: verified price changes, a change log, and a calculator that runs on the site's own dataset. Basis: Google's generative-UI paper (only proprietary-data tools stay defensible), Lily Ray's "first-party data" test, and the thin-affiliation text ("additional information about price"). Caveat: SaaS Price Pulse already tracks 271 tools. Link-earning from such data for a small site is unproven, and ChatGPT sends pricing questions to vendor pages.
4. Add a named human with first-hand claims on LinkedIn (articles). Basis: Semrush's 89K-URL study (individuals are 59% of LinkedIn citations in ChatGPT Search and AI Mode; LinkedIn is 11% of citations on average). This is a citation surface, not a traffic or revenue claim.
5. Short screen-recorded video of the same tests, hosted on YouTube. Basis: YouTube is top AIO domain for CRM-type commercial queries (DerivateX, June 2026, 26% of CRM citations), but under 1% of all channels combined (Overthink) and about 2% on ChatGPT (secondhand). Cost is low given ScreenshotOne and Creatomate. Revenue effect unproven.
6. Target Google AIO/AI Mode, Gemini and Claude, not ChatGPT. Basis: ChatGPT is shifting to vendor docs (Discovered Labs, 2026-09), while third-party lists still dominate AIO citations (DerivateX 63%). Within AIO, independent publishers beat vendor listicles in 54% of matchups (Indig, 2026-08-24).
7. Earned off-site mentions via journalist-request platforms (Featured free tier, Source of Sources free) and niche community participation. Basis: Ahrefs brand-mention correlation (STALE, correlation only) plus the fact that cited pages often are not the top-ranked ones. Hit rate unmeasured.
8. Measure with free tools first: Search Console generative AI report, Bing AI Performance, Ahrefs free, plus the 10+ word zero-click filter. Pay for Otterly Lite (EUR 29) only if a defined prompt set is worth tracking daily.

## Evidence-backed dead ends (for this site)

- High-volume AI-drafted comparison, alternatives, "best X for Y", glossary and FAQ-per-page content on a young domain with no links. Evidence: Lily Ray (2026-05-18), GSQi (2026-08), JumpFly (2026-10-20), Google spam policy.
- Pages written per AI fan-out query variation. Google's AI features guide says this violates scaled content abuse.
- llms.txt, markdown mirrors for bots, special GEO schema, chopping pages into tiny chunks. Google says it ignores or does not require them; SE Ranking's 300K-domain analysis found no effect (Nov 2025, secondhand).
- Generic formula calculators (ROI, simple cost). Google's generated interfaces can reproduce them inside results (SEJ 2026-08-21).
- Self-promotional "best" listicles are irrelevant to this site as an independent publisher, but note that vendor self-listicles got cited while the vendor went unrecommended (69%, Search Engine Land), so there is no tactical edge there.
- Treating AI-tracker question impressions as demand. Use the 10+ word, zero-click filter, and Google's impression logging was inflated May 2025 to April 2026.
- Buying "AI citations" or link packages. Reported (secondhand) as in scope of Google's May 2026 spam clarification.
- A newsletter as a first distribution channel with no audience. No evidence found for this model in 2026 for affiliate sites.
- Generic YouTube income claims ("highest-earning niche"). Unsourced, no verified cases.
- Integration page farms for "connect X to Y" written without testing. Even Zapier's strength is its blog and utility-rich pages, and the thin test (unique information) fails for LLM-written pairs.

## Gaps (no credible evidence found)
- Query classes where AIO does not appear for B2B software, and "is X legit" CTR.
- Whether hands-on reviews measurably outrank desk research.
- Small-site link yield from calculators, data studies or journalist-request platforms.
- Coupon, free-trial, and n8n/Make template-library performance for affiliates.
- Newsletter-first and community-first results for affiliate sites.
- Google's own page for the 2026-05-15 AI spam clarification (only secondhand coverage).
