// Newsletter signups: saves the reader, adds them to Resend contacts and sends the welcome email once.
// Called from the site with the anon key (Verify JWT on). Secret: RESEND_API_KEY (full access).
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KEY = Deno.env.get("RESEND_API_KEY") || "";
const CORS = { "Access-Control-Allow-Origin": "https://cauce.blog", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const PERFILES = ["particular", "agente", "inmobiliaria", "inv-local", "inv-int", "desarrollador", "otro"];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const resend = (path: string, method: string, body: unknown) =>
  fetch("https://api.resend.com" + path, { method, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });

const WELCOME = (boletin: boolean) => `<!doctype html><html lang="es"><body style="margin:0;background:#F1EEE9;font-family:Helvetica,Arial,sans-serif;color:#1B1A18">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1EEE9"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FAF8F5;border-radius:18px"><tr><td style="padding:36px 32px">
<img src="https://cauce.blog/logo.png" width="44" height="44" alt="Cauce" style="display:block;border:0">
<p style="font-size:28px;font-weight:800;letter-spacing:-1px;margin:24px 0 8px">Bienvenido a Cauce.</p>
<p style="font-size:16px;line-height:1.55;margin:0 0 16px">${boletin ? "Gracias por suscribirte. Cada jueves te enviamos lo que se movió en el mercado inmobiliario venezolano: precios por zona, operaciones y lo que dicen los datos, siempre con su fuente." : "Gracias por tu interés en Cauce. Publicamos datos del mercado inmobiliario venezolano, siempre con su fuente."}</p>
<p style="font-size:16px;line-height:1.55;margin:0 0 24px">Para empezar, te regalamos nuestra guía completa: cómo comprar en Venezuela paso a paso, con los costos reales y los riesgos que conviene revisar antes de firmar.</p>
<a href="https://cauce.blog/#articulo/guia" style="display:inline-block;background:#1B1A18;color:#F1EEE9;text-decoration:none;font-size:15px;padding:12px 22px;border-radius:999px">Leer la guía gratis</a>
<p style="font-size:16px;line-height:1.55;margin:28px 0 0">Si tienes una pregunta o un caso concreto, responde este correo. Lo leemos nosotros.</p>
<p style="font-size:16px;line-height:1.4;margin:24px 0 0">Un abrazo,<br><b>Equipo Cauce</b><br><span style="color:#6B675F;font-size:14px">Datos inmobiliarios con fuente · <a href="https://cauce.blog" style="color:#6B675F">cauce.blog</a></span></p>
</td></tr></table>
<p style="font-size:12px;color:#6B675F;line-height:1.5;max-width:520px;margin:18px auto 0">${boletin ? "Recibes este correo porque te suscribiste en cauce.blog. Cada boletín incluye un enlace para darte de baja." : "Recibes este correo porque pediste la guía en cauce.blog. No te enviaremos el boletín salvo que te suscribas."} Cauce publica información, no asesoría de inversión.</p>
</td></tr></table></body></html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return json({ error: "email" }, 400);
  const perfil = PERFILES.includes(b.perfil) ? b.perfil : null;
  const source = ["boletin", "cuenta", "guia"].includes(b.source) ? b.source : "boletin";
  const boletin = b.boletin !== false; // guide requests can opt out of the newsletter

  const { data: row } = await db.from("subscribers").select("email, welcomed_at, perfil").eq("email", email).maybeSingle();
  if (!row) await db.from("subscribers").insert({ email, source, perfil });
  else if (perfil && perfil !== row.perfil) await db.from("subscribers").update({ perfil }).eq("email", email);

  if (KEY) {
    if (!row || !row.welcomed_at) await resend("/contacts", "POST", { email, unsubscribed: !boletin });
    else if (b.boletin === true) await resend(`/contacts/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: false }).catch(() => {});
    // perfil is a custom property; create "perfil" under Resend → Contacts → Properties for it to stick
    if (perfil) await resend(`/contacts/${encodeURIComponent(email)}`, "PATCH", { properties: { perfil } }).catch(() => {});
    if (!row || !row.welcomed_at) {
      const m = await resend("/emails", "POST", { from: "Cauce <hola@cauce.blog>", to: [email], reply_to: "hola@cauce.blog", subject: "Bienvenido a Cauce: tu guía gratis", html: WELCOME(boletin) });
      if (m.ok) await db.from("subscribers").update({ welcomed_at: new Date().toISOString() }).eq("email", email);
    }
  }
  return json({ ok: true });
});
