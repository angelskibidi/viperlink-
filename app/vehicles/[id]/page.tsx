"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/app/components/Shell";
import VehicleSilhouette from "@/app/components/VehicleSilhouette";
import { useToast } from "@/app/components/Toast";
import { useApp, Vehicle } from "@/app/context/AppContext";

type VLEvent = { id: string; type: string; description: string; severity: string; created_at: string };

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: string }) {
  const c: Record<string, string> = { good: "var(--good)", crit: "var(--crit)", warn: "var(--warn)", muted: "var(--ink-2)" };
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: 12 }}>
      <div className="row between">
        <div className="cap">{label}</div>
        <span className="ms sm" style={{ color: c[tone] ?? "var(--ink-2)" }}>{icon}</span>
      </div>
      <div className="bold" style={{ fontSize: 17, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { vehicles, sendCommand, reloadVehicles } = useApp();
  const v = vehicles.find((x) => x.id === id) ?? vehicles[0];

  const [events, setEvents] = useState<VLEvent[]>([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events?vehicleId=${id}`).then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : []));
  }, [id]);

  if (!v) return null;

  const armed = v.alarm_status === "ARMED";
  const triggered = v.alarm_status === "TRIGGERED";

  const doCmd = async (cmd: string, label: string) => {
    await sendCommand(cmd, v.id);
    toast({ tone: "good", icon: "check_circle", title: `${label} sent`, sub: v.name });
  };

  const removeVehicle = async () => {
    if (!confirm(`Remove ${v.name}? This cannot be undone.`)) return;
    await fetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
    toast({ tone: "crit", icon: "delete", title: "Vehicle removed" });
    reloadVehicles();
    router.push("/vehicles");
  };

  return (
    <Shell
      title={v.name}
      crumbs={<><a href="/vehicles">Vehicles</a><span>/</span><span style={{ color: "var(--ink)" }}>{v.name}</span></>}
    >
      {/* Hero */}
      <div className="card card-pad-lg" style={{ position: "relative", overflow: "hidden" }}>
        <div className="row gap-6" style={{ alignItems: "center" }}>
          <div className={`status-disc ${triggered ? "crit" : armed ? "" : "off"}`} style={{ width: 140, height: 140 }}>
            <div className="status-disc-label" style={{ fontSize: 22 }}>{v.alarm_status}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cap">Vehicle profile</div>
            <div className="h1" style={{ fontSize: 32, marginTop: 4 }}>{v.name}</div>
            <div className="muted" style={{ marginTop: 4 }}>{v.year} {v.make} {v.model}</div>
            <div className="row gap-2" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <span className={`pill ${v.module_status === "online" ? "good" : "crit"} live`}><span className="dot" />module {v.module_status ?? "unknown"}</span>
              <span className="pill"><span className="ms sm">memory</span>fw {v.firmware_version ?? "—"}</span>
              {v.last_lat && v.last_lng && <span className="pill"><span className="ms sm">location_on</span>{v.last_lat.toFixed(4)}, {v.last_lng.toFixed(4)}</span>}
            </div>
          </div>
          <div style={{ width: 360 }}>
            <VehicleSilhouette tone={triggered ? "#ef4444" : "#3b82f6"} width={360} height={140} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginTop: 24 }}>
        {[["overview", "Overview"], ["module", "Module"], ["settings", "Settings"]].map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-in" style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
          <div className="col gap-4">
            <div className="card card-pad-lg">
              <div className="cap" style={{ marginBottom: 12 }}>Current status</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <MiniStat label="Alarm" value={v.alarm_status} tone={armed ? "good" : triggered ? "crit" : "muted"} icon="shield" />
                <MiniStat label="Doors" value={v.door_status} tone={v.door_status === "LOCKED" ? "good" : v.door_status === "OPEN" ? "crit" : "warn"} icon="lock" />
                <MiniStat label="Engine" value={v.engine_status} tone={v.engine_status === "OFF" ? "muted" : "warn"} icon="electric_car" />
                <MiniStat label="Module" value={v.module_status ?? "—"} tone={v.module_status === "online" ? "good" : "muted"} icon="cell_tower" />
              </div>
            </div>

            <div className="card">
              <div className="row between" style={{ padding: "18px 20px 12px" }}>
                <div className="cap">Activity today</div>
                <a href="/events" className="btn btn-ghost btn-sm">full history →</a>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="list-row">
                    <div className="mono" style={{ width: 56, fontSize: 11, color: "var(--ink-2)" }}>{fmtTime(e.created_at)}</div>
                    <span className="ms sm" style={{ color: e.severity === "critical" ? "var(--crit)" : e.severity === "warning" ? "var(--warn)" : e.severity === "success" ? "var(--good)" : "var(--brand)" }}>
                      {e.severity === "critical" ? "crisis_alert" : e.severity === "warning" ? "warning" : e.severity === "success" ? "check_circle" : "info"}
                    </span>
                    <span className="mono bold" style={{ fontSize: 12, width: 160 }}>{e.type}</span>
                    <span className="muted" style={{ flex: 1, fontSize: 13 }}>{e.description}</span>
                  </div>
                ))}
                {events.length === 0 && <div className="muted" style={{ padding: "12px 0" }}>No events yet.</div>}
              </div>
            </div>
          </div>

          <div className="col gap-4">
            <div className="card card-pad-lg">
              <div className="cap" style={{ marginBottom: 12 }}>Commands</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => doCmd("ARM", "Arm")} disabled={armed}><span className="ms sm">lock</span>Arm</button>
                <button className="btn" onClick={() => doCmd("DISARM", "Disarm")} disabled={v.alarm_status === "DISARMED"}><span className="ms sm">lock_open</span>Disarm</button>
                <button className="btn" onClick={() => doCmd("LOCK", "Lock")}>Lock</button>
                <button className="btn" onClick={() => doCmd("UNLOCK", "Unlock")}>Unlock</button>
                <button className="btn btn-ghost" onClick={() => doCmd("REMOTE_START", "Start engine")}>Start engine</button>
                <button className="btn btn-ghost" onClick={() => doCmd("ENGINE_OFF", "Stop engine")}>Engine off</button>
              </div>
            </div>

            <div className="card card-pad-lg">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="cap">Module</div>
                <span className={`pill ${v.module_id ? "good" : ""}`}><span className="dot" />{v.module_id ? "paired" : "not paired"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="cap" style={{ fontSize: 10 }}>ID</div><div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.module_id ?? "—"}</div></div>
                <div><div className="cap" style={{ fontSize: 10 }}>Firmware</div><div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.firmware_version ?? "—"}</div></div>
                <div><div className="cap" style={{ fontSize: 10 }}>Last ping</div><div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.last_seen ?? "—"}</div></div>
                <div><div className="cap" style={{ fontSize: 10 }}>GPS</div><div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.gps_enabled ? "enabled" : "disabled"}</div></div>
              </div>
              <div className="row gap-2" style={{ marginTop: 12 }}>
                <a href={`/setup/module?vehicleId=${v.id}`} className="btn btn-sm btn-ghost"><span className="ms sm">refresh</span>re-pair</a>
              </div>
            </div>

            <div className="danger-zone">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="cap" style={{ color: "var(--crit)" }}>Danger zone</div>
                <span className="ms" style={{ color: "var(--crit)" }}>warning</span>
              </div>
              <div className="row gap-2">
                <button className="btn btn-sm btn-danger" onClick={removeVehicle}>Remove vehicle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab !== "overview" && (
        <div className="fade-in card card-pad-lg" style={{ marginTop: 20, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="col gap-2 text-c muted">
            <span className="ms xl">construction</span>
            <div className="bold">{tab.charAt(0).toUpperCase() + tab.slice(1)} tab</div>
            <div style={{ fontSize: 13 }}>Coming in the next iteration.</div>
          </div>
        </div>
      )}
    </Shell>
  );
}
