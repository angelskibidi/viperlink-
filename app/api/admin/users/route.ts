import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json(await listUsers());
}
