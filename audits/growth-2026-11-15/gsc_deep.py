"""Second GSC pass (read-only). argv[1] = data dir. Uses pages.json + gsc.json and a few extra API calls."""
import json
import os
import re
import statistics as st
import sys
from collections import defaultdict
from datetime import date, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DATA = sys.argv[1]
PROP = "sc-domain:theautomationsguide.com"
HOST = "https://theautomationsguide.com"
TOKEN = os.path.expanduser("~/.gsc/token.json")
creds = Credentials.from_authorized_user_file(TOKEN, ["https://www.googleapis.com/auth/webmasters.readonly"])
if not creds.valid:
    creds.refresh(Request())
svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
g = json.load(open(os.path.join(DATA, "gsc.json"), encoding="utf-8"))
pages = json.load(open(os.path.join(DATA, "pages.json"), encoding="utf-8"))
END = date.fromisoformat(g["end"])
S28 = END - timedelta(days=27)


def q(start, end, dims, filters=None, limit=25000):
    body = {"startDate": str(start), "endDate": str(end), "dimensions": dims, "rowLimit": limit, "type": "web"}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return svc.searchanalytics().query(siteUrl=PROP, body=body).execute().get("rows", [])


# ---- 1. US-only page table, 28d and prev 28d
us = {r["keys"][0]: r for r in q(S28, END, ["page"], [{"dimension": "country", "operator": "equals", "expression": "usa"}])}
core = ["usa", "gbr", "can", "aus"]
eng = defaultdict(lambda: [0, 0])
for r in g["page_country_28"]:
    if r["keys"][1] in core:
        eng[r["keys"][0]][0] += r["clicks"]
        eng[r["keys"][0]][1] += r["impressions"]
print("=== SITE 28d: US page rows", len(us), "US impr", int(sum(r["impressions"] for r in us.values())), "US clicks", int(sum(r["clicks"] for r in us.values())))
tot = sum(r["impressions"] for r in g["country_28"])
print("share of impressions from USA/GBR/CAN/AUS:", round(sum(r["impressions"] for r in g["country_28"] if r["keys"][0] in core) / tot, 3),
      "| clicks:", int(sum(r["clicks"] for r in g["country_28"] if r["keys"][0] in core)), "of", int(sum(r["clicks"] for r in g["country_28"])))

# ---- 2. format table by exposure: posts published on or before END-14d; exposure days inside the 28d window
print("\n=== FORMAT, all posts aged >=14d, normalised by days live inside the window")
print("fmt | n | posts w/ click | clicks | US impr | clicks per 100 post-weeks | US impr per post-week | median pos (US rows)")
by = defaultdict(list)
for p in pages:
    if p["age"] is None or p["age"] < 14:
        continue
    exp = min(28, p["age"] + 1)
    u = us.get(p["url"], {"impressions": 0, "clicks": 0, "position": None})
    by[p["fmt"]].append((p, exp, u))
for f, rs in sorted(by.items(), key=lambda x: -sum(r[0]["c28"] for r in x[1])):
    weeks = sum(e for _, e, _ in rs) / 7
    cl = sum(p["c28"] for p, _, _ in rs)
    ui = sum(u["impressions"] for _, _, u in rs)
    pos = [u["position"] for _, _, u in rs if u["position"]]
    print(f"{f:13s} {len(rs):3d} | {sum(1 for p, _, _ in rs if p['c28'] > 0):2d} | {cl:3.0f} | {ui:6.0f} | {100 * cl / weeks:5.1f} | {ui / weeks:5.1f} | {st.median(pos) if pos else 0:5.1f}")
print("same, EXCLUDING the MoltSets review:")
for f, rs in sorted(by.items(), key=lambda x: -sum(r[0]["c28"] for r in x[1])):
    rs = [r for r in rs if "is-moltsets-legit" not in r[0]["slug"]]
    weeks = sum(e for _, e, _ in rs) / 7
    cl = sum(p["c28"] for p, _, _ in rs)
    print(f"{f:13s} {len(rs):3d} | clicks {cl:3.0f} | per 100 post-weeks {100 * cl / weeks:5.1f}")

# ---- 3. anchor-tool table: first tool named in the title
def anchor(title):
    t = re.split(r"\s+(?:vs\.?|versus|:|pricing|review|alternatives|for|to|in 2026|integration|automat)", title, flags=re.I)[0]
    t = re.sub(r"^(is|what|does|connect|migrate from|migrating from|best|how to|switch from)\s+", "", t.strip(), flags=re.I)
    return t.strip().lower()[:24]


an = defaultdict(list)
for p in pages:
    an[anchor(p["title"])].append(p)
print("\n=== ANCHOR TOOL (first tool in title), >=3 posts or any clicks: anchor | posts | clicks28 | clicks90 | US impr 28")
for a, rs in sorted(an.items(), key=lambda x: (-sum(r["c28"] for r in x[1]), -len(x[1]))):
    cl = sum(r["c28"] for r in rs)
    if cl > 0 or len(rs) >= 4:
        print(f"{a:26s} {len(rs):3d} | {cl:3.0f} | {sum(r['c90'] for r in rs):3.0f} | {sum(r['us_i28'] for r in rs):6.0f}")

# ---- 4. any-tool mention table: clicks of posts whose title names the tool
names = ["pipedrive", "moltsets", "nutshell", "hubspot", "apollo", "clay", "lemlist", "instantly", "smartlead", "kit", "beehiiv", "lusha",
         "rb2b", "surfe", "attio", "make", "n8n", "zapier", "salesforce", "brevo", "activecampaign", "close", "justcall", "aircall",
         "pabbly", "motion", "nooks", "orum", "gong", "warmly", "findymail", "prospeo", "bland", "pandadoc", "reply.io", "getresponse"]
print("\n=== TITLE MENTIONS: tool | posts | clicks28 | clicks90 | US impr28 | posts w/ click")
tm = []
for n in names:
    rs = [p for p in pages if re.search(r"\b" + re.escape(n) + r"\b", p["title"], re.I)]
    tm.append((n, len(rs), sum(r["c28"] for r in rs), sum(r["c90"] for r in rs), sum(r["us_i28"] for r in rs), sum(1 for r in rs if r["c28"] > 0)))
for row in sorted(tm, key=lambda x: -x[2]):
    print(f"{row[0]:15s} {row[1]:3d} | {row[2]:3.0f} | {row[3]:3.0f} | {row[4]:6.0f} | {row[5]}")

# ---- 5. tracker-style queries: long question prompts
def is_prompt(qs):
    return len(qs.split()) >= 7 or qs.endswith("?")


pi = sum(r["impressions"] for r in g["query_28"] if is_prompt(r["keys"][0]))
pc = sum(r["clicks"] for r in g["query_28"] if is_prompt(r["keys"][0]))
ti = sum(r["impressions"] for r in g["query_28"])
print(f"\n=== PROMPT-STYLE QUERIES (>=7 words or ends '?'): {sum(1 for r in g['query_28'] if is_prompt(r['keys'][0]))} of {len(g['query_28'])} queries, "
      f"{pi:.0f} of {ti:.0f} query impressions ({pi / ti:.0%}), {pc:.0f} clicks")
sitei = sum(r["impressions"] for r in g["query_28"] if "theautomationsguide" in r["keys"][0])
print(f"domain-name queries: {sitei:.0f} impressions")

# ---- 6. daily series for the winners + W45 spike
def daily(page, start):
    rows = q(start, END, ["date"], [{"dimension": "page", "operator": "equals", "expression": page}])
    return [(r["keys"][0][5:], int(r["clicks"]), int(r["impressions"]), round(r["position"], 1)) for r in rows]


for slug in ["2026-10-13-is-moltsets-legit-an-honest-review-of-the-27-contact-data-api", "2026-06-25-nutshell-vs-pipedrive-vs-close-best-affordable-sales-crm",
             "2026-10-26-pipedrive-for-marketing-teams-what-works-and-what-doesnt"]:
    match = [p for p in pages if p["slug"].startswith(slug[:40])]
    if not match:
        print("no match", slug)
        continue
    print(f"\n=== DAILY {match[0]['slug'][:60]} (date, clicks, impr, pos)")
    print(daily(match[0]["url"], END - timedelta(days=34)))

print("\n=== W45 (11/02-11/08) vs W44 (10/26-11/01): top pages by impression gain")
a = {r["keys"][0]: r for r in q(date(2026, 11, 2), date(2026, 11, 8), ["page"])}
b = {r["keys"][0]: r for r in q(date(2026, 10, 26), date(2026, 11, 1), ["page"])}
gain = sorted(((u, r["impressions"] - b.get(u, {"impressions": 0})["impressions"], r) for u, r in a.items()), key=lambda x: -x[1])[:12]
for u, d, r in gain:
    print(f"+{d:5.0f} (now {r['impressions']:5.0f}, clicks {r['clicks']:2.0f}) {u.replace(HOST, '')[:80]}")
print("W45 by country top 6:", [(r["keys"][0], int(r["impressions"]), int(r["clicks"])) for r in sorted(q(date(2026, 11, 2), date(2026, 11, 8), ["country"]), key=lambda r: -r["impressions"])[:6]])
print("W45 'moltsets' queries:", [(r["keys"][0], int(r["impressions"]), int(r["clicks"])) for r in sorted(q(date(2026, 11, 2), date(2026, 11, 8), ["query"], [{"dimension": "query", "operator": "contains", "expression": "molt"}]), key=lambda r: -r["impressions"])[:8]])

# ---- 7. Nutshell hub read (TODO: title + meta changed 10/13; baseline 28d to 10/10 = 358 impr, 0 clicks)
hub = HOST + "/tools/nutshell/"
f = [{"dimension": "page", "operator": "equals", "expression": hub}]
print("\n=== NUTSHELL HUB 28d to", END)
print("total:", [(int(r["clicks"]), int(r["impressions"]), round(r["position"], 1)) for r in q(S28, END, [], f)])
print("by country:", [(r["keys"][0], int(r["impressions"]), int(r["clicks"])) for r in sorted(q(S28, END, ["country"], f), key=lambda r: -r["impressions"])[:6]])
print("by query:", [(r["keys"][0], int(r["impressions"]), int(r["clicks"]), round(r["position"], 1)) for r in sorted(q(S28, END, ["query"], f), key=lambda r: -r["impressions"])[:6]])
for h in ["/tools/fullenrich/", "/tools/moltsets/", "/tools/appy-ai/", "/tools/justcall/", "/tools/rb2b/"]:
    f = [{"dimension": "page", "operator": "equals", "expression": HOST + h}]
    t = q(S28, END, [], f)
    c = sorted(q(S28, END, ["country"], f), key=lambda r: -r["impressions"])[:3]
    qq = sorted(q(S28, END, ["query"], f), key=lambda r: -r["impressions"])[:3]
    print(h, [(int(r["clicks"]), int(r["impressions"]), round(r["position"], 1)) for r in t], [(r["keys"][0], int(r["impressions"])) for r in c],
          [(r["keys"][0], int(r["impressions"]), round(r["position"], 1)) for r in qq])

# ---- 8. US-only striking distance at query level (real demand shortlist)
print("\n=== US-ONLY page+query, pos 3-20, US impr >= 25 (28d)")
rows = q(S28, END, ["page", "query"], [{"dimension": "country", "operator": "equals", "expression": "usa"}])
for r in sorted(rows, key=lambda r: -r["impressions"]):
    if 3 <= r["position"] <= 20 and r["impressions"] >= 25 and "theautomationsguide" not in r["keys"][1]:
        print(f"i{r['impressions']:4.0f} c{r['clicks']:2.0f} pos {r['position']:4.1f} {r['keys'][0].replace(HOST, '')[:62]} | {r['keys'][1][:70]}")
print("\n=== US-ONLY top queries by impressions (28d), top 45")
rows = q(S28, END, ["query"], [{"dimension": "country", "operator": "equals", "expression": "usa"}])
for r in sorted(rows, key=lambda r: -r["impressions"])[:45]:
    print(f"i{r['impressions']:4.0f} c{r['clicks']:2.0f} pos {r['position']:4.1f} {r['keys'][0][:90]}")
