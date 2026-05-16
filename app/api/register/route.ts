import { NextResponse } from "next/server";
import { createUser } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!username || !name || !email || !password) {
      return NextResponse.json({ error: "Name, username, email, and password are required." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const user = await createUser({ username, name, email, password });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/register error:", error);
    const raw = JSON.stringify(error).toLowerCase();
    const message = raw.includes("duplicate") || raw.includes("unique") || raw.includes("already registered")
      ? "That username or email is already taken."
      : "Could not create account. Check your Supabase app_users schema and service role key.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
