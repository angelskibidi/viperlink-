import { NextResponse } from "next/server";
import { verifySync } from "otplib";
import { getCurrentUser } from "@/lib/auth";
import { getTotpSecret, enableTotp } from "@/lib/users";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const token = String(body.token ?? "").replace(/\s/g, "");

  const secret = await getTotpSecret(user.id);
  if (!secret) return NextResponse.json({ error: "No TOTP secret found. Start setup again." }, { status: 400 });

  let valid = false;
  try {
    const result = verifySync({ token, secret, epochTolerance: 90 });
    valid = result?.valid === true;
  } catch {
    return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
  }
  if (!valid) return NextResponse.json({ error: "Invalid code. Check your authenticator app and try again." }, { status: 400 });

  await enableTotp(user.id);
  return NextResponse.json({ success: true });
}
