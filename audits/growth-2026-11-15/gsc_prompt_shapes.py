"""Read-only: how question-shaped and long queries perform, from the gsc.json dump. argv[1] = data dir."""
import json
import os
import sys

g = json.load(open(os.path.join(sys.argv[1], "gsc.json"), encoding="utf-8"))
rows = g["query_28"]


def shape(q):
    n = len(q.split())
    if q.strip().endswith("?"):
        return "ends with ?"
    if n >= 10:
        return "10+ words"
    if n >= 7:
        return "7 to 9 words"
    return "under 7 words"


agg = {}
for r in rows:
    a = agg.setdefault(shape(r["keys"][0]), [0, 0, 0, []])
    a[0] += 1
    a[1] += r["impressions"]
    a[2] += r["clicks"]
    if r["clicks"]:
        a[3].append((r["keys"][0], int(r["clicks"])))
for k, a in agg.items():
    print(f"{k:14s} queries {a[0]:5d} impressions {a[1]:6.0f} clicks {a[2]:3.0f} clicked: {a[3] if k != 'under 7 words' else len(a[3])}")
