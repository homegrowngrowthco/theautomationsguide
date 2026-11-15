"""Read-only: who clicked the Pipedrive cluster? argv[1] = data dir."""
import json
import os
import sys
from datetime import date

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DATA = sys.argv[1]
PROP = "sc-domain:theautomationsguide.com"
creds = Credentials.from_authorized_user_file(os.path.expanduser("~/.gsc/token.json"), ["https://www.googleapis.com/auth/webmasters.readonly"])
if not creds.valid:
    creds.refresh(Request())
svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def q(start, end, dims, filters=None):
    body = {"startDate": str(start), "endDate": str(end), "dimensions": dims, "rowLimit": 25000, "type": "web"}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return svc.searchanalytics().query(siteUrl=PROP, body=body).execute().get("rows", [])


S, E = date(2026, 10, 16), date(2026, 11, 12)
f = [{"dimension": "page", "operator": "contains", "expression": "pipedrive"}]
print("=== pages with 'pipedrive' in the URL, 10/16 to 11/12")
tot = q(S, E, [], f)
print("total clicks/impr:", [(int(r["clicks"]), int(r["impressions"])) for r in tot])
print("by country (clicks>0):", [(r["keys"][0], int(r["clicks"]), int(r["impressions"])) for r in sorted(q(S, E, ["country"], f), key=lambda r: -r["clicks"]) if r["clicks"] > 0])
print("by device:", [(r["keys"][0], int(r["clicks"]), int(r["impressions"])) for r in q(S, E, ["device"], f)])
print("by date (clicks>0):", [(r["keys"][0][5:], int(r["clicks"])) for r in q(S, E, ["date"], f) if r["clicks"] > 0])
print("by page (clicks>0):")
for r in sorted(q(S, E, ["page"], f), key=lambda r: -r["clicks"]):
    if r["clicks"] > 0:
        print("  ", int(r["clicks"]), int(r["impressions"]), round(r["position"], 1), r["keys"][0][-70:])
print("by query (clicks>0):", [(r["keys"][0], int(r["clicks"]), int(r["impressions"]), round(r["position"], 1)) for r in sorted(q(S, E, ["query"], f), key=lambda r: -r["clicks"]) if r["clicks"] > 0])
print("device x date for clicks:", [(r["keys"][0][5:], r["keys"][1], r["keys"][2], int(r["clicks"])) for r in q(S, E, ["date", "device", "country"], f) if r["clicks"] > 0])

print("\n=== all clicks by page, 10/16 to 11/12 (for the PostHog join)")
rows = sorted(q(S, E, ["page"]), key=lambda r: -r["clicks"])
out = [(r["keys"][0].replace("https://theautomationsguide.com", ""), int(r["clicks"])) for r in rows if r["clicks"] > 0]
json.dump(out, open(os.path.join(DATA, "clicks_by_page.json"), "w"))
for p, c in out:
    print(c, p[:90])

print("\n=== site clicks by device x country 28d (clicks>=2)")
print([(r["keys"][0], r["keys"][1], int(r["clicks"])) for r in sorted(q(S, E, ["country", "device"]), key=lambda r: -r["clicks"]) if r["clicks"] >= 2])
