/* global React, ReactDOM */
// ViperLink — shell, router, state, primitives.
// Exposes a bunch of globals on window.

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// ─────────────────────────────────────────────────────────────
// Router (hash-based)
// ─────────────────────────────────────────────────────────────
const RouterCtx = createContext(null);

function parseHash() {
  const raw = (window.location.hash || '').replace(/^#/, '') || '/login';
  const [path, query = ''] = raw.split('?');
  const params = {};
  if (query) {
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { path, params, raw };
}

function navigate(to) {
  window.location.hash = '#' + to;
}

function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return <RouterCtx.Provider value={route}>{children}</RouterCtx.Provider>;
}

function useRoute() { return useContext(RouterCtx); }

function Link({ to, className = '', children, onClick, ...rest }) {
  return (
    <a href={'#' + to} className={className} onClick={(e) => { if (onClick) onClick(e); }} {...rest}>{children}</a>
  );
}

// ─────────────────────────────────────────────────────────────
// App state context
// ─────────────────────────────────────────────────────────────
const StateCtx = createContext(null);

const STORAGE_KEY = 'vl_demo_state_v1';

function defaultState() {
  return {
    // Auth / onboarding flags
    signedIn: false,
    has2FA: true,                  // demo: existing user with 2FA enrolled
    trustedDevice: false,
    user: {
      first: 'Alex', last: 'Rivera',
      username: 'alex', email: 'alex@viperlink.app',
      phone: '+1 555 123 4567',
      avatar: 'A',
    },
    // Has the user completed first-run setup?
    onboarded: true,
    selectedVehicleId: 'v1',
    vehicles: [
      {
        id: 'v1', name: 'WRX', make: 'Subaru', model: 'WRX STI', year: '2019',
        plate: '7VLK·442', color: '#1a1f2a',
        moduleId: 'VLK-A3F2-9C04', moduleSecret: 'vlk_sk_••••', firmware: 'VLK-2.1.0',
        moduleStatus: 'online', signalDbm: -67, lastSeen: 'just now',
        alarm: 'ARMED', doors: 'LOCKED', engine: 'OFF', battery: '12.4V',
        location: { lat: 37.7749, lng: -122.4194, address: '1428 Oak St', geofence: 'Home', updated: '14m ago' },
      },
      {
        id: 'v2', name: 'F-150', make: 'Ford', model: 'F-150 Lariat', year: '2022',
        plate: 'TRK·7821', color: '#101417',
        moduleId: 'VLK-B71C-22E1', moduleSecret: 'vlk_sk_••••', firmware: 'VLK-2.1.0',
        moduleStatus: 'online', signalDbm: -58, lastSeen: '4m ago',
        alarm: 'ARMED', doors: 'LOCKED', engine: 'OFF', battery: '12.6V',
        location: { lat: 37.7849, lng: -122.4094, address: '410 Bryant St', geofence: 'Work', updated: '4m ago' },
      },
      {
        id: 'v3', name: "Wife's CR-V", make: 'Honda', model: 'CR-V', year: '2020',
        plate: 'CRV·104', color: '#c2362b',
        moduleId: 'VLK-9D44-1AA8', moduleSecret: 'vlk_sk_••••', firmware: 'VLK-2.1.0',
        moduleStatus: 'online', signalDbm: -71, lastSeen: 'just now',
        alarm: 'ARMED', doors: 'LOCKED', engine: 'OFF', battery: '12.2V',
        location: { lat: 37.78, lng: -122.42, address: 'Trader Joe\'s · Mission', geofence: null, updated: 'just now' },
      },
    ],
    events: [], // populated below
    commands: [],
  };
}

function seedEvents(state) {
  const now = Date.now();
  const mk = (mins, vid, type, desc, sev='info') => ({
    id: 'e' + Math.random().toString(36).slice(2, 9),
    vehicleId: vid, type, description: desc, severity: sev,
    timestamp: now - mins * 60 * 1000,
  });
  state.events = [
    mk(2,  'v1', 'ARMED',         'Alarm armed via remote',          'success'),
    mk(3,  'v1', 'DOOR_CLOSED',   'Driver door closed',              'info'),
    mk(6,  'v1', 'IGNITION_OFF',  'Engine off, parked',              'info'),
    mk(22, 'v1', 'DOOR_OPEN',     'Driver door opened',              'warning'),
    mk(23, 'v1', 'UNLOCKED',      'Doors unlocked via remote',       'success'),
    mk(34, 'v2', 'MODULE_PING',   'Module heartbeat · OK',           'info'),
    mk(58, 'v3', 'GEOFENCE_LEFT', 'Wife\'s CR-V left "Home"',         'info'),
    mk(96, 'v1', 'TRIP_END',      'Arrived home · 14.2 mi · 32 min', 'info'),
    mk(128,'v1', 'TRIP_START',    'Left work',                       'info'),
    mk(180,'v2', 'SHOCK_LIGHT',   'Light shock detected · 0.8g',     'warning'),
    mk(310,'v3', 'ARMED',         'Alarm armed via remote',          'success'),
  ];
  state.commands = [
    { id: 'c1', vehicleId: 'v1', command: 'ARM',    status: 'delivered', timestamp: now - 2*60*1000 },
    { id: 'c2', vehicleId: 'v1', command: 'LOCK',   status: 'delivered', timestamp: now - 22*60*1000 },
    { id: 'c3', vehicleId: 'v1', command: 'UNLOCK', status: 'delivered', timestamp: now - 23*60*1000 },
    { id: 'c4', vehicleId: 'v2', command: 'ARM',    status: 'delivered', timestamp: now - 35*60*1000 },
    { id: 'c5', vehicleId: 'v3', command: 'ARM',    status: 'delivered', timestamp: now - 311*60*1000 },
  ];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // refresh timestamps to be relative to "now" so the demo doesn't go stale
      if (parsed && Array.isArray(parsed.events) && parsed.events.length > 0) {
        return parsed;
      }
    }
  } catch {}
  const s = defaultState();
  seedEvents(s);
  return s;
}

function StateProvider({ children }) {
  const [state, _setState] = useState(loadState);
  const persist = useCallback((next) => {
    _setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);
  const setState = useCallback((updater) => {
    _setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    const s = defaultState();
    seedEvents(s);
    persist(s);
    window.location.hash = '#/login';
  }, [persist]);

  // Helper actions
  const api = useMemo(() => ({
    state, setState, reset,
    setSelectedVehicle: (id) => setState((s) => ({ ...s, selectedVehicleId: id })),
    sendCommand: (cmd) => setState((s) => {
      const vid = s.selectedVehicleId;
      const updates = { ...s };
      updates.commands = [
        { id: 'c' + Math.random().toString(36).slice(2, 9), vehicleId: vid, command: cmd, status: 'delivered', timestamp: Date.now() },
        ...s.commands,
      ];
      const updateVehicle = (v) => {
        if (v.id !== vid) return v;
        const nv = { ...v };
        if (cmd === 'ARM') nv.alarm = 'ARMED';
        if (cmd === 'DISARM') nv.alarm = 'DISARMED';
        if (cmd === 'LOCK') nv.doors = 'LOCKED';
        if (cmd === 'UNLOCK') nv.doors = 'UNLOCKED';
        if (cmd === 'START') nv.engine = 'RUNNING';
        if (cmd === 'STOP') nv.engine = 'OFF';
        return nv;
      };
      updates.vehicles = s.vehicles.map(updateVehicle);
      updates.events = [
        { id: 'e' + Math.random().toString(36).slice(2, 9), vehicleId: vid, type: cmd, description: cmd + ' command delivered', severity: 'success', timestamp: Date.now() },
        ...s.events,
      ];
      return updates;
    }),
    addEvent: (type, description, severity = 'info') => setState((s) => ({
      ...s,
      events: [
        { id: 'e' + Math.random().toString(36).slice(2, 9), vehicleId: s.selectedVehicleId, type, description, severity, timestamp: Date.now() },
        ...s.events,
      ],
    })),
    simulate: (kind) => setState((s) => {
      const vid = s.selectedVehicleId;
      const presets = {
        shock:    ['SHOCK_TRIGGERED', 'Shock sensor triggered · 3.2g impact', 'critical'],
        door:     ['DOOR_OPEN',       'Driver door opened',                 'warning'],
        ignition: ['IGNITION_ON',     'Ignition signal detected',           'warning'],
        alarm:    ['FULL_ALARM',      'FULL ALARM · alarm sequence triggered','critical'],
      };
      const [type, desc, sev] = presets[kind];
      const updates = { ...s };
      updates.events = [
        { id: 'e' + Math.random().toString(36).slice(2, 9), vehicleId: vid, type, description: desc, severity: sev, timestamp: Date.now() },
        ...s.events,
      ];
      if (kind === 'shock' || kind === 'alarm') {
        updates.vehicles = s.vehicles.map((v) => v.id === vid ? { ...v, alarm: 'TRIGGERED' } : v);
      }
      if (kind === 'door') {
        updates.vehicles = s.vehicles.map((v) => v.id === vid ? { ...v, doors: 'OPEN' } : v);
      }
      if (kind === 'ignition') {
        updates.vehicles = s.vehicles.map((v) => v.id === vid ? { ...v, engine: 'RUNNING' } : v);
      }
      return updates;
    }),
    signIn: () => setState((s) => ({ ...s, signedIn: true })),
    signOut: () => setState((s) => ({ ...s, signedIn: false })),
    setUser: (patch) => setState((s) => ({ ...s, user: { ...s.user, ...patch } })),
    set2FA: (on) => setState((s) => ({ ...s, has2FA: on })),
  }), [state, setState, reset]);

  return <StateCtx.Provider value={api}>{children}</StateCtx.Provider>;
}

function useApp() { return useContext(StateCtx); }

function useSelectedVehicle() {
  const { state } = useApp();
  return state.vehicles.find((v) => v.id === state.selectedVehicleId) || state.vehicles[0];
}

// ─────────────────────────────────────────────────────────────
// Toast system
// ─────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

function ToastProvider({ children }) {
  const [stack, setStack] = useState([]);
  const push = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast = { id, tone: 'brand', icon: 'info', title: '', sub: '', ttl: 3000, ...opts };
    setStack((cur) => [...cur, toast]);
    setTimeout(() => setStack((cur) => cur.filter((t) => t.id !== id)), toast.ttl);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {stack.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <span className="ms fill">{t.icon}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.sub && <div className="toast-sub">{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function useToast() { return useContext(ToastCtx); }

// ─────────────────────────────────────────────────────────────
// Time formatting helpers
// ─────────────────────────────────────────────────────────────
function fmtRel(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─────────────────────────────────────────────────────────────
// Sidebar + TopBar + Shell
// ─────────────────────────────────────────────────────────────
const NAV = [
  { to: '/',         label: 'Dashboard',     icon: 'dashboard',   match: (p) => p === '/' || p.startsWith('/dashboard') },
  { to: '/vehicles', label: 'Vehicles',      icon: 'directions_car', match: (p) => p.startsWith('/vehicles') },
  { to: '/events',   label: 'Events',        icon: 'receipt_long', match: (p) => p.startsWith('/events') },
  { to: '/security', label: 'Security',      icon: 'verified_user', match: (p) => p.startsWith('/security') },
  { to: '/settings', label: 'Settings',      icon: 'settings',    match: (p) => p.startsWith('/settings') },
];

function Sidebar() {
  const { path } = useRoute();
  const { state, signOut } = useApp();
  const toast = useToast();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark">V</div>
        <div className="sidebar-wordmark">ViperLink</div>
      </div>
      {NAV.map((item) => {
        const active = item.match(path);
        return (
          <a key={item.to} href={'#' + item.to} className={`nav-item ${active ? 'active' : ''}`}>
            <span className="ms">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.to === '/events' && (
              <span className="nav-badge">3</span>
            )}
          </a>
        );
      })}
      <div className="sidebar-spacer" />
      <button
        className="sidebar-panic"
        onClick={() => toast({ tone: 'crit', icon: 'siren', title: 'Panic alarm armed', sub: 'Notifying authorized contacts…', ttl: 4000 })}
      >
        <span className="ms">crisis_alert</span>
        <span className="panic-text">Panic</span>
      </button>
      <div className="sidebar-user">
        <div className="user-avatar">{state.user.avatar}</div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div className="user-name">{state.user.first} {state.user.last}</div>
          <div className="user-mail">{state.user.email}</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, crumbs = null, right = null }) {
  const { state, setSelectedVehicle } = useApp();
  const sel = useSelectedVehicle();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      {crumbs && <div className="topbar-crumb">{crumbs}</div>}

      <div className="topbar-actions">
        {/* Vehicle switcher */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div className="vehicle-switcher" onClick={() => setOpen((o) => !o)}>
            <span className="ms sm">directions_car</span>
            <span>{sel.name}</span>
            <span className="muted mono" style={{ fontSize: 11 }}>· {sel.year} {sel.make}</span>
            <span className="ms sm">expand_more</span>
          </div>
          {open && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-2)', minWidth: 260, padding: 6,
              boxShadow: 'var(--shadow-pop)', zIndex: 100,
            }}>
              {state.vehicles.map((v) => (
                <div key={v.id}
                  onClick={() => { setSelectedVehicle(v.id); setOpen(false); }}
                  style={{
                    padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: v.id === sel.id ? 'var(--brand-soft)' : 'transparent',
                  }}>
                  <span className={`sd ${v.alarm === 'ARMED' ? 'good' : v.alarm === 'TRIGGERED' ? 'crit' : ''}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{v.year} {v.make} {v.model}</div>
                  </div>
                  {v.id === sel.id && <span className="ms sm" style={{ color: 'var(--brand)' }}>check</span>}
                </div>
              ))}
              <div className="divider" style={{ margin: '6px 0' }} />
              <a href="#/setup/module" className="nav-item" style={{ padding: '8px 10px', color: 'var(--brand)' }}>
                <span className="ms sm">add</span>
                <span style={{ opacity: 1, fontSize: 13 }}>Pair another vehicle</span>
              </a>
            </div>
          )}
        </div>

        <div className="row gap-2">
          <span className="sd good" />
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>
        </div>

        {right}
      </div>
    </div>
  );
}

function Shell({ title, crumbs, right, children }) {
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

// ─────────────────────────────────────────────────────────────
// OTP input component (autofocus, auto-submit)
// ─────────────────────────────────────────────────────────────
function Otp({ length = 6, value, onChange, onComplete, autoFocus = true }) {
  const refs = useRef([]);

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    const next = (value + '').split('');
    next[i] = clean || '';
    const out = next.join('').slice(0, length);
    onChange(out);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
    if (out.length === length && /^\d+$/.test(out) && !(value || '').match(new RegExp(`^\\d{${length}}$`))) {
      // fire complete on the call that filled the last cell
      if ((next.filter(Boolean).length) === length) {
        setTimeout(() => onComplete && onComplete(out), 80);
      }
    }
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !(value[i] || '')) {
      if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };
  const onPaste = (e) => {
    const txt = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!txt) return;
    e.preventDefault();
    onChange(txt.padEnd(value.length, '').slice(0, length));
    if (txt.length === length) {
      setTimeout(() => onComplete && onComplete(txt), 80);
    } else {
      refs.current[txt.length]?.focus();
    }
  };
  return (
    <div className="otp" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`otp-cell ${value[i] ? 'filled' : ''}`}
          inputMode="numeric"
          maxLength="1"
          value={value[i] || ''}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tiny sparkline (SVG) — used in KPI cards
// ─────────────────────────────────────────────────────────────
function Sparkline({ values, color = 'var(--brand)', fill = 'rgba(59,130,246,0.15)' }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 100, h = 32;
  const xs = values.map((_, i) => (i / (values.length - 1)) * w);
  const ys = values.map((v) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={area} fill={fill} />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Strength meter
// ─────────────────────────────────────────────────────────────
function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
function Strength({ score }) {
  const labels = ['', 'weak', 'fair', 'good', 'strong'];
  return (
    <div className="col gap-1">
      <div className="strength">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={i <= score ? `on-${score}` : ''} />
        ))}
      </div>
      <div className="cap" style={{ fontSize: 10 }}>{labels[score] || '·'}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vehicle silhouette (sleek SVG, single-color, used in vcard image)
// ─────────────────────────────────────────────────────────────
function VehicleSilhouette({ tone = 'var(--ink-3)', width = 260, height = 100 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 260 100" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="vcar-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0" />
          <stop offset="0.7" stopColor={tone} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g fill={tone} stroke="none">
        {/* body silhouette */}
        <path d="M 10 70 C 14 60, 28 56, 40 56 L 60 56 C 64 48, 80 36, 108 33 L 168 33 C 188 33, 210 48, 222 56 L 244 58 C 252 60, 252 70, 244 72 L 222 72 C 218 80, 208 86, 196 86 C 184 86, 174 80, 170 72 L 90 72 C 86 80, 76 86, 64 86 C 52 86, 42 80, 38 72 L 18 72 C 12 72, 8 70, 10 70 Z" />
        {/* windows */}
        <path d="M 76 54 L 90 38 L 132 38 L 138 54 Z M 142 54 L 138 38 L 168 38 C 178 38, 192 48, 198 54 Z" fill="rgba(255,255,255,0.08)" />
      </g>
      <g fill="rgba(0,0,0,0.5)">
        <circle cx="64" cy="78" r="10" />
        <circle cx="196" cy="78" r="10" />
        <circle cx="64" cy="78" r="3" fill={tone} />
        <circle cx="196" cy="78" r="3" fill={tone} />
      </g>
      <ellipse cx="130" cy="92" rx="120" ry="3" fill="url(#vcar-shadow)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Copy-to-clipboard helper
// ─────────────────────────────────────────────────────────────
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────
// Page header
// ─────────────────────────────────────────────────────────────
function PageHead({ eyebrow, title, lead, right }) {
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

// ─────────────────────────────────────────────────────────────
// Auth shell (the split-screen used by login/signup/etc)
// ─────────────────────────────────────────────────────────────
function AuthLayout({ title, sub, footer, children, aside }) {
  return (
    <div className="auth">
      <div className="auth-aside">
        <div className="auth-brand">
          <div className="sidebar-mark">V</div>
          <span>ViperLink</span>
          <span className="cap" style={{ marginLeft: 12 }}>vehicle security console</span>
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {aside}
        </div>
        <div className="row gap-2 muted" style={{ position: 'relative', zIndex: 1, fontSize: 12 }}>
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

// Decorative aside illustrations (lo-poly-ish — minimal SVG, no slop)
function AuthAsideHero({ kind = 'lock' }) {
  return (
    <div className="col gap-6" style={{ alignItems: 'center' }}>
      <VehicleSilhouette tone="#3b82f6" width={420} height={160} />
      <div style={{
        padding: '28px 36px',
        border: '1px solid var(--line)',
        background: 'rgba(20,26,35,0.5)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        maxWidth: 420,
        textAlign: 'center',
      }}>
        <div className="cap" style={{ color: 'var(--brand)' }}>real-time control</div>
        <div className="h2" style={{ marginTop: 6 }}>
          Your fleet, on the right side of every glass.
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Arm, locate, and audit every vehicle from a single console — with end-to-end audit logs and TOTP-gated access.
        </div>
      </div>
      <div className="row gap-3" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="pill brand live"><span className="dot" /> 3 vehicles online</div>
        <div className="pill"><span className="ms sm">bolt</span> &lt; 200 ms commands</div>
        <div className="pill"><span className="ms sm">lock</span> AES-256</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  RouterProvider, useRoute, navigate, Link,
  StateProvider, useApp, useSelectedVehicle,
  ToastProvider, useToast,
  Sidebar, TopBar, Shell, PageHead,
  Otp, Sparkline, Strength, scorePassword,
  VehicleSilhouette, AuthLayout, AuthAsideHero,
  copyText, fmtRel, fmtTime,
});
