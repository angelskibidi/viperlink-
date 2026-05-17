import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type SessionRecord = {
  id: string;
  user_id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_used_at: string;
};

export function parseUA(ua: string | null): { label: string; icon: string } {
  if (!ua) return { label: "Unknown device", icon: "device_unknown" };

  let os = "Unknown";
  let browser = "Unknown";
  let icon = "device_unknown";

  if (/curl\//i.test(ua)) { os = "curl"; browser = "curl"; icon = "terminal"; }
  else if (/iPhone/i.test(ua)) { os = "iPhone"; icon = "smartphone"; }
  else if (/Android/i.test(ua)) { os = "Android"; icon = "smartphone"; }
  else if (/iPad/i.test(ua)) { os = "iPad"; icon = "tablet_mac"; }
  else if (/Macintosh/i.test(ua)) { os = "Mac"; icon = "laptop_mac"; }
  else if (/Windows/i.test(ua)) { os = "Windows"; icon = "desktop_windows"; }
  else if (/Linux/i.test(ua)) { os = "Linux"; icon = "terminal"; }

  if (os !== "curl") {
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Chromium\//i.test(ua)) browser = "Chromium";
  }

  return { label: `${os} · ${browser}`, icon };
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (h < 48) return "yesterday";
  return new Date(dateStr).toLocaleDateString();
}

export async function createDbSession(userId: string, userAgent: string | null, ip: string | null): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("app_sessions")
    .insert({ user_id: userId, user_agent: userAgent, ip, last_used_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not create session");
  return data.id;
}

export async function getSessionsByUserId(userId: string): Promise<SessionRecord[]> {
  const { data } = await supabaseAdmin
    .from("app_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false });
  return (data ?? []) as SessionRecord[];
}

export async function touchSession(sessionId: string): Promise<void> {
  await supabaseAdmin
    .from("app_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("app_sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();
  return !!data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await supabaseAdmin.from("app_sessions").delete().eq("id", sessionId);
}

export async function deleteAllSessions(userId: string): Promise<void> {
  await supabaseAdmin.from("app_sessions").delete().eq("user_id", userId);
}
