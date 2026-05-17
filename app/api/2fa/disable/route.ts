import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { disableTotp } from "@/lib/users";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await disableTotp(user.id);
  return NextResponse.json({ success: true });
}
