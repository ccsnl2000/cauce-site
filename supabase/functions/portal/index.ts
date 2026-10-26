// Opens the Stripe customer portal for the signed-in reader (cancel, change card, invoices).
// Called from the site with the anon key (Verify JWT on) and the reader's session in x-user-token. Secret: STRIPE_SECRET_KEY.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "sk_missing");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = { "Access-Control-Allow-Origin": "https://cauce.blog", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-user-token", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const token = req.headers.get("x-user-token");
  if (!token) return json({ error: "signin" }, 401);
  const { data } = await db.auth.getUser(token);
  const user = data?.user; if (!user) return json({ error: "signin" }, 401);
  let lang = "es"; try { const b = await req.json(); if (b?.lang === "en") lang = "en"; } catch { /* no body */ }

  const { data: p } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  let customer = p?.stripe_customer_id as string | undefined;
  if (!customer && user.email) {   // paid before the account was linked: find the customer by email
    const found = await stripe.customers.list({ email: user.email, limit: 1 });
    customer = found.data[0]?.id;
    if (customer) await db.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  }
  if (!customer) return json({ error: "no-customer" }, 404);
  try {
    const s = await stripe.billingPortal.sessions.create({ customer, return_url: "https://cauce.blog/#entrar", locale: lang === "en" ? "en" : "es" });
    return json({ url: s.url });
  } catch (e) {
    return json({ error: "portal", message: String((e as Error).message || e) }, 502);
  }
});
