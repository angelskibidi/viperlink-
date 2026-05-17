"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "./Toast";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", match: (p: string) => p === "/" },
  { to: "/vehicles", label: "Vehicles", icon: "directions_car", match: (p: string) => p.startsWith("/vehicles") },
{ to: "/history", label: "History", icon: "history", match: (p: string) => p.startsWith("/history") },
  { to: "/security", label: "Security", icon: "verified_user", match: (p: string) => p.startsWith("/security") },
];

function Sidebar() {
  const path = usePathname();
  const { user } = useApp();
  const toast = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand" style={{ textDecoration: "none" }}>
        <div className="sidebar-mark">V</div>
        <div className="sidebar-wordmark">ViperLink</div>
      </Link>
      {NAV.map((item) => {
        const active = item.match(path ?? "");
        return (
          <Link key={item.to} href={item.to} className={`nav-item ${active ? "active" : ""}`}>
            <span className="ms">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
      <div className="sidebar-spacer" />
      <button
        className="sidebar-panic"
        onClick={() => toast({ tone: "crit", icon: "siren", title: "Panic alarm armed", sub: "Notifying authorized contacts…", ttl: 4000 })}
      >
        <span className="ms">crisis_alert</span>
        <span className="panic-text">Panic</span>
      </button>
      <div className="sidebar-user" style={{ cursor: "pointer" }} onClick={handleSignOut} title="Sign out">
        <div className="user-avatar">{(user?.name?.[0] ?? user?.username?.[0] ?? "V").toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div className="user-name">{user?.name ?? user?.username ?? "User"}</div>
          <div className="user-mail">{user?.email ?? ""}</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, crumbs, right }: { title: string; crumbs?: React.ReactNode; right?: React.ReactNode }) {
  const { vehicles, selectedVehicleId, setSelectedVehicleId } = useApp();
  const sel = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      {crumbs && <div className="topbar-crumb">{crumbs}</div>}
      <div className="topbar-actions">
        {sel && (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div className="vehicle-switcher" onClick={() => setOpen((o) => !o)}>
              <span className="ms sm">directions_car</span>
              <span>{sel.name}</span>
              {sel.year && <span className="muted mono" style={{ fontSize: 11 }}>· {sel.year} {sel.make}</span>}
              <span className="ms sm">expand_more</span>
            </div>
            {open && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: "var(--r-2)", minWidth: 260, padding: 6,
                boxShadow: "var(--shadow-pop)", zIndex: 100,
              }}>
                {vehicles.map((v) => (
                  <div key={v.id}
                    onClick={() => { setSelectedVehicleId(v.id); setOpen(false); }}
                    style={{
                      padding: "8px 10px", borderRadius: 4, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      background: v.id === sel?.id ? "var(--brand-soft)" : "transparent",
                    }}>
                    <span className={`sd ${v.alarm_status === "ARMED" ? "good" : v.alarm_status === "TRIGGERED" ? "crit" : ""}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{v.year} {v.make} {v.model}</div>
                    </div>
                    {v.id === sel?.id && <span className="ms sm" style={{ color: "var(--brand)" }}>check</span>}
                  </div>
                ))}
                <div className="divider" style={{ margin: "6px 0" }} />
                <Link href="/setup/module" className="nav-item" style={{ padding: "8px 10px", color: "var(--brand)" }}>
                  <span className="ms sm">add</span>
                  <span style={{ opacity: 1, fontSize: 13 }}>Pair another vehicle</span>
                </Link>
              </div>
            )}
          </div>
        )}
        <div className="row gap-2">
          <span className="sd good" />
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
        </div>
        {right}
      </div>
    </div>
  );
}

export default function Shell({
  title,
  crumbs,
  right,
  children,
}: {
  title: string;
  crumbs?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <TopBar title={title} crumbs={crumbs} right={right} />
        <div className="content fade-in" key={title}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="cap" style={{ marginBottom: 4 }}>{eyebrow}</div>}
        <div className="h1">{title}</div>
        {lead && <div className="lead" style={{ marginTop: 6, maxWidth: 640 }}>{lead}</div>}
      </div>
      {right && <div className="row gap-2">{right}</div>}
    </div>
  );
}
