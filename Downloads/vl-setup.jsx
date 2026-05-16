/* global React, useApp, useToast, navigate, AuthLayout, copyText, VehicleSilhouette */
// ViperLink — first-run setup screens

const { useState: _su, useEffect: _se } = React;

// ─────────────────────────────────────────────────────────────
// Shared chrome for setup (uses AuthLayout structure with a stepper)
// ─────────────────────────────────────────────────────────────
function SetupStepper({ step }) {
  const steps = [
    { n: 1, label: 'Module' },
    { n: 2, label: 'Vehicle' },
    { n: 3, label: 'Ready' },
  ];
  return (
    <div className="stepper" style={{ marginBottom: 24 }}>
      {steps.map((s, i) => {
        const state = step > s.n ? 'done' : step === s.n ? 'active' : 'todo';
        return (
          <React.Fragment key={s.n}>
            <div className={`step ${state === 'done' ? 'done' : state === 'active' ? 'active' : ''}`}>
              <div className="step-bubble">{state === 'done' ? '✓' : s.n}</div>
              <div className="step-label">{s.label}</div>
            </div>
            {i < steps.length - 1 && <div className={`step-bar ${step > s.n ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SetupFrame({ step, children, side }) {
  return (
    <div className="auth" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth-form-wrap" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
        <div style={{ width: '100%', maxWidth: 1080 }}>
          <div className="row between" style={{ marginBottom: 24 }}>
            <div className="auth-brand">
              <div className="sidebar-mark">V</div>
              <span>ViperLink</span>
              <span className="cap" style={{ marginLeft: 12 }}>first-run setup</span>
            </div>
            <div className="row gap-2">
              <button className="btn btn-ghost btn-sm">save & exit</button>
              <button className="btn btn-ghost btn-sm">sign out</button>
            </div>
          </div>
          <SetupStepper step={step} />
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: side ? '1.2fr 1fr' : '1fr', gap: 28, marginTop: 8 }}>
            <div>{children}</div>
            {side && <div>{side}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /setup/module
// ─────────────────────────────────────────────────────────────
function genModuleId() {
  const h = () => Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VLK-${h()}-${h()}`;
}
function genSecret() {
  return 'vlk_sk_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function SetupModuleScreen() {
  const toast = useToast();
  const [moduleId, setModuleId] = _su('');
  const [secret, setSecret] = _su('');
  const [status, setStatus] = _su('idle'); // idle | searching | paired | failed

  const valid = /^VLK-[A-F0-9]{4}-[A-F0-9]{4}$/i.test(moduleId.trim());

  const pair = () => {
    if (!valid) return;
    setStatus('searching');
    setTimeout(() => {
      setStatus('paired');
      toast({ tone: 'good', icon: 'cell_tower', title: 'Module paired', sub: moduleId.toUpperCase() });
      setTimeout(() => navigate('/setup/vehicle?moduleId=' + encodeURIComponent(moduleId.toUpperCase())), 700);
    }, 1500);
  };

  const fakeIt = () => {
    setModuleId(genModuleId());
    setSecret(genSecret());
    toast({ tone: 'brand', icon: 'flash_on', title: 'Sim module generated', sub: 'Fake credentials for demo only.' });
  };

  return (
    <SetupFrame step={1} side={
      <div className="col gap-4">
        <div className="card card-pad-lg">
          <div className="cap" style={{ marginBottom: 10 }}>Where to find it</div>
          <ModuleIllustration />
          <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            The module is the matchbox-sized brain wired into your fuse panel — typically behind the dashboard near the steering column.
          </div>
          <div className="row gap-2" style={{ marginTop: 14 }}>
            <button className="btn btn-sm btn-outline"><span className="ms sm">qr_code_scanner</span>scan QR instead</button>
            <button className="btn btn-sm btn-ghost"><span className="ms sm">help</span>help</button>
          </div>
        </div>
        <div className="card card-pad" style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)' }}>
          <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
            <span className="ms" style={{ color: 'var(--warn)' }}>info</span>
            <div>
              <div className="bold">Heads-up</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                The module must be powered. Check the green LED on the lid is solid before pairing.
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <div className="h1" style={{ marginBottom: 8 }}>Connect your alarm module</div>
      <div className="lead" style={{ marginBottom: 24 }}>
        ViperLink needs to talk to the hardware bolted to your car. Pull the sticker off your module and type the ID below — exactly as printed.
      </div>

      <div className="card card-pad-lg">
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label">Module ID</label>
          <input
            className="input mono"
            placeholder="VLK-XXXX-XXXX"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value.toUpperCase())}
            style={{ fontSize: 17, letterSpacing: '0.1em' }}
            autoFocus
          />
          <span className="field-hint">format · VLK-XXXX-XXXX</span>
        </div>

        <div className="field">
          <label className="field-label">Pairing secret <span style={{ color: 'var(--ink-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            className="input mono"
            placeholder="vlk_sk_••••••••••••••••"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <span className="field-hint">printed under the QR sticker, or rotate it later in vehicle settings</span>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16, borderStyle: 'dashed', background: 'var(--bg-2)' }}>
        <div className="row between gap-3">
          <div>
            <div className="cap">Sim mode</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>No real module on hand? Generate a fake one.</div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={fakeIt}>
            <span className="ms sm">bolt</span>generate fake ID
          </button>
        </div>
      </div>

      {status !== 'idle' && (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid ' + (status === 'paired' ? 'var(--good)' : status === 'failed' ? 'var(--crit)' : 'var(--brand)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: status === 'paired' ? 'var(--good)' : status === 'failed' ? 'var(--crit)' : 'var(--brand)',
              background: status === 'paired' ? 'var(--good-soft)' : status === 'failed' ? 'var(--crit-soft)' : 'var(--brand-soft)',
            }}>
              <span className="ms">{status === 'paired' ? 'check' : status === 'failed' ? 'close' : 'wifi_tethering'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="bold">
                {status === 'searching' && 'Reaching module…'}
                {status === 'paired' && 'Paired · ready'}
                {status === 'failed' && 'Could not reach module'}
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {status === 'searching' && 'handshake · firmware check · time sync'}
                {status === 'paired' && 'Continue to vehicle profile.'}
                {status === 'failed' && 'Power-cycle the module and try again.'}
              </div>
            </div>
            {status === 'searching' && (
              <div className="row gap-1">
                <span className="sd brand" /><span className="sd brand" style={{ animationDelay: '0.2s' }} /><span className="sd" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="row between" style={{ marginTop: 24 }}>
        <a href="#/login" className="btn btn-ghost">← back to login</a>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => navigate('/setup/vehicle')}>skip for now</button>
          <button className="btn btn-primary btn-lg" disabled={!valid || status === 'searching'} onClick={pair}>
            {status === 'searching' ? 'Pairing…' : <>Pair & continue <span className="ms sm">arrow_forward</span></>}
          </button>
        </div>
      </div>
    </SetupFrame>
  );
}

// Sleek SVG of the alarm module hardware
function ModuleIllustration() {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 'var(--r-2)',
      background: 'linear-gradient(135deg, var(--surface-2), var(--bg-2))',
      padding: '14px',
      border: '1px solid var(--line)',
    }}>
      <svg width="100%" height="160" viewBox="0 0 260 160" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="mod-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a323e" />
            <stop offset="1" stopColor="#1a212c" />
          </linearGradient>
        </defs>
        {/* shadow */}
        <ellipse cx="130" cy="146" rx="105" ry="6" fill="rgba(0,0,0,0.4)" />
        {/* body */}
        <rect x="38" y="32" width="184" height="100" rx="10" fill="url(#mod-body)" stroke="rgba(255,255,255,0.06)" />
        {/* top strip */}
        <rect x="38" y="32" width="184" height="14" rx="10" fill="rgba(59,130,246,0.18)" />
        <rect x="38" y="40" width="184" height="6" fill="rgba(59,130,246,0.3)" />
        {/* label */}
        <rect x="56" y="56" width="120" height="60" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" />
        <text x="64" y="74" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="#e8ecf2">ViperLink</text>
        <text x="64" y="90" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#9aa3b2">VLK-A3F2-9C04</text>
        <text x="64" y="106" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5a6371">fw VLK-2.1.0</text>
        {/* LEDs */}
        <circle cx="194" cy="68" r="3" fill="#10b981">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="194" cy="68" r="6" fill="rgba(16,185,129,0.25)" />
        <circle cx="194" cy="86" r="3" fill="#3b82f6" />
        <circle cx="194" cy="104" r="3" fill="#5a6371" />
        {/* cable */}
        <path d="M 222 100 C 234 100, 246 100, 246 116 L 246 156" stroke="#5a6371" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* sticker callout arrow */}
        <path d="M 88 144 L 100 134 L 116 138" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeDasharray="3 3" strokeLinecap="round" />
        <text x="44" y="156" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#ef4444" fontWeight="700">find the ID here ↗</text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /setup/vehicle
// ─────────────────────────────────────────────────────────────
const COLORS = [
  { hex: '#0d1218', label: 'Black' },
  { hex: '#9aa3b2', label: 'Silver' },
  { hex: '#e8ecf2', label: 'White' },
  { hex: '#c2362b', label: 'Red' },
  { hex: '#1e40af', label: 'Blue' },
  { hex: '#365314', label: 'Green' },
  { hex: '#7c2d12', label: 'Brown' },
];
const MAKES = ['Subaru', 'Ford', 'Honda', 'Toyota', 'Chevrolet', 'BMW', 'Audi', 'Nissan', 'Tesla', 'Other'];

function SetupVehicleScreen() {
  const { setState } = useApp();
  const toast = useToast();
  const [form, setForm] = _su({
    name: '', year: '2024', make: 'Subaru', model: '', plate: '', color: '#0d1218', gps: true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const finish = () => {
    if (!form.name) { toast({ tone: 'crit', icon: 'error', title: 'Nickname required' }); return; }
    setState((s) => {
      const id = 'v' + Math.random().toString(36).slice(2, 6);
      const v = {
        id, name: form.name, make: form.make, model: form.model || '—', year: form.year,
        plate: form.plate, color: form.color,
        moduleId: 'VLK-A3F2-9C04', moduleSecret: 'vlk_sk_••••', firmware: 'VLK-2.1.0',
        moduleStatus: 'online', signalDbm: -67, lastSeen: 'just now',
        alarm: 'DISARMED', doors: 'UNLOCKED', engine: 'OFF', battery: '12.4V',
        location: { lat: 37.7749, lng: -122.4194, address: 'Garage', geofence: null, updated: 'just now' },
      };
      return {
        ...s,
        vehicles: [...s.vehicles, v],
        selectedVehicleId: id,
        signedIn: true,
        onboarded: true,
      };
    });
    toast({ tone: 'good', icon: 'celebration', title: 'Setup complete!', sub: 'Welcome to your dashboard.' });
    setTimeout(() => navigate('/'), 600);
  };

  return (
    <SetupFrame step={2} side={
      <div className="col gap-4">
        <div className="card card-pad-lg">
          <div className="cap" style={{ marginBottom: 8 }}>Live preview</div>
          <div style={{
            height: 160,
            borderRadius: 'var(--r-2)',
            background: 'linear-gradient(135deg, var(--surface-2), var(--bg-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid var(--line)',
          }}>
            <VehicleSilhouette tone={form.color} width={280} height={120} />
            {form.plate && (
              <div className="mono" style={{
                position: 'absolute', left: 12, bottom: 12,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                padding: '4px 8px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              }}>{form.plate}</div>
            )}
          </div>
          <div className="row gap-3" style={{ marginTop: 12, alignItems: 'center' }}>
            <div className="status-disc off" style={{ width: 56, height: 56, borderWidth: 2 }}>
              <div className="status-disc-label" style={{ fontSize: 11 }}>DIS</div>
            </div>
            <div>
              <div className="bold" style={{ fontSize: 18 }}>{form.name || 'Your nickname'}</div>
              <div className="muted" style={{ fontSize: 13 }}>{form.year} {form.make} {form.model || ''}</div>
            </div>
          </div>
        </div>
        <div className="card card-pad">
          <div className="cap" style={{ marginBottom: 8 }}>Up next</div>
          <div className="col gap-2">
            <div className="row gap-2" style={{ fontSize: 13 }}>
              <span className="ms sm" style={{ color: 'var(--good)' }}>check_circle</span>
              <span>Land on dashboard</span>
            </div>
            <div className="row gap-2" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              <span className="ms sm">radio_button_unchecked</span>
              <span>Invite a second driver (optional)</span>
            </div>
            <div className="row gap-2" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              <span className="ms sm">radio_button_unchecked</span>
              <span>Set up 2FA in security</span>
            </div>
          </div>
        </div>
      </div>
    }>
      <div className="h1" style={{ marginBottom: 8 }}>Tell us about the car</div>
      <div className="lead" style={{ marginBottom: 24 }}>
        The basics — used for the dashboard label, license-plate alerts, and event annotations.
      </div>

      <div className="card card-pad-lg col gap-4">
        <div className="field">
          <label className="field-label">Nickname</label>
          <input className="input" autoFocus placeholder='"WRX", "the truck", whatever' value={form.name} onChange={(e) => set('name', e.target.value)} />
          <span className="field-hint">This is what appears on the dashboard.</span>
        </div>

        <hr className="hr" />

        <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Year</label>
            <select className="select" value={form.year} onChange={(e) => set('year', e.target.value)}>
              {Array.from({ length: 30 }).map((_, i) => {
                const y = 2026 - i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Make</label>
            <select className="select" value={form.make} onChange={(e) => set('make', e.target.value)}>
              {MAKES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Model</label>
            <input className="input" placeholder="WRX STI" value={form.model} onChange={(e) => set('model', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">License plate <span style={{ color: 'var(--ink-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input className="input mono" placeholder="7VLK·442" value={form.plate} onChange={(e) => set('plate', e.target.value.toUpperCase())} />
          </div>
          <div className="field">
            <label className="field-label">Color</label>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button key={c.hex} type="button" title={c.label}
                  onClick={() => set('color', c.hex)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c.hex,
                    border: form.color === c.hex ? '2.5px solid var(--brand)' : '1.5px solid var(--line)',
                    boxShadow: form.color === c.hex ? '0 0 0 2px var(--bg) inset' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <hr className="hr" />

        <div className="row between">
          <div>
            <div className="cap">GPS / 4G telemetry</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Reserve fields for future GNSS hardware.</div>
          </div>
          <div className={`switch ${form.gps ? 'on' : ''}`} onClick={() => set('gps', !form.gps)} />
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16, borderStyle: 'dashed' }}>
        <div className="row between">
          <div>
            <div className="cap">Paired module</div>
            <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>VLK-A3F2-9C04</div>
            <div className="muted" style={{ fontSize: 12 }}>fw VLK-2.1.0 · paired 2 min ago</div>
          </div>
          <a href="#/setup/module" className="btn btn-sm btn-ghost">← change module</a>
        </div>
      </div>

      <div className="row between" style={{ marginTop: 24 }}>
        <a href="#/setup/module" className="btn btn-ghost">← back</a>
        <div className="row gap-2">
          <button className="btn btn-ghost">save draft</button>
          <button className="btn btn-primary btn-lg" onClick={finish}>
            Finish setup <span className="ms sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </SetupFrame>
  );
}

Object.assign(window, { SetupModuleScreen, SetupVehicleScreen });
