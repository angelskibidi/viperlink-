import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ensureSupabaseAuthForEmail } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter the email address on your account." }, { status: 400 });
    }

    await ensureSupabaseAuthForEmail(email);

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const redirectTo = `${origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "If that email exists, Supabase sent a password reset link.",
    });
  } catch (error) {
    console.error("POST /api/forgot-password error:", error);
    return NextResponse.json(
      { error: "Could not send reset email. Check Supabase Auth email settings and redirect URLs." },
      { status: 400 },
    );
  }
}
