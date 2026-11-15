"""Read-only GSC pull for the TAG growth read (op #1633). Dumps JSON to the out dir given as argv[1]."""
import json
import os
import sys
from datetime import date, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

OUT = sys.argv[1]
PROP = "sc-domain:theautomationsguide.com"
TOKEN = os.path.expanduser("~/.gsc/token.json")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
if not creds.valid:
    creds.refresh(Request())
    with open(TOKEN, "w", encoding="utf-8") as f:
        f.write(creds.to_json())
svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

END = date.today() - timedelta(days=3)


def q(start, end, dims, limit=25000, filters=None):
    rows, start_row = [], 0
    while True:
        body = {"startDate": str(start), "endDate": str(end), "dimensions": dims,
                "rowLimit": min(limit, 25000), "startRow": start_row, "type": "web"}
        if filters:
            body["dimensionFilterGroups"] = [{"filters": filters}]
        resp = svc.searchanalytics().query(siteUrl=PROP, body=body).execute()
        got = resp.get("rows", [])
        rows += got
        if len(got) < 25000 or len(rows) >= limit:
            break
        start_row += 25000
    return [{"keys": r["keys"], "clicks": r["clicks"], "impressions": r["impressions"],
             "ctr": r["ctr"], "position": r["position"]} for r in rows]


def win(n, offset=0):
    e = END - timedelta(days=offset)
    return e - timedelta(days=n - 1), e


out = {"end": str(END)}
s, e = win(180)
out["by_date_180"] = q(s, e, ["date"])
out["by_date_country_90"] = q(*win(90), ["date", "country"])
s28, e28 = win(28)
p28s, p28e = win(28, 28)
out["win28"] = [str(s28), str(e28)]
out["prev28"] = [str(p28s), str(p28e)]
out["page_28"] = q(s28, e28, ["page"])
out["page_prev28"] = q(p28s, p28e, ["page"])
out["page_90"] = q(*win(90), ["page"])
out["query_28"] = q(s28, e28, ["query"])
out["query_prev28"] = q(p28s, p28e, ["query"])
out["page_query_28"] = q(s28, e28, ["page", "query"])
out["page_country_28"] = q(s28, e28, ["page", "country"])
out["country_28"] = q(s28, e28, ["country"])
out["device_28"] = q(s28, e28, ["device"])
out["page_query_90"] = q(*win(90), ["page", "query"])
out["page_country_90"] = q(*win(90), ["page", "country"])

with open(os.path.join(OUT, "gsc.json"), "w", encoding="utf-8") as f:
    json.dump(out, f)
for k, v in out.items():
    if isinstance(v, list) and v and isinstance(v[0], dict):
        print(k, len(v), "rows", "clicks", sum(r["clicks"] for r in v), "impr", sum(r["impressions"] for r in v))
    else:
        print(k, v)
