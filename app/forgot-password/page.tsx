"use client";

import { FormEvent, useState } from "react";
import AuthLayout from "@/app/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [val, setVal] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: val }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Could not send reset email.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout
      title="Forgot password?"
      sub={sent
        ? "If that account exists, a link is on its way. Check spam too."
        : "Enter the email tied to your ViperLink account. We'll send a reset link valid for 30 minutes."}
      footer={
        <div className="col gap-2" style={{ alignItems: "center" }}>
          <a href="/login" style={{ fontWeight: 700, color: "var(--brand)" }}>← back to sign in</a>
        </div>
      }
    >
      {!sent ? (
        <form className="col gap-4" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Email or username</label>
            <input className="input" autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="you@somewhere.com" required />
          </div>
          {err && <div className="field-error">{err}</div>}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? "Sending…" : <><span>Send reset link</span> <span className="ms sm">arrow_forward</span></>}
          </button>
        </form>
      ) : (
        <div className="col gap-4">
          <div className="card card-pad row gap-3" style={{ alignItems: "flex-start", borderColor: "rgba(16,185,129,0.3)" }}>
            <span className="ms fill" style={{ color: "var(--good)" }}>mark_email_read</span>
            <div style={{ flex: 1 }}>
              <div className="bold">Email sent (if account exists)</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                For security, we don't confirm whether the email is registered. Open the link in the email to continue.
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
