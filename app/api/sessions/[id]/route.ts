import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSessionsByUserId, deleteSession } from "@/lib/sessions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const sessions = await getSessionsByUserId(user.id);
  if (!sessions.find((s) => s.id === id)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await deleteSession(id);
  return NextResponse.json({ success: true });
}
