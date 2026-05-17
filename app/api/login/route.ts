import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findUserForLogin, verifyPassword, getTotpSecret } from "@/lib/users";
import { verifySync } from "otplib";
import { recordLoginEvent } from "@/lib/loginEvents";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  const token = body.token ? String(body.token).replace(/\s/g, "") : null;

  const ua = request.headers.get("user-agent") ?? null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? request.headers.get("x-real-ip")
    ?? null;

  const user = await findUserForLogin(username);
  const passwordOk = user ? verifyPassword(password, user.salt, user.password_hash) : false;

  if (!user || !passwordOk) {
    if (user) await recordLoginEvent(user.id, "failed_password", ua, ip);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  if (user.totp_enabled) {
    if (!token) return NextResponse.json({ totp_required: true }, { status: 200 });

    const secret = await getTotpSecret(user.id);
    if (!secret) return NextResponse.json({ error: "2FA configuration error." }, { status: 500 });

    let valid = false;
    try {
      valid = verifySync({ token, secret, epochTolerance: 90 })?.valid === true;
    } catch {
      valid = false;
    }
    if (!valid) {
      await recordLoginEvent(user.id, "failed_2fa", ua, ip);
      return NextResponse.json({ error: "Invalid 2FA code. Try again." }, { status: 401 });
    }
  }

  await recordLoginEvent(user.id, "success", ua, ip);
  await createSession(user.id, request);
  return NextResponse.json({
    user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, created_at: user.created_at },
  });
}
