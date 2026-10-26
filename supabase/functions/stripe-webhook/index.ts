// Stripe → Supabase: marks readers as Inteligencia when they pay, and back to Boletín when they cancel.
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Verify JWT is off (Stripe signs its own requests).
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
  }

  if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    const r = await db.from("profiles").update(subRow(o)).eq("stripe_customer_id", o.customer);
    if (r.error) return new Response(r.error.message, { status: 500 });
  }

  return new Response("ok");
});
