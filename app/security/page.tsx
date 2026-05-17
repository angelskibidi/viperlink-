"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell, { PageHead } from "@/app/components/Shell";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";
import { COMMON_TIMEZONES, formatTs, formatTsShort, timeAgo, getStoredTz, setStoredTz } from "@/lib/time";

type Session = { id: string; label: string; icon: string; created_at: string; last_used_at: string; ip: string | null; current: boolean };

export default function SecurityPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useApp();
  const [has2FA, setHas2FA] = useState(user?.totp_enabled ?? false);
  useEffect(() => { if (user) setHas2FA(user.totp_enabled ?? false); }, [user]);
  const [tz, setTzState] = useState("");
  useEffect(() => { setTzState(getStoredTz()); }, []);
  const handleTzChange = (v: string) => { setStoredTz(v); setTzState(v); };
  const [sendingReset, setSendingReset] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => { if (d.sessions) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const revokeSession = async (id: string) => {
    const s = sessions.find((x) => x.id === id);
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((x) => x.id !== id));
    toast({ tone: "good", icon: "check_circle", title: "Session revoked", sub: s?.label });
  };

  const signOutEverywhere = async () => {
    await fetch("/api/sessions", { method: "DELETE" });
    router.push("/login");
  };

  type LoginEvent = { id: string; created_at: string; res: string; ua: string; ok: boolean };
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/login-events")
      .then((r) => r.json())
      .then((d) => { if (d.events) setLoginEvents(d.events); })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  // Password change modal
  const [pwModal, setPwModal] = useState(false);
  const [pwStep, setPwStep] = useState<1 | 2>(1);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const openPwModal = () => { setPwModal(true); setPwStep(1); setCurPw(""); setNewPw(""); setConfirmPw(""); setPwErr(""); };
  const closePwModal = () => { setPwModal(false); setPwStep(1); setCurPw(""); setNewPw(""); setConfirmPw(""); setPwErr(""); };

  const handlePwStep1 = () => {
    if (!curPw) { setPwErr("Enter your current password."); return; }
    setPwErr("");
    setPwStep(2);
  };

  const handlePwSubmit = async () => {
    if (!newPw) { setPwErr("Enter a new password."); return; }
    if (newPw.length < 6) { setPwErr("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwErr("Passwords don't match."); return; }
    setPwBusy(true);
    setPwErr("");
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    });
    setPwBusy(false);
    if (res.ok) {
      closePwModal();
      toast({ tone: "good", icon: "check_circle", title: "Password updated", sub: "Your password has been changed." });
    } else {
      const d = await res.json().catch(() => ({}));
      setPwErr(d.error ?? "Could not update password.");
      if (d.error?.toLowerCase().includes("current")) setPwStep(1);
    }
  };

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
              <div className={`switch ${has2FA ? "on" : ""}`} onClick={async () => {
                if (has2FA) {
                  await fetch("/api/2fa/disable", { method: "POST" });
                  setHas2FA(false);
                  toast({ tone: "crit", icon: "verified_user", title: "2FA disabled" });
                } else {
                  router.push("/security/2fa-enroll");
                }
              }} />
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Codes pulled from your authenticator app (1Password, Authy, Google). Stops a stolen password from unlocking your fleet.</div>
            {user?.totp_updated_at && (
              <div className="row gap-2" style={{ marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`pill ${has2FA ? "good" : "crit"}`}>
                  <span className="ms sm" style={{ fontSize: 10 }}>{has2FA ? "verified_user" : "no_encryption"}</span>
                  {has2FA ? "enabled" : "disabled"} {timeAgo(user.totp_updated_at)}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{formatTs(user.totp_updated_at, tz || undefined)}</span>
              </div>
            )}
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

            <div className="row gap-2">
              <button className="btn" onClick={openPwModal}>
                <span className="ms sm">lock_reset</span>Change password
              </button>
              <button className="btn btn-ghost" onClick={sendResetEmail} disabled={sendingReset}>
                <span className="ms sm">forward_to_inbox</span>
                {sendingReset ? "Sending…" : "Email me a reset link"}
              </button>
            </div>
          </div>

          {/* Password change modal */}
          {pwModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={closePwModal} />
              <div className="card card-pad-lg fade-in" style={{ position: "relative", width: 400, zIndex: 1 }}>
                <div className="row between" style={{ marginBottom: 20 }}>
                  <div>
                    <div className="cap">Change password</div>
                    <div className="bold" style={{ fontSize: 16, marginTop: 2 }}>
                      {pwStep === 1 ? "Step 1 of 2 · Verify identity" : "Step 2 of 2 · Set new password"}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={closePwModal} style={{ padding: "4px 8px" }}>
                    <span className="ms">close</span>
                  </button>
                </div>

                {pwStep === 1 && (
                  <div className="col gap-4 fade-in">
                    <div className="field">
                      <label className="field-label">Current password</label>
                      <input className="input" type="password" autoFocus value={curPw} onChange={(e) => setCurPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePwStep1()} placeholder="••••••••" />
                    </div>
                    {pwErr && <div className="field-error">{pwErr}</div>}
                    <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={closePwModal}>Cancel</button>
                      <button className="btn btn-primary" onClick={handlePwStep1}>Next <span className="ms sm">arrow_forward</span></button>
                    </div>
                  </div>
                )}

                {pwStep === 2 && (
                  <div className="col gap-4 fade-in">
                    <div className="field">
                      <label className="field-label">New password</label>
                      <input className="input" type="password" autoFocus value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="field">
                      <label className="field-label">Confirm new password</label>
                      <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !pwBusy && handlePwSubmit()} placeholder="••••••••" />
                    </div>
                    {pwErr && <div className="field-error">{pwErr}</div>}
                    <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost" onClick={() => { setPwStep(1); setPwErr(""); }}>← Back</button>
                      <button className="btn btn-primary" onClick={handlePwSubmit} disabled={pwBusy}>
                        {pwBusy ? "Updating…" : "Update password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col gap-4">
          {/* Timezone selector */}
          <div className="field">
            <label className="field-label">Time zone</label>
            <select className="select" value={tz} onChange={(e) => handleTzChange(e.target.value)}>
              {COMMON_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Sessions */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="cap">Active sessions</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Sign out anywhere you don't recognize.</div>
              </div>
              <button className="btn btn-sm" style={{ borderColor: "var(--crit)", color: "var(--crit)" }} onClick={signOutEverywhere}>
                <span className="ms sm">logout</span>sign out everywhere
              </button>
            </div>
            {sessionsLoading ? (
              <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>No active sessions found.</div>
            ) : sessions.map((s, i) => (
              <div key={s.id} className="row gap-3" style={{ padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)", alignItems: "center" }}>
                <span className="ms" style={{ color: "var(--ink-2)" }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="bold" style={{ fontSize: 13 }}>{s.label}</div>
                  <div className="row gap-2" style={{ marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="pill purple">
                      <span className="ms sm" style={{ fontSize: 10 }}>schedule</span>
                      logged in {timeAgo(s.created_at)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{formatTs(s.created_at, tz || undefined)}</span>
                    {s.ip && <span className="mono muted" style={{ fontSize: 11 }}>· {s.ip}</span>}
                  </div>
                </div>
                {s.current
                  ? <span className="pill good"><span className="dot" />this device</span>
                  : <button className="btn btn-sm btn-ghost" onClick={() => revokeSession(s.id)}>revoke</button>}
              </div>
            ))}
          </div>

          {/* Recent sign-in */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="cap">Recent sign-in activity</div>
            </div>
            {eventsLoading ? (
              <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>Loading…</div>
            ) : loginEvents.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>No sign-in activity yet.</div>
            ) : loginEvents.map((r, i) => (
              <div key={r.id} className="col gap-1" style={{ padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                <div className="row gap-3" style={{ alignItems: "center" }}>
                  <span className="mono bold" style={{ fontSize: 12, color: r.ok ? "var(--good)" : "var(--crit)", flexShrink: 0 }}>{r.res}</span>
                  <span className="mono muted" style={{ fontSize: 11, flexShrink: 0 }}>{timeAgo(r.created_at)}</span>
                </div>
                <div className="mono muted" style={{ fontSize: 11 }}>{formatTsShort(r.created_at, tz || undefined)}</div>
                <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.ua}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
