// Cal.com → Supabase: keeps every discovery call in public.bookings, linked to the reader's account.
// Verify JWT off (Cal.com signs its own requests). Secret: CAL_WEBHOOK_SECRET (same value as in Cal.com).
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SECRET = Deno.env.get("CAL_WEBHOOK_SECRET") || "";

async function hmac(body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const body = await req.text();
  if (!SECRET || (await hmac(body)) !== (req.headers.get("x-cal-signature-256") || "")) return new Response("bad signature", { status: 401 });
  let ev: any; try { ev = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
  const t = ev.triggerEvent, p = ev.payload || {};
  if (!p.uid) return new Response("ok");
  const att = (p.attendees || [])[0] || {};
  const email = String(att.email || p.responses?.email?.value || "").toLowerCase() || null;
  let user_id = p.metadata?.userId || null;
  if (!user_id && email) { const { data } = await db.from("profiles").select("id").eq("email", email).maybeSingle(); user_id = data?.id || null; }
  const now = new Date().toISOString();
  const base = { uid: p.uid, user_id, email, name: att.name || null, title: p.title || null, start_time: p.startTime || null, end_time: p.endTime || null,
    meeting_url: p.metadata?.videoCallUrl || p.videoCallData?.url || (typeof p.location === "string" && p.location.startsWith("http") ? p.location : null),
    answers: p.responses || null, updated_at: now };

  if (t === "BOOKING_CREATED" || t === "BOOKING_REQUESTED") await db.from("bookings").upsert({ ...base, status: "reservada", paid: !!p.paid });
  else if (t === "BOOKING_RESCHEDULED") {
    await db.from("bookings").upsert({ ...base, status: "reservada" });
    const old = p.rescheduleUid || p.fromReschedule; if (old) await db.from("bookings").update({ status: "reprogramada", updated_at: now }).eq("uid", old);
  } else if (t === "BOOKING_CANCELLED" || t === "BOOKING_REJECTED") await db.from("bookings").upsert({ ...base, status: "cancelada" });
  else if (t === "BOOKING_PAID" || t === "BOOKING_PAYMENT_INITIATED") await db.from("bookings").upsert({ ...base, paid: t === "BOOKING_PAID" });
  else if (t === "MEETING_ENDED") await db.from("bookings").update({ status: "realizada", updated_at: now }).eq("uid", p.uid);
  return new Response("ok");
});
