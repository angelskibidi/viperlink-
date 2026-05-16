"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/app/components/AuthLayout";
import Strength, { scorePassword } from "@/app/components/Strength";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", username: "", email: "",
    country: "+1", phone: "", password: "", agree: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const score = scorePassword(form.password);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!form.agree) { setErr("Accept the terms to continue."); return; }
    setBusy(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, username: form.username, email: form.email, password: form.password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setErr(data.error ?? "Could not create account."); return; }

    const loginRes = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.username, password: form.password }),
    });
    setBusy(false);
    router.push(loginRes.ok ? "/setup/module" : "/login");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Create your account"
      sub="Takes about a minute. You'll pair your alarm module next."
      footer={
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          <span className="muted">Already have an account?</span>
          <a href="/login" style={{ fontWeight: 700, color: "var(--brand)" }}>Sign in</a>
        </div>
      }
    >
      <form className="col gap-4" onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="field-label">Full name</label>
            <input className="input" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alex Rivera" required />
          </div>
          <div className="field">
            <label className="field-label">Username</label>
            <input className="input" value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="your_handle" required />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@somewhere.com" />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required />
          <Strength score={score} />
        </div>

        <label className="row gap-2" style={{ cursor: "pointer", fontSize: 13, alignItems: "flex-start" }}>
          <span className={`check ${form.agree ? "on" : ""}`} onClick={(e) => { e.preventDefault(); set("agree", !form.agree); }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>
            I agree to the{" "}
            <a style={{ textDecoration: "underline", fontWeight: 700, color: "var(--brand)" }}>Terms</a>{" "}
            and the{" "}
            <a style={{ textDecoration: "underline", fontWeight: 700, color: "var(--brand)" }}>Privacy Policy</a>.
          </span>
        </label>

        {err && <div className="field-error">{err}</div>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? "Creating account…" : <><span>Create account</span> <span className="ms sm">arrow_forward</span></>}
        </button>
      </form>
    </AuthLayout>
  );
}
