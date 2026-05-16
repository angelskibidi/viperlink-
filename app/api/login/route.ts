import { NextResponse } from "next/server";
import { createSession, validateLogin } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  const user = await validateLogin(username, password);
  if (!user) return NextResponse.json({ error: "Invalid username/email or password." }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    },
  });
}
