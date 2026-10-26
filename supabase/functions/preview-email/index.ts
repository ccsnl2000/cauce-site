// Sends a published email design (cauce.blog/emails/<tpl>.html) to the owner's inbox only, to preview it.
// Secret: RESEND_API_KEY. Recipient is fixed; only boletin-*, bienvenida-* and plan-* templates.
// Trigger: GitHub → Actions → "Email preview" → Run workflow.
const TO = "lamedinaba@gmail.com";
Deno.serve(async (req) => {
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  const tpl = String(b.tpl || "");
  if (!/^(boletin|bienvenida|plan)-[a-z0-9-]+$/.test(tpl)) return new Response("bad tpl", { status: 400 });
  const KEY = Deno.env.get("RESEND_API_KEY") || "";
  const r = await fetch(`https://cauce.blog/emails/${tpl}.html?v=${Date.now()}`);
  if (!r.ok) return new Response("no template", { status: 404 });
  const html = (await r.text()).replace(/\{\{\{?RESEND_UNSUBSCRIBE_URL\}?\}\}/g, "https://cauce.blog").replace(/\{\{saludo\}\}/g, "Hola, Luis.");
  const subject = String(b.subject || "[Vista previa] " + tpl).slice(0, 150);
  const m = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Cauce <hola@cauce.blog>", to: [TO], reply_to: "hola@cauce.blog", subject, html }) });
  return new Response(await m.text(), { status: m.status });
});
