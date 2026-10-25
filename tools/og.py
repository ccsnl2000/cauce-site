# Builds og.png (1200x630 share image) from the site fonts. Run once; commit og.png.
import pathlib, io
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
R = pathlib.Path(__file__).resolve().parent.parent
def font(w, size):
    f = TTFont(R / f"fonts/hnd-{w}.woff2"); f.flavor = None; b = io.BytesIO(); f.save(b); b.seek(0)
    return ImageFont.truetype(b, size)
W, H, INK, BG, SOFT = 1200, 630, "#1B1A18", "#F1EEE9", "#77736C"
im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
d.ellipse((80, 80, 160, 160), fill=INK)
d.text((120, 121), "c", font=font(800, 52), fill=BG, anchor="mm")
d.text((76, 330), "cauce", font=font(800, 190), fill=INK, anchor="ls")
d.text((84, 420), "Datos inmobiliarios con fuente.", font=font(400, 48), fill=INK, anchor="ls")
d.text((84, 550), "cauce.blog  ·  Boletín cada jueves", font=font(400, 30), fill=SOFT, anchor="ls")
im.save(R / "og.png", optimize=True)
