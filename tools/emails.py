# Cauce email templates: one master layout + blocks, in Spanish and English.
# Run: python3 tools/emails.py
#   → emails/*.html. They are published with the site, and the Supabase functions fetch them
#     from https://cauce.blog/emails/<name>-<lang>.html when sending, so a design change only needs a push.
# Look: same as Mi cuenta. Paper page, sheet card, tight bold headline, small caps labels,
# a bordered inner card and arrow rows. Wordmark only (the "c" circle is just the site icon).
# Placeholders filled when sending: {{saludo}} {{fecha}} {{unsub}}.
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
INK, SOFT, LINE, PAPER, SHEET, FILL = "#1B1A18", "#6B675F", "#DCD6CC", "#F1EEE9", "#FAF8F5", "#E7E2DA"
FONT = "'HND','Helvetica Neue',Helvetica,Arial,sans-serif"
SITE = "https://cauce.blog"

def lab(t, color=SOFT):
    return f'<span style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:{color}">{t}</span>'

def head(label):
    return f'''<tr><td style="padding:0 0 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><a href="{SITE}" style="text-decoration:none;font-size:22px;font-weight:800;letter-spacing:-1px;color:{INK}">cauce</a></td>
<td align="right" valign="middle">{lab(label)}</td></tr></table></td></tr>'''

def hello(title, sub=None):
    s = f'<p style="margin:12px 0 0;font-size:17px;line-height:1.5;color:{SOFT}">{sub}</p>' if sub else ""
    return f'<tr><td style="padding:0 0 28px"><h1 style="margin:0;font-size:40px;line-height:1.02;font-weight:800;letter-spacing:-1.8px;color:{INK}">{title}</h1>{s}</td></tr>'

def button(t, url, solid=True):
    st = f"background:{INK};color:{PAPER};border:1px solid {INK}" if solid else f"background:transparent;color:{INK};border:1px solid {LINE}"
    return f'<a href="{url}" style="display:inline-block;{st};text-decoration:none;font-size:15px;padding:12px 22px;border-radius:999px">{t}</a>'

def card(label, title, sub=None, items=None, btn=None, badge=None, warn=False, big=False):
    b = ""
    if badge:
        bg, fg = (INK, PAPER) if warn else (FILL, INK)
        b = f'<td align="right" valign="top"><span style="display:inline-block;font-size:12px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg}">{badge}</span></td>'
    size = "54px;letter-spacing:-2.4px" if big else "30px;letter-spacing:-1.2px"
    out = f'''<tr><td style="padding:0 0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid {LINE};border-radius:18px"><tr><td style="padding:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="top">{lab(label)}</td>{b}</tr></table>
<p style="margin:10px 0 0;font-size:{size};line-height:1.05;font-weight:800;color:{INK}">{title}</p>'''
    if sub: out += f'<p style="margin:10px 0 0;font-size:15px;line-height:1.5;color:{SOFT}">{sub}</p>'
    if items:
        out += '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 0">' + "".join(
            f'<tr><td valign="top" style="padding:3px 10px 3px 0;font-size:15px;color:{SOFT}">&#10003;</td><td style="padding:3px 0;font-size:15px;line-height:1.45;color:{INK}">{i}</td></tr>' for i in items) + "</table>"
    if btn: out += f'<p style="margin:22px 0 0">{button(*btn)}</p>'
    return out + "</td></tr></table></td></tr>"

def rows(items, label=None):
    out = f'<tr><td style="padding:0 0 8px">{lab(label)}</td></tr>' if label else ""
    out += f'<tr><td style="padding:0 0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid {LINE}">'
    for t, sub, url in items:
        out += f'''<tr><td style="padding:15px 2px;border-bottom:1px solid {LINE}"><a href="{url}" style="text-decoration:none;color:{INK};display:block">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><b style="font-size:16px;color:{INK}">{t}</b><br><span style="font-size:14px;line-height:1.5;color:{SOFT}">{sub}</span></td>
<td align="right" valign="middle" style="font-size:22px;color:{INK};padding-left:12px">&#8594;</td></tr></table></a></td></tr>'''
    return out + "</table></td></tr>"

def section(label, title, body):
    return f'''<tr><td style="padding:0 0 28px">{lab(label)}
<p style="margin:10px 0 0;font-size:24px;line-height:1.15;font-weight:800;letter-spacing:-0.8px;color:{INK}">{title}</p>
<p style="margin:10px 0 0;font-size:16px;line-height:1.55;color:{INK}">{body}</p></td></tr>'''

def para(t, color=INK):
    return f'<tr><td style="padding:0 0 22px;font-size:16px;line-height:1.55;color:{color}">{t}</td></tr>'

def sign(note, team, tag):
    return f'''<tr><td style="border-top:1px solid {LINE}"><p style="margin:22px 0 0;font-size:16px;line-height:1.5;color:{INK}">{note}</p>
<p style="margin:16px 0 0;font-size:16px;color:{INK}"><b>{team}</b><br><span style="color:{SOFT};font-size:14px">{tag} · cauce.blog</span></p></td></tr>'''

def page(lang, preheader, body, foot):
    return f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<style>@font-face{{font-family:HND;src:url({SITE}/fonts/hnd-400.woff2) format("woff2");font-weight:400}}@font-face{{font-family:HND;src:url({SITE}/fonts/hnd-800.woff2) format("woff2");font-weight:800}}
@media (max-width:480px){{.sheet{{padding:30px 22px!important}} h1{{font-size:34px!important}}}}</style></head>
<body style="margin:0;background:{PAPER};font-family:{FONT};color:{INK};-webkit-font-smoothing:antialiased">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{PAPER}"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:{SHEET};border-radius:22px"><tr><td class="sheet" style="padding:46px 48px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{body}</table></td></tr></table>
<p style="max-width:520px;margin:20px auto 0;font-size:12px;line-height:1.6;color:{SOFT};text-align:center">{foot}</p>
</td></tr></table></body></html>'''

# ---------------- copy ----------------
C = {
 "es": dict(team="Equipo Cauce", tag="Datos inmobiliarios con fuente", legal="Cauce publica información, no asesoría de inversión.",
   guide_t="Comprar en Venezuela siendo extranjero", guide_s="Si puedes ser dueño, qué visa y RIF necesitas, cuánto cuesta cerrar y qué se hace a distancia. Dos páginas, con fuentes y una lista para el cierre.", guide_b="Descargar la guía (PDF, en inglés)",
   intel=("Inteligencia Básico", "2 estudios por semana y la ficha de cada zona · $10/mes"), call=("Llamada de diagnóstico", "45 minutos con el equipo, tras un cuestionario corto · $199"),
   pro=("Inteligencia Pro", "12 estudios por semana, comparar zonas, tendencias y CSV · $50/mes"), routes=("Comprar con nosotros", "Ruta A, título a través de la empresa ($997) · Ruta B, título a tu nombre ($2.997)"),
   custom=("A medida", "Para agentes, desarrolladores y dueños · cotización"), intro="Cauce es una publicación y una herramienta de datos sobre el mercado inmobiliario de Venezuela: noticias con fuente, precios por zona y acompañamiento para comprar, desde el exterior o aquí.", offer="Lo que puedes hacer con Cauce",
   perks=["2 estudios por semana", "Ficha de cada zona", "Cifras de la semana, cada jueves"],
   # welcome
   w_lab="Bienvenida", w_sub="Ya estás en Cauce. Empieza por aquí.", w_pre="Tu guía gratis está lista. Y cada jueves, el mercado en cinco minutos.",
   w_g="Tu guía gratis", w_thu="Cada jueves en tu correo",
   w_rows=[("El número", "Una cifra del mercado y lo que significa"), ("La calle", "Una persona, un edificio, una cuadra"), ("Marco legal", "Lo que cambió, explicado en simple")],
   w_more="Cuando quieras ir más lejos", w_note="¿Tienes una pregunta o un caso concreto? Responde este correo. Lo leemos nosotros.",
   w_foot_b="Recibes este correo porque te suscribiste en cauce.blog.", w_foot_g="Recibes este correo porque pediste la guía en cauce.blog. No te enviaremos el boletín salvo que te suscribas.",
   w_subject="Tu guía gratis de Cauce",
   # plan on
   a_lab="Tu cuenta", a_t="Ya tienes Inteligencia.", a_s="Todo está desbloqueado desde ahora.", a_pre="Inteligencia ya está activa en tu cuenta.",
   a_plan="Tu plan", a_badge="Activo", a_renew="$10/mes · se renueva el {{fecha}}", a_btn="Ir a Inteligencia",
   a_rows_l="Tu cuenta", a_manage=("Gestionar suscripción", "Tarjeta, facturas, cambiar o cancelar"),
   a_note="Stripe te envía la factura por separado. Si algo no cuadra, responde este correo.", a_subject="Ya tienes Inteligencia",
   # cancelled
   x_t="Cancelaste Inteligencia.", x_s="No se te cobrará de nuevo. Mantienes todo hasta el final del período que pagaste.", x_pre="Tu acceso a Inteligencia sigue hasta el {{fecha}}.",
   x_badge="Cancelado", x_body="Acceso hasta el {{fecha}}. Después pasas al Boletín gratis y sigues recibiendo Cauce cada jueves.", x_btn="Reactivar suscripción",
   x_why="¿Por qué te vas? Responde con una línea. Leemos cada respuesta.", x_keep="Lo que conservas", x_guide_s="Sigue siendo tuya, gratis",
   x_note="Gracias por haber sido parte de Inteligencia.", x_subject="Cancelaste Inteligencia",
   p_foot="Recibes este correo por un cambio en tu suscripción en cauce.blog."),
 "en": dict(team="The Cauce team", tag="Real estate data, sourced", legal="Cauce publishes information, not investment advice.",
   guide_t="Buying property in Venezuela as a foreigner", guide_s="Whether you can own property, which visa and tax ID you need, what closing costs, and what can be done remotely. Two pages, with sources and a closing checklist.", guide_b="Download the guide (PDF)",
   intel=("Inteligencia Basic", "2 studies a week and a profile of every area · $10/mo"), call=("Discovery call", "45 minutes with the team, after a short questionnaire · $199"),
   pro=("Inteligencia Pro", "12 studies a week, area comparison, trends and CSV · $50/mo"), routes=("Buy with us", "Route A, held title ($997) · Route B, title in your name ($2,997)"),
   custom=("Custom", "For agents, developers and owners · quote"), intro="Cauce is a publication and a data tool on Venezuelan real estate: sourced reporting, prices by area and help buying, from abroad or in the country.", offer="What you can do with Cauce",
   perks=["2 studies a week", "Profile of every area", "This week in numbers, every Thursday"],
   w_lab="Welcome", w_sub="You're in. Start here.", w_pre="Your free guide is ready. And every Thursday, the market in five minutes.",
   w_g="Your free guide", w_thu="Every Thursday in your inbox",
   w_rows=[("The number", "One market figure and what it means"), ("The street", "A person, a building, a block"), ("Legal watch", "What changed, in plain words")],
   w_more="When you want to go further", w_note="Have a question or a specific case? Reply to this email. We read every one.",
   w_foot_b="You're getting this email because you subscribed at cauce.blog.", w_foot_g="You're getting this email because you requested the guide at cauce.blog. We won't send you the newsletter unless you subscribe.",
   w_subject="Your free Cauce guide",
   a_lab="Your account", a_t="Inteligencia is on.", a_s="Everything is unlocked from now on.", a_pre="Inteligencia is now active on your account.",
   a_plan="Your plan", a_badge="Active", a_renew="$10/mo · renews on {{fecha}}", a_btn="Go to Inteligencia",
   a_rows_l="Your account", a_manage=("Manage subscription", "Card, invoices, change or cancel"),
   a_note="Stripe sends your invoice separately. If anything looks off, reply to this email.", a_subject="Inteligencia is on",
   x_t="You canceled Inteligencia.", x_s="You won't be charged again. You keep everything until the end of the period you paid for.", x_pre="Your Inteligencia access continues until {{fecha}}.",
   x_badge="Canceled", x_body="Access until {{fecha}}. After that you move to the free newsletter and keep getting Cauce every Thursday.", x_btn="Reactivate subscription",
   x_why="Why are you leaving? Reply with one line. We read every answer.", x_keep="What you keep", x_guide_s="Still yours, free",
   x_note="Thanks for being part of Inteligencia.", x_subject="You canceled Inteligencia",
   p_foot="You're getting this email because of a change to your subscription at cauce.blog."),
}

def build(l):
    t = C[l]
    G, CAL, DATOS, ACCT = SITE + "/guia/cauce-guia-comprador-extranjero-en.pdf", "https://cal.com/cauceblog/discovery", SITE + "/#datos", SITE + "/#entrar"
    PLANES, CUEST = SITE + "/#planes", SITE + "/#cuestionario"
    intel, call = (*t["intel"], PLANES), (*t["call"], CUEST)
    thursday = rows([(a, b, SITE) for a, b in t["w_rows"]], t["w_thu"])
    def welcome(boletin):
        return page(l, t["w_pre"],
            head(t["w_lab"]) + hello("{{saludo}}", t["w_sub"])
            + card(t["w_g"], t["guide_t"], t["guide_s"], btn=(t["guide_b"], G, True))
            + para(t["intro"], SOFT)
            + rows([intel, (*t["pro"], PLANES), call, (*t["routes"], PLANES), (*t["custom"], PLANES)], t["offer"])
            + (thursday if boletin else "")
            + sign(t["w_note"], t["team"], t["tag"]),
            f'{t["w_foot_b"] if boletin else t["w_foot_g"]} {t["legal"]}')
    on = page(l, t["a_pre"],
        head(t["a_lab"]) + hello(t["a_t"], t["a_s"])
        + card(t["a_plan"], t["intel"][0], t["a_renew"], items=t["perks"], btn=(t["a_btn"], DATOS, True), badge=t["a_badge"])
        + rows([(*t["a_manage"], ACCT), call], t["a_rows_l"])
        + sign(t["a_note"], t["team"], t["tag"]), f'{t["p_foot"]} {t["legal"]}')
    off = page(l, t["x_pre"],
        head(t["a_lab"]) + hello(t["x_t"], t["x_s"])
        + card(t["a_plan"], t["intel"][0], t["x_body"], btn=(t["x_btn"], ACCT, False), badge=t["x_badge"], warn=True)
        + para(t["x_why"], SOFT)
        + rows([(t["guide_t"], t["x_guide_s"], G), call], t["x_keep"])
        + sign(t["x_note"], t["team"], t["tag"]), f'{t["p_foot"]} {t["legal"]}')
    return {"bienvenida": welcome(True), "bienvenida-guia": welcome(False), "plan-activo": on, "plan-cancelado": off}


# Guide email: written for investors. English is sent by default; each version links to the other on the web.
GUIDE = {
 "en": dict(lab="Free guide", sub="The asking price is only the starting point.",
   p1="How does it compare with similar properties? What will closing add? And what needs to be verified before you commit?",
   p2="Your guide covers the first step: understanding how to buy as a foreigner.",
   card_l="Your free guide", card_t="Buying property in Venezuela as a foreigner: steps, costs and risks",
   card_s="Ownership rules, visa options, documentation and example closing costs, in two pages, with sources and an interactive checklist.", card_b="Download your free guide →",
   h2="Understand the market before making an offer.",
   p3="Cauce is a real estate market analysis platform focused on Venezuela. We help you assess properties in Caracas and Margarita through local price comparisons, investment scenarios and clearly identified risks.",
   p4="Use Cauce to investigate three questions:", q=["How does the asking price compare with the area?", "What assumptions would make the investment work?", "What information is still missing?"],
   b2="Explore the market →", p5="Already considering a property? Reply with the listing and your main question. We’ll explain which analysis or buying support fits your situation.",
   team="The Cauce team", tag="Real estate market analysis · Venezuela", other="Leer en español →",
   foot="The guide is informational and does not replace legal, tax or investment advice. You’re getting this email because you requested the guide at cauce.blog.", hi="Hi,"),
 "es": dict(lab="Guía gratis", sub="El precio pedido es solo el punto de partida.",
   p1="¿Cómo se compara con inmuebles parecidos? ¿Cuánto suma el cierre? ¿Y qué hay que verificar antes de comprometerte?",
   p2="Tu guía cubre el primer paso: entender cómo comprar siendo extranjero.",
   card_l="Tu guía gratis", card_t="Comprar en Venezuela siendo extranjero: pasos, costos y riesgos",
   card_s="Reglas de propiedad, opciones de visa, documentos y costos de cierre de ejemplo, en dos páginas, con fuentes y una lista interactiva. (PDF en inglés.)", card_b="Descarga tu guía gratis →",
   h2="Entiende el mercado antes de hacer una oferta.",
   p3="Cauce es una plataforma de análisis del mercado inmobiliario de Venezuela. Te ayudamos a evaluar inmuebles en Caracas y Margarita con comparaciones de precios locales, escenarios de inversión y riesgos bien identificados.",
   p4="Usa Cauce para investigar tres preguntas:", q=["¿Cómo se compara el precio pedido con la zona?", "¿Qué supuestos harían que la inversión funcione?", "¿Qué información todavía falta?"],
   b2="Explorar el mercado →", p5="¿Ya estás considerando un inmueble? Responde con el anuncio y tu pregunta principal. Te diremos qué análisis o qué acompañamiento te conviene.",
   team="El equipo de Cauce", tag="Análisis del mercado inmobiliario · Venezuela", other="Read in English →",
   foot="La guía es informativa y no sustituye asesoría legal, fiscal ni de inversión. Recibes este correo porque pediste la guía en cauce.blog.", hi="Hola,"),
}
def guide_mail(l, saludo="{{saludo}}"):
    g = GUIDE[l]; o = "es" if l == "en" else "en"
    G = SITE + "/guia/cauce-guia-comprador-extranjero-en.pdf"
    qs = "".join(f'<tr><td valign="top" style="padding:4px 10px 4px 0;font-size:16px;color:{SOFT}">—</td><td style="padding:4px 0;font-size:16px;line-height:1.5;color:{INK}">{x}</td></tr>' for x in g["q"])
    body = (f'<tr><td align="right" style="padding:0 0 12px"><a href="{SITE}/emails/guia-{o}-web.html" style="font-size:13px;color:{SOFT}">{g["other"]}</a></td></tr>'
        + head(g["lab"]) + hello(saludo, g["sub"]) + para(g["p1"]) + para(g["p2"])
        + card(g["card_l"], g["card_t"], g["card_s"], btn=(g["card_b"], G, True))
        + f'<tr><td style="padding:0 0 14px"><p style="margin:0;font-size:24px;line-height:1.15;font-weight:800;letter-spacing:-0.8px;color:{INK}">{g["h2"]}</p></td></tr>'
        + para(g["p3"], SOFT) + para(g["p4"])
        + f'<tr><td style="padding:0 0 24px"><table role="presentation" cellpadding="0" cellspacing="0">{qs}</table></td></tr>'
        + f'<tr><td style="padding:0 0 30px">{button(g["b2"], SITE + "/?lang=" + l + "#datos", False)}</td></tr>'
        + para(g["p5"])
        + f'<tr><td style="border-top:1px solid {LINE}"><p style="margin:20px 0 0;font-size:16px;color:{INK}"><b>{g["team"]}</b><br><span style="color:{SOFT};font-size:14px">{g["tag"]}</span><br><a href="{SITE}" style="color:{SOFT};font-size:14px">cauce.blog</a></p></td></tr>')
    return page(l, g["sub"] + " " + g["p2"], body, g["foot"])

def newsletter_es():
    t = C["es"]
    return page("es", "$1.003 por m² en Porlamar, y por qué no es lo que parece.",
        head("N.º 01 · Jueves 29 oct 2026")
        + hello("El mercado, esta semana.", "Cinco minutos de lectura.")
        + card("El número", "$1.003<span style='font-size:22px;letter-spacing:-0.5px'> /m²</span>",
               "Precio pedido en Porlamar · n=18 · ago 2026 · ejemplo. Un 33% menos de lo que haría falta para que un edificio nuevo dé números.", big=True)
        + section("La calle", "Una vecina de Altamira lleva dos años vendiendo.", "Su historia explica por qué los precios pedidos bajan tan despacio: nadie quiere ser el primero en ceder.")
        + section("Marco legal", "El RIF ya no vence.", "Desde agosto, el RIF de persona natural es permanente y se tramita en línea. Si compras, sácalo primero.")
        + section("Margarita", "Cuánto rinde un apartamento por noches.", "Con $60 la noche, el alquiler vacacional supera al largo a partir de un 30% de ocupación. Lo difícil es mayo, junio y octubre.")
        + card("La lectura de Cauce · opinión", "No es momento de perseguir la costa.", "Los precios de entrada son bajos, pero la ocupación fuera de temporada todavía no sostiene los números. Conviene esperar a ver la de diciembre.")
        + rows([("Leer el boletín completo", "Con gráficos y fuentes", SITE), (*t["intel"], SITE + "/#datos")])
        + sign("¿Te reenviaron este correo? Suscríbete gratis en cauce.blog.", t["team"], t["tag"]),
        f'Recibes Cauce Semanal porque te suscribiste en cauce.blog. <a href="{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}" style="color:{SOFT}">Darte de baja</a>. {t["legal"]}')

if __name__ == "__main__":
    out = ROOT / "emails"; out.mkdir(exist_ok=True)
    T = {}
    for l in ("es", "en"):
        for k, v in build(l).items():
            T[f"{k}_{l}"] = v; (out / f"{k}-{l}.html").write_text(v, encoding="utf-8")
        (out / f"bienvenida-guia-{l}.html").write_text(guide_mail(l), encoding="utf-8")
        (out / f"guia-{l}-web.html").write_text(guide_mail(l, GUIDE[l]["hi"]), encoding="utf-8")
    (out / "boletin-plantilla.html").write_text(newsletter_es(), encoding="utf-8")
    print("templates:", ", ".join(T), "+ boletin-plantilla")
