// Stripe → Supabase: marks readers as Inteligencia when they pay, and back to Boletín when they cancel.
// Deploy: Supabase → Edge Functions → Deploy a new function → Via editor, name "stripe-webhook",
// paste this file, and turn OFF "Verify JWT". Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const crypto = Stripe.createSubtleCryptoProvider();

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
    const row = { plan: "inteligencia", plan_status: "active", stripe_customer_id: o.customer };
    const q = db.from("profiles").update(row);
    const r = o.client_reference_id
      ? await q.eq("id", o.client_reference_id)
      : await q.eq("email", (o.customer_details?.email || "").toLowerCase());
    if (r.error) return new Response(r.error.message, { status: 500 });
  }

  if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    const live = ["active", "trialing", "past_due"].includes(o.status);
    const r = await db.from("profiles").update({ plan: live ? "inteligencia" : "boletin", plan_status: o.status }).eq("stripe_customer_id", o.customer);
    if (r.error) return new Response(r.error.message, { status: 500 });
  }

  return new Response("ok");
});
