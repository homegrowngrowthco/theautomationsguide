# Newsletter templates (Brand Kit v2.2)

The Brand Kit ships two newsletter templates that match the refreshed site design. They live in this repo as source-of-truth, but **importing them is a manual step in the Beehiiv UI** — Beehiiv templates cannot be created from the repo.

## Where the files are

| Purpose | Path |
|---|---|
| Inbox-safe templates to import into Beehiiv | [brand-kit/beehiiv/daily.html](brand-kit/beehiiv/daily.html), [brand-kit/beehiiv/weekly.html](brand-kit/beehiiv/weekly.html) |
| Full import guide (constraints, per-send checklist, testing) | [brand-kit/beehiiv/README.md](brand-kit/beehiiv/README.md) |
| Design-fidelity previews (web fonts — open in a browser to see the intended look) | [brand-kit/newsletters/daily.html](brand-kit/newsletters/daily.html), [brand-kit/newsletters/weekly.html](brand-kit/newsletters/weekly.html) |

The `beehiiv/*.html` files are stripped of `<style>`/`<link>`/`<script>` and use inlined, table-based layout for email-client compatibility. The `newsletters/*.html` files use real web fonts and are for previewing the design only — do **not** paste those into Beehiiv.

## Action required of Ian (manual, in Beehiiv)

1. In Beehiiv: **New → Template post → Blank draft**.
2. Add an **HTML Snippet** block (type `/` → HTML Snippet, under Premium), paste everything inside `<body>...</body>` from `beehiiv/daily.html`, **Preview**, save.
3. **Save as template** — name it "The Briefing — Daily".
4. Repeat with `beehiiv/weekly.html` → "The Guide — Weekly".
5. Send yourself a test and check Gmail (light + dark), Apple Mail iPhone, and Outlook desktop. Gmail dark mode re-themes aggressively — confirm the teal stays legible.

Full per-send editing checklist (issue number, date, affiliate link, read-time, preview text) is in [brand-kit/beehiiv/README.md](brand-kit/beehiiv/README.md).

## Signup conversion steps in Beehiiv (conversion audit 2026-10-01, Ian applies)

These come from [audits/AUDIT-CONVERSION-2026-10-01.md](audits/AUDIT-CONVERSION-2026-10-01.md) (F8). Claude drafted them; nothing here was written to Beehiiv by Claude. Beehiiv's menu names shift between releases, so treat each click path as approximate.

1. **Fix the squeezed mobile form.** On a phone the email field shows only "Ente" (screenshot, 375px).
   - **Cause:** the embed iframe is 325px wide. Inside it, form `d41efc59-...` renders a large publication title and a narrow inline input-plus-button row. The site cannot restyle a cross-origin iframe.
   - **Where:** Beehiiv > Grow > Subscribe forms > that form.
   - **What to change:**
     - Hide the publication name/title (the site already shows the heading and copy beside it).
     - Switch the input layout to **stacked**, so the email field is full width with the button below.
     - Use a transparent or cream (`#f5f2ea`) background so it sits in the site's card.
   - **Verify:** open any post on a phone; the placeholder should read in full.
2. **Turn on a welcome email.**
   - **Where:** Settings > Emails (or Automations, "Welcome email"). On the free plan, use the built-in welcome email if automations are unavailable.
   - **Draft copy** (no dashes, no claims we can't back):
     > **Subject:** You're in: what to expect from The Automations Guide
     >
     > Thanks for subscribing. You'll get new posts as they publish: tool comparisons, migration guides, and pricing breakdowns for RevOps and GTM teams. Every price is read from the vendor's own page and dated.
     >
     > Three good places to start:
     > - The RevOps automation pricing index: https://theautomationsguide.com/revops-automation-pricing/
     > - Head-to-head tool comparisons: https://theautomationsguide.com/guides/tool-vs-tool/
     > - Migration guides: https://theautomationsguide.com/guides/migrations/
     >
     > Reply to this email with the tool decision you're stuck on. I read every reply.
     >
     > Ian
   - **Lead magnet:** if the RevOps Stack Audit template is published later (TODO, audit R8), add one line offering it here.
3. **Join the free recommendations network.**
   - **Where:** Grow > Recommendations. Free recommendations work on the Launch plan; Boosts (paid) do not.
   - **What to do:** recommend 2-3 RevOps or GTM newsletters you actually read, and accept incoming requests that fit.
   - **Baseline:** 0 in, 0 out on 10/01.
4. **How to measure all of this:** count real Beehiiv subscriptions per week, excluding your own test addresses ([ANALYTICS.md](ANALYTICS.md), "Newsletter signups"). The baseline is 0.

## Already handled in the repo

The site's CSP ([public/_headers](public/_headers)) already allows `subscribe-forms.beehiiv.com` for the on-site signup embed; no CSP change is needed for the newsletter templates (they live inside Beehiiv, not on the site).
