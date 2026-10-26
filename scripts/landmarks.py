# Notable places in Caracas from OpenStreetMap → data/landmarks.json, one category each, to switch on and off on the map.
# Runs on GitHub Actions (.github/workflows/landmarks.yml). "Notable" = the feature has a Wikidata entry, plus every embassy and mall.
# Later categories (schools, supermarkets, pharmacies) can be added to CATS with notable=False to measure access from a parish or a property.
import json, urllib.parse, urllib.request, pathlib, sys

BBOX = "10.38,-67.08,10.56,-66.74"
# category: (label, [overpass selectors], notable_only)
CATS = {
  "cultura":     ("Cultura", ['nwr["tourism"="museum"]', 'nwr["amenity"="theatre"]', 'nwr["amenity"="arts_centre"]', 'nwr["amenity"="concert_hall"]'], True),
  "hitos":       ("Hitos", ['nwr["tourism"="attraction"]', 'nwr["historic"]', 'nwr["building"]["wikidata"]', 'nwr["man_made"="tower"]["wikidata"]'], True),
  "educacion":   ("Universidades", ['nwr["amenity"="university"]', 'nwr["amenity"="college"]'], True),
  "diplomatico": ("Embajadas", ['nwr["office"="diplomatic"]', 'nwr["amenity"="embassy"]', 'nwr["diplomatic"]'], False),
  "gobierno":    ("Gobierno", ['nwr["amenity"="townhall"]', 'nwr["office"="government"]', 'nwr["government"]'], True),
  "salud":       ("Hospitales y clínicas", ['nwr["amenity"="hospital"]', 'nwr["amenity"="clinic"]["wikidata"]'], True),
  "parques":     ("Parques", ['nwr["leisure"="park"]', 'nwr["leisure"="nature_reserve"]', 'nwr["boundary"="national_park"]'], True),
  "comercio":    ("Centros comerciales", ['nwr["shop"="mall"]'], False),
  "deporte":     ("Estadios", ['nwr["leisure"="stadium"]', 'nwr["leisure"="sports_centre"]["wikidata"]'], True),
  "religion":    ("Templos", ['nwr["amenity"="place_of_worship"]["wikidata"]'], True),
}

def query():
    parts = []
    for k, (_, sels, notable) in CATS.items():
        for s in sels:
            parts.append(f'{s}["name"]{"[wikidata]" if notable and "[wikidata]" not in s and "embassy" not in s else ""}({BBOX});')
    return "[out:json][timeout:180];(" + "".join(parts) + ");out center tags;"

def get(q):
    for host in ("https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"):
        try:
            req = urllib.request.Request(host, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "cauce.blog landmarks"})
            return json.load(urllib.request.urlopen(req, timeout=240))["elements"]
        except Exception as e:
            print(f"::warning::overpass failed at {host}: {type(e).__name__}: {e}")
    print("::error::Could not download landmarks from Overpass"); sys.exit(1)

def cat_of(t):
    g = t.get
    if g("office") == "diplomatic" or g("amenity") == "embassy" or g("diplomatic"): return "diplomatico"
    if g("shop") == "mall": return "comercio"
    if g("amenity") in ("university", "college"): return "educacion"
    if g("amenity") in ("hospital", "clinic"): return "salud"
    if g("leisure") in ("stadium", "sports_centre"): return "deporte"
    if g("amenity") in ("theatre", "arts_centre", "concert_hall") or g("tourism") == "museum": return "cultura"
    if g("amenity") == "place_of_worship": return "religion"
    if g("leisure") in ("park", "nature_reserve") or g("boundary") == "national_park": return "parques"
    if g("amenity") == "townhall" or g("office") == "government" or g("government"): return "gobierno"
    return "hitos"

els = get(query())
print(f"::notice::Overpass returned {len(els)} elements")
seen, out = set(), []
for e in els:
    t = e.get("tags", {}); n = (t.get("name:es") or t.get("name") or "").strip()
    lon, lat = (e.get("lon"), e.get("lat")) if "lon" in e else (e.get("center", {}).get("lon"), e.get("center", {}).get("lat"))
    if not n or lon is None: continue
    key = n.lower()
    if key in seen: continue
    seen.add(key)
    out.append({"n": n, "c": cat_of(t), "x": round(lon, 5), "y": round(lat, 5), **({"w": t["wikidata"]} if t.get("wikidata") else {})})
out.sort(key=lambda p: (p["c"], p["n"]))
res = {"cats": {k: v[0] for k, v in CATS.items()}, "places": out}
p = pathlib.Path(__file__).resolve().parent.parent / "data" / "landmarks.json"
p.write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
from collections import Counter
print("::notice::" + ", ".join(f"{k}: {v}" for k, v in Counter(x["c"] for x in out).items()))
