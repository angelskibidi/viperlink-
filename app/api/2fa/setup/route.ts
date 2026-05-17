import { NextResponse } from "next/server";
import { generateSecret, generateURI } from "otplib";
import { getCurrentUser } from "@/lib/auth";
import { saveTotpSecret } from "@/lib/users";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const secret = generateSecret();
  const ok = await saveTotpSecret(user.id, secret);
  if (!ok) return NextResponse.json({ error: "Could not save secret." }, { status: 500 });

  const account = user.email ?? user.username;
  const otpauth = generateURI({ secret, label: account, issuer: "ViperLink" });

  return NextResponse.json({ secret, otpauth });
}
