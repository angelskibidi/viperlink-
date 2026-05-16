"use client";

import { useState } from "react";
import Shell, { PageHead } from "@/app/components/Shell";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";

const RECOVERY_CODES = ["4F2A-9C04", "V8E1-77RR", "KQ2X-LM93", "0PNB-44XS", "HJ7T-9AB1", "3DZE-WK20", "YN6Q-8VV4", "C5L0-EZ8M", "1RAX-PT0K", "TF92-MN6Y"];

const sessions = [
  { id: "s1", label: "MacBook Pro · Safari", sub: "just now", icon: "laptop_mac", pill: "this device" },
  { id: "s2", label: "iPhone 15 · Mobile app", sub: "4m ago", icon: "smartphone", pill: null },
  { id: "s3", label: "Windows · Chrome", sub: "2 hours ago", icon: "desktop_windows", pill: null },
  { id: "s4", label: "Unknown · curl 8.4", sub: "16 hours ago", icon: "terminal", pill: "review" },
];

export default function SecurityPage() {
  const toast = useToast();
  const { user } = useApp();
  const [has2FA, setHas2FA] = useState(true);
  const [showCodes, setShowCodes] = useState(false);
  const [pw, setPw] = useState({ cur: "", new: "" });
  const [sendingReset, setSendingReset] = useState(false);

  const sendResetEmail = async () => {
    if (!user?.email) { toast({ tone: "crit", icon: "error", title: "No email on this account" }); return; }
    setSendingReset(true);
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    setSendingReset(false);
    if (res.ok) {
      toast({ tone: "good", icon: "forward_to_inbox", title: "Reset link sent", sub: `Check ${user.email}` });
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ tone: "crit", icon: "error", title: d.error ?? "Could not send reset email" });
    }
  };

  return (
    <Shell title="Security">
      <PageHead
        eyebrow="Account security"
        title="Security & access"
        lead="2FA, sessions, password, sign-in activity. All your auth controls in one place."
        right={
          <span className={`pill ${has2FA ? "good" : "crit"} live`}>
            <span className="dot" />2FA {has2FA ? "enabled · TOTP" : "disabled"}
          </span>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div className="col gap-4">
          {/* 2FA card */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="cap">Two-factor authentication</div>
                <div className="h2" style={{ fontSize: 20, marginTop: 4 }}>Authenticator app · TOTP</div>
              </div>
              <div className={`switch ${has2FA ? "on" : ""}`} onClick={() => {
                setHas2FA((v) => !v);
                toast({ tone: has2FA ? "crit" : "good", icon: "verified_user", title: has2FA ? "2FA disabled" : "2FA enabled" });
              }} />
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Codes pulled from your authenticator app (1Password, Authy, Google). Stops a stolen password from unlocking your fleet.</div>
            <div className="row gap-2" style={{ marginTop: 14, flexWrap: "wrap" }}>
              <a href="/security/2fa-enroll" className="btn btn-sm btn-outline"><span className="ms sm">qr_code_2</span>reconfigure</a>
              <button className="btn btn-sm btn-outline" onClick={() => setShowCodes((s) => !s)}>
                <span className="ms sm">vpn_key</span>{showCodes ? "hide" : "view"} recovery codes
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => toast({ tone: "brand", icon: "autorenew", title: "New recovery codes generated", sub: "Old codes are invalidated." })}>
                <span className="ms sm">autorenew</span>regenerate
              </button>
            </div>

            {showCodes && (
              <div className="card card-pad fade-in" style={{ marginTop: 14, padding: 12, background: "var(--bg-2)" }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div className="cap">10 recovery codes · use each once</div>
                  <button className="btn btn-sm btn-ghost" onClick={async () => {
                    await navigator.clipboard.writeText(RECOVERY_CODES.join("\n"));
                    toast({ tone: "good", icon: "content_copy", title: "Codes copied" });
                  }}><span className="ms sm">content_copy</span>copy all</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {RECOVERY_CODES.map((c, i) => (
                    <div key={i} className="mono" style={{ padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, background: "var(--surface)" }}>{c}</div>
                  ))}
                </div>
              </div>
            )}

            <hr className="hr" style={{ margin: "18px 0" }} />
            <div className="cap" style={{ marginBottom: 10 }}>Other methods</div>
            <div className="col gap-2">
              {[
                { id: "sms", label: "SMS backup", sub: "Backup method", icon: "sms", on: true },
                { id: "hw", label: "Hardware key (YubiKey)", sub: "Most resistant to phishing", icon: "usb", on: false },
                { id: "passkey", label: "Passkey on this device", sub: "Recommended", icon: "fingerprint", on: false },
              ].map((m) => (
                <div key={m.id} className="row between" style={{ padding: "10px 0", borderTop: "1px solid var(--line-soft)" }}>
                  <div className="row gap-3" style={{ alignItems: "center" }}>
                    <span className="ms" style={{ color: "var(--ink-2)" }}>{m.icon}</span>
                    <div>
                      <div className="bold" style={{ fontSize: 14 }}>{m.label}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{m.sub}</div>
                    </div>
                  </div>
                  {m.on ? <span className="pill good"><span className="dot" />on</span> : <button className="btn btn-sm btn-outline">set up</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="cap">Password</div>
              <span className="muted mono" style={{ fontSize: 11 }}>last changed recently</span>
            </div>

            {user?.email && (
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="field-label">Account email</label>
                <div className="input mono" style={{ background: "var(--bg-2)", color: "var(--ink-2)", cursor: "default", userSelect: "all" }}>
                  {user.email}
                </div>
                <span className="field-hint">Reset links are sent to this address.</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="field-label">Current</label>
                <input className="input" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="field">
                <label className="field-label">New</label>
                <input className="input" type="password" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => {
                if (!pw.cur || !pw.new) { toast({ tone: "crit", icon: "error", title: "Fill both fields" }); return; }
                setPw({ cur: "", new: "" });
                toast({ tone: "good", icon: "check_circle", title: "Password updated", sub: "Other sessions have been signed out." });
              }}>Update password</button>
              <button className="btn btn-ghost" onClick={sendResetEmail} disabled={sendingReset}>
                <span className="ms sm">forward_to_inbox</span>
                {sendingReset ? "Sending…" : "Email me a reset link"}
              </button>
            </div>
          </div>
        </div>

        <div className="col gap-4">
          {/* Sessions */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="cap">Active sessions</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Sign out anywhere you don't recognize.</div>
              </div>
              <button className="btn btn-sm" style={{ borderColor: "var(--crit)", color: "var(--crit)" }} onClick={() => toast({ tone: "crit", icon: "logout", title: "Signed out everywhere" })}>
                <span className="ms sm">logout</span>sign out everywhere
              </button>
            </div>
            {sessions.map((s, i) => (
              <div key={s.id} className="row gap-3" style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)", alignItems: "center" }}>
                <span className="ms" style={{ color: s.pill === "review" ? "var(--crit)" : "var(--ink-2)" }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="bold" style={{ fontSize: 13 }}>{s.label}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{s.sub}</div>
                </div>
                {s.pill === "this device"
                  ? <span className="pill good"><span className="dot" />this device</span>
                  : s.pill === "review"
                  ? <span className="pill crit live"><span className="dot" />review</span>
                  : <button className="btn btn-sm btn-ghost" onClick={() => toast({ tone: "good", icon: "check_circle", title: "Session revoked", sub: s.label })}>revoke</button>}
              </div>
            ))}
          </div>

          {/* Recent sign-in */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="cap">Recent sign-in activity</div>
            </div>
            {[
              { t: "just now", res: "✓ password", ua: "mac · safari", ok: true },
              { t: "4m ago", res: "✓ password", ua: "iphone · app", ok: true },
              { t: "yesterday", res: "✗ failed", ua: "unknown · curl", ok: false },
            ].map((r, i) => (
              <div key={i} className="row gap-3" style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 11, width: 80, color: "var(--ink-2)" }}>{r.t}</span>
                <span className="mono bold" style={{ fontSize: 12, width: 90, color: r.ok ? "var(--ink)" : "var(--crit)" }}>{r.res}</span>
                <span className="muted" style={{ fontSize: 13 }}>{r.ua}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
