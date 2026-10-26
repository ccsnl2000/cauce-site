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

// Email designs are published with the site (tools/emails.py → emails/*.html) and fetched here when sending.
const SUBJECT: Record<string, string> = {
  "bienvenida-es": "Tu guía gratis de Cauce", "bienvenida-guia-es": "Tu guía gratis de Cauce",
  "bienvenida-en": "Your free Cauce guide", "bienvenida-guia-en": "Your free Cauce guide",
  "plan-activo-es": "Ya tienes Inteligencia", "plan-activo-en": "Inteligencia is on",
  "plan-cancelado-es": "Cancelaste Inteligencia", "plan-cancelado-en": "You canceled Inteligencia",
};
async function sendTpl(key: string, to: string, vars: Record<string, string>) {
  const KEY = Deno.env.get("RESEND_API_KEY") || "";
  if (!KEY) return false;
  const r = await fetch(`https://cauce.blog/emails/${key}.html`);
  if (!r.ok) return false;
  const html = (await r.text()).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  const m = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cauce <hola@cauce.blog>", to: [to], reply_to: "hola@cauce.blog", subject: SUBJECT[key], html }),
  });
  return m.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return json({ error: "email" }, 400);
  const perfil = PERFILES.includes(b.perfil) ? b.perfil : null;
  const source = ["boletin", "cuenta", "guia"].includes(b.source) ? b.source : "boletin";
  const boletin = b.boletin !== false; // guide requests can opt out of the newsletter
  const l = b.lang === "en" ? "en" : "es";

  const { data: row } = await db.from("subscribers").select("email, welcomed_at, perfil, guide_sent_at").eq("email", email).maybeSingle();
  if (!row) await db.from("subscribers").insert({ email, source, perfil });
  else if (perfil && perfil !== row.perfil) await db.from("subscribers").update({ perfil }).eq("email", email);

  if (KEY) {
    if (!row || !row.welcomed_at) await resend("/contacts", "POST", { email, unsubscribed: !boletin });
    else if (b.boletin === true) await resend(`/contacts/${encodeURIComponent(email)}`, "PATCH", { unsubscribed: false }).catch(() => {});
    // perfil is a custom property; create "perfil" under Resend → Contacts → Properties for it to stick
    if (perfil) await resend(`/contacts/${encodeURIComponent(email)}`, "PATCH", { properties: { perfil } }).catch(() => {});
    // the welcome goes once; a guide request always gets the guide email (at most every 10 minutes)
    const guide = source === "guia" && !b.perfil_only;
    const recent = row?.guide_sent_at && Date.now() - new Date(row.guide_sent_at).getTime() < 10 * 60 * 1000;
    if ((!row || !row.welcomed_at || guide) && !(guide && recent)) {
      const { data: p } = await db.from("profiles").select("nombre").eq("email", email).maybeSingle();
      const n = (p?.nombre || "").trim().split(/\s+/)[0];
      const saludo = l === "en" ? (n ? `Hi, ${n}.` : "Welcome to Cauce.") : (n ? `Hola, ${n}.` : "Bienvenido a Cauce.");
      const sent = await sendTpl(`${boletin && !(row && row.welcomed_at) ? "bienvenida" : "bienvenida-guia"}-${l}`, email, { saludo });
      if (sent) await db.from("subscribers").update({ welcomed_at: row?.welcomed_at || new Date().toISOString(), ...(guide ? { guide_sent_at: new Date().toISOString() } : {}) }).eq("email", email);
    }
  }
  return json({ ok: true });
});
