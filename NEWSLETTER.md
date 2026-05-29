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

## Already handled in the repo

The site's CSP ([public/_headers](public/_headers)) already allows `subscribe-forms.beehiiv.com` for the on-site signup embed; no CSP change is needed for the newsletter templates (they live inside Beehiiv, not on the site).
