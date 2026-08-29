# Design audit: why the site reads as AI-generated, and the plan to fix it

**Date:** 2026-08-29. **Status:** DECISIONS MADE (8/29), IMPLEMENTATION NOT STARTED. Findings freeze here; execution is tracked in TODO.md.

**Evidence base:** live homepage (Ian's screenshots), live post page (LeadMagic pricing, 8/28), live /tools/, the OG card generator, and full-page captures of the two references Ian named: morningbrew.com and latestly.ai. Plus the source: `src/pages/index.astro`, `src/styles/global.css`, `PostCard.astro`, `BlogPostLayout.astro`, `src/pages/og/[...route].ts`.

---

## 1. The diagnosis: eight tells, ranked by how loudly they say "AI"

| # | Tell | Where | What the references do instead |
|---|---|---|---|
| 1 | **Emoji as iconography.** Feature cards use ⚡🔁📊🔧; topic tiles use ⚡⚖️📖🛠️🚀❄️🏷️🔶. | `index.astro` (only file in `src/` with emoji, 5 + `tagIconMap`) | Neither reference has a single emoji. Morning Brew uses photos; Latestly uses templated thumbnails. Emoji-in-a-card is the single most recognizable LLM-landing-page signature. |
| 2 | **Zero imagery.** Every card on every page is text-only. Hero is a decorative SVG flowchart. 116 build-time OG cards exist but are text-only too. 0 posts use `<Figure src=>` (all 58 figures are inline SVG), 0 product screenshots. | site-wide | Every story card on both references leads with an image. Latestly's are *templated* (brand mark + category + a photo), not custom art, so this is achievable at build time. |
| 3 | **Template section rhythm.** Eyebrow (UPPERCASE MONO) → H2 → subtitle → grid of equal cards, repeated 5x down the homepage: hero / 4 feature cards / 3 posts / 8 topic tiles / newsletter / CTA strip. | `index.astro`, `.section-label/.section-heading/.section-sub` | Morning Brew is a newspaper front page: one lead story with a big photo + a dense "The Latest" list, asymmetric, no subtitles. Latestly: content-type sections with a "View more" link, no eyebrows. |
| 4 | **Sections that describe the site instead of showing content.** "Tool Reviews: Honest takes on the automation platforms your RevOps team is actually considering." x4, then "Built for teams that run on automation → Start reading" (a second hero). | `index.astro` features + CTA strip | Real publications never explain their categories; they show the stories. Both references have zero "what you'll find here" sections. |
| 5 | **Boilerplate copy.** "No fluff. Just actionable automation content." / "Step-by-step guides you can copy, adapt, and ship to your stack immediately." / "Whether you're a one-person RevOps team or scaling a GTM motion" / "Jump straight to the guides and reviews". | homepage, blog index, newsletter block | Morning Brew's entire pitch is one specific line: "Become smarter in just 5 minutes." |
| 6 | **Pill everything, 14px radius everything.** Teal-outlined pill tags (TOOLS · ENRICHMENT · PROSPECTING), pill eyebrow, pill badges, every element a white rounded card with a 1px border on cream. | `.tag`, `.hero-eyebrow`, `--radius-lg: 14px`, `.post-card`, `.feature-item`, `.topic-tile` | Morning Brew: small-caps blue category label, no border, sharp corners, hairline dividers. Latestly: 4-6px radius, one card template. |
| 7 | **Taxonomy leaking into the UI.** Topic tiles show raw tags title-cased by machine: "Crm 10 articles", "Hubspot 8 articles", "Guide 24 articles", "Tools 19 articles". "Filed under:" pills on posts. Article counts on every tool card. | `index.astro` topic tiles, /tools/, post footer | References label by editorial section ("Editor's Picks", "Tool vs Tool", "Best AI For…"), never by tag. |
| 8 | **Formulaic post anatomy + box stacking.** Every post: TL;DR box → TOC box → Key Takeaways box → 3 StatRow tiles → H2s → 4-card ChooseIf grid → My Take box → Bottom Line box → FAQ boxes → newsletter box. The LeadMagic post has ~14 bordered boxes and no image. Byline has no face. | engine prompt + `BlogPostLayout.astro` | A Morning Brew story is prose with one or two images and a byline with a name and time. The post page is actually TAG's strongest page; it just needs fewer boxes and one real image. |

Two smaller tells: the geometric display face (Outfit) is the 2025-26 "AI-built site" font family (with Plus Jakarta / Manrope / Space Grotesk); and the /tools/ page has 9 category sections where two contain a single card, leaving 75% of the row empty.

**One strategic miss found along the way:** the pricing index, the site's only linkable asset, is not on the homepage at all. It gets one sentence on /tools/.

---

## 2. What the references actually do (the patterns to borrow)

**Morning Brew** (newspaper model): one saturated brand color used in *large blocks* (full-bleed subscribe bar at top and bottom); lead story with big photo + "The Latest" list (category · headline · author · timestamp) beside it; "Editor's Picks"; dense, sharp-cornered, hairline dividers; a name and a time on every story; footer shows the brand family. Nothing is explained, everything is shown.

**Latestly** (templated-thumbnail model): every card is thumbnail → bold headline → one-line dek, and the thumbnail is a *template* (brand "L" tab + category ribbon over a stock/product image) so 100% coverage costs nothing per post; sections by content type ("Tool vs Tool", "Best AI For…", "AI Breakdowns") each with "View more"; a searchable hub with filter pills and pagination; serif headlines; a social-proof line (real numbers).

**What TAG already has that the references need:** 99 tool logos, per-post tool detection (`postMentionsTool`), a build-time image pipeline (`astro-og-canvas`), an author headshot, and content formats that map directly onto editorial sections (migrations, 3-way comparisons, pricing breakdowns, reviews are the tags that earn clicks per the 8/04 audit).

---

## 3. The plan, in four phases

### Phase 1: kill the tells (CSS + markup only, no new assets, ~1 day)

1. **Remove every emoji.** Delete the 4 feature cards section outright (tell #4). Topic tiles → a plain "Browse" list with editorial labels via a label map (`crm → CRM`, `hubspot → HubSpot`, drop `guide`/`tools` meta-tags from the tile set).
2. **Delete the "Built for teams" CTA strip** (duplicate hero).
3. **Retire the pill.** `.tag` → small-caps category label, no border, no background, accent color. `.hero-eyebrow` → same treatment. `--radius-lg` 14 → 6px; `.post-card` loses its border on the homepage grid in favor of hairline row dividers.
4. **Copy pass.** Replace every line quoted under tell #5. Section headings name what is in them ("Latest", "Migration guides", "Tool vs tool", "Pricing breakdowns"), never adjectives. Drop `.section-sub` on the homepage entirely.
5. **Author everywhere.** `PostCard` and post byline get the headshot (24px circle) next to "Ian Chamberland". Cheapest humanizing move on the site; asset already exists at `/images/ian-headshot.jpg`.
6. **Typography.** Retire Outfit for display. Source Serif 4 (already loaded, already the H1 face) becomes the headline family site-wide, Inter stays for body/UI. One display voice instead of three.

### Phase 2: imagery system (the real gap, ~2-3 days, then automatic)

7. **Templated card image per post, generated at build.** Extend `src/pages/og/[...route].ts` (or a sibling route) to render a 16:9 card: cream ground, teal tab with the section label, the logo(s) of the tools the post is about (from `postMentionsTool`, max 3, the "vs" layout for comparisons), headline. Output `/cards/<slug>.png` for card thumbnails and keep `/og/` for social. Latestly's "L" card is exactly this pattern. **116 posts get imagery in one build, zero manual work, and every future engine post gets one automatically.** No stock photography: an AI-looking stock image is a worse tell than no image.
8. **Card template** (blog index, homepage, related posts, teams/playbooks hubs): image → small-caps section → headline → dek → author · date.
9. **Real product screenshots in posts.** Per the standing rule (tool screenshots = real product UI, from vendor help docs), backfill the top 20 posts by GSC impressions with 1-2 screenshots each, and add a screenshot step to the engine for new posts. This is the slow, ongoing half; item 7 is what makes the site look finished this week.

### Phase 3: homepage as a front page (~1-2 days, after Phase 2)

Top to bottom:

1. Nav (unchanged).
2. **Lead story + "The latest."** The newest High-priority post, big card image, dek, byline, at 2/3 width; a 5-row list of the next posts (section · headline · date) at 1/3. Replaces the flowchart hero.
3. **Editorial sections by format**, 3 cards each with "View all →": Migration guides · Tool vs tool · Pricing breakdowns · Reviews. These are the formats that earn clicks; the homepage should sell them, not "Tool Reviews / Workflow Playbooks / RevOps Strategy / Stack Comparisons" abstractions.
4. **Pricing index callout.** One full-width band: "65 RevOps tools priced from their own pricing pages, CC BY, updated quarterly" with 4-5 live figures pulled from `pricing-index.json`. The site's linkable asset finally on its front page.
5. Tools marquee (PR #256, keep).
6. **From the author** block: headshot, two sentences, LinkedIn. Not a "why this site exists" essay.
7. Newsletter (existing block, copy rewritten; keep modest given the readership-first hold).
8. Footer.

Full-bleed teal subscribe bar at the very top (the Morning Brew move) is worth an A/B later, not now: readership is the priority and it pushes the lead story below the fold on mobile.

### Phase 4: /tools/ and the post page (~1 day)

10. **/tools/ becomes a directory, not nine card grids.** One table/list: logo lockup · name · one-line blurb · badge · "N guides" · CTA. Category as a sticky filter row. Kills the single-card-in-a-row problem and reads like a reference page.
11. **Post page: cap the boxes.** Engine rule: at most 3 callout components per post (pick from TL;DR, KeyTakeaways, StatRow, ChooseIf, MyTake, BottomLine), and vary which. Add the card image below the byline as a hero. TL;DR stays (it is the best thing on the page). "Filed under" pills → small-caps inline text.
12. **Post byline** gets the headshot (Phase 1 item 5) and drops the read-time badge in favor of Morning Brew's plain "Aug 28, 2026".

---

## 4. Guardrails (things that would make it worse)

- **No invented social proof.** Latestly's "Read by 100,000+" line only works because it is true. TAG's honest equivalent is "116 guides · 99 tools · pricing index updated quarterly". The 8/21 PartnerStack lesson applies to the homepage too.
- **No stock photography, no AI-generated art.** Templated brand cards (Phase 2.7) or real product UI. Nothing else.
- **No em/en dashes** in any new copy (hard rule, sanitizer-enforced).
- Every phase ships through the existing gates: `qa:lint`, `qa:render`, `qa:overflow` (390px), `qa:logos`, plus a breakpoint QA pass before review. Playwright's headless WebKit understates iOS text; check a real phone for the lead-story card.
- Phase 2.7 changes the OG route; verify `/og/<slug>.png` still resolves for every post so BlogPosting JSON-LD `image` does not break.

---

## 5. Decisions (Ian, 2026-08-29)

1. **Phase order: APPROVED as planned.** Tells first (Phase 1, one PR this week), then imagery, then front page, then /tools/ and post-page.
2. **Typography: Source Serif 4** for headlines site-wide (already loaded as the H1 face; zero new font cost). Outfit is retired from display use.
3. **Card imagery: templated brand cards APPROVED** (logos + section tab + headline, generated at build time via the OG-route pattern) for all 116 posts. Real product screenshots stay reserved for use inside posts only, never as the card thumbnail.
4. **Homepage lead story: automatic + manual override.** Newest High-priority post is the default lead; a `featured: true` frontmatter flag lets Ian hand-pick an override.
5. **Engine change for post anatomy** (Phase 4.11) touches the generation prompt; it needs a dry-run and a canary post before the 3-box cap goes live. Standing requirement, not reopened for debate.

**Next action:** implement Phase 1 (tells removal: emoji, pill styling, boilerplate copy, radius, typography swap, author-headshot-on-cards) as one PR against `master`, worktree in `C:\tmp`, full QA gate pass + breakpoint screenshots before requesting review.
