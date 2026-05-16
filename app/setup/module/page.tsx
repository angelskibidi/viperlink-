"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";

function genModuleId() {
  const h = () => Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VLK-${h()}-${h()}`;
}

function SetupStepper({ step }: { step: number }) {
  const steps = [{ n: 1, label: "Module" }, { n: 2, label: "Vehicle" }, { n: 3, label: "Ready" }];
  return (
    <div className="stepper" style={{ marginBottom: 24 }}>
      {steps.map((s, i) => {
        const state = step > s.n ? "done" : step === s.n ? "active" : "todo";
        return (
          <>
            <div key={s.n} className={`step ${state === "done" ? "done" : state === "active" ? "active" : ""}`}>
              <div className="step-bubble">{state === "done" ? "✓" : s.n}</div>
              <div className="step-label">{s.label}</div>
            </div>
            {i < steps.length - 1 && <div className={`step-bar ${step > s.n ? "done" : ""}`} />}
          </>
        );
      })}
    </div>
  );
}

export default function SetupModulePage() {
  const router = useRouter();
  const toast = useToast();
  const { vehicles } = useApp();
  const hasVehicles = vehicles.length > 0;
  const [moduleId, setModuleId] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "paired" | "failed">("idle");

  const valid = /^VLK-[A-F0-9]{4}-[A-F0-9]{4}$/i.test(moduleId.trim());

  const pair = () => {
    if (!valid) return;
    setStatus("searching");
    setTimeout(() => {
      setStatus("paired");
      toast({ tone: "good", icon: "cell_tower", title: "Module paired", sub: moduleId.toUpperCase() });
      setTimeout(() => router.push(`/setup/vehicle?moduleId=${encodeURIComponent(moduleId.toUpperCase())}&moduleSecret=${encodeURIComponent(secret)}`), 700);
    }, 1500);
  };

  return (
    <div className="auth" style={{ gridTemplateColumns: "1fr" }}>
      <div className="auth-form-wrap" style={{ alignItems: "flex-start", paddingTop: 48 }}>
        <div style={{ width: "100%", maxWidth: 1080 }}>
          <div className="row between" style={{ marginBottom: 24 }}>
            <div className="auth-brand">
              <div className="sidebar-mark">V</div>
              <span>ViperLink</span>
              <span className="cap" style={{ marginLeft: 12 }}>first-run setup</span>
            </div>
            <div className="row gap-2">
              {hasVehicles && <a href="/" className="btn btn-ghost btn-sm">go to dashboard</a>}
              <button className="btn btn-ghost btn-sm" onClick={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/login"); }}>
                <span className="ms sm">logout</span>sign out
              </button>
            </div>
          </div>

          <SetupStepper step={1} />

          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, marginTop: 8 }}>
            <div>
              <div className="h1" style={{ marginBottom: 8 }}>Connect your alarm module</div>
              <div className="lead" style={{ marginBottom: 24 }}>Pull the sticker off your module and type the ID below — exactly as printed.</div>

              <div className="card card-pad-lg">
                <div className="field" style={{ marginBottom: 16 }}>
                  <label className="field-label">Module ID</label>
                  <input className="input mono" placeholder="VLK-XXXX-XXXX" value={moduleId} onChange={(e) => setModuleId(e.target.value.toUpperCase())} style={{ fontSize: 17, letterSpacing: "0.1em" }} autoFocus />
                  <span className="field-hint">format · VLK-XXXX-XXXX</span>
                </div>
                <div className="field">
                  <label className="field-label">Pairing secret <span style={{ color: "var(--ink-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <input className="input mono" placeholder="vlk_sk_••••••••••••••••" value={secret} onChange={(e) => setSecret(e.target.value)} />
                  <span className="field-hint">printed under the QR sticker</span>
                </div>
              </div>

              <div className="card card-pad" style={{ marginTop: 16, borderStyle: "dashed", background: "var(--bg-2)" }}>
                <div className="row between gap-3">
                  <div>
                    <div className="cap">Sim mode</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>No real module on hand? Generate a fake one.</div>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => { setModuleId(genModuleId()); toast({ tone: "brand", icon: "flash_on", title: "Sim module generated" }); }}>
                    <span className="ms sm">bolt</span>generate fake ID
                  </button>
                </div>
              </div>

              {status !== "idle" && (
                <div className="card card-pad" style={{ marginTop: 16 }}>
                  <div className="row gap-3" style={{ alignItems: "center" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      border: `2px solid ${status === "paired" ? "var(--good)" : status === "failed" ? "var(--crit)" : "var(--brand)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: status === "paired" ? "var(--good)" : status === "failed" ? "var(--crit)" : "var(--brand)",
                      background: status === "paired" ? "var(--good-soft)" : status === "failed" ? "var(--crit-soft)" : "var(--brand-soft)",
                    }}>
                      <span className="ms">{status === "paired" ? "check" : status === "failed" ? "close" : "wifi_tethering"}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="bold">{status === "searching" ? "Reaching module…" : status === "paired" ? "Paired · ready" : "Could not reach module"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{status === "searching" ? "handshake · firmware check" : status === "paired" ? "Continue to vehicle profile." : "Power-cycle the module and try again."}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row between" style={{ marginTop: 24 }}>
                {hasVehicles ? <a href="/" className="btn btn-ghost">← back to dashboard</a> : <div />}
                <div className="row gap-2">
<button className="btn btn-primary btn-lg" disabled={!valid || status === "searching"} onClick={pair}>
                    {status === "searching" ? "Pairing…" : <><span>Pair & continue</span> <span className="ms sm">arrow_forward</span></>}
                  </button>
                </div>
              </div>
            </div>

            <div className="col gap-4">
              <div className="card card-pad-lg">
                <div className="cap" style={{ marginBottom: 10 }}>Where to find it</div>
                <div className="muted" style={{ fontSize: 13 }}>The module is the matchbox-sized brain wired into your fuse panel — typically behind the dashboard near the steering column.</div>
                <div className="row gap-2" style={{ marginTop: 14 }}>
                  <button className="btn btn-sm btn-outline"><span className="ms sm">help</span>help</button>
                </div>
              </div>
              <div className="card card-pad" style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.06)" }}>
                <div className="row gap-3" style={{ alignItems: "flex-start" }}>
                  <span className="ms" style={{ color: "var(--warn)" }}>info</span>
                  <div>
                    <div className="bold">Heads-up</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>The module must be powered. Check the green LED on the lid is solid before pairing.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
