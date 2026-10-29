# Parish boundaries for the other cities on the map → data/zonas-<city>.json (same shape as data/caracas-parroquias.json).
# Runs on GitHub Actions (.github/workflows/zonas.yml). Source: venezuela360 Hosted/Parroquias (estado, municipio, parroquia).
# If venezuela360 can't be read, falls back to geoBoundaries VEN ADM2 (municipalities only). Never invents geometry.
import json, sys, time, unicodedata, urllib.parse, urllib.request, pathlib

V360 = "https://venezuela360.org/server/rest/services/Hosted/Parroquias/FeatureServer/0/query"
GB = "https://www.geoboundaries.org/api/current/gbOpen/VEN/ADM2/"
CITIES = {
    # Margarita: the whole state of Nueva Esparta (11 municipalities, includes Coche and Cubagua)
    "margarita": {"bbox": [-64.45, 10.68, -63.75, 11.20], "estado": "nueva esparta", "municipios": None},
    # Lechería and its conurbation: Urbaneja (Lechería, El Morro), Sotillo (Puerto La Cruz), Guanta, Simón Bolívar (Barcelona)
    "lecheria": {"bbox": [-64.80, 10.00, -64.50, 10.30], "estado": "anzoategui",
                 "municipios": ["urbaneja", "sotillo", "guanta", "bolivar"]},
}

def norm(s):
    return "".join(c for c in unicodedata.normalize("NFKD", str(s or "").lower()) if not unicodedata.combining(c)).strip()

def tc(s):
    small = {"de", "del", "la", "las", "los", "y", "el"}
    w = str(s or "").lower().split()
    return " ".join(x if (i and x in small) else x[:1].upper() + x[1:] for i, x in enumerate(w))

def get(url, tries=3):
    err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "cauce.blog boundaries (hola@cauce.blog)"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            err = e; time.sleep(2 + 3 * i)
    raise RuntimeError(f"{url[:80]}… {err}")

def rings(g):
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    return [[[round(x, 6), round(y, 6)] for x, y in p[0]] for p in polys if p and len(p[0]) > 3]

def from_v360(cfg):
    a, b, c, d = cfg["bbox"]
    q = {"where": "1=1", "geometry": f"{a},{b},{c},{d}", "geometryType": "esriGeometryEnvelope", "inSR": 4326,
         "spatialRel": "esriSpatialRelIntersects", "outFields": "parroquia,municipio,estado", "returnGeometry": "true",
         "outSR": 4326, "geometryPrecision": 6, "maxAllowableOffset": 0.00003, "f": "geojson"}
    j = get(V360 + "?" + urllib.parse.urlencode(q))
    out = []
    for f in j.get("features", []):
        p = f.get("properties") or {}
        if cfg["estado"] not in norm(p.get("estado")): continue
        if cfg["municipios"] and not any(m in norm(p.get("municipio")) for m in cfg["municipios"]): continue
        if not f.get("geometry"): continue
        out.append({"n": tc(p.get("parroquia")), "m": tc(p.get("municipio")), "c": rings(f["geometry"])})
    return out

def from_gb(cfg):
    meta = get(GB)
    j = get(meta.get("simplifiedGeometryGeoJSON") or meta["gjDownloadURL"])
    a, b, c, d = cfg["bbox"]; out = []
    for f in j["features"]:
        rs = rings(f["geometry"]); pts = [pt for r in rs for pt in r]
        x = sum(p[0] for p in pts) / len(pts); y = sum(p[1] for p in pts) / len(pts)
        if a <= x <= c and b <= y <= d:
            n = tc(f["properties"].get("shapeName")); out.append({"n": n, "m": n, "c": rs})
    return out

def main():
    root = pathlib.Path(__file__).resolve().parent.parent / "data"
    failed = False
    for key, cfg in CITIES.items():
        src, p = "Límites: parroquias, venezuela360.", []
        try: p = from_v360(cfg)
        except Exception as e: print(key, "venezuela360 failed:", e, file=sys.stderr)
        if len(p) < 3:
            try: p, src = from_gb(cfg), "Límites: municipios, geoBoundaries (gbOpen)."
            except Exception as e: print(key, "geoBoundaries failed:", e, file=sys.stderr)
        if len(p) < 2:
            failed = True; print(key, "no boundaries; keeping the previous file", file=sys.stderr); continue
        p.sort(key=lambda z: (z["m"], z["n"]))
        (root / f"zonas-{key}.json").write_text(json.dumps({"src": src, "bbox": cfg["bbox"], "p": p}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(key, len(p), "zones,", len({z["m"] for z in p}), "municipalities:", sorted({z["m"] for z in p}))
    if failed: sys.exit(1)

if __name__ == "__main__":
    main()
