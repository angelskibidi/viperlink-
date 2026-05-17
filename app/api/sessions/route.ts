import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentSessionId, destroySession } from "@/lib/auth";
import { getSessionsByUserId, deleteAllSessions, parseUA } from "@/lib/sessions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const currentSessionId = await getCurrentSessionId();
  const sessions = await getSessionsByUserId(user.id).catch(() => []);

  const result = sessions.map((s) => {
    const { label, icon } = parseUA(s.user_agent);
    return {
      id: s.id,
      label,
      icon,
      created_at: s.created_at,
      last_used_at: s.last_used_at,
      ip: s.ip ?? null,
      current: s.id === currentSessionId,
    };
  });

  return NextResponse.json({ sessions: result });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await deleteAllSessions(user.id);
  await destroySession();
  return NextResponse.json({ success: true });
}
