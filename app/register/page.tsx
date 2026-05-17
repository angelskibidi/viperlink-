"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/app/components/AuthLayout";
import Strength, { scorePassword } from "@/app/components/Strength";
import OtpInput from "@/app/components/OtpInput";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "", agree: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // OTP modal
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpErr, setOtpErr] = useState("");

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const score = scorePassword(form.password);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (!form.agree) { setErr("Accept the terms to continue."); return; }
    if (!form.name || !form.username || !form.email || !form.password) { setErr("All required fields must be filled."); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);

    const res = await fetch("/api/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.error ?? "Could not send verification code."); return; }

    setOtpCode("");
    setOtpErr("");
    setOtpStep(true);
  }

  async function verifyOtp(code: string) {
    setOtpBusy(true);
    setOtpErr("");
    const res = await fetch("/api/verify-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        token: code,
        name: form.name,
        username: form.username,
        password: form.password,
      }),
    });
    setOtpBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setOtpErr(data.error ?? "Invalid code. Try again."); return; }

    router.push("/setup/module");
    router.refresh();
  }

  return (
    <>
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
            <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@somewhere.com" required />
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
            {busy ? "Sending code…" : <><span>Create account</span> <span className="ms sm">arrow_forward</span></>}
          </button>
        </form>
      </AuthLayout>

      {/* Email OTP modal */}
      {otpStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
          <div className="card card-pad-lg fade-in" style={{ position: "relative", width: 420, zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span className="ms xl" style={{ color: "var(--brand)", fontSize: 40 }}>mark_email_unread</span>
              <div className="h2" style={{ marginTop: 12 }}>Check your email</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                We sent a 6-digit code to <strong>{form.email}</strong>
              </div>
            </div>

            <OtpInput
              length={6}
              value={otpCode}
              onChange={setOtpCode}
              onComplete={verifyOtp}
              autoFocus
            />

            {otpErr && <div className="field-error" style={{ marginTop: 12, textAlign: "center" }}>{otpErr}</div>}

            <button
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 20 }}
              onClick={() => verifyOtp(otpCode)}
              disabled={otpBusy || otpCode.length < 6}
            >
              {otpBusy ? "Verifying…" : "Verify & create account"}
            </button>

            <div className="row" style={{ justifyContent: "center", marginTop: 14, gap: 6, fontSize: 13 }}>
              <span className="muted">Didn&apos;t get it?</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => {
                await fetch("/api/send-email-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email }) });
              }}>Resend code</button>
              <span className="muted">·</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setOtpStep(false)}>← Back</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
