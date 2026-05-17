"use client";

import { useEffect, useState } from "react";
import Shell, { PageHead } from "@/app/components/Shell";
import { useApp } from "@/app/context/AppContext";
import { COMMON_TIMEZONES, formatTsShort, getStoredTz, setStoredTz } from "@/lib/time";

type VLEvent = { id: string; vehicleId?: string; type: string; description: string; severity: string; created_at: string };

function KpiBox({ label, value, sub, tone, small }: { label: string; value: string | number; sub: string; tone: string; small?: boolean }) {
  const color = tone === "brand" ? "var(--brand)" : tone === "crit" ? "var(--crit)" : "var(--ink)";
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color, fontSize: small ? 18 : 26, fontFamily: small ? "var(--font-mono)" : "var(--font-sans)", letterSpacing: small ? "0.04em" : "-0.02em" }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export default function EventsPage() {
  const { vehicles, selectedVehicleId } = useApp();
  const [events, setEvents] = useState<VLEvent[]>([]);
  const [tz, setTzState] = useState("");
  useEffect(() => { setTzState(getStoredTz()); }, []);
  const handleTzChange = (v: string) => { setStoredTz(v); setTzState(v); };
  const [q, setQ] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [sev, setSev] = useState("all");

  useEffect(() => {
    const vid = vehicleFilter !== "all" ? vehicleFilter : selectedVehicleId;
    const url = vid ? `/api/events?vehicleId=${vid}` : "/api/events";
    fetch(url).then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : []));
  }, [vehicleFilter, selectedVehicleId]);

  const filtered = events.filter((e) => {
    if (sev !== "all" && e.severity !== sev) return false;
    if (q && !`${e.type} ${e.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: events.length,
    critical: events.filter((e) => e.severity === "critical").length,
    topType: (() => {
      const counts: Record<string, number> = {};
      events.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : "—";
    })(),
  };

  return (
    <Shell title="Events">
      <PageHead eyebrow="Activity log" title="Event history" lead="Every signal across every paired vehicle. Filter and search." />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div className="field">
            <label className="field-label">Search</label>
            <div style={{ position: "relative" }}>
              <span className="ms sm" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>search</span>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="type, description…" style={{ paddingLeft: 32 }} />
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
            <label className="field-label">Severity</label>
            <select className="select" value={sev} onChange={(e) => setSev(e.target.value)}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Time zone</label>
            <select className="select" value={tz} onChange={(e) => handleTzChange(e.target.value)}>
              {COMMON_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost"><span className="ms sm">download</span>export CSV</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <KpiBox label="Total events" value={stats.total} sub="all time" tone="brand" />
        <KpiBox label="Critical" value={stats.critical} sub={stats.critical ? `${stats.critical} need review` : "no incidents"} tone="crit" />
        <KpiBox label="Showing" value={filtered.length} sub="after filters" tone="muted" />
        <KpiBox label="Top trigger" value={stats.topType} sub="most frequent" tone="muted" small />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 220px 110px 1fr", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
          {["Time", "Event", "Severity", "Details"].map((h, i) => (
            <div key={i} className="cap" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: "calc(100vh - 480px)", minHeight: 300, overflowY: "auto" }}>
          {filtered.length === 0 && <div className="muted text-c" style={{ padding: 48 }}>No matching events.</div>}
          {filtered.map((e) => (
            <div key={e.id} style={{
              display: "grid", gridTemplateColumns: "180px 220px 110px 1fr",
              gap: 12, padding: "12px 20px",
              borderBottom: "1px solid var(--line-soft)",
              alignItems: "center",
              background: e.severity === "critical" ? "rgba(239,68,68,0.04)" : "transparent",
            }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{formatTsShort(e.created_at, tz || undefined)}</div>
              <div className="row gap-2">
                <span className="ms sm" style={{ color: e.severity === "critical" ? "var(--crit)" : e.severity === "warning" ? "var(--warn)" : e.severity === "success" ? "var(--good)" : "var(--brand)" }}>
                  {e.severity === "critical" ? "crisis_alert" : e.severity === "warning" ? "warning" : e.severity === "success" ? "check_circle" : "info"}
                </span>
                <span className="mono bold" style={{ fontSize: 12 }}>{e.type}</span>
              </div>
              <span className={`pill ${e.severity === "critical" ? "crit" : e.severity === "warning" ? "warn" : e.severity === "success" ? "good" : ""}`}>{e.severity}</span>
              <div className="muted" style={{ fontSize: 13 }}>{e.description}</div>
            </div>
          ))}
        </div>
        <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
          <span className="muted mono" style={{ fontSize: 12 }}>{filtered.length} of {events.length} events</span>
        </div>
      </div>
    </Shell>
  );
}
