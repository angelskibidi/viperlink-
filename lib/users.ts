import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type UserRole = "admin" | "user";

export type AppUser = {
  id: string;
  auth_user_id?: string | null;
  username: string;
  email: string | null;
  name: string;
  role: UserRole;
  created_at: string;
};

type UserRow = AppUser & {
  password_hash: string;
  salt: string;
};

function now() {
  return new Date().toISOString();
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (hashBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}

function toAppUser(user: UserRow): AppUser {
  return {
    id: user.id,
    auth_user_id: user.auth_user_id ?? null,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at,
  };
}

async function getAuthUserIdByEmail(email: string) {
  // Supabase Admin does not expose a direct get-by-email helper in all versions,
  // so scan a small number of pages. ViperLink is a portfolio/demo-scale app.
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 1000) break;
  }

  return null;
}

async function createOrGetSupabaseAuthUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const existingId = await getAuthUserIdByEmail(input.email);
  if (existingId) return existingId;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      username: input.username,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("duplicate")) {
      const authUserId = await getAuthUserIdByEmail(input.email);
      if (authUserId) return authUserId;
    }
    throw error;
  }

  return data.user.id;
}

async function ensureDefaultAdmin() {
  const { data: existingAdmin, error: findError } = await supabaseAdmin
    .from("app_users")
    .select("id")
    .eq("username", "admin")
    .maybeSingle();

  if (findError) throw findError;
  if (existingAdmin) return;

  const { hash, salt } = hashPassword("viper123");
  const email = "admin@viperlink.local";
  let authUserId: string | null = null;

  try {
    authUserId = await createOrGetSupabaseAuthUser({
      email,
      password: "viper123",
      name: "Angel",
      username: "admin",
    });
  } catch (error) {
    // The local .local admin email is only for demo login. If Supabase Auth rejects it,
    // keep the app admin login working through app_users.
    console.warn("Default admin Supabase Auth mirror skipped:", error);
  }

  const { error } = await supabaseAdmin.from("app_users").insert({
    auth_user_id: authUserId,
    username: "admin",
    email,
    name: "Angel",
    password_hash: hash,
    salt,
    role: "admin",
    created_at: now(),
    updated_at: now(),
  });

  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    throw error;
  }
}

export async function findUserForLogin(identifier: string): Promise<UserRow | null> {
  await ensureDefaultAdmin();

  const cleanIdentifier = identifier.trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("*")
    .or(`username.eq.${cleanIdentifier},email.eq.${cleanIdentifier}`)
    .maybeSingle();

  if (error) throw error;
  return (data as UserRow | null) ?? null;
}

export async function createUser(input: { username: string; email: string; name: string; password: string; role?: UserRole }) {
  await ensureDefaultAdmin();

  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const { hash, salt } = hashPassword(input.password);
  const authUserId = await createOrGetSupabaseAuthUser({
    email,
    password: input.password,
    name,
    username,
  });

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .insert({
      auth_user_id: authUserId,
      username,
      email,
      name,
      password_hash: hash,
      salt,
      role: input.role ?? "user",
      created_at: now(),
      updated_at: now(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return toAppUser(data as UserRow);
}

export async function getUserById(id: string): Promise<AppUser | null> {
  await ensureDefaultAdmin();

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, auth_user_id, username, email, name, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as AppUser | null) ?? null;
}

export async function listUsers(): Promise<AppUser[]> {
  await ensureDefaultAdmin();

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, auth_user_id, username, email, name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function ensureSupabaseAuthForEmail(email: string) {
  await ensureDefaultAdmin();

  const cleanEmail = email.trim().toLowerCase();
  const { data: appUser, error } = await supabaseAdmin
    .from("app_users")
    .select("id, auth_user_id, email, username, name")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (error) throw error;
  if (!appUser) return null;
  if (appUser.auth_user_id) return appUser.auth_user_id as string;

  const tempPassword = crypto.randomBytes(32).toString("base64url");
  const authUserId = await createOrGetSupabaseAuthUser({
    email: cleanEmail,
    password: tempPassword,
    name: String(appUser.name ?? "ViperLink User"),
    username: String(appUser.username ?? cleanEmail),
  });

  const { error: updateError } = await supabaseAdmin
    .from("app_users")
    .update({ auth_user_id: authUserId, updated_at: now() })
    .eq("id", appUser.id);

  if (updateError) throw updateError;
  return authUserId;
}

export async function updatePasswordByAuthToken(accessToken: string, password: string) {
  await ensureDefaultAdmin();

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user?.email) return false;

  const email = data.user.email.toLowerCase();
  const { hash, salt } = hashPassword(password);

  const { error: updateError } = await supabaseAdmin
    .from("app_users")
    .update({
      auth_user_id: data.user.id,
      password_hash: hash,
      salt,
      updated_at: now(),
    })
    .eq("email", email);

  if (updateError) throw updateError;

  await supabaseAdmin.auth.admin.updateUserById(data.user.id, { password });
  return true;
}
