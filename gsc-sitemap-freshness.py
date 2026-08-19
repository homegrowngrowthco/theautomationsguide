#!/usr/bin/env python3
"""GSC sitemap-freshness check — the monitor whose absence let a 58-day-stale
sitemap read go unnoticed (found 2026-08-19: lastDownloaded 6/22, 94 of 217 URLs).

Checks, via the Search Console API (webmasters.readonly):
  1. lastDownloaded age  — FAIL if Google hasn't re-read the sitemap in > MAX_AGE_DAYS.
  2. submitted URL count — FAIL if Google's count is < 80% of the live sitemap's count
     (Google seeing far fewer URLs than we publish = it is working from a stale read).

Exit 0 = healthy, exit 1 = stale/mismatch (CI turns that into a Slack alert), exit 78
= no credentials available (skipped, not passed — do not read a skip as health).

Credentials: ~/.gsc/token.json locally, or the GSC_TOKEN_JSON env var in CI
(paste the full contents of ~/.gsc/token.json into the repo secret).
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

SITE = "sc-domain:theautomationsguide.com"
SITEMAP = "https://theautomationsguide.com/sitemap-index.xml"
LIVE_SITEMAP_PART = "https://theautomationsguide.com/sitemap-0.xml"
MAX_AGE_DAYS = 14
MIN_COVERAGE = 0.8

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def get_creds():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    raw = os.environ.get("GSC_TOKEN_JSON")
    if raw:
        info = json.loads(raw)
        creds = Credentials.from_authorized_user_info(info, SCOPES)
    else:
        token_path = os.path.join(os.path.expanduser("~"), ".gsc", "token.json")
        if not os.path.exists(token_path):
            print("SKIP: no GSC_TOKEN_JSON env var and no ~/.gsc/token.json.")
            sys.exit(78)
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def live_url_count():
    with urllib.request.urlopen(LIVE_SITEMAP_PART, timeout=30) as r:
        body = r.read().decode("utf-8", "replace")
    return body.count("<loc>")


def main():
    from googleapiclient.discovery import build

    svc = build("searchconsole", "v1", credentials=get_creds())
    resp = svc.sitemaps().list(siteUrl=SITE).execute()
    entry = next((s for s in resp.get("sitemap", []) if s.get("path") == SITEMAP), None)
    if entry is None:
        print(f"FAIL: {SITEMAP} is not registered in GSC at all.")
        sys.exit(1)

    last = entry.get("lastDownloaded")
    age_days = None
    if last:
        dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
        age_days = (datetime.now(timezone.utc) - dt).days
    submitted = sum(int(c.get("submitted", 0)) for c in entry.get("contents", []))
    live = live_url_count()

    print(f"lastDownloaded: {last} (age {age_days}d) | GSC submitted: {submitted} | live sitemap: {live}")

    problems = []
    if age_days is None:
        problems.append("Google has never downloaded the sitemap.")
    elif age_days > MAX_AGE_DAYS:
        problems.append(f"Google last read the sitemap {age_days} days ago (max {MAX_AGE_DAYS}).")
    if live and submitted < live * MIN_COVERAGE:
        problems.append(f"Google's URL count ({submitted}) is under {int(MIN_COVERAGE*100)}% of live ({live}) — stale read.")

    if problems:
        for p in problems:
            print("FAIL:", p)
        print("Action: resubmit sitemap-index.xml in GSC UI; if this repeats, investigate crawl budget/lastmod.")
        sys.exit(1)
    print("OK: sitemap read is fresh and coverage is sane.")


if __name__ == "__main__":
    main()
