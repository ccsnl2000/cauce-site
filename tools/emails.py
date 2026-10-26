# Cauce email templates (master + blocks). Renders emails/*.html for preview.
# Same look as Mi cuenta: paper page, sheet card, tight bold headline, small caps labels,
# a bordered inner card, and arrow rows. Email-safe: tables + inline styles.
import pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
INK, SOFT, LINE, PAPER, SHEET, FILL = "#1B1A18", "#6B675F", "#DCD6CC", "#F1EEE9", "#FAF8F5", "#E7E2DA"
FONT = "'HND','Helvetica Neue',Helvetica,Arial,sans-serif"
ARROW = "&#8594;"

def esc(t): return html.escape(t, quote=False)

def lab(t, color=SOFT):
    return f'<span style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:{color}">{t}</span>'

def head(label):
    return f'''<tr><td style="padding:0 0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><img src="https://cauce.blog/logo.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;border:0"><span style="font-size:20px;font-weight:800;letter-spacing:-0.8px;vertical-align:middle;margin-left:8px;color:{INK}">cauce</span></td>
<td align="right" valign="middle">{lab(label)}</td></tr></table></td></tr>'''

def hello(title, sub=None):
    s = f'<p style="margin:10px 0 0;font-size:16px;line-height:1.5;color:{SOFT}">{sub}</p>' if sub else ""
    return f'<tr><td style="padding:0 0 26px"><h1 style="margin:0;font-size:40px;line-height:1.02;font-weight:800;letter-spacing:-1.8px;color:{INK}">{title}</h1>{s}</td></tr>'

def card(label, title, sub=None, items=None, button=None, badge=None, warn=False, big=False):
    b = ""
    if badge:
        bg, fg = (INK, PAPER) if warn else (FILL, INK)
        b = f'<td align="right" valign="top"><span style="display:inline-block;font-size:12px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg}">{badge}</span></td>'
    size = "52px;letter-spacing:-2.4px" if big else "30px;letter-spacing:-1.2px"
    out = f'''<tr><td style="padding:0 0 26px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid {LINE};border-radius:18px"><tr><td style="padding:22px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="top">{lab(label)}</td>{b}</tr></table>
<p style="margin:8px 0 0;font-size:{size};line-height:1.05;font-weight:800;color:{INK}">{title}</p>'''
    if sub: out += f'<p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:{SOFT}">{sub}</p>'
    if items:
        out += '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 0">' + "".join(
            f'<tr><td valign="top" style="padding:3px 10px 3px 0;font-size:14px;color:{SOFT}">&#10003;</td><td style="padding:3px 0;font-size:14px;line-height:1.45;color:{INK}">{i}</td></tr>' for i in items) + "</table>"
    if button:
        t, url, solid = button
        st = f"background:{INK};color:{PAPER};border:1px solid {INK}" if solid else f"background:transparent;color:{INK};border:1px solid {LINE}"
        out += f'<p style="margin:20px 0 0"><a href="{url}" style="display:inline-block;{st};text-decoration:none;font-size:15px;padding:11px 20px;border-radius:999px">{t}</a></p>'
    return out + "</td></tr></table></td></tr>"

def rows(items, label=None):
    out = f'<tr><td style="padding:0 0 6px">{lab(label)}</td></tr>' if label else ""
    out += f'<tr><td style="padding:0 0 26px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid {LINE}">'
    for t, sub, url in items:
        out += f'''<tr><td style="padding:14px 2px;border-bottom:1px solid {LINE}"><a href="{url}" style="text-decoration:none;color:{INK};display:block">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><b style="font-size:16px;color:{INK}">{t}</b><br><span style="font-size:13px;color:{SOFT}">{sub}</span></td>
<td align="right" valign="middle" style="font-size:22px;color:{INK}">{ARROW}</td></tr></table></a></td></tr>'''
    return out + "</table></td></tr>"

def section(label, title, body):
    return f'''<tr><td style="padding:0 0 26px">{lab(label)}
<p style="margin:8px 0 0;font-size:22px;line-height:1.15;font-weight:800;letter-spacing:-0.8px;color:{INK}">{title}</p>
<p style="margin:8px 0 0;font-size:16px;line-height:1.55;color:{INK}">{body}</p></td></tr>'''

def para(t, color=INK):
    return f'<tr><td style="padding:0 0 18px;font-size:16px;line-height:1.55;color:{color}">{t}</td></tr>'

def sign(note):
    return f'''<tr><td style="padding:6px 0 0;border-top:1px solid {LINE}"><p style="margin:18px 0 0;font-size:15px;line-height:1.5;color:{INK}">{note}</p>
<p style="margin:14px 0 0;font-size:15px;color:{INK}"><b>Equipo Cauce</b><br><span style="color:{SOFT};font-size:13px">Datos inmobiliarios con fuente · cauce.blog</span></p></td></tr>'''

def page(preheader, body, foot):
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@font-face{{font-family:HND;src:url(https://cauce.blog/fonts/hnd-400.woff2) format("woff2");font-weight:400}}@font-face{{font-family:HND;src:url(https://cauce.blog/fonts/hnd-800.woff2) format("woff2");font-weight:800}}
@media (max-width:480px){{.sheet{{padding:28px 22px!important}} h1{{font-size:34px!important}}}}</style></head>
<body style="margin:0;background:{PAPER};font-family:{FONT};color:{INK};-webkit-font-smoothing:antialiased">
<span style="display:none;max-height:0;overflow:hidden">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{PAPER}"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:{SHEET};border-radius:22px;box-shadow:0 30px 70px rgba(27,26,24,.08)"><tr><td class="sheet" style="padding:44px 48px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{body}</table></td></tr></table>
<p style="max-width:520px;margin:20px auto 0;font-size:12px;line-height:1.55;color:{SOFT};text-align:center">{foot}</p>
</td></tr></table></body></html>'''

LEGAL = "Cauce publica información, no asesoría de inversión."
G = "https://cauce.blog/#articulo/guia"
CALL = ("Llamada de diagnóstico", "45 minutos con el equipo · $149", "https://cal.com/cauceblog/discovery")
INTEL = ("Inteligencia", "Precios y oferta por zona · $10/mes", "https://cauce.blog/#datos")
PERKS = ["Estudios completos y calculadora", "151 zonas, con datos semanales", "Análisis de propiedades ilimitados", "Descarga de datos en CSV"]

EMAILS = {
"bienvenida": page("Tu guía gratis está lista. Y cada jueves, el mercado en cinco minutos.",
    head("Bienvenida")
    + hello("Hola, Luis.", "Ya estás en Cauce. Empieza por aquí.")
    + card("Tu guía gratis", "Comprar en Venezuela siendo extranjero",
           "Si puedes ser dueño, qué visa y RIF necesitas, cuánto cuesta cerrar y qué se hace a distancia. Siete capítulos, unos 40 minutos.",
           button=("Leer la guía", G, True))
    + rows([("El número", "Una cifra del mercado y lo que significa", "https://cauce.blog"),
            ("La calle", "Una persona, un edificio, una cuadra", "https://cauce.blog"),
            ("Marco legal", "Lo que cambió, explicado en simple", "https://cauce.blog")], "Cada jueves en tu correo")
    + rows([INTEL, CALL], "Cuando quieras ir más lejos")
    + sign("¿Tienes una pregunta o un caso concreto? Responde este correo. Lo leemos nosotros."),
    f"Recibes este correo porque te suscribiste en cauce.blog. {LEGAL}"),

"boletin": page("$1.003 por m² en Porlamar, y por qué no es lo que parece.",
    head("N.º 01 · Jueves 29 oct 2026")
    + hello("El mercado, esta semana.", "Cinco minutos de lectura. Cifras de ejemplo hasta que publiquemos datos reales.")
    + card("El número", "$1.003<span style='font-size:22px;letter-spacing:-0.5px'> /m²</span>",
           "Precio pedido en Porlamar · n=18 · ago 2026 · ejemplo. Es un 33% menos de lo que haría falta para que un edificio nuevo dé números.", big=True)
    + section("La calle", "Una vecina de Altamira lleva dos años vendiendo.", "Su historia explica por qué los precios pedidos bajan tan despacio: nadie quiere ser el primero en ceder. La contamos completa en el sitio.")
    + section("Marco legal", "El RIF ya no vence.", "Desde agosto, el RIF de persona natural es permanente y se tramita en línea. Si compras, sácalo primero: cualquier retraso al final detiene la firma.")
    + section("Margarita", "Cuánto rinde un apartamento por noches.", "Con $60 la noche, el alquiler vacacional supera al largo a partir de un 30% de ocupación. Lo difícil es mayo, junio y octubre.")
    + card("Mi lectura · opinión", "No es momento de perseguir la costa.", "Los precios de entrada son bajos, pero la ocupación fuera de temporada todavía no sostiene los números. Yo esperaría a ver la de este diciembre.")
    + rows([("Leer el boletín completo", "Con gráficos y fuentes", "https://cauce.blog"), INTEL], None)
    + sign("¿Te reenviaron este correo? Suscríbete gratis en cauce.blog."),
    f"Recibes Cauce Semanal porque te suscribiste en cauce.blog. <a href=\"{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}\" style=\"color:{SOFT}\">Darte de baja</a>. {LEGAL}"),

"plan-activo": page("Inteligencia ya está activa en tu cuenta.",
    head("Tu cuenta")
    + hello("Ya tienes Inteligencia.", "Gracias, Luis. Todo está desbloqueado desde ahora.")
    + card("Tu plan", "Inteligencia", "$10/mes · se renueva el 25 de noviembre de 2026", items=PERKS,
           button=("Ir a Inteligencia", "https://cauce.blog/#datos", True), badge="Activo")
    + rows([("Gestionar suscripción", "Tarjeta, facturas, cambiar o cancelar", "https://cauce.blog/#entrar"),
            CALL], "Tu cuenta")
    + sign("Stripe te envía la factura por separado. Si algo no cuadra, responde este correo."),
    f"Recibes este correo por un cambio en tu suscripción en cauce.blog. {LEGAL}"),

"plan-cancelado": page("Cancelaste Inteligencia. Tu acceso sigue hasta el 25 de noviembre.",
    head("Tu cuenta")
    + hello("Cancelaste Inteligencia.", "No se te cobrará de nuevo. Mantienes todo hasta el final del período que pagaste.")
    + card("Tu plan", "Inteligencia", "Acceso hasta el 25 de noviembre de 2026. Después pasas al Boletín gratis y sigues recibiendo Cauce cada jueves.",
           button=("Reactivar suscripción", "https://cauce.blog/#entrar", False), badge="Cancelado", warn=True)
    + para("¿Por qué te vas? Responde con una línea. Leemos cada respuesta y nos ayuda a mejorar.", SOFT)
    + rows([("Guía para inversionistas extranjeros", "Sigue siendo tuya, gratis", G), CALL], "Lo que conservas")
    + sign("Gracias por haber sido parte de Inteligencia."),
    f"Recibes este correo por un cambio en tu suscripción en cauce.blog. {LEGAL}"),
}

if __name__ == "__main__":
    out = ROOT / "emails"; out.mkdir(exist_ok=True)
    for k, v in EMAILS.items(): (out / f"{k}.html").write_text(v, encoding="utf-8")
    print("wrote", ", ".join(EMAILS))
