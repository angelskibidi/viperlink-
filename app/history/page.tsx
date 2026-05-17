"use client";

import { useEffect, useState } from "react";
import Shell, { PageHead } from "@/app/components/Shell";
import { useApp } from "@/app/context/AppContext";
import { COMMON_TIMEZONES, formatTsShort, timeAgo, getStoredTz, setStoredTz } from "@/lib/time";

type Row = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleLabel: string;
  type: string;
  message: string;
  command?: string;
  created_at: string;
};

const COMMAND_META: Record<string, { icon: string; label: string; color: string }> = {
  ARM:          { icon: "shield",       label: "Arm",          color: "var(--crit)"  },
  DISARM:       { icon: "shield_off",   label: "Disarm",       color: "var(--good)"  },
  LOCK:         { icon: "lock",         label: "Lock",         color: "var(--brand)" },
  UNLOCK:       { icon: "lock_open",    label: "Unlock",       color: "var(--warn)"  },
  REMOTE_START: { icon: "start",        label: "Remote Start", color: "var(--good)"  },
  ENGINE_OFF:   { icon: "power_off",    label: "Engine Off",   color: "var(--crit)"  },
};

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  SHOCK:           { icon: "crisis_alert", label: "Shock",        color: "var(--crit)"  },
  ALARM_TRIGGERED: { icon: "notifications_active", label: "Alarm", color: "var(--crit)" },
  DOOR_OPEN:       { icon: "sensor_door",  label: "Door Open",    color: "var(--warn)"  },
  DOOR_CLOSED:     { icon: "door_front",   label: "Door Closed",  color: "var(--good)"  },
  GPS_UPDATE:      { icon: "location_on",  label: "GPS Update",   color: "var(--brand)" },
};

function getMeta(row: Row, tab: "commands" | "events") {
  if (tab === "commands") {
    const key = row.command ?? row.type.replace(/^COMMAND_/, "");
    return COMMAND_META[key] ?? { icon: "terminal", label: key, color: "var(--brand)" };
  }
  return EVENT_META[row.type] ?? { icon: "info", label: row.type, color: "var(--brand)" };
}

export default function HistoryPage() {
  const { vehicles, selectedVehicleId } = useApp();
  const [tab, setTab] = useState<"commands" | "events">("commands");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [q, setQ] = useState("");
  const [tz, setTzState] = useState("");
  useEffect(() => { setTzState(getStoredTz()); }, []);
  const handleTzChange = (v: string) => { setStoredTz(v); setTzState(v); };

  useEffect(() => {
    setLoading(true);
    setRows([]);
    const vid = vehicleFilter !== "all" ? vehicleFilter : selectedVehicleId;
    const url = new URL("/api/history", location.href);
    url.searchParams.set("type", tab);
    if (vid) url.searchParams.set("vehicleId", vid);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab, vehicleFilter, selectedVehicleId]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const key = tab === "commands" ? (r.command ?? r.type) : r.type;
    return key.toLowerCase().includes(q.toLowerCase()) ||
      r.vehicleName.toLowerCase().includes(q.toLowerCase()) ||
      r.message.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <Shell title="History">
      <PageHead
        eyebrow="Activity log"
        title="History"
        lead="Commands dispatched and events recorded across your fleet."
      />

      {/* Toggle tabs */}
      <div className="row gap-2" style={{ marginBottom: 16 }}>
        <button
          className={`btn ${tab === "commands" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("commands")}
        >
          <span className="ms sm">terminal</span>Commands
        </button>
        <button
          className={`btn ${tab === "events" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("events")}
        >
          <span className="ms sm">sensors</span>Events
        </button>
      </div>

      {/* Filters */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12, alignItems: "end" }}>
          <div className="field">
            <label className="field-label">Search</label>
            <div style={{ position: "relative" }}>
              <span className="ms sm" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>search</span>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "commands" ? "command, vehicle…" : "event type, vehicle…"} style={{ paddingLeft: 32 }} />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Vehicle</label>
            <select className="select" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="all">All vehicles</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Time zone</label>
            <select className="select" value={tz} onChange={(e) => handleTzChange(e.target.value)}>
              {COMMON_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Total {tab}</div>
          <div className="kpi-value" style={{ color: "var(--brand)" }}>{rows.length}</div>
          <div className="kpi-sub">all time</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Showing</div>
          <div className="kpi-value" style={{ color: "var(--brand)" }}>{filtered.length}</div>
          <div className="kpi-sub">after filters</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Last activity</div>
          <div className="kpi-value" style={{ color: "var(--brand)", fontSize: 18 }}>{rows[0] ? timeAgo(rows[0].created_at) : "—"}</div>
          <div className="kpi-sub">{rows[0] ? formatTsShort(rows[0].created_at, tz || undefined) : "no activity"}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 200px 1fr 120px", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
          {["Time", tab === "commands" ? "Command" : "Event", "Vehicle", "When"].map((h, i) => (
            <div key={i} className="cap" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>

        <div style={{ maxHeight: "calc(100vh - 500px)", minHeight: 300, overflowY: "auto" }}>
          {loading && <div className="muted text-c" style={{ padding: 48 }}>Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div className="muted text-c" style={{ padding: 48 }}>No {tab} found.</div>
          )}
          {!loading && filtered.map((row) => {
            const meta = getMeta(row, tab);
            return (
              <div key={row.id} style={{
                display: "grid", gridTemplateColumns: "180px 200px 1fr 120px",
                gap: 12, padding: "12px 20px",
                borderBottom: "1px solid var(--line-soft)",
                alignItems: "center",
                background: meta.color === "var(--crit)" ? "rgba(239,68,68,0.03)" : "transparent",
              }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>
                  {formatTsShort(row.created_at, tz || undefined)}
                </div>
                <div className="row gap-2">
                  <span className="ms sm" style={{ color: meta.color }}>{meta.icon}</span>
                  <div>
                    <div className="mono bold" style={{ fontSize: 12 }}>{meta.label}</div>
                    {tab === "events" && row.message && (
                      <div className="muted" style={{ fontSize: 11 }}>{row.message}</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="bold" style={{ fontSize: 12 }}>{row.vehicleName}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{row.vehicleLabel}</div>
                </div>
                <span className="pill purple" style={{ justifySelf: "start" }}>
                  <span className="ms sm" style={{ fontSize: 10 }}>schedule</span>
                  {timeAgo(row.created_at)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
          <span className="muted mono" style={{ fontSize: 12 }}>{filtered.length} of {rows.length} {tab}</span>
        </div>
      </div>
    </Shell>
  );
}
