// Website assistant: answers in the site chat with Claude and saves the conversation for the team.
// Called from the site with the anon key (Verify JWT on). Secret: ANTHROPIC_API_KEY.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const CORS = { "Access-Control-Allow-Origin": "https://cauce.blog", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-user-token", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SYSTEM = `You are the assistant on cauce.blog, an independent publication on Venezuelan real estate (Caracas and Margarita) run by "Equipo Cauce".
Answer in the reader's language (Spanish from Venezuela or English), in 2–4 short sentences, warm and precise, never salesy.
What Cauce offers:
- Free Thursday newsletter, and a free guide for foreign investors: "Comprar en Venezuela siendo extranjero" (visas, RIF, SAREN, closing costs, security zones). Link: https://cauce.blog/#guia
- Inteligencia, $10/month: prices and supply by area (151 parishes), full studies, calculator, CSV. https://cauce.blog/#planes
- Discovery call / Llamada de diagnóstico, $149 one-time: 45-minute video call, written report within 24 hours, credited toward "Compra a tu nombre" within 60 days. Readers need a free account to book. https://cauce.blog/#planes
- Owners and agents: feasibility study for a lot, $450.
- Check an asking price: https://cauce.blog/#analizar ; prices by area: https://cauce.blog/#datos
Rules: Cauce does not sell property and gives information, not legal, tax or investment advice; for a specific transaction the reader needs a Venezuelan lawyer. Never invent laws, fees, dates or prices; if you don't know, say so and suggest the discovery call or writing to hola@cauce.blog. Figures on the site are partly demo data during the beta. Be calm about politics. Readers in other countries must check sanctions rules themselves.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const session = String(b.session || "").slice(0, 64);
  const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-12)
    .map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 1200) }))
    .filter((m: any) => m.content.trim());
  if (!session || !msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "bad request" }, 400);
  if (!KEY) return json({ error: "not configured" }, 503);

  // who is writing (optional): the site sends the reader's session token when signed in
  let user_id: string | null = null, email: string | null = null;
  const auth = req.headers.get("x-user-token");
  if (auth) { const { data } = await db.auth.getUser(auth); if (data?.user) { user_id = data.user.id; email = data.user.email ?? null; } }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 400, system: SYSTEM, messages: msgs }),
  });
  if (!r.ok) return json({ error: "assistant unavailable" }, 502);
  const out = await r.json();
  const text = (out.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim();

  const all = [...msgs, { role: "assistant", content: text }];
  await db.from("chats").upsert({ session, user_id, email, lang: b.lang === "en" ? "en" : "es", messages: all, updated_at: new Date().toISOString() });
  return json({ text });
});
