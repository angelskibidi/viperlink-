import { NextResponse } from "next/server";
import { updatePasswordByAuthToken } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = String(body.accessToken ?? "").trim();
    const password = String(body.password ?? "");

    if (!accessToken || password.length < 6) {
      return NextResponse.json({ error: "Valid reset session and 6+ character password required." }, { status: 400 });
    }

    const success = await updatePasswordByAuthToken(accessToken, password);
    if (!success) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/reset-password error:", error);
    return NextResponse.json({ error: "Could not update password." }, { status: 400 });
  }
}
