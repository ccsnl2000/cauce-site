// Emails for site requests: a confirmation to the person and a notice to the Cauce team.
// Called by the site right after it saves a row in `waitlist` (fake door) or `source_requests` (Fuentes).
// It only sends for a matching row saved in the last 10 minutes that hasn't been notified yet, so it can't be used to email anyone else.
// Secret: RESEND_API_KEY.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "https://cauce.blog", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const TEAM = ["hola@cauce.blog", "lamedinaba@gmail.com"];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const TOOL: Record<string, [string, string]> = { mapa: ["el mapa de Inteligencia", "the Intelligence map"], analisis: ["el análisis de propiedades", "property analysis"], chat: ["el chat de Cauce", "the Cauce chat"] };
const MOTIVO: Record<string, [string, string]> = { investigacion: ["Investigación o estudio", "Research or study"], periodismo: ["Periodismo o medios", "Journalism or media"], inversion: ["Invertir o comprar un inmueble", "Investing or buying a property"], profesional: ["Trabajo inmobiliario", "Real estate work"], institucion: ["Gobierno o institución", "Government or institution"], otro: ["Otro", "Other"] };

const P = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1B1A18">${t}</p>`;
const shell = (tag: string, h1: string, body: string, foot: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F1EEE9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1EEE9"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FAF8F5;border-radius:22px"><tr><td style="padding:44px 46px">
<p style="margin:0 0 28px"><a href="https://cauce.blog" style="text-decoration:none;font-size:22px;font-weight:800;letter-spacing:-1px;color:#1B1A18">cauce</a><span style="float:right;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6B675F;line-height:28px">${tag}</span></p>
<h1 style="margin:0 0 18px;font-size:34px;line-height:1.05;font-weight:800;letter-spacing:-1.4px;color:#1B1A18">${h1}</h1>
${body}
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #DCD6CC;font-size:14px;color:#6B675F">${foot}</p>
</td></tr></table></td></tr></table></body></html>`;

async function send(to: string[], subject: string, html: string, replyTo?: string) {
  const KEY = Deno.env.get("RESEND_API_KEY") || "";
  if (!KEY) return false;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cauce <hola@cauce.blog>", to, reply_to: replyTo ? [replyTo] : ["hola@cauce.blog"], subject, html }) });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const kind = b.kind === "fuentes" ? "fuentes" : b.kind === "espera" ? "espera" : "";
  const email = String(b.email || "").trim().toLowerCase();
  if (!kind || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "bad request" }, 400);
  const table = kind === "fuentes" ? "source_requests" : "waitlist";
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: row } = await db.from(table).select("*").eq("email", email).is("notified_at", null).gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row) return json({ ok: true, sent: false });
  const en = row.lang === "en", when = new Date(row.created_at).toLocaleString("es-VE", { timeZone: "America/Caracas", dateStyle: "medium", timeStyle: "short" });

  let mine: [string, string], team: [string, string];
  if (kind === "fuentes") {
    const mo = MOTIVO[row.motivo] || [row.motivo, row.motivo];
    mine = en
      ? ["We received your request", shell("Sources", "Thanks, we got your request.", P(`You asked to see the sources behind Cauce's maps and data, for: <b>${esc(mo[1])}</b>.`) + (row.nota ? P(`Your note: “${esc(row.nota)}”`) : "") + P("We review every request by hand and will write back to this address. You can reply to this email if you want to add anything."), "Cauce · Real estate data with sources · cauce.blog")]
      : ["Recibimos tu solicitud", shell("Fuentes", "Gracias, recibimos tu solicitud.", P(`Pediste ver las fuentes detrás de los mapas y datos de Cauce, para: <b>${esc(mo[0])}</b>.`) + (row.nota ? P(`Tu nota: «${esc(row.nota)}»`) : "") + P("Revisamos cada solicitud a mano y te escribiremos a este correo. Si quieres agregar algo, responde este mensaje."), "Cauce · Datos inmobiliarios con fuente · cauce.blog")];
    team = [`Solicitud de fuentes: ${email}`, shell("Equipo", "Nueva solicitud de fuentes", P(`<b>Correo:</b> ${esc(email)}<br><b>Para qué:</b> ${esc(mo[0])}<br><b>Detalle:</b> ${esc(row.nota || "—")}<br><b>Idioma:</b> ${en ? "EN" : "ES"}<br><b>Fecha:</b> ${esc(when)}`) + P("Respóndele directamente a este correo (va a la persona). También está en el panel → Lista de espera → Solicitudes de fuentes."), "Aviso automático de cauce.blog")];
  } else {
    const t = TOOL[row.tool] || [row.tool, row.tool];
    mine = en
      ? ["You're on the list, with 30% off", shell("Waitlist", "You're on the list.", P(`We'll email you as soon as ${esc(t[1])} is ready.`) + P("When it launches you'll get <b>30% off any Cauce subscription</b>. We'll include your code in that email."), "Cauce · Real estate data with sources · cauce.blog")]
      : ["Estás en la lista, con 30% de descuento", shell("Lista de espera", "Ya estás en la lista.", P(`Te escribiremos en cuanto ${esc(t[0])} esté listo.`) + P("Cuando lo lancemos tendrás <b>30% de descuento en cualquier suscripción de Cauce</b>. Te enviaremos tu código en ese correo."), "Cauce · Datos inmobiliarios con fuente · cauce.blog")];
    team = [`Lista de espera (${t[0]}): ${email}`, shell("Equipo", "Alguien se sumó a la lista de espera", P(`<b>Correo:</b> ${esc(email)}<br><b>Herramienta:</b> ${esc(t[0])}<br><b>Idioma:</b> ${en ? "EN" : "ES"}<br><b>Fecha:</b> ${esc(when)}`) + P("Se le prometió 30% de descuento en cualquier suscripción al lanzar. Está en el panel → Lista de espera."), "Aviso automático de cauce.blog")];
  }
  const a = await send([email], mine[0], mine[1]);
  const c = await send(TEAM, team[0], team[1], email);
  if (a || c) await db.from(table).update({ notified_at: new Date().toISOString() }).eq("id", row.id);
  return json({ ok: true, sent: a, team: c });
});
