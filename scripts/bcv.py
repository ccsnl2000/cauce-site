"""Fetch the official BCV reference rate (USD) from bcv.org.ve and write data/bcv.json.

Runs once a day from .github/workflows/bcv.yml. If the page can't be read or the
value looks wrong, it exits without touching the file, so the site keeps the last
good rate and its date.
"""
import datetime, json, pathlib, re, ssl, sys, urllib.request

URL = "https://www.bcv.org.ve/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "bcv.json"


def fetch(verify=True):
    ctx = ssl.create_default_context()
    if not verify:  # bcv.org.ve often serves an incomplete certificate chain
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (cauce.blog; tasa diaria)"})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def main():
    try:
        html = fetch(True)
    except Exception as e:  # noqa: BLE001
        print("Verified TLS failed, retrying without verification:", e)
        html = fetch(False)
    m = re.search(r'id="dolar".*?<strong>\s*([\d.,]+)\s*</strong>', html, re.S)
    if not m:
        sys.exit("USD value not found on the BCV page; leaving data/bcv.json as it is.")
    usd = float(m.group(1).replace(".", "").replace(",", "."))
    d = re.search(r'Fecha Valor.*?content="(\d{4}-\d{2}-\d{2})', html, re.S)
    date = d.group(1) if d else datetime.date.today().isoformat()
    prev = json.loads(OUT.read_text()) if OUT.exists() else None
    if usd <= 0 or (prev and prev.get("usd") and abs(usd / prev["usd"] - 1) > 0.5):
        sys.exit(f"Implausible value {usd}; leaving data/bcv.json as it is.")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "usd": round(usd, 4), "date": date,
        "source": "Banco Central de Venezuela, tipo de cambio de referencia (bcv.org.ve)",
        "fetched": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    }, ensure_ascii=False, indent=2) + "\n")
    print("BCV", usd, date)


if __name__ == "__main__":
    main()
