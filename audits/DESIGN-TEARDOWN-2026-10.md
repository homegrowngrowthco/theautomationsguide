# Design teardown, October 2026

**Date:** 2026-10-02 (Session 101). **Status:** findings freeze here; the build is tracked in TODO.md.

Why this exists: Design de-AI shipped in Sessions 81 to 87 and the site no longer reads as generated, but it still reads as assembled rather than designed. The same week, `../homecare-leadgen` went from "janky vibe-coded" to "this site looks really good" in one session by doing a teardown first, a design system second and pages third. This applies that method to TAG. Every reference was captured at 1440 and 390 px with Playwright (`audits/teardown-shots.mjs`, output in `C:/tmp/tag-shots/teardown/`, not committed).

Capture notes: G2 served a bot check headless at both widths and still at 390 when headed; the 1440 headed capture is used. Lenny's Newsletter (Substack) shows a full-screen subscribe interstitial to a cold visitor, which is noted below as something to avoid. Wirecutter and The Verge lead with display ads; ignore the ad slots.

## Affiliate and review editorial (the model)

**Wirecutter (best password managers).** The benchmark for what TAG is. The disclosure is one line directly under the nav, before the headline: "We independently review everything we recommend. When you buy through our links, we may earn a commission. Learn more". Small category label, a heavy rule, a big grotesk headline, "Updated February 24, 2026", then a byline with a face and a one-line credential ("has covered privacy and security for over a decade"). The verdict comes in the first two paragraphs and is then repeated as "Everything we recommend": two rows, each a logo tile, a label ("Top pick", "Budget pick"), the use case as a title, and an underlined text link. Further down each pick gets a bordered box with a flag tab, a short paragraph and one solid black button. "The research" opens with "Why you should trust us": who tested, how many products, what was done, and the independence statement. Body is a serif at about 65 characters with a narrow right rail for asides. Borrow: the disclosure before the headline, the byline credential, the pick rows near the top, the pick box with one button, "Why you should trust us" as a named block. Avoid: the bright-blue newsletter slab dropped mid-article and the ad slots.

**Zapier blog (Zapier vs. Make).** A vendor's comparison page, so it is a sales page, but the table is the reference: a three-column grid (criterion, Zapier, Make), criterion labels in a muted left column, row hairlines, alternating fills, every cell a plain sentence rather than a tick. Published date and author on one line under the H1. Four link cards (Comparison, Reviews, Features, FAQ) act as an above-the-fold contents. Borrow: sentence cells instead of ticks for comparison rows, criterion column styling, the plain published-and-author line. Avoid: the testimonial wall and "trusted by" logo strip (exactly what TAG's honest-trust rule forbids), and two competing primary buttons.

**Ahrefs blog (34 free SEO tools).** Category chip, large headline, then a byline row with a photo, name, job title, "Reviewed by", "Updated" and read time, then a strip of the article's own performance data. A left-rail "Contents" ToC stays beside the body on desktop. Numbered tool sections each lead with a real product screenshot in a soft grey frame. Borrow: the left-rail ToC beside a body column, the byline row that carries the credential, screenshots in a consistent frame. Avoid: the saturated full-bleed header band (it pushes the content below the fold) and an in-article product widget.

**Backlinko (best SEO tools).** Dark-navy header band with a centered headline and "Written by" plus "Last updated" with a small avatar, a large illustration, then "On this page" in a left rail and a share count in a right rail. The intro ends in a numbered summary list ("My top SEO tools for 2026": name in the accent color, one line each), then each tool gets "Best for" and "Pricing" lines before the screenshot. Borrow: the numbered top-of-post summary list, the "Best for / Pricing" pair at the head of each tool section. Avoid: the decorative illustration hero and a share count as social proof.

**Every (home).** A real editorial front page: a centered serif wordmark, a lead story with a large image centered between a left column of two smaller stories and a right "Recent essays" list with thumbnails, author names under every headline, dates in small caps. Dark ground, custom illustration. Borrow: the three-column front page (secondary, lead, list) and author presence on every item. Avoid: the black ground and commissioned art, neither of which TAG can sustain.

**Lenny's Newsletter (Substack home).** A cold visit is a full-screen subscribe takeover: logo, one-line description, a subscriber count, an email field. It converts, and it is the kind of interstitial the conversion audit ruled out. The honest part to borrow is the copy shape: one sentence on what you get, who it is for, then the field. Avoid: the takeover itself.

**The Verge (reviews hub).** Huge condensed wordmark-style "Reviews" header on a saturated purple band, a paragraph of description, related category chips, then a lead image card plus a ranked side list. Their individual reviews carry a score with stated criteria; the hub page does not. Borrow: category chips under the hub title. Avoid: the purple band and the paragraph describing the hub (audit tell 4).

**G2 (Apollo vs Clay compare, 1440 headed).** Rating rows with ring gauges and review counts on each side, "Not enough data" for Clay on most rows, an email-gated "Send me this comparison", then feature categories with "Show 70 features". This is the review-count theatre the brief names: numbers without meaning, half the cells empty, a gate in the middle. Avoid all of it. The one thing to note is that a criterion-per-row layout is how buyers expect a comparison to read.

**Capterra (Pipedrive product page).** A referral-fee disclosure in the top bar (good placement), a "Shortlist" award badge, a star rating with a sentiment bar, pros and cons with plus and minus icons, a "Starting price $19" tile and a "Free trial available" tile. Borrow: the pros-and-cons pair with icons, the two small price and trial tiles. Avoid: badges, stars, the sentiment bar, the dense right column of competing modules.

## Product polish for components

**Linear (home).** Dark ground, Inter-like grotesk, figures labelled "FIG 0.1" in mono, hairline column dividers, real product UI as the illustration. Borrow: hairline column dividers between three short points, mono figure labels used sparingly, real UI as the image. Avoid: the all-dark page (TAG's readers are reading 2,000-word posts).

**Vercel (pricing).** The feature table is the reference for TAG's pricing index: section headings with an icon and one line of description, rows with a muted label column, thin check marks, real values ("Up to 40", "1M / month included") right in the cell, a dash for "not offered", info icons for footnotes, no fills. Borrow: label column styling, dash for absent values, the section grouping, restraint. 

**Stripe docs (build a payments page).** A left navigation tree, breadcrumbs, a large title with a one-sentence subtitle, a utility row (Copy for LLM, View as Markdown), then a hero card that is part text and part product diagram. Borrow: breadcrumbs, the subtitle-as-dek, the utility row idea (a "Copy table as CSV" or "Download the dataset" link on the pricing index), and generous type at a comfortable measure.

**Notion template gallery.** Large grey-ground cards with a category label, a title, one line and an illustration; a row of category tiles with a simple colored icon and a count ("5,564 templates"); creator cards with a face, two lines and two buttons. Borrow: the category tile with a count (for TAG's guide hubs and tool categories), soft grey card grounds instead of bordered white cards on cream.

## TAG today (the before)

- **Post (Apollo vs Clay vs Sales Nav).** The bones are right: disclosure under the byline, "Tools compared", TL;DR, ToC, stat tiles, a pick list with prices and "Try" buttons. The execution is not. The body runs about 1,230 px wide at 1440, roughly 150 characters a line, more than double a comfortable measure. Raw tags show in uppercase mono ("COMPARISON AUTOMATION OUTBOUND"). Every element is a bordered box on cream, so nothing leads. The ToC sits in a box beside the TL;DR, then disappears; it is not a rail. At 390 the pick rows clip their price text inside the component ("$49/user/mo Basic; $99/mo Pro (unlimited export"), which `qa:overflow` cannot see because the page itself does not overflow.
- **Home.** A two-column hero with a decorative workflow diagram, a logo marquee, then "Recent articles" as three cards whose image repeats the headline and whose body repeats it again with tags. The pricing index and the author are not visible above the second screen.
- **/tools/.** A full-width disclosure box, an eyebrow, an H1, then category sections of bordered cards with long paragraphs, badges in mono pills and article counts. Card heights vary with blurb length.
- **Pricing index.** The content is the best on the site (dated, sourced, honest nulls) and the stat cards are the right idea. The table reads like a spreadsheet export: no grouping, no sticky header, mono price units, the source column carrying the date in small grey.

## Pattern evidence

- **Disclosure before the first link, not only in the footer:** Wirecutter (one line under the nav), Capterra (top bar). TAG already has it under the byline; keep it there and make it read as a sentence, not a caption.
- **Methodology near the top of every review:** Wirecutter's "Why you should trust us" (who, how many, what was done, independence). Ahrefs' "Reviewed by". TAG's honest version: what was compared, what sources (vendor pricing pages, dated, from the index), and what was not done (no paid placement, no hands-on test where there was none).
- **Comparison tables that read as sentences:** Zapier's criterion rows; Vercel's dash for absent values. At 390 the first column must stay visible while the row scrolls inside its own container.
- **One primary action per screen:** Wirecutter's single black button per pick box versus Zapier's two competing buttons.
- **Byline with a face and a one-line credential:** Wirecutter, Ahrefs, Backlinko all do it. TAG has the face; it lacks the credential line.
- **"Last verified" dates on prices:** Capterra's tiles and Vercel's table carry none; TAG's index already dates every row, which is the one place it is ahead of everyone captured here.

## Direction for TAG

**Who it is for.** A RevOps lead or founder on a desktop at work, comparing two or three tools before a renewal or a purchase, who will judge the site in ten seconds on whether it knows more than the vendor's own page. The job of the design is to look like a reference: calm, dated, specific and easy to scan, with the verdict and the price visible before the scroll.

**Look.** Keep Brand Kit v2.2's hues (teal, ink, the warm cream ground) unless Ian says otherwise, and fix the execution. One saturated color, used sparingly: teal for links and the one primary button per screen, never for decoration. Ink for headings, a quieter ink for meta. Cards lose borders in favor of soft grounds (Notion) or hairlines (Wirecutter, Vercel). Radii small (6 to 8 px). No gradients, no illustration, no decorative diagram; the imagery is logos, tables, real screenshots and the templated post cards that already exist.

**Type.** Source Serif 4 stays as the display face (it is the brand's serif and already self-hosted with metric-matched fallbacks); Inter stays as the text face. A 1.25 scale. Post body at 18 px, line height 1.65, measure 68 to 72 characters. Small caps or a quiet sans label for categories; mono only for figures in tables (tabular numerals everywhere a number sits in a column).

**Post template (the money page).** Disclosure line, category label, headline, dek, byline (face, name, one-line credential, published, updated, read time), then "Tools compared". A pick row block near the top in the Wirecutter shape (logo tile, label, use case, price, one button each). A methodology block on comparison posts. Left-rail ToC on desktop at 1200 px and up, collapsing to a disclosure above the body below that. Comparison tables with a sticky first column, sentence cells and the `/go/` buttons as real buttons. Pick boxes for the verdict. Prices from the index with their "verified on" date. Related posts, then the newsletter block once.

**Home.** One sentence on what the site is, then a front page in the Every shape: lead story, two secondary stories, a "Latest" list; the format sections (comparisons, migrations, pricing breakdowns); the pricing index as a band with live figures; the tool categories as tiles with counts; the author. No hero diagram.

**What stays honest.** No star ratings, review counts, award badges, testimonials, "trusted by" logos or subscriber counts we do not have. The proof is ours: 166 posts, 65 of 93 tools priced from vendor pages with dates, every live affiliate program disclosed by name, a named author with a real credential.
