"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/app/components/AuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!username || !password) { setErr("Username and password are required."); return; }
    setBusy(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Invalid credentials.");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Sign in"
      sub="Welcome back. Sign in with your username or email."
      footer={
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          <span className="muted">No account?</span>
          <a href="/register" style={{ fontWeight: 700, color: "var(--brand)" }}>Register a vehicle</a>
        </div>
      }
    >
      <form className="col gap-4" onSubmit={submit}>
        <div className="field">
          <label className="field-label">Username or Email</label>
          <input className="input" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username or email" />
        </div>
        <div className="field">
          <div className="row between">
            <label className="field-label">Password</label>
            <a href="/forgot-password" className="muted" style={{ fontSize: 12, textDecoration: "underline" }}>Forgot?</a>
          </div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <label className="row gap-2" style={{ cursor: "pointer", fontSize: 13 }}>
          <span className={`check ${remember ? "on" : ""}`} onClick={(e) => { e.preventDefault(); setRemember((r) => !r); }} />
          Keep me signed in on this device
        </label>

        {err && <div className="field-error">{err}</div>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? "Signing in…" : <><span>Sign in</span> <span className="ms sm">arrow_forward</span></>}
        </button>

        <div className="row gap-3" style={{ marginTop: 4, alignItems: "center" }}>
          <hr className="hr" style={{ flex: 1 }} />
          <span className="cap" style={{ fontSize: 10 }}>or</span>
          <hr className="hr" style={{ flex: 1 }} />
        </div>

        <a href="/register" className="btn btn-outline btn-block" style={{ textAlign: "center" }}>
          Create account
        </a>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
