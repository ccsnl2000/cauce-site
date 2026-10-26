// Stripe → Supabase: keeps each reader's plan in sync and sends the account emails
// (plan activated, plan cancelled) in the reader's language.
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY. Verify JWT is off (Stripe signs its own requests).
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_missing");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const crypto = Stripe.createSubtleCryptoProvider();

// Renewal date and cancel flag, wherever this API version puts them.
const subRow = (s: any) => {
  const end = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  const live = ["active", "trialing", "past_due"].includes(s.status);
  return {
    plan: live ? "inteligencia" : "boletin",
    plan_status: s.status,
    renews_at: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: !!(s.cancel_at_period_end || s.cancel_at),
  };
};

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

async function mail(kind: "plan-activo" | "plan-cancelado", where: { id?: string; customer?: string }) {
  const q = db.from("profiles").select("email, lang, renews_at");
  const { data: p } = where.id ? await q.eq("id", where.id).maybeSingle() : await q.eq("stripe_customer_id", where.customer!).maybeSingle();
  if (!p?.email) return;
  const l = p.lang === "en" ? "en" : "es";
  const fecha = p.renews_at ? new Date(p.renews_at).toLocaleDateString(l === "en" ? "en-US" : "es-VE", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Caracas" }) : "";
  await sendTpl(`${kind}-${l}`, p.email, { fecha }).catch(() => false);
}

Deno.serve(async (req) => {
  const body = await req.text();
  let ev: Stripe.Event;
  try {
    ev = await stripe.webhooks.constructEventAsync(body, req.headers.get("stripe-signature")!, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, crypto);
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  const o: any = ev.data.object;

  if (ev.type === "checkout.session.completed" && o.mode === "subscription") {
    let row: any = { plan: "inteligencia", plan_status: "active" };
    try { row = subRow(await stripe.subscriptions.retrieve(o.subscription)); } catch { /* keep the basic row */ }
    row.stripe_customer_id = o.customer;
    const q = db.from("profiles").update(row);
    const r = o.client_reference_id
      ? await q.eq("id", o.client_reference_id)
      : await q.eq("email", (o.customer_details?.email || "").toLowerCase());
    if (r.error) return new Response(r.error.message, { status: 500 });
    await mail("plan-activo", o.client_reference_id ? { id: o.client_reference_id } : { customer: o.customer });
  }

  if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    const row = subRow(o);
    const r = await db.from("profiles").update(row).eq("stripe_customer_id", o.customer);
    if (r.error) return new Response(r.error.message, { status: 500 });
    // emails only when the reader changes their mind: cancel scheduled, or cancellation undone
    const prev: any = (ev.data as any).previous_attributes || {};
    if (ev.type === "customer.subscription.updated" && ("cancel_at_period_end" in prev || "cancel_at" in prev)) {
      const was = !!(prev.cancel_at_period_end ?? prev.cancel_at);
      if (row.cancel_at_period_end && !was) await mail("plan-cancelado", { customer: o.customer });
      if (!row.cancel_at_period_end && was) await mail("plan-activo", { customer: o.customer });
    }
  }

  return new Response("ok");
});
