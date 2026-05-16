"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/app/components/AuthLayout";
import Strength, { scorePassword } from "@/app/components/Strength";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("Opening secure reset session…");
  const [err, setErr] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);

  const score = scorePassword(pw);
  const rules = [
    { ok: pw.length >= 8, label: "at least 8 characters" },
    { ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw), label: "mix of upper and lower case" },
    { ok: /\d/.test(pw), label: "at least one number" },
    { ok: pw && pw === pw2, label: "matches the confirmation" },
  ];
  const canSubmit = rules.every((r) => r.ok) && !!accessToken;

  useEffect(() => {
    async function load() {
      setErr("");
      const code = params.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setMessage(""); setErr("This reset link is invalid or expired."); return; }
        setAccessToken(data.session?.access_token ?? "");
        setMessage("Reset link verified. Enter a new password.");
        return;
      }
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hat = hashParams.get("access_token") ?? "";
      const hrt = hashParams.get("refresh_token") ?? "";
      if (hat && hrt) {
        const { data, error } = await supabase.auth.setSession({ access_token: hat, refresh_token: hrt });
        if (error) { setMessage(""); setErr("This reset link is invalid or expired."); return; }
        setAccessToken(data.session?.access_token ?? hat);
        setMessage("Reset link verified. Enter a new password.");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) { setAccessToken(data.session.access_token); setMessage("Reset link verified. Enter a new password."); return; }
      setMessage(""); setErr("Open this page from the Supabase reset email link.");
    }
    load();
  }, [params]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(""); setMessage(""); setLoading(true);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, password: pw }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setErr(data.error ?? "Failed to update password."); return; }
    await supabase.auth.signOut();
    setMessage("Password updated. You can sign in now.");
    setAccessToken("");
  }

  const valid = !!accessToken;

  return (
    <AuthLayout
      title="Set a new password"
      sub={<>After this, every other session is signed out.</>}
    >
      <div className="col gap-4">
        <div className="card card-pad row gap-3" style={{
          alignItems: "flex-start",
          borderColor: valid ? "rgba(59,130,246,0.4)" : "rgba(239,68,68,0.4)",
          background: valid ? "var(--brand-soft)" : err ? "var(--crit-soft)" : "var(--surface)",
        }}>
          <span className="ms" style={{ color: valid ? "var(--brand)" : "var(--crit)" }}>{valid ? "link" : "link_off"}</span>
          <div style={{ flex: 1 }}>
            <div className="bold">{message || err}</div>
          </div>
        </div>

        {valid && (
          <form className="col gap-4" onSubmit={submit}>
            <div className="field">
              <div className="row between">
                <label className="field-label">New password</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)}>
                  <span className="ms sm">{show ? "visibility_off" : "visibility"}</span>{show ? "hide" : "show"}
                </button>
              </div>
              <input className="input" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
              <Strength score={score} />
            </div>
            <div className="field">
              <label className="field-label">Confirm new password</label>
              <input className="input" type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>

            <div className="card card-pad" style={{ padding: 12 }}>
              <div className="cap" style={{ marginBottom: 8 }}>Password must</div>
              <div className="col gap-1">
                {rules.map((r, i) => (
                  <div key={i} className="row gap-2" style={{ fontSize: 13 }}>
                    <span className="ms sm" style={{ color: r.ok ? "var(--good)" : "var(--ink-4)" }}>
                      {r.ok ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span style={{ color: r.ok ? "var(--ink)" : "var(--ink-3)" }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {err && <div className="field-error">{err}</div>}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!canSubmit || loading}>
              {loading ? "Updating…" : <><span>Reset &amp; sign me in</span> <span className="ms sm">arrow_forward</span></>}
            </button>
          </form>
        )}

        {!valid && !message && (
          <a href="/forgot-password" className="btn btn-primary">Request new link</a>
        )}

        <div className="text-c">
          <a href="/login" style={{ color: "var(--brand)", fontWeight: 700, fontSize: 13 }}>← back to sign in</a>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
