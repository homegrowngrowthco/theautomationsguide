#!/usr/bin/env python3
"""GSC index-status checker for theautomationsguide.com.

Pulls the live Google index verdict for every URL in the sitemap via the
Search Console URL Inspection API, prints a one-line-per-URL table, and then
prints an explicit "NEEDS INDEXING" list (every URL Google is not currently
indexing) so it can be actioned in GSC.

Shares auth with homegrown-growthco/scripts/gsc-index-status.py — OAuth *user*
credentials at ~/.gsc/ (account-level, read-only webmasters scope). The same
Google account owns this property, so the cached token works without re-consent.
Setup + deps: see homegrown-growthco/scripts/README.md.

Usage:
  C:\\Users\\Ian\\.venvs\\gsc\\Scripts\\python gsc-index-status.py [host]
  host defaults to https://theautomationsguide.com
"""
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

GSC_DIR = os.path.expanduser("~/.gsc")
CLIENT = os.path.join(GSC_DIR, "client_secret.json")
TOKEN = os.path.join(GSC_DIR, "token.json")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

HOST = (sys.argv[1] if len(sys.argv) > 1 else "https://theautomationsguide.com").rstrip("/")
BARE = HOST.split("://", 1)[-1]
SITEMAP = f"{HOST}/sitemap-0.xml"

# Coverage states that mean "Google IS indexing this" — everything else needs action.
INDEXED_STATES = {"Submitted and indexed", "Indexed, not submitted in sitemap"}


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
    """Pick the right siteUrl: prefer the domain property, else the https prefix."""
    sites = svc.sites().list().execute().get("siteEntry", [])
    owned = [s["siteUrl"] for s in sites]
    for candidate in (f"sc-domain:{BARE}", f"{HOST}/"):
        if candidate in owned:
            return candidate
    for s in owned:
        if BARE in s:
            return s
    sys.exit(f"No {BARE} property found for this account. Properties visible: {owned}")


def urls_from_sitemap():
    with urllib.request.urlopen(SITEMAP, timeout=20) as r:
        root = ET.fromstring(r.read())
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in root.findall(".//s:loc", ns)]


def main():
    svc = build("searchconsole", "v1", credentials=get_creds())
    site = resolve_site_url(svc)
    urls = urls_from_sitemap()
    print(f"Property: {site}   URLs: {len(urls)}\n")
    print(f"{'PATH':46} {'VERDICT':9} {'COVERAGE STATE':36} LAST CRAWL")
    print("-" * 116)
    summary = {}
    needs_index = []  # (url, coverage)
    for u in urls:
        path = u.replace(HOST, "") or "/"
        try:
            res = svc.urlInspection().index().inspect(
                body={"inspectionUrl": u, "siteUrl": site}).execute()
            r = res["inspectionResult"]["indexStatusResult"]
            verdict = r.get("verdict", "?")
            coverage = r.get("coverageState", "?")
            crawl = (r.get("lastCrawlTime", "-") or "-")[:10]
            summary[coverage] = summary.get(coverage, 0) + 1
            if coverage not in INDEXED_STATES:
                needs_index.append((u, coverage))
            print(f"{path:46} {verdict:9} {coverage:36} {crawl}")
        except Exception as e:  # noqa: BLE001 - want the loop to continue
            print(f"{path:46} ERROR     {e}")
            needs_index.append((u, "ERROR"))
    print("\nSummary by coverage state:")
    for k, v in sorted(summary.items(), key=lambda kv: -kv[1]):
        print(f"  {v:3}  {k}")

    print(f"\n{'='*116}\nNEEDS INDEXING ({len(needs_index)} URLs not currently indexed):\n{'-'*116}")
    for u, cov in needs_index:
        print(f"  [{cov}]  {u}")


if __name__ == "__main__":
    main()
