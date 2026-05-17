import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseUA } from "@/lib/sessions";

type EventResult = "success" | "failed_password" | "failed_2fa";

export async function recordLoginEvent(
  userId: string,
  result: EventResult,
  userAgent: string | null,
  ip: string | null,
) {
  try { await supabaseAdmin.from("login_events").insert({ user_id: userId, result, user_agent: userAgent, ip }); } catch { }
}

export async function getLoginEvents(userId: string, limit = 20) {
  const { data } = await supabaseAdmin
    .from("login_events")
    .select("id, result, user_agent, ip, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((e: { id: string; result: EventResult; user_agent: string | null; ip: string | null; created_at: string }) => ({
    id: e.id,
    created_at: e.created_at,
    res: e.result === "success" ? "✓ success" : e.result === "failed_2fa" ? "✗ 2FA failed" : "✗ failed",
    ua: parseUA(e.user_agent).label,
    ok: e.result === "success",
  }));
}
