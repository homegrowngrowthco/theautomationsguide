# Next session (theautomationsguide): raise the site to the standard homecare-leadgen just hit

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`. Read `CLAUDE.md`, `TODO.md`, the top of `docs/SESSION_LOG.md`, `audits/AUDIT-DESIGN-2026-08-29.md` and `audits/AUDIT-CONVERSION-2026-10-01.md` first. This file is a 2026-10-02 snapshot; re-check every claim against the repo before acting.

Then read the sibling project that sets the bar: `../homecare-leadgen/docs/DESIGN-TEARDOWN-2026-10.md`, `../homecare-leadgen/docs/DESIGN-SYSTEM.md`, `../homecare-leadgen/docs/SESSION_LOG.md` (S2), and the memory `reference_astro7_tailwind4_visual_qa_gotchas`. Open https://local-home-care-guide.netlify.app on a phone-width viewport and a desktop one. That site was rebuilt in one session from "janky vibe-coded" to something a worried family trusts; Ian's verdict was "this site looks really good." TAG should feel like it was made by the same studio: calm, specific, designed rather than generated.

## NEEDS FROM IAN (ask each one with AskUserQuestion before building anything)

1. **Palette: keep the Brand Kit v2.2 colors, or allow a refresh?** The kit is the brand. The default is to keep its hues and fix the execution (type, spacing, hierarchy, components). Only change hue values if Ian says so.
2. **Direction choice.** After the teardown, show two or three artboards of the post template and the home page in a Design artifact (Ian picks; last time he chose the navy centered-marketplace direction over the recommended one, so show real alternatives, not three shades of the same idea). Attach rendered PNGs with SendUserFile before the question.
3. **Is the "RevOps Stack Audit" Notion template real and publishable?** It decides whether the newsletter block gets a real reason to subscribe (audit R8) or stays a plain signup.

## The brief

TAG's problem is different from homecare's. Design de-AI already shipped (Sessions 81-87), the brand kit is applied, and the money metric is affiliate clicks per post pageview (baseline 3.8 to 5.9 per 100, audit 10/01), with newsletter signups at zero. Traffic is 90 percent desktop, about 63 post pageviews a week, and the top entry pages are comparison posts (apollo-vs-clay, gong-vs-outreach, activecampaign-vs-hubspot). So the post template is the money page, the way get-matched was for homecare, and the home page is second. The goal is a site a RevOps lead would bookmark and cite: editorial authority, visible methodology, comparison tables that are a pleasure to read, and one obvious action per screen.

## What does NOT change

- Every post's MDX body, the component contract in `src/components/post/` (the engine writes to it twice a day), `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/<slug>` redirect, the `ClickSource` attribution shipped in PR #326 (`source_path`, `source_component` must keep flowing; the 10/15 and 11/26 audit reads depend on it), `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD, the pricing index data and its CC BY 4.0 notice, the Beehiiv form id.
- All QA gates in `qa/` keep passing: `qa:lint`, `qa:render`, `qa:overflow`, `qa:logos`, `qa:seo`, `qa:docs`. The render-acceptance and mobile-overflow gates are your friends; add the two new ones from homecare (below) rather than weakening any.
- No fake urgency, exit-intent walls, invented social proof, star ratings, "trusted by" logos, or testimonials (audit 10/01 out-of-scope list and the honest-trust rule from homecare). TAG has real proof to use instead: 164 posts, the pricing index (65 of 93 tools priced from vendor pages, dated), 32 live affiliate programs disclosed by name, the named author.
- No em or en dashes anywhere (the sanitizer and lint already enforce it).

## Part 0. Teardown first (about 45 minutes, before any code)

Copy `../homecare-leadgen/scripts/teardown-shots.mjs`, point it at the sites below, run it at 1440 and 390 (headless Chromium from `%LOCALAPPDATA%\ms-playwright\chromium-1228`; the Chrome download 403s on this network), and write `audits/DESIGN-TEARDOWN-2026-10.md`: one paragraph per site on what to borrow and avoid, then a one-page direction for TAG. Sites that block headless get a headed run.

**Affiliate and review editorial (our actual model):** Wirecutter (nytimes.com/wirecutter: the standard for methodology-forward affiliate reviews, "why you should trust us", pick boxes, comparison tables, disclosure placement), Zapier blog (zapier.com/blog: app comparisons with sticky tables and plain language), Ahrefs blog and Backlinko (long-form with a left-rail table of contents and data callouts), Every (every.to: editorial type, author presence), Lenny's Newsletter (newsletter conversion done without tricks), The Verge reviews (scorecards with stated criteria), G2 and Capterra (what to avoid: density, review-count theatre).

**Product polish to study for components:** Linear (linear.app) and Vercel (vercel.com) for tables, badges and dark bands; Stripe docs for a sticky ToC and code-level hierarchy; Notion's template gallery for card grids.

**Pattern evidence to cite:** methodology block near the top of every review (Wirecutter); affiliate disclosure visible before the first link, not only in the footer; a comparison table that stays readable at 390 (first column sticky, horizontal scroll inside the table only); a single primary action per screen; author byline with a real photo and a one-line credential; "last verified" dates on every price.

## Part 1. Design system before pages

1. Load `artifact-design`. Open the existing Design System artifact "Local Home Care Guide" (https://claude.ai/artifact/4VL8eojsit5CAP7G9T13oK) to see the format, then create one for TAG from the Brand Kit v2.2 tokens already in `src/styles/global.css` (revalue and augment, never rename; see memory `reference_applying_claude_design_kits`). Mirror the result back into the repo.
2. **Stack decision, stated in the first message:** TAG is on Astro 4 and the Astro 6 upgrade is a deferred audit low. Tailwind v4's Vite plugin works on Astro 4's Vite 5, so the token-to-utility layer can be added without the upgrade. Astro's fonts API (metric-matched fallbacks, the thing that took homecare's CLS to 0) needs Astro 5.7 or later, so either do the upgrade first on its own PR (preferred if `npm run qa:render` passes afterwards) or self-host the fonts with hand-written `@font-face` plus `size-adjust` fallbacks. Do not leave Google Fonts links in.
3. **Type:** keep the kit's display face if it carries the brand; pair it with one text face; set a real 1.25 scale and a 68 to 72 character measure for post bodies; tabular numerals in every table and price.
4. **Components** (`src/components/ui/` as in homecare: Container, Section, Button, Card, Badge, Stat, Callout, Accordion, Table): then the TAG-specific ones rebuilt on them: `ComparisonTable`, `ToolPricing`, `PostCard`, `EmailSignup`, `AuthorNote`, the pick box, the methodology block, the disclosure line.
5. **Imagery:** the card imagery for all posts shipped in PR #261 stays. Tool logos stay under `qa:logos`. No stock photos of people at laptops; TAG's visuals are tables, logos, screenshots and data.
6. **Iconography:** Lucide, one size, used sparingly.

## Part 2. Page by page (priority order)

**Post template (the money page):** header that gets out of the way; title, byline with photo and one-line credential, published and updated dates, reading time; a disclosure line above the first affiliate link; a methodology block ("how we compared these") near the top for comparison posts; left-rail ToC on desktop (the homecare service page pattern); the comparison table with a sticky first column and the `/go/` buttons as real buttons; pick boxes for the verdict; pricing pulled from the index with its "verified on" date; a related-posts grid; the newsletter block once, with a real reason to subscribe if Ian confirms the template exists. Measure clicks per 100 pageviews by `source_component` before and after; the audit's baseline is the comparison.

**Home:** one sentence on what the site is, the newest and the most-read posts, the tool hubs as a grid, the pricing index as the linkable asset, the author. No hero image; the content is the hero.

**/tools/ and /tools/<slug>/:** 46 cards in 11 sections already render; make each card consistent (logo tile, one line, program status), and give each hub a pricing stat and its posts.

**Pricing index:** a product-grade table (the homecare calculator result panel is the reference for the summary; the dataviz skill for any chart), filter row, "verified on" per row, download link for the CC BY dataset.

**About, disclosure, privacy, terms:** article layout, same system; the disclosure page lists every live program by name.

## Part 3. Quality gates before Ian sees anything

Copy `../homecare-leadgen/scripts/qa-shots.mjs` and `qa-lighthouse.mjs`, adapt the route list (home, /tools/, two tool hubs, the three top comparison posts, the pricing index, about, disclosure, search), and add them as `qa:shots` and `qa:lighthouse`. Pass criteria: 0 overflow and 0 console errors across all routes at 390, 768 and 1440; Lighthouse mobile Performance 95+, Accessibility 100, SEO 100, CLS 0 on the post template, home, /tools/ and the pricing index. Look at every screenshot yourself before the AskUserQuestion (memory `feedback_qa_before_user_review`); check one post at 390 with a 20 px root font. Then the existing gates: `npm run qa:lint && npm run qa:render && npm run qa:overflow && npm run qa:logos && npm run qa:seo && npm run qa:docs`. Test search on the deploy preview, not locally (CSP).

## Part 4. Ship

- Worktree in `C:\tmp` off `origin/master` (junction `node_modules` for sharp per CLAUDE.md gotcha 3, or a fresh install if deps change; `cmd //c rmdir` the junction before `git worktree remove`; OneDrive locks stale worktree metadata, clear attributes then remove only the git-confirmed-stale dir). Branch `design/2026-10`. Two PRs: design system and tooling first, then the templates. Netlify builds a deploy preview per PR; send Ian the preview link and the PNGs. Ian merges; master auto-deploys.
- Docs: `audits/DESIGN-TEARDOWN-2026-10.md`, `docs/DESIGN-SYSTEM.md`, a session-log entry of 20 lines or fewer, `TODO.md` updated, `CLAUDE.md` tech stack and current-state lines refreshed, `qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first.
- After the merge, add the before and after click rate to the TODO item that reads the audit metrics on 10/15 and 11/26.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block, never only inside a question.
- No secrets in chat or the repo. Never `git add -A`. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; PR bodies end with the Claude Code attribution line.
- Do not touch the engine, `n8n/`, `backlog/`, `pricing/` scripts or anything under `alita/`.
- Do not name a component class `table`, `container` or any other Tailwind utility name. Keep buttons wrapping (no `nowrap`), give grid children `min-w-0`, and set `MSYS_NO_PATHCONV=1` when passing `/route/` arguments to node scripts in Git Bash.
- Rewrite this file in place with whatever is still open at the end; `git rm` it only when nothing is.
