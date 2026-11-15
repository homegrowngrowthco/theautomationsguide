"""Join the GSC dump to post frontmatter. argv[1] = data dir, argv[2] = blog dir. Prints a report, writes pages.json."""
import json
import os
import re
import statistics as st
import sys
from collections import defaultdict
from datetime import date, datetime

DATA, BLOG = sys.argv[1], sys.argv[2]
g = json.load(open(os.path.join(DATA, "gsc.json"), encoding="utf-8"))
END = date.fromisoformat(g["end"])
HOST = "https://theautomationsguide.com"


def fmt_of(title, slug):
    t = title.lower()
    if re.search(r"\balternatives?\b|\bcompetitors?\b", t):
        return "alternatives"
    if re.search(r"\bmigrat|\bswitch(ing)? from\b|\bmove from\b| to .* migration", t):
        return "migration"
    if re.search(r"\bpricing\b|\bcosts?\b|\bprice\b|promo code|discount|free tier|free plan", t):
        return "pricing"
    if re.search(r"\breviews?\b|worth it|honest take", t):
        return "review"
    if re.search(r"\bvs\.?\b|\bversus\b|compared", t):
        return "comparison"
    if re.search(r"\bhow to\b|\bsetup\b|\bset up\b|\bguide\b|playbook|\bautomate\b|\bintegrat|\bconnect\b|step.by.step|tutorial|workflow", t):
        return "how-to"
    if re.search(r"\bbest\b|\btop \d|\bstack\b", t):
        return "best-of"
    return "other"


posts = {}
for fn in os.listdir(BLOG):
    if not fn.endswith(".mdx"):
        continue
    txt = open(os.path.join(BLOG, fn), encoding="utf-8").read()
    fm = txt.split("---", 2)[1] if txt.startswith("---") else ""
    m = re.search(r'^title:\s*["\']?(.*?)["\']?\s*$', fm, re.M)
    d = re.search(r"^pubDate:\s*(\S+)", fm, re.M)
    tg = re.search(r"^tags:\s*\[(.*?)\]", fm, re.M)
    slug = fn[:-4]
    title = m.group(1) if m else slug
    pub = None
    if d:
        try:
            pub = datetime.fromisoformat(d.group(1).strip("\"'")[:10]).date()
        except ValueError:
            pass
    tags = [x.strip().strip("\"'") for x in tg.group(1).split(",")] if tg else []
    gos = sorted(set(re.findall(r"/go/([a-z0-9-]+)", txt)))
    posts[f"{HOST}/blog/{slug}/"] = {"slug": slug, "title": title, "pub": pub, "tags": tags,
                                    "fmt": fmt_of(title, slug), "go": gos, "words": len(txt.split())}


def idx(rows):
    return {r["keys"][0]: r for r in rows}


p28, pprev, p90 = idx(g["page_28"]), idx(g["page_prev28"]), idx(g["page_90"])
us28 = defaultdict(float)
tot28c = defaultdict(float)
for r in g["page_country_28"]:
    tot28c[r["keys"][0]] += r["impressions"]
    if r["keys"][1] == "usa":
        us28[r["keys"][0]] += r["impressions"]
topq = {}
for r in sorted(g["page_query_28"], key=lambda r: -r["impressions"]):
    topq.setdefault(r["keys"][0], (r["keys"][1], r["impressions"], round(r["position"], 1), r["clicks"]))

print("=== WINDOWS", g["win28"], "prev", g["prev28"])
# ---- weekly trend
wk = defaultdict(lambda: [0, 0])
for r in g["by_date_180"]:
    d = date.fromisoformat(r["keys"][0])
    k = d.isocalendar()
    wk[(k[0], k[1])][0] += r["clicks"]
    wk[(k[0], k[1])][1] += r["impressions"]
usw = defaultdict(lambda: [0, 0])
cw = defaultdict(lambda: defaultdict(float))
for r in g["by_date_country_90"]:
    d = date.fromisoformat(r["keys"][0])
    k = d.isocalendar()
    cw[(k[0], k[1])][r["keys"][1]] += r["impressions"]
    if r["keys"][1] == "usa":
        usw[(k[0], k[1])][0] += r["clicks"]
        usw[(k[0], k[1])][1] += r["impressions"]
print("\n=== WEEKLY (iso week: clicks, impressions | US clicks, US impr | top non-US country)")
for k in sorted(wk):
    top = sorted(cw[k].items(), key=lambda x: -x[1])[:3] if k in cw else []
    print(f"{k[0]}-W{k[1]:02d}  {wk[k][0]:4.0f} {wk[k][1]:7.0f} | {usw[k][0]:3.0f} {usw[k][1]:6.0f} | {[(c, int(v)) for c, v in top]}")

print("\n=== COUNTRY 28d top 12")
for r in sorted(g["country_28"], key=lambda r: -r["impressions"])[:12]:
    print(f"{r['keys'][0]:5s} impr {r['impressions']:6.0f} clicks {r['clicks']:3.0f} pos {r['position']:.1f}")
print("device", [(r["keys"][0], int(r["impressions"]), int(r["clicks"])) for r in g["device_28"]])

# ---- page type split
def ptype(u):
    p = u.replace(HOST, "")
    if p.startswith("/blog/") and p != "/blog/":
        return "post"
    if p.startswith("/tools/") and p != "/tools/":
        return "hub"
    if "pricing" in p:
        return "pricing-index"
    return "other"


print("\n=== PAGE TYPE 28d vs prev (pages w/ impr, impr, clicks)")
for label, src in (("28d", p28), ("prev", pprev)):
    agg = defaultdict(lambda: [0, 0, 0])
    for u, r in src.items():
        a = agg[ptype(u)]
        a[0] += 1
        a[1] += r["impressions"]
        a[2] += r["clicks"]
    print(label, {k: [int(x) for x in v] for k, v in agg.items()})

# ---- per-post table
rows = []
for u, p in posts.items():
    r = p28.get(u, {"clicks": 0, "impressions": 0, "position": None})
    rp = pprev.get(u, {"clicks": 0, "impressions": 0})
    r9 = p90.get(u, {"clicks": 0, "impressions": 0})
    age = (END - p["pub"]).days if p["pub"] else None
    usshare = (us28[u] / tot28c[u]) if tot28c[u] else None
    rows.append({**p, "url": u, "pub": str(p["pub"]), "age": age, "c28": r["clicks"], "i28": r["impressions"],
                 "pos28": r["position"], "cprev": rp["clicks"], "iprev": rp["impressions"], "c90": r9["clicks"],
                 "i90": r9["impressions"], "us_share": usshare, "us_i28": us28[u], "topq": topq.get(u)})
json.dump(rows, open(os.path.join(DATA, "pages.json"), "w", encoding="utf-8"), default=str)

print(f"\n=== POSTS {len(rows)}; with impressions 28d: {sum(1 for r in rows if r['i28'] > 0)}; with clicks 28d: {sum(1 for r in rows if r['c28'] > 0)}")

# format table: posts aged >= 28 days at END, so every post had the full window
print("\n=== FORMAT (posts aged >=28d): n | with impr | median i28 | mean i28 | mean US i28 | clicks 28 | clicks 90 | median pos | clicks per 100 posts")
by = defaultdict(list)
for r in rows:
    if r["age"] is not None and r["age"] >= 28:
        by[r["fmt"]].append(r)
for f, rs in sorted(by.items(), key=lambda x: -sum(r["c28"] for r in x[1])):
    imp = [r["i28"] for r in rs]
    pos = [r["pos28"] for r in rs if r["pos28"]]
    print(f"{f:13s} {len(rs):3d} | {sum(1 for i in imp if i > 0):3d} | {st.median(imp):6.0f} | {st.mean(imp):6.0f} | {st.mean([r['us_i28'] for r in rs]):6.0f} | "
          f"{sum(r['c28'] for r in rs):4.0f} | {sum(r['c90'] for r in rs):4.0f} | {st.median(pos) if pos else 0:5.1f} | {100 * sum(r['c28'] for r in rs) / len(rs):5.1f}")

print("\n=== FORMAT by publish cohort (all posts): fmt | n published since 09-15 | n before")
for f in by:
    n_new = sum(1 for r in rows if r["fmt"] == f and r["pub"] >= "2026-09-15")
    n_old = sum(1 for r in rows if r["fmt"] == f and r["pub"] < "2026-09-15")
    print(f"{f:13s} {n_new:3d} {n_old:3d}")

print("\n=== PUBLISH MONTH cohort: month | n | with i28>0 | with i28>=50 | clicks28 | median i28")
bm = defaultdict(list)
for r in rows:
    bm[r["pub"][:7]].append(r)
for m in sorted(bm):
    rs = bm[m]
    print(f"{m} {len(rs):3d} | {sum(1 for r in rs if r['i28'] > 0):3d} | {sum(1 for r in rs if r['i28'] >= 50):3d} | {sum(r['c28'] for r in rs):3.0f} | {st.median([r['i28'] for r in rs]):5.0f}")

print("\n=== TOP 25 POSTS BY CLICKS 28d (clicks, prev clicks, impr, pos, US share, fmt, pub, title | top query)")
for r in sorted(rows, key=lambda r: (-r["c28"], -r["i28"]))[:25]:
    us = f"{r['us_share']:.0%}" if r["us_share"] is not None else "-"
    print(f"{r['c28']:3.0f} {r['cprev']:3.0f} {r['i28']:5.0f} {r['pos28'] or 0:5.1f} {us:>4s} {r['fmt']:11s} {r['pub']} {r['title'][:62]} | {r['topq']}")

print("\n=== TOP 25 POSTS BY IMPRESSIONS 28d")
for r in sorted(rows, key=lambda r: -r["i28"])[:25]:
    us = f"{r['us_share']:.0%}" if r["us_share"] is not None else "-"
    print(f"{r['i28']:5.0f} (prev {r['iprev']:5.0f}) c{r['c28']:2.0f} pos {r['pos28'] or 0:5.1f} US {us:>4s} {r['fmt']:11s} {r['pub']} {r['title'][:58]} | {r['topq']}")

print("\n=== NON-POST PAGES top 20 by impressions 28d")
others = [(u, r) for u, r in p28.items() if u not in posts]
for u, r in sorted(others, key=lambda x: -x[1]["impressions"])[:20]:
    us = us28[u] / tot28c[u] if tot28c[u] else 0
    print(f"{r['impressions']:5.0f} c{r['clicks']:3.0f} pos {r['position']:5.1f} US {us:.0%} {u.replace(HOST, '')} | {topq.get(u)}")

# tool-level: clicks and impressions of posts linking each /go/ slug
print("\n=== TAG THEMES (posts aged>=28d): tag | n | clicks28 | mean i28 | clicks/post")
tg = defaultdict(list)
for r in rows:
    if r["age"] is not None and r["age"] >= 28:
        for t in r["tags"]:
            tg[t].append(r)
for t, rs in sorted(tg.items(), key=lambda x: -sum(r["c28"] for r in x[1]))[:40]:
    if len(rs) >= 3:
        print(f"{t:28s} {len(rs):3d} | {sum(r['c28'] for r in rs):3.0f} | {st.mean([r['i28'] for r in rs]):6.0f} | {sum(r['c28'] for r in rs) / len(rs):.2f}")

# query classes
def qclass(q):
    if "theautomationsguide" in q or "automations guide" in q:
        return "brand"
    if re.search(r"\bvs\b|versus|compar", q):
        return "vs"
    if re.search(r"pricing|price|cost|free|promo|discount|coupon|plans?\b", q):
        return "pricing"
    if re.search(r"alternativ|competitor", q):
        return "alternatives"
    if re.search(r"review|worth|legit|is .* good", q):
        return "review"
    if re.search(r"how to|integrat|setup|set up|migrat|connect|automat|workflow|template", q):
        return "how-to"
    return "other/nav"


print("\n=== QUERY CLASS 28d vs prev: class | queries | impr | clicks | CTR || prev impr | prev clicks")
qa = defaultdict(lambda: [0, 0, 0])
qb = defaultdict(lambda: [0, 0, 0])
for r in g["query_28"]:
    a = qa[qclass(r["keys"][0])]
    a[0] += 1; a[1] += r["impressions"]; a[2] += r["clicks"]
for r in g["query_prev28"]:
    a = qb[qclass(r["keys"][0])]
    a[0] += 1; a[1] += r["impressions"]; a[2] += r["clicks"]
for k, a in sorted(qa.items(), key=lambda x: -x[1][1]):
    print(f"{k:13s} {a[0]:5d} | {a[1]:6.0f} | {a[2]:3.0f} | {100 * a[2] / a[1]:.2f}% || {qb[k][1]:6.0f} | {qb[k][2]:3.0f}")

print("\n=== TOP 40 QUERIES BY CLICKS then impressions 28d")
for r in sorted(g["query_28"], key=lambda r: (-r["clicks"], -r["impressions"]))[:40]:
    print(f"c{r['clicks']:2.0f} i{r['impressions']:5.0f} pos {r['position']:5.1f} {r['keys'][0]}")

print("\n=== STRIKING DISTANCE: page+query, pos 4-15, impr>=40 (28d), US share of page shown")
for r in sorted(g["page_query_28"], key=lambda r: -r["impressions"]):
    if 4 <= r["position"] <= 15 and r["impressions"] >= 40:
        u = r["keys"][0]
        us = us28[u] / tot28c[u] if tot28c[u] else 0
        print(f"i{r['impressions']:5.0f} c{r['clicks']:2.0f} pos {r['position']:4.1f} US {us:.0%} {u.replace(HOST, '')[:70]} | {r['keys'][1]}")
