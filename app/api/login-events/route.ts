import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLoginEvents } from "@/lib/loginEvents";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const events = await getLoginEvents(user.id).catch(() => []);
  return NextResponse.json({ events });
}
