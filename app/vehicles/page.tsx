"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell, { PageHead } from "@/app/components/Shell";
import VehicleSilhouette from "@/app/components/VehicleSilhouette";
import { useApp, Vehicle } from "@/app/context/AppContext";

function Stat({ k, v, tone }: { k: string; v: string; tone: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="cap" style={{ fontSize: 10 }}>{k}</div>
      <div className="row gap-1" style={{ marginTop: 4 }}>
        <span className={`sd ${tone === "muted" ? "" : tone}`} />
        <span className="bold mono" style={{ fontSize: 12 }}>{v}</span>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const router = useRouter();
  const { vehicles, setSelectedVehicleId } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = vehicles.filter((v) => {
    if (q && !`${v.name} ${v.make} ${v.model}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "alerts" && v.alarm_status !== "TRIGGERED") return false;
    if (filter === "offline" && v.module_status === "online") return false;
    return true;
  });

  const counts = {
    all: vehicles.length,
    alerts: vehicles.filter((v) => v.alarm_status === "TRIGGERED").length,
    offline: vehicles.filter((v) => v.module_status !== "online").length,
  };

  return (
    <Shell title="Vehicles">
      <PageHead
        eyebrow="My garage"
        title="Vehicles"
        lead={`${vehicles.length} paired · ${counts.alerts} need attention`}
        right={
          <div className="row gap-2">
            <div style={{ position: "relative" }}>
              <span className="ms sm" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>search</span>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vehicles…" style={{ paddingLeft: 32, width: 240 }} />
            </div>
            <a href="/setup/module" className="btn btn-primary"><span className="ms sm">add</span>Pair vehicle</a>
          </div>
        }
      />

      <div className="row gap-2" style={{ marginBottom: 16, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
        {([["all", "All"], ["alerts", "Needs attention"], ["offline", "Offline"]] as [string, string][]).map(([k, label]) => (
          <button key={k} className={`tab ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
            {label} <span className="mono muted" style={{ marginLeft: 6, fontSize: 11 }}>{counts[k as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {filtered.map((v) => {
          const alert = v.alarm_status === "TRIGGERED";
          const offline = v.module_status !== "online";
          return (
            <div key={v.id} className={`vcard ${alert ? "alert" : ""}`}
              onClick={() => { setSelectedVehicleId(v.id); router.push(`/vehicles/${v.id}`); }}>
              <div className="row between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="bold" style={{ fontSize: 16 }}>{v.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{v.year} {v.make} {v.model}</div>
                </div>
                <div className={`pill ${alert ? "crit live" : offline ? "" : "good"}`}>
                  <span className="dot" />
                  {alert ? "alarm" : offline ? "offline" : "armed"}
                </div>
              </div>
              <div className="vcard-image">
                <VehicleSilhouette tone={alert ? "#ef4444" : "#3b82f6"} width={300} height={120} />
                {alert && (
                  <div style={{ position: "absolute", top: 12, left: 12, background: "var(--crit)", color: "white", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 0 16px var(--crit-glow)" }}>
                    <span className="ms sm" style={{ verticalAlign: "-3px", marginRight: 4 }}>crisis_alert</span>alarm
                  </div>
                )}
                {offline && !alert && (
                  <div style={{ position: "absolute", top: 12, left: 12, background: "var(--surface)", color: "var(--ink-2)", padding: "4px 10px", borderRadius: 4, border: "1px dashed var(--line)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>module offline</div>
                )}
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div className="row gap-3" style={{ marginBottom: 12 }}>
                  <Stat k="alarm" v={v.alarm_status} tone={v.alarm_status === "ARMED" ? "good" : v.alarm_status === "TRIGGERED" ? "crit" : "muted"} />
                  <Stat k="doors" v={v.door_status} tone={v.door_status === "LOCKED" ? "good" : v.door_status === "OPEN" ? "crit" : "warn"} />
                  <Stat k="ign" v={v.engine_status} tone={v.engine_status === "OFF" ? "muted" : "warn"} />
                </div>
                <div className="row gap-2">
                  <button className="btn btn-sm" style={{ flex: 1 }}>Open</button>
                  <button className="btn btn-sm btn-ghost"><span className="ms sm">receipt_long</span></button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="vcard"
          onClick={() => router.push("/setup/module")}
          style={{ border: "1px dashed var(--line)", alignItems: "center", justifyContent: "center", minHeight: 340, display: "flex" }}>
          <div className="col gap-3" style={{ alignItems: "center", padding: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px dashed var(--ink-4)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
              <span className="ms lg">add</span>
            </div>
            <div className="bold">Pair another vehicle</div>
            <div className="muted text-c" style={{ fontSize: 13, maxWidth: 220 }}>Scan the QR on your module → name it → done.</div>
            <button className="btn btn-primary btn-sm">Start pairing</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
