"""Read-only: weekly clicks split into MoltSets pages, the four Pipedrive-burst pages, and everything else. argv[1] = data dir."""
import json
import os
import sys
from collections import defaultdict
from datetime import date, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DATA = sys.argv[1]
PROP = "sc-domain:theautomationsguide.com"
creds = Credentials.from_authorized_user_file(os.path.expanduser("~/.gsc/token.json"), ["https://www.googleapis.com/auth/webmasters.readonly"])
if not creds.valid:
    creds.refresh(Request())
svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
END = date(2026, 11, 12)
START = END - timedelta(days=83)  # 12 weeks
rows, start = [], 0
while True:
    body = {"startDate": str(START), "endDate": str(END), "dimensions": ["date", "page"], "rowLimit": 25000, "startRow": start, "type": "web"}
    got = svc.searchanalytics().query(siteUrl=PROP, body=body).execute().get("rows", [])
    rows += got
    if len(got) < 25000:
        break
    start += 25000
BURST = ("nutshell-vs-pipedrive-vs-close", "pipedrive-for-marketing-teams", "pipedrive-segmentation-guide", "pipedrive-automated-emails")


def bucket(u):
    if "moltsets" in u:
        return "moltsets"
    if any(b in u for b in BURST):
        return "burst4"
    return "rest"


wk = defaultdict(lambda: defaultdict(lambda: [0, 0]))
win = defaultdict(lambda: defaultdict(lambda: [0, 0]))
for r in rows:
    d = date.fromisoformat(r["keys"][0])
    k = d.isocalendar()
    b = bucket(r["keys"][1])
    wk[(k[0], k[1])][b][0] += r["clicks"]
    wk[(k[0], k[1])][b][1] += r["impressions"]
    w = "last28" if d >= END - timedelta(days=27) else ("prev28" if d >= END - timedelta(days=55) else "older28")
    win[w][b][0] += r["clicks"]
    win[w][b][1] += r["impressions"]
print("week | moltsets clicks/impr | burst4 clicks/impr | rest clicks/impr")
out = []
for k in sorted(wk):
    v = wk[k]
    print(f"{k[0]}-W{k[1]:02d} | {v['moltsets'][0]:3.0f} {v['moltsets'][1]:5.0f} | {v['burst4'][0]:3.0f} {v['burst4'][1]:5.0f} | {v['rest'][0]:3.0f} {v['rest'][1]:6.0f}")
    out.append({"week": f"{k[0]}-W{k[1]:02d}", **{b: v[b] for b in ("moltsets", "burst4", "rest")}})
for w in ("older28", "prev28", "last28"):
    v = win[w]
    print(w, {b: [int(x) for x in v[b]] for b in ("moltsets", "burst4", "rest")})
json.dump(out, open(os.path.join(DATA, "weekly_split.json"), "w"))
