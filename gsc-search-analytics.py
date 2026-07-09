#!/usr/bin/env python3
"""GSC Search Analytics snapshot for theautomationsguide.com.

Pulls last-N-day performance (clicks / impressions / CTR / avg position) from the
Search Console Search Analytics API and prints:
  - a site-wide totals line,
  - a day-by-day clicks/impressions trend (to see the ramp),
  - top queries by impressions,
  - top pages by impressions,
  - the "page-1, zero-click" pages (avg position <= 10 but 0 clicks) — the CTR-gap
    set the growth audit tracks.

Companion to gsc-index-status.py (index verdicts). Shares the SAME cached OAuth
user creds at ~/.gsc/ (read-only webmasters scope), so no re-consent if that token
is live. Setup + deps: see homegrown-growthco/scripts/README.md.

Usage:
  C:\\Users\\Ian\\.venvs\\gsc\\Scripts\\python gsc-search-analytics.py [days] [host]
  days defaults to 28; host defaults to https://theautomationsguide.com
"""
import os
import sys
from datetime import date, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

GSC_DIR = os.path.expanduser("~/.gsc")
CLIENT = os.path.join(GSC_DIR, "client_secret.json")
TOKEN = os.path.join(GSC_DIR, "token.json")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 28
HOST = (sys.argv[2] if len(sys.argv) > 2 else "https://theautomationsguide.com").rstrip("/")
BARE = HOST.split("://", 1)[-1]

# GSC data lags ~2-3 days; end the window 3 days back so every bucket is settled.
END = date.today() - timedelta(days=3)
START = END - timedelta(days=DAYS - 1)


def get_creds():
    creds = None
    if os.path.exists(TOKEN):
        creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT):
                sys.exit(f"Missing {CLIENT}. Download an OAuth 'Desktop app' "
                         f"client JSON from Google Cloud Console and save it there.")
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT, SCOPES)
            creds = flow.run_local_server(port=0)
        os.makedirs(GSC_DIR, exist_ok=True)
        with open(TOKEN, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return creds


def resolve_site_url(svc):
    sites = svc.sites().list().execute().get("siteEntry", [])
    owned = [s["siteUrl"] for s in sites]
    for candidate in (f"sc-domain:{BARE}", f"{HOST}/"):
        if candidate in owned:
            return candidate
    for s in owned:
        if BARE in s:
            return s
    sys.exit(f"No {BARE} property found for this account. Visible: {owned}")


def q(svc, site, **body):
    body.setdefault("startDate", START.isoformat())
    body.setdefault("endDate", END.isoformat())
    return svc.searchanalytics().query(siteUrl=site, body=body).execute().get("rows", [])


def main():
    svc = build("searchconsole", "v1", credentials=get_creds())
    site = resolve_site_url(svc)
    print(f"Property: {site}")
    print(f"Window:   {START} .. {END}  ({DAYS} days, ending 3d back for settled data)\n")

    # Site-wide totals (no dimensions).
    tot = q(svc, site)
    if tot:
        r = tot[0]
        ctr = r["ctr"] * 100
        print(f"TOTALS:  {int(r['clicks'])} clicks | {int(r['impressions'])} impressions "
              f"| CTR {ctr:.2f}% | avg pos {r['position']:.1f}\n")
    else:
        print("TOTALS:  no data in window\n")

    # Daily trend.
    print("DAILY TREND (clicks / impressions):")
    for r in q(svc, site, dimensions=["date"]):
        d = r["keys"][0]
        print(f"  {d}   {int(r['clicks']):>3} clk   {int(r['impressions']):>5} impr")
    print()

    # Top queries by impressions.
    print("TOP QUERIES (by impressions):")
    rows = q(svc, site, dimensions=["query"], rowLimit=100)
    rows.sort(key=lambda r: r["impressions"], reverse=True)
    print(f"  {'QUERY':45} {'CLK':>4} {'IMPR':>6} {'CTR':>6} {'POS':>5}")
    for r in rows[:25]:
        print(f"  {r['keys'][0][:45]:45} {int(r['clicks']):>4} {int(r['impressions']):>6} "
              f"{r['ctr']*100:>5.1f}% {r['position']:>5.1f}")
    print()

    # Top pages by impressions.
    print("TOP PAGES (by impressions):")
    pages = q(svc, site, dimensions=["page"], rowLimit=100)
    pages.sort(key=lambda r: r["impressions"], reverse=True)
    print(f"  {'PATH':60} {'CLK':>4} {'IMPR':>6} {'CTR':>6} {'POS':>5}")
    for r in pages[:20]:
        path = r["keys"][0].replace(HOST, "") or "/"
        print(f"  {path[:60]:60} {int(r['clicks']):>4} {int(r['impressions']):>6} "
              f"{r['ctr']*100:>5.1f}% {r['position']:>5.1f}")
    print()

    # Page-1, zero-click pages (the CTR-gap set): pos <= 10, clicks == 0, impr >= 5.
    print("PAGE-1 ZERO-CLICK PAGES (avg pos <= 10, 0 clicks, >= 5 impr):")
    gap = [r for r in pages if r["position"] <= 10 and r["clicks"] == 0
           and r["impressions"] >= 5]
    gap.sort(key=lambda r: r["impressions"], reverse=True)
    if not gap:
        print("  (none)")
    for r in gap:
        path = r["keys"][0].replace(HOST, "") or "/"
        print(f"  {path[:60]:60} {int(r['impressions']):>6} impr  pos {r['position']:>5.1f}")


if __name__ == "__main__":
    main()
