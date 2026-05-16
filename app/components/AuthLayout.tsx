import VehicleSilhouette from "./VehicleSilhouette";

export function AuthAsideHero() {
  return (
    <div className="col gap-6" style={{ alignItems: "center" }}>
      <VehicleSilhouette tone="#3b82f6" width={420} height={160} />
      <div style={{
        padding: "28px 36px",
        border: "1px solid var(--line)",
        background: "rgba(20,26,35,0.5)",
        backdropFilter: "blur(8px)",
        borderRadius: 12,
        maxWidth: 420,
        textAlign: "center",
      }}>
        <div className="cap" style={{ color: "var(--brand)" }}>real-time control</div>
        <div className="h2" style={{ marginTop: 6 }}>
          Your fleet, on the right side of every glass.
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Arm, locate, and audit every vehicle from a single console — with end-to-end audit logs and TOTP-gated access.
        </div>
      </div>
      <div className="row gap-3" style={{ flexWrap: "wrap", justifyContent: "center" }}>
        <div className="pill brand live"><span className="dot" /> 3 vehicles online</div>
        <div className="pill"><span className="ms sm">bolt</span> &lt; 200 ms commands</div>
        <div className="pill"><span className="ms sm">lock</span> AES-256</div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  title,
  sub,
  footer,
  children,
  aside,
}: {
  title: string;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="auth">
      <div className="auth-aside">
        <div className="auth-brand">
          <div className="sidebar-mark">V</div>
          <span>ViperLink</span>
          <span className="cap" style={{ marginLeft: 12 }}>vehicle security console</span>
        </div>
        <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {aside ?? <AuthAsideHero />}
        </div>
        <div className="row gap-2 muted" style={{ position: "relative", zIndex: 1, fontSize: 12 }}>
          <span className="mono">v0.4.2</span>
          <span>·</span>
          <span>SOC-2 type II</span>
          <span>·</span>
          <span>encryption at rest</span>
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form fade-in">
          <div style={{ marginBottom: 24 }}>
            <div className="h1">{title}</div>
            {sub && <div className="lead" style={{ marginTop: 6 }}>{sub}</div>}
          </div>
          {children}
          {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
