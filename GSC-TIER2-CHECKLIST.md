# GSC Tier-2 Request-Indexing checklist

Source: [AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md) (Indexing section). Tier-1 (the 6 `/teams/*` + `/playbooks/` hubs and 5 recent blog posts) was submitted 2026-06-14. This is Tier-2: the newest `/tools/*` hub pages that are "URL is unknown to Google" (never crawled). Submit top-down within GSC's daily Request-Indexing cap; if you hit the cap, continue the next day from where you stopped.

How to submit each: in Google Search Console -> URL Inspection -> paste the URL -> Request Indexing. Note: the Pages report lags the live index by days, so do not expect instant status changes; the URL Inspection live test is the source of truth.

## IAN MANUAL CHECKLIST (this doc)

- [ ] Request-Index the 10 hubs below in order: ~1 min each, ~10 min total
- [ ] Leave `/tools/warmly/` alone (monitor-only, see bottom)

## Submit, in order (10 actionable hubs)

- [ ] https://theautomationsguide.com/tools/bettercontact/
- [ ] https://theautomationsguide.com/tools/circleback/
- [ ] https://theautomationsguide.com/tools/fillout/
- [ ] https://theautomationsguide.com/tools/fullenrich/
- [ ] https://theautomationsguide.com/tools/leadmagic/
- [ ] https://theautomationsguide.com/tools/lemlist/
- [ ] https://theautomationsguide.com/tools/mailforge/
- [ ] https://theautomationsguide.com/tools/surfe/
- [ ] https://theautomationsguide.com/tools/vapi/
- [ ] https://theautomationsguide.com/tools/vector/

## Monitor only (do NOT submit)

- https://theautomationsguide.com/tools/warmly/ - this is the 11th tool hub referenced in TODO.md, but the audit lists it as "Crawled, currently not indexed" (200, self-canonical, nothing to fix). It is a normal authority/quality wait, not a discovery problem, so Request Indexing will not help. Just check back in GSC in a few weeks.

> Trailing slashes match the site's canonical directory format (no-slash redirects one hop to slash). Submit the slash form to avoid feeding Google the redirecting URL.
