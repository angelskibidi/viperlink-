import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createUser } from "@/lib/users";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "").trim();
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const phone = body.phone ? String(body.phone).trim() : undefined;

  if (!email || !token || !name || !username || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

  try {
    const user = await createUser({ name, username, email, password, phone });
    await createSession(user.id, request);
    return NextResponse.json({ user });
  } catch (err) {
    const raw = JSON.stringify(err).toLowerCase();
    const msg = raw.includes("duplicate") || raw.includes("unique")
      ? "That username or email is already taken."
      : "Could not create account.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
