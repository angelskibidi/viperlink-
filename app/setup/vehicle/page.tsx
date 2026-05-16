"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VehicleSilhouette from "@/app/components/VehicleSilhouette";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";

const COLORS = [
  { hex: "#0d1218", label: "Black" },
  { hex: "#9aa3b2", label: "Silver" },
  { hex: "#e8ecf2", label: "White" },
  { hex: "#c2362b", label: "Red" },
  { hex: "#1e40af", label: "Blue" },
  { hex: "#365314", label: "Green" },
];
const MAKES = ["Subaru", "Ford", "Honda", "Toyota", "Chevrolet", "BMW", "Audi", "Nissan", "Tesla", "Other"];

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

function SetupVehicleForm() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const { reloadVehicles } = useApp();
  const moduleId = params.get("moduleId") ?? "";
  const moduleSecret = params.get("moduleSecret") ?? "";

  const [form, setForm] = useState({ name: "", year: "2024", make: "Subaru", model: "", plate: "", color: "#0d1218" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!form.name) { toast({ tone: "crit", icon: "error", title: "Nickname required" }); return; }
    setBusy(true);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, make: form.make, model: form.model, year: form.year, moduleId: moduleId || undefined }),
    });
    if (!res.ok) { setBusy(false); toast({ tone: "crit", icon: "error", title: "Could not add vehicle" }); return; }
    const vehicle = await res.json();

    if (moduleId && moduleSecret) {
      await fetch(`/api/vehicles/${vehicle.id}/module`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, moduleSecret }),
      });
    }

    await reloadVehicles();
    toast({ tone: "good", icon: "celebration", title: "Setup complete!", sub: "Welcome to your dashboard." });
    setBusy(false);
    router.push("/");
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
            <button className="btn btn-ghost btn-sm" onClick={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/login"); }}>
              <span className="ms sm">logout</span>sign out
            </button>
          </div>

          <SetupStepper step={2} />

          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, marginTop: 8 }}>
            <div>
              <div className="h1" style={{ marginBottom: 8 }}>Tell us about the car</div>
              <div className="lead" style={{ marginBottom: 24 }}>The basics — used for the dashboard label and event annotations.</div>

              <div className="card card-pad-lg col gap-4">
                <div className="field">
                  <label className="field-label">Nickname</label>
                  <input className="input" autoFocus placeholder='"WRX", "the truck", whatever' value={form.name} onChange={(e) => set("name", e.target.value)} />
                  <span className="field-hint">This is what appears on the dashboard.</span>
                </div>
                <hr className="hr" />
                <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr", gap: 12 }}>
                  <div className="field">
                    <label className="field-label">Year</label>
                    <select className="select" value={form.year} onChange={(e) => set("year", e.target.value)}>
                      {Array.from({ length: 30 }).map((_, i) => { const y = 2026 - i; return <option key={y} value={y}>{y}</option>; })}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Make</label>
                    <select className="select" value={form.make} onChange={(e) => set("make", e.target.value)}>
                      {MAKES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Model</label>
                    <input className="input" placeholder="WRX STI" value={form.model} onChange={(e) => set("model", e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="field">
                    <label className="field-label">License plate <span style={{ color: "var(--ink-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                    <input className="input mono" placeholder="7VLK·442" value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} />
                  </div>
                  <div className="field">
                    <label className="field-label">Color</label>
                    <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                      {COLORS.map((c) => (
                        <button key={c.hex} type="button" title={c.label} onClick={() => set("color", c.hex)} style={{ width: 32, height: 32, borderRadius: "50%", background: c.hex, border: form.color === c.hex ? "2.5px solid var(--brand)" : "1.5px solid var(--line)", boxShadow: form.color === c.hex ? "0 0 0 2px var(--bg) inset" : "none", cursor: "pointer" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {moduleId && (
                <div className="card card-pad" style={{ marginTop: 16, borderStyle: "dashed" }}>
                  <div className="row between">
                    <div>
                      <div className="cap">Paired module</div>
                      <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{moduleId}</div>
                    </div>
                    <a href="/setup/module" className="btn btn-sm btn-ghost">← change module</a>
                  </div>
                </div>
              )}

              <div className="row between" style={{ marginTop: 24 }}>
                <a href="/setup/module" className="btn btn-ghost">← back</a>
                <button className="btn btn-primary btn-lg" onClick={finish} disabled={busy}>
                  {busy ? "Saving…" : <><span>Finish setup</span> <span className="ms sm">arrow_forward</span></>}
                </button>
              </div>
            </div>

            <div className="col gap-4">
              <div className="card card-pad-lg">
                <div className="cap" style={{ marginBottom: 8 }}>Live preview</div>
                <div style={{ height: 160, borderRadius: "var(--r-2)", background: "linear-gradient(135deg, var(--surface-2), var(--bg-2))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
                  <VehicleSilhouette tone={form.color} width={280} height={120} />
                </div>
                <div className="row gap-3" style={{ marginTop: 12, alignItems: "center" }}>
                  <div className="status-disc off" style={{ width: 56, height: 56, borderWidth: 2 }}>
                    <div className="status-disc-label" style={{ fontSize: 11 }}>DIS</div>
                  </div>
                  <div>
                    <div className="bold" style={{ fontSize: 18 }}>{form.name || "Your nickname"}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{form.year} {form.make} {form.model}</div>
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

export default function SetupVehiclePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <SetupVehicleForm />
    </Suspense>
  );
}
