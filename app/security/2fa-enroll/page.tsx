"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Shell, { PageHead } from "@/app/components/Shell";
import OtpInput from "@/app/components/OtpInput";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";

type Step = "intro" | "qr" | "verify" | "done";

export default function TwoFactorEnrollPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, reloadVehicles } = useApp();

  const [step, setStep] = useState<Step>("intro");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const startSetup = async () => {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/2fa/setup", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "Could not start setup."); return; }

    setSecret(data.secret);
    const dataUrl = await QRCode.toDataURL(data.otpauth, { width: 240, margin: 2, color: { dark: "#0d1218", light: "#ffffff" } });
    setQrDataUrl(dataUrl);
    setStep("qr");
  };

  const verify = async (token: string) => {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "Invalid code."); return; }
    setStep("done");
  };

  const stepNum = step === "intro" ? 1 : step === "qr" ? 2 : step === "verify" ? 3 : 4;

  return (
    <Shell title="2FA Setup">
      <PageHead
        eyebrow="Two-factor authentication"
        title="Set up authenticator app"
        lead="Takes about 2 minutes. Works with 1Password, Authy, Google Authenticator, and any TOTP app."
        right={<a href="/security" className="btn btn-ghost btn-sm">← Back to security</a>}
      />

      {/* Progress */}
      <div className="stepper" style={{ marginBottom: 32 }}>
        {[
          { n: 1, label: "Overview" },
          { n: 2, label: "Scan QR" },
          { n: 3, label: "Verify" },
          { n: 4, label: "Done" },
        ].map((s, i, arr) => {
          const state = stepNum > s.n ? "done" : stepNum === s.n ? "active" : "todo";
          return (
            <>
              <div key={s.n} className={`step ${state === "done" ? "done" : state === "active" ? "active" : ""}`}>
                <div className="step-bubble">{state === "done" ? "✓" : s.n}</div>
                <div className="step-label">{s.label}</div>
              </div>
              {i < arr.length - 1 && <div className={`step-bar ${stepNum > s.n ? "done" : ""}`} />}
            </>
          );
        })}
      </div>

      <div style={{ maxWidth: 560 }}>

        {/* Step 1 — Intro */}
        {step === "intro" && (
          <div className="card card-pad-lg fade-in col gap-4">
            <div className="col gap-3">
              {[
                { icon: "smartphone", label: "Get your app ready", sub: "Open 1Password, Authy, Google Authenticator, or any TOTP app on your phone." },
                { icon: "qr_code_scanner", label: "Scan a QR code", sub: "We'll show you a QR code to scan. Your app will start generating 6-digit codes." },
                { icon: "verified_user", label: "Enter a code to confirm", sub: "Type in one code from the app to prove it's working before we enable 2FA." },
              ].map((item, i) => (
                <div key={i} className="row gap-4" style={{ alignItems: "flex-start", padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "var(--r-2)", background: "var(--brand-soft)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <span className="ms" style={{ color: "var(--brand)" }}>{item.icon}</span>
                  </div>
                  <div>
                    <div className="bold" style={{ fontSize: 14 }}>{item.label}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row gap-2" style={{ paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <div className="row gap-2" style={{ flex: 1 }}>
                {["1Password", "Authy", "Google"].map((app) => (
                  <span key={app} className="pill" style={{ fontSize: 11 }}>{app}</span>
                ))}
              </div>
              <button className="btn btn-primary" onClick={startSetup} disabled={busy}>
                {busy ? "Generating…" : <><span>Get started</span> <span className="ms sm">arrow_forward</span></>}
              </button>
            </div>
            {err && <div className="field-error">{err}</div>}
          </div>
        )}

        {/* Step 2 — QR code */}
        {step === "qr" && (
          <div className="card card-pad-lg fade-in col gap-5">
            <div>
              <div className="bold" style={{ marginBottom: 4 }}>Scan this QR code</div>
              <div className="muted" style={{ fontSize: 13 }}>Open your authenticator app, tap the + button, and choose &quot;Scan QR code&quot;.</div>
            </div>

            <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
              {qrDataUrl && (
                <div style={{ padding: 12, background: "#fff", borderRadius: "var(--r-2)", border: "1px solid var(--line)", flex: "none" }}>
                  <img src={qrDataUrl} width={200} height={200} alt="2FA QR code" />
                </div>
              )}
              <div className="col gap-3" style={{ flex: 1, minWidth: 200 }}>
                <div>
                  <div className="cap" style={{ marginBottom: 6 }}>Can&apos;t scan? Enter manually</div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>In your app choose &quot;Enter key manually&quot; and paste this:</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="mono" style={{
                      fontSize: 13, letterSpacing: "0.08em", padding: "8px 12px",
                      background: "var(--bg-2)", border: "1px solid var(--line)",
                      borderRadius: "var(--r-1)", flex: 1, wordBreak: "break-all",
                      filter: showSecret ? "none" : "blur(5px)", userSelect: showSecret ? "all" : "none",
                      transition: "filter 0.2s",
                    }}>
                      {secret}
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={() => setShowSecret((s) => !s)}>
                      <span className="ms sm">{showSecret ? "visibility_off" : "visibility"}</span>
                    </button>
                    {showSecret && (
                      <button className="btn btn-sm btn-ghost" onClick={() => { navigator.clipboard.writeText(secret); toast({ tone: "good", icon: "content_copy", title: "Secret copied" }); }}>
                        <span className="ms sm">content_copy</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="card card-pad" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.3)" }}>
                  <div className="row gap-2" style={{ alignItems: "flex-start" }}>
                    <span className="ms sm" style={{ color: "var(--warn)", marginTop: 1 }}>lock</span>
                    <div className="muted" style={{ fontSize: 12 }}>Keep this key private. Anyone with it can generate valid codes for your account.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row gap-2" style={{ justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-ghost" onClick={() => setStep("intro")}>← Back</button>
              <button className="btn btn-primary" onClick={() => { setCode(""); setErr(""); setStep("verify"); }}>
                I&apos;ve scanned it <span className="ms sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Verify */}
        {step === "verify" && (
          <div className="card card-pad-lg fade-in col gap-5">
            <div style={{ textAlign: "center" }}>
              <span className="ms xl" style={{ color: "var(--brand)", fontSize: 48 }}>phone_iphone</span>
              <div className="bold" style={{ fontSize: 18, marginTop: 12 }}>Enter the 6-digit code</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                Open your authenticator app and enter the code shown for <strong>ViperLink</strong>.
              </div>
            </div>

            <OtpInput length={6} value={code} onChange={setCode} onComplete={verify} autoFocus />

            {err && <div className="field-error" style={{ textAlign: "center" }}>{err}</div>}

            <div className="row gap-2" style={{ justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => { setErr(""); setStep("qr"); }}>← Back</button>
              <button className="btn btn-primary" onClick={() => verify(code)} disabled={busy || code.length < 6}>
                {busy ? "Verifying…" : "Confirm & enable 2FA"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && (
          <div className="card card-pad-lg fade-in col gap-4" style={{ textAlign: "center", alignItems: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--good-soft)", border: "2px solid var(--good)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="ms xl" style={{ color: "var(--good)", fontSize: 36 }}>check_circle</span>
            </div>
            <div>
              <div className="bold" style={{ fontSize: 20 }}>2FA is now active</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Your account is protected. You&apos;ll need your authenticator app each time you sign in.</div>
            </div>
            <div className="row gap-2" style={{ justifyContent: "center", marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => router.push("/security")}>
                Back to security <span className="ms sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
