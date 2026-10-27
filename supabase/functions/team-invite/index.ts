// One-off: welcome email for a new Cauce team member (fixed recipient). Secret: RESEND_API_KEY.
const TO = "dmedina@rotatorsurvey.com";
const P = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1B1A18">${t}</p>`;
const STEP = (n: number, t: string, d: string) => `<tr><td valign="top" style="padding:0 14px 18px 0;font-size:22px;font-weight:800;color:#1B1A18;width:28px">${n}</td><td style="padding:0 0 18px;font-size:16px;line-height:1.55;color:#1B1A18"><b>${t}</b><br><span style="color:#6B675F">${d}</span></td></tr>`;
const BTN = (t: string, u: string, solid = true) => `<a href="${u}" style="display:inline-block;margin:0 8px 8px 0;${solid ? "background:#1B1A18;color:#F1EEE9;border:1px solid #1B1A18" : "background:transparent;color:#1B1A18;border:1px solid #DCD6CC"};text-decoration:none;font-size:15px;padding:12px 22px;border-radius:999px">${t}</a>`;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F1EEE9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1EEE9"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FAF8F5;border-radius:22px"><tr><td style="padding:44px 46px">
<p style="margin:0 0 28px"><a href="https://cauce.blog" style="text-decoration:none;font-size:22px;font-weight:800;letter-spacing:-1px;color:#1B1A18">cauce</a><span style="float:right;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6B675F;line-height:28px">Equipo</span></p>
<h1 style="margin:0 0 10px;font-size:38px;line-height:1.02;font-weight:800;letter-spacing:-1.6px;color:#1B1A18">Bienvenida al equipo, Dorka.</h1>
<p style="margin:0 0 28px;font-size:17px;line-height:1.5;color:#6B675F">Ya tienes acceso de administradora a Cauce. Así entras:</p>
<table role="presentation" cellpadding="0" cellspacing="0">
${STEP(1, "Crea tu cuenta en cauce.blog", "Abre cauce.blog/#entrar (o «Iniciar sesión», arriba a la derecha) y elige «Registrarme». Usa este mismo correo: dmedina@rotatorsurvey.com.")}
${STEP(2, "Confirma tu correo", "Te llegará un enlace de confirmación. Ábrelo y quedas dentro.")}
${STEP(3, "Entra al panel", "Con la sesión abierta, ve a cauce.blog/admin.html. Ahí está todo: visitas, personas, artículos, propiedades, llamadas y chats.")}
</table>
<p style="margin:4px 0 26px">${BTN("Ir a cauce.blog", "https://cauce.blog/#entrar")}${BTN("Abrir el panel", "https://cauce.blog/admin.html", false)}</p>
<p style="margin:0 0 8px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6B675F">Dos atajos útiles</p>
${P("<b>Ver todo desbloqueado:</b> abre <a href=\"https://cauce.blog/?vista=completa\" style=\"color:#1B1A18\">cauce.blog/?vista=completa</a> para ver el contenido de suscriptores sin pagar. Para volver a la vista normal: <a href=\"https://cauce.blog/?vista=normal\" style=\"color:#1B1A18\">?vista=normal</a>.")}
${P("<b>Datos de prueba:</b> el panel tiene cuentas y visitas de ejemplo, marcadas como «prueba», para que los gráficos se vean llenos. Puedes ocultarlas con el interruptor de arriba. Por favor no uses «Borrar prueba» todavía.")}
<p style="margin:10px 0 8px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6B675F">Lo que nos ayudarías a revisar</p>
${P("Diseño, recorrido de las páginas, experiencia en celular y computadora, y los embudos: suscribirse, crear cuenta, el cuestionario antes de la llamada, agendar y pagar. Si algo se ve raro, confunde o se rompe, mándanos una captura con una línea de contexto.")}
${P("Puedes responder directamente este correo. Gracias por sumarte.")}
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #DCD6CC;font-size:16px;color:#1B1A18"><b>Luis y el equipo de Cauce</b><br><span style="color:#6B675F;font-size:14px">Datos inmobiliarios con fuente · cauce.blog</span></p>
</td></tr></table>
<p style="max-width:520px;margin:20px auto 0;font-size:12px;line-height:1.6;color:#6B675F;text-align:center">Recibes este correo porque te sumaste al equipo de Cauce. El panel es privado: no compartas el enlace con terceros.</p>
</td></tr></table></body></html>`;
Deno.serve(async () => {
  const KEY = Deno.env.get("RESEND_API_KEY") || "";
  const m = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cauce <hola@cauce.blog>", to: [TO], cc: ["lamedinaba@gmail.com"], reply_to: ["hola@cauce.blog", "lamedinaba@gmail.com"], subject: "Bienvenida al equipo de Cauce: tu acceso al sitio y al panel", html }) });
  return new Response(await m.text(), { status: m.status });
});
