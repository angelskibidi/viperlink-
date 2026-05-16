import crypto from "crypto";
import { cookies } from "next/headers";
import { findUserForLogin, getUserById, verifyPassword, type AppUser } from "@/lib/users";

const COOKIE_NAME = "viperlink_session";
const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-only-change-me";

type SessionPayload = { userId: string; exp: number };

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = encode({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const payload = decode(cookieStore.get(COOKIE_NAME)?.value);
  if (!payload) return null;
  return getUserById(payload.userId);
}

export async function validateLogin(identifier: string, password: string) {
  const user = await findUserForLogin(identifier.trim());
  if (!user) return null;
  if (!verifyPassword(password, user.salt, user.password_hash)) return null;
  return user;
}
