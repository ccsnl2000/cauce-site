# Caracas Metro from OpenStreetMap → data/metro.json (lines with colour, stations with their lines).
# Runs on GitHub Actions (.github/workflows/metro.yml). Line names and colours fall back to the official ones.
import json, math, re, unicodedata, urllib.parse, urllib.request, pathlib

BBOX = "10.36,-67.10,10.56,-66.72"
Q = f"""[out:json][timeout:120];
(relation["route"="subway"]({BBOX}););out body;>;out skel qt;
node["railway"="station"]["station"="subway"]({BBOX});out body;"""
OFFICIAL = {
  "1": ("Línea 1", "#E2231A", "Propatria, Pérez Bonalde, Plaza Sucre, Gato Negro, Agua Salud, Caño Amarillo, Capitolio, La Hoyada, Parque Carabobo, Bellas Artes, Colegio de Ingenieros, Plaza Venezuela, Sabana Grande, Chacaíto, Chacao, Altamira, Miranda, Los Dos Caminos, Los Cortijos, La California, Petare, Palo Verde"),
  "2": ("Línea 2", "#00A04A", "El Silencio, Capuchinos, Maternidad, Artigas, La Paz, La Yaguara, Carapita, Antímano, Mamera, Caricuao, Zoológico, Ruiz Pineda, Las Adjuntas"),
  "3": ("Línea 3", "#0077C8", "Plaza Venezuela, Ciudad Universitaria, Los Símbolos, La Bandera, El Valle, Los Jardines, Coche, Mercado, La Rinconada"),
  "4": ("Línea 4", "#F2C200", "Zona Rental, Parque Central, Nuevo Circo, Teatros, Capuchinos"),
  "5": ("Línea 5", "#7B3F98", "Zona Rental, Bello Monte"),
}
ALIAS = {"parque del este": "miranda", "hugo chavez": "miranda", "el silencio": "capitolio"}
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()).replace("estacion ", "").strip()

def get():
    for host in ("https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"):
        try:
            req = urllib.request.Request(host, data=urllib.parse.urlencode({"data": Q}).encode(), headers={"User-Agent": "cauce.blog metro map"})
            return json.load(urllib.request.urlopen(req, timeout=180))
        except Exception as e:
            print(f"::warning::overpass failed at {host}: {type(e).__name__}: {e}")
    print("::error::Could not download Metro data from Overpass")
    raise SystemExit(1)

import traceback, sys
def fail(t, v, tb):
    print("::error::" + " | ".join(traceback.format_exception(t, v, tb)[-3:]).replace("\n", " "))
    sys.__excepthook__(t, v, tb)
sys.excepthook = fail
d = get()["elements"]
print(f"::notice::Overpass returned {len(d)} elements")
nodes = {e["id"]: (e["lon"], e["lat"]) for e in d if e["type"] == "node" and "lon" in e}
ways = {e["id"]: e["nodes"] for e in d if e["type"] == "way"}
lines = {}
for r in (e for e in d if e["type"] == "relation"):
    t = r.get("tags", {}); ref = (t.get("ref") or re.sub(r"\D", "", t.get("name", "")) or "?").strip()
    ref = re.sub(r"^L(ínea)?\s*", "", ref, flags=re.I)
    if ref not in OFFICIAL: continue          # Caracas lines only (Los Teques metro has its own system)
    segs = [[nodes[n] for n in ways[m["ref"]] if n in nodes] for m in r["members"] if m["type"] == "way" and m["ref"] in ways and m["role"] in ("", "route", "forward", "backward")]
    segs = [s for s in segs if len(s) > 1]
    if not segs: continue
    L = lines.setdefault(ref, {"ref": ref, "name": OFFICIAL[ref][0], "colour": t.get("colour") or OFFICIAL[ref][1], "segs": []})
    L["segs"] += segs                          # both directions overlap; harmless for drawing
stations = {}
for e in d:
    if e["type"] != "node" or e.get("tags", {}).get("railway") != "station": continue
    n = e["tags"].get("name:es") or e["tags"].get("name")
    if not n: continue
    k = ALIAS.get(norm(n), norm(n))
    on = [ref for ref, (_, _, st) in OFFICIAL.items() if k in [ALIAS.get(norm(x), norm(x)) for x in st.split(", ")]]
    if not on: continue
    stations.setdefault(k, {"name": re.sub(r"^Estación\s+", "", n), "lon": e["lon"], "lat": e["lat"], "lines": on})
out = {"source": "© OpenStreetMap contributors (ODbL)", "lines": [{"ref": v["ref"], "name": v["name"], "colour": v["colour"], "coords": [[[round(x, 5), round(y, 5)] for x, y in s] for s in v["segs"]]} for v in sorted(lines.values(), key=lambda v: v["ref"])],
       "stations": sorted(stations.values(), key=lambda s: s["name"])}
pathlib.Path("data/metro.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out["lines"]), "lines,", len(out["stations"]), "stations")
