"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/app/components/Shell";
import Sparkline from "@/app/components/Sparkline";
import VehicleSilhouette from "@/app/components/VehicleSilhouette";
import { useToast } from "@/app/components/Toast";
import { useApp } from "@/app/context/AppContext";

type VLEvent = { id: string; type: string; description: string; severity: string; created_at: string };
type VLCommand = { id: string; command: string; status: string; created_at: string };

function fmtRel(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function sevColor(s: string) {
  return s === "critical" ? "var(--crit)" : s === "warning" ? "var(--warn)" : s === "success" ? "var(--good)" : "var(--brand)";
}
function sevIcon(s: string) {
  return s === "critical" ? "crisis_alert" : s === "warning" ? "warning" : s === "success" ? "check_circle" : "info";
}

function CmdBtn({ icon, label, tone, disabled, onClick }: { icon: string; label: string; tone?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button className={`cmd-btn ${tone === "danger" ? "danger" : ""} ${tone === "brand" ? "brand" : ""} ${disabled ? "disabled" : ""}`} onClick={onClick} disabled={disabled}>
      <span className="ms">{icon}</span>
      <span className="cmd-btn-label">{label}</span>
    </button>
  );
}

function StatTile({ label, value, icon, tone = "muted", sub }: { label: string; value: string; icon: string; tone?: string; sub?: string }) {
  const colors: Record<string, string> = { good: "var(--good)", crit: "var(--crit)", warn: "var(--warn)", brand: "var(--brand)", muted: "var(--ink-2)" };
  return (
    <div className="card card-pad">
      <div className="row between">
        <div className="cap">{label}</div>
        <span className="ms" style={{ color: colors[tone] }}>{icon}</span>
      </div>
      <div className="row between" style={{ marginTop: 8 }}>
        <div className="h2" style={{ fontSize: 22 }}>{value}</div>
        <span className={`pill ${tone === "muted" ? "" : tone}`}><span className="dot" />{value.toLowerCase()}</span>
      </div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { vehicles, vehiclesLoaded, selectedVehicleId, sendCommand, reloadVehicles } = useApp();
  const v = vehicles.find((x) => x.id === selectedVehicleId) ?? vehicles[0];

  const [authStatus, setAuthStatus] = useState<"loading" | "ok" | "out">("loading");
  const [events, setEvents] = useState<VLEvent[]>([]);
  const [commands, setCommands] = useState<VLCommand[]>([]);
  const [busyCmd, setBusyCmd] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"disconnected" | "connected">("disconnected");

  useEffect(() => {
    fetch("/api/me").then((r) => {
      if (!r.ok) { setAuthStatus("out"); router.push("/login"); return; }
      setAuthStatus("ok");
    });
  }, [router]);

  useEffect(() => {
    if (!v?.id || authStatus !== "ok") return;
    fetch(`/api/events?vehicleId=${v.id}`).then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : []));
    fetch(`/api/commands?vehicleId=${v.id}`).then((r) => r.json()).then((d) => setCommands(Array.isArray(d) ? d : []));
  }, [v?.id, authStatus]);

  useEffect(() => {
    if (!v?.id || authStatus !== "ok") return;
    const src = new EventSource(`/api/realtime?vehicleId=${v.id}`);
    src.addEventListener("vehicle-update", (msg) => {
      setRealtimeStatus("connected");
      const snap = JSON.parse((msg as MessageEvent).data);
      if (snap.events) setEvents(snap.events);
      if (snap.commands) setCommands(snap.commands);
      reloadVehicles();
    });
    src.addEventListener("ping", () => setRealtimeStatus("connected"));
    src.onerror = () => setRealtimeStatus("disconnected");
    return () => { src.close(); setRealtimeStatus("disconnected"); };
  }, [v?.id, authStatus, reloadVehicles]);

  const onCmd = async (cmd: string, label: string, tone = "good") => {
    if (!v) return;
    setBusyCmd(cmd);
    await sendCommand(cmd);
    setBusyCmd(null);
    toast({ tone: tone === "crit" ? "crit" : "good", icon: "check_circle", title: `${label} sent`, sub: `Delivered to ${v.name} in ~150ms.` });
  };

  const simulate = async (kind: "shock" | "door" | "ignition" | "alarm") => {
    if (!v?.module_id || !v.module_secret) {
      await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: kind.toUpperCase(), description: `Simulated ${kind} event`, vehicleId: v?.id }) });
      reloadVehicles();
      return;
    }
    const presets: Record<string, [string, string]> = {
      shock: ["SHOCK_TRIGGERED", "Shock sensor triggered · 3.2g impact"],
      door: ["DOOR_OPEN", "Driver door opened"],
      ignition: ["IGNITION_ON", "Ignition signal detected"],
      alarm: ["FULL_ALARM", "FULL ALARM · alarm sequence triggered"],
    };
    const [eventType, message] = presets[kind];
    await fetch("/api/module/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId: v.module_id, moduleSecret: v.module_secret, eventType, message }) });
    reloadVehicles();
  };

  const series = useMemo(() => {
    const buckets = Array(24).fill(0);
    const now = Date.now();
    for (const e of events) {
      const ageHr = (now - new Date(e.created_at).getTime()) / (60 * 60 * 1000);
      if (ageHr < 0 || ageHr > 24) continue;
      buckets[Math.max(0, Math.min(23, 23 - Math.floor(ageHr)))]++;
    }
    return buckets.map((v, i) => v + (i % 3 === 0 ? 0.3 : 0));
  }, [events]);

  useEffect(() => {
    if (authStatus === "ok" && vehiclesLoaded && vehicles.length === 0) {
      router.push("/setup/module");
    }
  }, [authStatus, vehiclesLoaded, vehicles.length, router]);

  if (authStatus === "loading" || (authStatus === "ok" && !vehiclesLoaded)) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="muted mono">Loading ViperLink…</div>
    </div>;
  }
  if (authStatus === "out") return null;
  if (authStatus === "ok" && vehicles.length === 0) return null;
  if (!v) return null;

  const armed = v.alarm_status === "ARMED";
  const triggered = v.alarm_status === "TRIGGERED";

  return (
    <Shell
      title="Dashboard"
      right={
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/setup/module")}>
          <span className="ms sm">add</span>add vehicle
        </button>
      }
    >
      {/* Status row + Module */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <div className="card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px) 0 0 / 32px 32px",
            pointerEvents: "none",
            maskImage: "radial-gradient(ellipse at 80% 50%, black 0%, transparent 70%)",
          }} />
          <div className="row gap-6" style={{ alignItems: "center", position: "relative" }}>
            <div className={`status-disc ${triggered ? "crit" : armed ? "" : "off"}`}>
              <div className="status-disc-label">{v.alarm_status}</div>
              <div className="status-disc-sub">{triggered ? "incident" : armed ? "protected" : "unprotected"}</div>
            </div>
            <div className="col gap-2" style={{ flex: 1 }}>
              <div className="cap" style={{ color: "var(--ink-2)" }}>Live status · {v.year} {v.make} {v.model}</div>
              <div className="h1" style={{ fontSize: 32 }}>
                {triggered ? "Alarm triggered." : armed ? "All systems normal." : "Alarm is disarmed."}
              </div>
              <div className="muted" style={{ fontSize: 14 }}>
                {triggered ? "Check the events log immediately." :
                 armed ? "Module pinging on schedule." :
                 "Arm the alarm to resume monitoring."}
              </div>
              <div className="row gap-2" style={{ marginTop: 8 }}>
                {armed
                  ? <button className="btn btn-lg" onClick={() => onCmd("DISARM", "Disarm")} disabled={busyCmd === "DISARM"}><span className="ms sm">lock_open</span>Disarm</button>
                  : <button className="btn btn-lg btn-primary" onClick={() => onCmd("ARM", "Arm")} disabled={busyCmd === "ARM"}><span className="ms sm">lock</span>Arm</button>}
                {v.door_status === "LOCKED"
                  ? <button className="btn btn-lg" onClick={() => onCmd("UNLOCK", "Unlock")} disabled={!!busyCmd}><span className="ms sm">lock_open</span>Unlock</button>
                  : <button className="btn btn-lg" onClick={() => onCmd("LOCK", "Lock")} disabled={!!busyCmd}><span className="ms sm">lock</span>Lock</button>}
                <a href={`/vehicles/${v.id}`} className="btn btn-lg btn-ghost"><span className="ms sm">tune</span>more</a>
              </div>
            </div>
            <div style={{ width: 320, opacity: 0.95 }}>
              <VehicleSilhouette tone={armed ? "#3b82f6" : triggered ? "#ef4444" : "#5a6371"} width={320} height={120} />
            </div>
          </div>
        </div>

        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="cap">Module</div>
            <div className={`pill live ${v.module_status === "online" ? "good" : "crit"}`}><span className="dot" />{v.module_status ?? "unknown"}</div>
          </div>
          <div className="mono bold" style={{ fontSize: 14, marginBottom: 4 }}>{v.module_id ?? "—"}</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>fw {v.firmware_version ?? "—"} · {v.module_id ? "paired" : "not paired"}</div>

          <div className="cap" style={{ marginBottom: 8 }}>Signal</div>
          <div className="row gap-2" style={{ alignItems: "flex-end", height: 40 }}>
            {[8, 14, 22, 30, 26].map((h, i) => (
              <div key={i} style={{ width: 14, height: h, background: i < 4 ? "var(--brand)" : "var(--surface-3)", borderRadius: 2, boxShadow: i < 4 ? "0 0 8px var(--brand-glow)" : "none" }} />
            ))}
            <div className="col" style={{ marginLeft: 8 }}>
              <div className="mono bold" style={{ fontSize: 16 }}>LTE</div>
              <div className="cap" style={{ fontSize: 10 }}>strong</div>
            </div>
          </div>

          <hr className="hr" style={{ margin: "16px 0" }} />
          <div className="cap" style={{ marginBottom: 8 }}>Last seen</div>
          <div className="mono" style={{ fontSize: 13 }}>{v.last_seen ? fmtRel(v.last_seen) : "—"}</div>
          <hr className="hr" style={{ margin: "16px 0" }} />
          <div className="row gap-2 muted" style={{ fontSize: 12 }}>
            <span className={`sd ${realtimeStatus === "connected" ? "good" : ""}`} />
            <span className="mono">{realtimeStatus}</span>
          </div>
        </div>
      </div>

      {/* Status quad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
        <StatTile label="Alarm" value={v.alarm_status} icon={armed ? "shield" : triggered ? "crisis_alert" : "shield_lock"} tone={armed ? "good" : triggered ? "crit" : "muted"} />
        <StatTile label="Doors" value={v.door_status} icon={v.door_status === "LOCKED" ? "lock" : "lock_open"} tone={v.door_status === "LOCKED" ? "good" : v.door_status === "OPEN" ? "crit" : "warn"} />
        <StatTile label="Ignition" value={v.engine_status} icon={v.engine_status === "OFF" ? "power_off" : "electric_car"} tone={v.engine_status === "RUNNING" ? "warn" : "muted"} />
        <StatTile label="Module" value={v.module_status ?? "unknown"} icon="cell_tower" tone={v.module_status === "online" ? "good" : "muted"} />
      </div>

      {/* Commands + Last 24h */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 14 }}>
            <div>
              <div className="cap">Commands</div>
              <div className="h3" style={{ marginTop: 2 }}>Send to {v.name}</div>
            </div>
            <span className="muted mono" style={{ fontSize: 11 }}>avg latency · ~150ms</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <CmdBtn icon="lock" label="Arm" tone="brand" onClick={() => onCmd("ARM", "Arm")} disabled={armed} />
            <CmdBtn icon="lock_open" label="Disarm" onClick={() => onCmd("DISARM", "Disarm")} disabled={v.alarm_status === "DISARMED"} />
            <CmdBtn icon="lock" label="Lock" onClick={() => onCmd("LOCK", "Lock")} disabled={v.door_status === "LOCKED"} />
            <CmdBtn icon="lock_open" label="Unlock" onClick={() => onCmd("UNLOCK", "Unlock")} disabled={v.door_status === "UNLOCKED"} />
            <CmdBtn icon="key" label="Start" onClick={() => onCmd("REMOTE_START", "Start engine")} />
            <CmdBtn icon="power_settings_new" label="Stop" onClick={() => onCmd("ENGINE_OFF", "Stop engine")} />
            <CmdBtn icon="luggage" label="Trunk" onClick={() => onCmd("TRUNK", "Trunk release")} />
            <CmdBtn icon="campaign" label="Honk" onClick={() => onCmd("HONK", "Horn")} />
          </div>

          <hr className="hr" style={{ margin: "16px 0" }} />
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="cap" style={{ color: "var(--ink-2)" }}>Simulate (dev)</div>
            <span className="pill">sim mode</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <CmdBtn icon="bolt" label="Shock" onClick={() => simulate("shock")} />
            <CmdBtn icon="door_open" label="Door" onClick={() => simulate("door")} />
            <CmdBtn icon="electric_car" label="Ignition" onClick={() => simulate("ignition")} />
            <CmdBtn icon="crisis_alert" label="Full alarm" tone="danger" onClick={() => simulate("alarm")} />
          </div>
        </div>

        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 6 }}>
            <div className="cap">Last 24 hours</div>
          </div>
          <div className="row gap-6" style={{ alignItems: "baseline", marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{events.length}</div>
              <div className="cap">events</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--crit)" }}>
                {events.filter((e) => e.severity === "critical").length}
              </div>
              <div className="cap">criticals</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{commands.length}</div>
              <div className="cap">commands</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Sparkline values={series} />
          </div>
          <div className="row between muted" style={{ marginTop: 8, fontSize: 11 }}>
            <span className="mono">00:00</span>
            <span className="mono">06:00</span>
            <span className="mono">12:00</span>
            <span className="mono">18:00</span>
            <span className="mono">now</span>
          </div>
        </div>
      </div>

      {/* Activity + Commands log */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="card">
          <div className="row between" style={{ padding: "18px 20px 12px" }}>
            <div>
              <div className="cap">Activity feed</div>
              <div className="h3" style={{ marginTop: 2 }}>Live event stream</div>
            </div>
            <div className="row gap-2">
              <span className="pill live brand"><span className="dot" />live</span>
              <a href="/events" className="btn btn-ghost btn-sm">view all →</a>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", maxHeight: 360, overflowY: "auto" }}>
            {events.length === 0 && <div className="muted" style={{ padding: "20px 0" }}>No events yet for this vehicle.</div>}
            {events.slice(0, 12).map((e) => (
              <div key={e.id} className="list-row">
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-2)", background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: sevColor(e.severity), flex: "none" }}>
                  <span className="ms sm">{sevIcon(e.severity)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row gap-2">
                    <span className="mono bold" style={{ fontSize: 13 }}>{e.type}</span>
                    <span className={`pill ${e.severity === "critical" ? "crit" : e.severity === "warning" ? "warn" : e.severity === "success" ? "good" : ""}`} style={{ padding: "1px 6px", fontSize: 9 }}>{e.severity}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{e.description}</div>
                </div>
                <div className="col" style={{ alignItems: "flex-end", flex: "none" }}>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{fmtTime(e.created_at)}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{fmtRel(e.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ padding: "18px 20px 12px" }}>
            <div>
              <div className="cap">Command history</div>
              <div className="h3" style={{ marginTop: 2 }}>Recent dispatches</div>
            </div>
            <span className="pill good"><span className="dot" />{commands.length} delivered</span>
          </div>
          <div style={{ padding: "0 20px 20px", maxHeight: 360, overflowY: "auto" }}>
            {commands.length === 0 && <div className="muted" style={{ padding: "20px 0" }}>No commands yet.</div>}
            {commands.slice(0, 10).map((c) => (
              <div key={c.id} className="list-row">
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-2)", background: "var(--brand-soft)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flex: "none" }}>
                  <span className="ms sm">arrow_outward</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono bold" style={{ fontSize: 13 }}>{c.command}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{c.status} · acked</div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{fmtTime(c.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
