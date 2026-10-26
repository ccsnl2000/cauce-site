# Lists visible Spanish text in src/draft.html that has no English line in the EN dictionary.
# Covers the page's HTML (not text built by scripts). Run: python3 tools/check_en.py
import pathlib, re, sys
from html.parser import HTMLParser
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / "src" / "draft.html").read_text(encoding="utf-8")
i = s.index("const EN = {"); j = s.index("\n  };", i)
keys = {m.group(2) for m in re.finditer(r"""(['"])((?:\\.|(?!\1).)*)\1\s*:\s*['"`]""", s[i:j])}
keys = {k.replace("\\'", "'").replace('\\"', '"') for k in keys}
SPANISH = re.compile(r"[áéíóúñ¿¡]|\b(el|la|los|las|de|del|que|para|con|por|una?|tu|tus|y)\b", re.I)
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.miss = []
    def handle_starttag(self, t, a):
        if t in ("script", "style"): self.skip += 1
        for k, v in a:
            if k in ("placeholder", "aria-label", "title") and v and SPANISH.search(v) and v.strip() not in keys: self.miss.append(v.strip())
    def handle_endtag(self, t):
        if t in ("script", "style"): self.skip -= 1
    def handle_data(self, d):
        t = d.strip()
        if not self.skip and t and SPANISH.search(t) and t not in keys: self.miss.append(t)
p = P(); p.feed(s)
miss = sorted(set(p.miss))
for m in miss: print("  sin inglés:", m[:110])
print(f"{len(miss)} textos sin traducción" if miss else "Todo el texto visible tiene inglés.")
sys.exit(0)
