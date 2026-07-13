---
description: Full SEO audit of theautomationsguide.com — technical, indexing, on-page, structured data, and performance. Optional URL arg scopes the on-page/Lighthouse pass to one page.
argument-hint: "[url] (optional — e.g. https://theautomationsguide.com/blog/<slug>/ ; omit for a full-site audit)"
---

Run a full SEO audit of **theautomationsguide.com** and write a dated, severity-ranked report to `AUDIT-SEO-<YYYY-MM-DD>.md` (repo root; it's fine to leave untracked). `$ARGUMENTS` optionally scopes the on-page + Lighthouse pass to a single URL; with no arg, audit the whole site.

This site is Astro (trailing-slash directory output), Netlify-hosted, sitemap auto-generated with `/go/`, `/og/`, and the noindex utility pages filtered out (see [astro.config.mjs](../../astro.config.mjs)). Audit **production**, not a Netlify deploy preview — previews send `X-Robots-Tag: noindex`, which tanks the Lighthouse SEO score and is a preview artifact, not a regression.

## 1. Technical / crawl (live, via curl)
- `robots.txt` reachable, `Allow: /`, AI crawlers allowed, and `Sitemap:` points at `https://theautomationsguide.com/sitemap-index.xml` (must be reachable, not 404).
- `sitemap-0.xml` reachable; count `<loc>` entries; confirm **zero** `/go/` or `/og/` URLs leak in.
- Redirects are single-hop: no-slash → slash (`curl -sIL <url> -o /dev/null -w "%{num_redirects} %{http_code} %{url_effective}"` should be 1 redirect → 200), `www` → apex, `http` → `https`.
- Security/SEO headers present on a page fetch: `HSTS`, `X-Content-Type-Options`, `Content-Security-Policy`, no stray `X-Robots-Tag: noindex` on indexable pages.
- Spot-check a `/go/<tool>/` page carries `<meta name="robots" content="noindex,follow">` + meta-refresh (thin redirect pages must stay out of the index).

## 2. Indexing (GSC URL Inspection)
Run the index-status checker:
`C:\Users\Ian\.venvs\gsc\Scripts\python.exe gsc-index-status.py`
- **Run this in the FOREGROUND, not a background shell** — if the cached `~/.gsc/token.json` expired it reopens a browser for OAuth consent, which silently hangs a background task at zero output. If it hangs, tell the user to complete the browser consent (or re-run interactively), then continue.
- Group results by coverage state. Call out everything not "Submitted and indexed": **"URL is unknown to Google"** = never crawled (normal for new pages; Request Indexing speeds it); **"Crawled - currently not indexed"** = crawl-budget/authority wait — verify the page is 200 / self-canonical / no-noindex before worrying.
- Remind the user the GSC **Pages report lags the live index by days**; this API call is the source of truth.

## 3. On-page + structured data (built dist)
- **Run `node qa/lint-content.mjs --all` FIRST — it is the only check that catches a live `/go/` revenue leak.** A post can reference `/go/<slug>` for a tool that was never added to `affiliate-links.ts`; `go/[tool].astro` then never generates the redirect and the affiliate CTA **404s in production**. `qa:seo` CANNOT see this (it skips `/go/` as noindex-by-design), and CI lints only the *changed* post, so a slug that slipped past one PR is invisible forever after. This exact defect shipped twice: audit C-1 (S40/S41: zapier/canva/creatify) and `/go/quickmail` (found 2026-07-13, live 404 on prod for a day). Any HARD here is a **Critical** finding — verify with `curl -o /dev/null -w "%{http_code}" https://theautomationsguide.com/go/<slug>/` (control: `/go/clay/` = 200) before writing it up.
- `npm run build` (generates `dist/` + Pagefind index), then `npm run qa:seo` ([qa/seo-scan.mjs](../../qa/seo-scan.mjs)). It's noindex-aware (skips `/go/`) and reports, per indexable page: missing canonical / H1 / meta description (HARD), duplicate titles (HARD), title > 62 chars, description length out of 70-165, missing `og:image`, and em/en dash in `<title>` (WARN). Quote the HARD count and the top WARN buckets.
- **Internal-link mesh / orphan hubs:** run `node internal-link-mesh.mjs` (census only, no key needed) and report `Hubs with ZERO in-body inbound links`. Orphaned hubs accrue no authority and stall at pos 50+. New hubs are auto-linked from their introducing post by CI (see the auto-register step), so a rising orphan count means either that broke, or the orphans are LP-only hubs with no article yet (which need *content*, not a mesh run).
- Spot-check JSON-LD on one blog post (`curl -s <post-url> | grep -oE '"@type":"?[A-Za-z]+'`): expect `BlogPosting`, `BreadcrumbList`, `FAQPage` + `Question`/`Answer`, `SoftwareApplication`, `Person`, `Organization`, `ImageObject`. Note any missing.
- Confirm E-E-A-T signals on a post: visible "By Ian Chamberland" byline linked to `/about/` with `rel="author"`, TL;DR answer box, author JSON-LD `author.name`.

## 4. Performance (Lighthouse, production)
Run the homepage on both presets + one representative blog post on mobile (mobile is the ranking-relevant profile for Core Web Vitals):
```
npx lighthouse https://theautomationsguide.com/ --preset=desktop --output=json --output-path=/c/tmp/lh-tag-home-desktop.json --quiet --chrome-flags="--headless --no-sandbox"
npx lighthouse https://theautomationsguide.com/ --output=json --output-path=/c/tmp/lh-tag-home-mobile.json --quiet --chrome-flags="--headless --no-sandbox"
npx lighthouse <a-blog-post-url> --output=json --output-path=/c/tmp/lh-tag-post-mobile.json --quiet --chrome-flags="--headless --no-sandbox"
```
For each: Performance / Accessibility / Best Practices / SEO scores + FCP, LCP, TBT, CLS. (Lighthouse CLI may exit 1 even on a successful run that wrote valid JSON — read the JSON, don't trust the exit code.) Flag mobile LCP > 2.5s and Performance below ~0.80 as Core-Web-Vitals risk. Best Practices is capped ~0.77 by third-party cookies (PostHog/analytics) + CSP `unsafe-inline` — tracked, not a ranking factor.

## 5. Report
Write `AUDIT-SEO-<date>.md`: a one-paragraph verdict, then findings tabled as **Critical / Medium / Low**, each with the evidence (the number, the URL, the header). Separate genuine issues from expected-and-correct behavior (e.g. noindex `/go/` pages having no description is correct, not a finding). End with a prioritized fix list. Do NOT auto-edit site source as part of the audit — propose fixes and let the user pick.
