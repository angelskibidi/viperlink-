import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { changePassword } from "@/lib/users";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both fields are required." }, { status: 400 });
  }

  const result = await changePassword(user.id, currentPassword, newPassword);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
