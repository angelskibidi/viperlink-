/* global React, Shell, PageHead, useApp, useToast, navigate, useRoute, VehicleSilhouette, fmtRel, fmtTime, useSelectedVehicle */
// ViperLink — Vehicles (list + detail) and Events log

const { useState: _vu, useMemo: _vm } = React;

// ─────────────────────────────────────────────────────────────
// /vehicles — garage view
// ─────────────────────────────────────────────────────────────
function VehiclesScreen() {
  const { state, setSelectedVehicle } = useApp();
  const [q, setQ] = _vu('');
  const [filter, setFilter] = _vu('all');

  const filtered = state.vehicles.filter((v) => {
    if (q && !`${v.name} ${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'alerts' && v.alarm !== 'TRIGGERED') return false;
    if (filter === 'offline' && v.moduleStatus === 'online') return false;
    return true;
  });

  const counts = {
    all: state.vehicles.length,
    alerts: state.vehicles.filter((v) => v.alarm === 'TRIGGERED').length,
    offline: state.vehicles.filter((v) => v.moduleStatus !== 'online').length,
  };

  return (
    <Shell title="Vehicles">
      <PageHead
        eyebrow="My garage"
        title="Vehicles"
        lead={`${state.vehicles.length} paired · ${counts.alerts} need attention`}
        right={[
          <div key="search" style={{ position: 'relative' }}>
            <span className="ms sm" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}>search</span>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vehicles…" style={{ paddingLeft: 32, width: 240 }} />
          </div>,
          <a key="add" href="#/setup/module" className="btn btn-primary"><span className="ms sm">add</span>Pair vehicle</a>,
        ]}
      />

      <div className="row gap-2" style={{ marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {[
          ['all', 'All'],
          ['alerts', 'Needs attention'],
          ['offline', 'Offline'],
        ].map(([k, label]) => (
          <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label} <span className="mono muted" style={{ marginLeft: 6, fontSize: 11 }}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map((v) => {
          const alert = v.alarm === 'TRIGGERED';
          const offline = v.moduleStatus !== 'online';
          return (
            <div key={v.id} className={`vcard ${alert ? 'alert' : ''}`}
              onClick={() => { setSelectedVehicle(v.id); navigate(`/vehicles/${v.id}`); }}>
              <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="bold" style={{ fontSize: 16 }}>{v.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{v.year} {v.make} {v.model}</div>
                </div>
                <div className={`pill ${alert ? 'crit live' : offline ? '' : 'good'}`}>
                  <span className="dot" />
                  {alert ? 'alarm' : offline ? 'offline' : 'armed'}
                </div>
              </div>
              <div className="vcard-image">
                <VehicleSilhouette tone={alert ? '#ef4444' : v.color || '#3b82f6'} width={300} height={120} />
                {alert && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: 'var(--crit)', color: 'white',
                    padding: '4px 10px', borderRadius: 4,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 16px var(--crit-glow)',
                  }}>
                    <span className="ms sm" style={{ verticalAlign: '-3px', marginRight: 4 }}>crisis_alert</span>
                    alarm 14:21
                  </div>
                )}
                {offline && !alert && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: 'var(--surface)', color: 'var(--ink-2)',
                    padding: '4px 10px', borderRadius: 4,
                    border: '1px dashed var(--line)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>module offline</div>
                )}
                {v.plate && (
                  <div className="mono" style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(10,14,19,0.85)',
                    border: '1px solid var(--line)',
                    padding: '3px 8px',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  }}>{v.plate}</div>
                )}
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div className="row gap-3" style={{ marginBottom: 12 }}>
                  <Stat k="alarm" v={v.alarm} tone={v.alarm === 'ARMED' ? 'good' : v.alarm === 'TRIGGERED' ? 'crit' : 'muted'} />
                  <Stat k="doors" v={v.doors} tone={v.doors === 'LOCKED' ? 'good' : v.doors === 'OPEN' ? 'crit' : 'warn'} />
                  <Stat k="ign" v={v.engine} tone={v.engine === 'OFF' ? 'muted' : 'warn'} />
                </div>
                <div className="row gap-2">
                  <button className="btn btn-sm" style={{ flex: 1 }}>Open</button>
                  <button className="btn btn-sm btn-ghost"><span className="ms sm">receipt_long</span></button>
                  <button className="btn btn-sm btn-ghost"><span className="ms sm">more_horiz</span></button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <div className="vcard"
          onClick={() => navigate('/setup/module')}
          style={{ border: '1px dashed var(--line)', alignItems: 'center', justifyContent: 'center', minHeight: 340, display: 'flex' }}>
          <div className="col gap-3" style={{ alignItems: 'center', padding: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '1.5px dashed var(--ink-4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand)',
            }}>
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

function Stat({ k, v, tone }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="cap" style={{ fontSize: 10 }}>{k}</div>
      <div className="row gap-1" style={{ marginTop: 4 }}>
        <span className={`sd ${tone === 'muted' ? '' : tone}`} />
        <span className="bold mono" style={{ fontSize: 12 }}>{v}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /vehicles/[id] — single vehicle detail
// ─────────────────────────────────────────────────────────────
function VehicleDetailScreen() {
  const { path } = useRoute();
  const { state, setState, sendCommand } = useApp();
  const toast = useToast();
  const id = path.split('/').pop();
  const v = state.vehicles.find((x) => x.id === id) || state.vehicles[0];

  const events = state.events.filter((e) => e.vehicleId === v.id);
  const [tab, setTab] = _vu('overview');

  const armed = v.alarm === 'ARMED';
  const triggered = v.alarm === 'TRIGGERED';

  const removeVehicle = () => {
    if (!confirm(`Remove ${v.name}? This cannot be undone.`)) return;
    setState((s) => ({ ...s, vehicles: s.vehicles.filter((x) => x.id !== v.id) }));
    toast({ tone: 'crit', icon: 'delete', title: 'Vehicle removed', sub: `${v.name} is no longer paired.` });
    navigate('/vehicles');
  };

  return (
    <Shell
      title={v.name}
      crumbs={<>
        <a href="#/vehicles">Vehicles</a><span>/</span><span style={{ color: 'var(--ink)' }}>{v.name}</span>
      </>}
    >
      {/* Hero */}
      <div className="card card-pad-lg" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="row gap-6" style={{ alignItems: 'center' }}>
          <div className={`status-disc ${triggered ? 'crit' : armed ? '' : 'off'}`} style={{ width: 140, height: 140 }}>
            <div className="status-disc-label" style={{ fontSize: 22 }}>{v.alarm}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cap">Vehicle profile</div>
            <div className="h1" style={{ fontSize: 32, marginTop: 4 }}>{v.name}</div>
            <div className="muted" style={{ marginTop: 4 }}>{v.year} {v.make} {v.model} · plate {v.plate || '—'}</div>
            <div className="row gap-2" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <span className={`pill ${v.moduleStatus === 'online' ? 'good' : 'crit'} live`}><span className="dot" />module {v.moduleStatus}</span>
              <span className="pill"><span className="ms sm">signal_cellular_alt</span>{v.signalDbm} dBm</span>
              <span className="pill"><span className="ms sm">memory</span>fw {v.firmware}</span>
              <span className="pill"><span className="ms sm">location_on</span>{v.location.address}</span>
            </div>
          </div>
          <div style={{ width: 360 }}>
            <VehicleSilhouette tone={triggered ? '#ef4444' : v.color || '#3b82f6'} width={360} height={140} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginTop: 24 }}>
        {[
          ['overview', 'Overview'],
          ['telemetry', 'Telemetry'],
          ['commands', 'Commands'],
          ['module', 'Module'],
          ['history', 'History'],
          ['settings', 'Settings'],
        ].map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="fade-in" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} key="ov">
          {/* Left column */}
          <div className="col gap-4">
            <div className="card card-pad-lg">
              <div className="cap" style={{ marginBottom: 12 }}>Current status</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MiniStat label="Alarm" value={v.alarm} tone={v.alarm === 'ARMED' ? 'good' : v.alarm === 'TRIGGERED' ? 'crit' : 'muted'} icon="shield" />
                <MiniStat label="Doors" value={v.doors} tone={v.doors === 'LOCKED' ? 'good' : v.doors === 'OPEN' ? 'crit' : 'warn'} icon="lock" />
                <MiniStat label="Ignition" value={v.engine} tone={v.engine === 'OFF' ? 'muted' : 'warn'} icon="electric_car" />
                <MiniStat label="Battery" value={v.battery} tone="good" icon="battery_full" />
              </div>
            </div>

            <div className="card">
              <div className="row between" style={{ padding: '18px 20px 12px' }}>
                <div className="cap">Activity today</div>
                <a href="#/events" className="btn btn-ghost btn-sm">full history →</a>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                {events.slice(0, 8).map((e) => (
                  <div key={e.id} className="list-row">
                    <div className="mono" style={{ width: 56, fontSize: 11, color: 'var(--ink-2)' }}>{fmtTime(e.timestamp)}</div>
                    <span className="ms sm" style={{ color: ['critical', 'warning', 'success'].includes(e.severity) ? `var(--${e.severity === 'critical' ? 'crit' : e.severity === 'warning' ? 'warn' : 'good'})` : 'var(--brand)' }}>
                      {e.severity === 'critical' ? 'crisis_alert' : e.severity === 'warning' ? 'warning' : e.severity === 'success' ? 'check_circle' : 'info'}
                    </span>
                    <span className="mono bold" style={{ fontSize: 12, width: 160 }}>{e.type}</span>
                    <span className="muted" style={{ flex: 1, fontSize: 13 }}>{e.description}</span>
                  </div>
                ))}
                {events.length === 0 && <div className="muted" style={{ padding: '12px 0' }}>No events yet.</div>}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col gap-4">
            <div className="card card-pad-lg">
              <div className="cap" style={{ marginBottom: 12 }}>Commands</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => { sendCommand('ARM'); toast({ tone: 'good', icon: 'check_circle', title: 'Armed', sub: v.name }); }} disabled={armed}>
                  <span className="ms sm">lock</span>Arm
                </button>
                <button className="btn" onClick={() => { sendCommand('DISARM'); toast({ tone: 'good', icon: 'check_circle', title: 'Disarmed', sub: v.name }); }} disabled={v.alarm === 'DISARMED'}>
                  <span className="ms sm">lock_open</span>Disarm
                </button>
                <button className="btn" onClick={() => sendCommand('LOCK')}>Lock</button>
                <button className="btn" onClick={() => sendCommand('UNLOCK')}>Unlock</button>
                <button className="btn btn-ghost">Start engine</button>
                <button className="btn btn-ghost">Trunk</button>
              </div>
            </div>

            <div className="card card-pad-lg">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="cap">Module</div>
                <span className="pill good"><span className="dot" />paired</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="cap" style={{ fontSize: 10 }}>ID</div>
                  <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.moduleId}</div>
                </div>
                <div>
                  <div className="cap" style={{ fontSize: 10 }}>Firmware</div>
                  <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.firmware}</div>
                </div>
                <div>
                  <div className="cap" style={{ fontSize: 10 }}>Last ping</div>
                  <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.lastSeen}</div>
                </div>
                <div>
                  <div className="cap" style={{ fontSize: 10 }}>Secret</div>
                  <div className="mono bold" style={{ fontSize: 13, marginTop: 2 }}>{v.moduleSecret}</div>
                </div>
              </div>
              <div className="row gap-2" style={{ marginTop: 12 }}>
                <button className="btn btn-sm btn-ghost"><span className="ms sm">refresh</span>re-pair</button>
                <button className="btn btn-sm btn-ghost"><span className="ms sm">key</span>rotate secret</button>
              </div>
            </div>

            <div className="danger-zone">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="cap" style={{ color: 'var(--crit)' }}>Danger zone</div>
                <span className="ms" style={{ color: 'var(--crit)' }}>warning</span>
              </div>
              <div className="row gap-2">
                <button className="btn btn-sm" style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }}>Factory reset</button>
                <button className="btn btn-sm btn-danger" onClick={removeVehicle}>Remove vehicle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab !== 'overview' && (
        <div className="fade-in card card-pad-lg" style={{ marginTop: 20, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }} key={tab}>
          <div className="col gap-2 text-c muted">
            <span className="ms xl">construction</span>
            <div className="bold">{tab.charAt(0).toUpperCase() + tab.slice(1)} tab</div>
            <div style={{ fontSize: 13 }}>Coming in the next iteration. The Overview tab has everything you need for now.</div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function MiniStat({ label, value, tone, icon }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-2)', padding: 12 }}>
      <div className="row between">
        <div className="cap">{label}</div>
        <span className="ms sm" style={{ color: `var(--${tone === 'muted' ? 'ink-2' : tone === 'good' ? 'good' : tone === 'crit' ? 'crit' : 'warn'})` }}>{icon}</span>
      </div>
      <div className="bold" style={{ fontSize: 17, marginTop: 4 }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// /events — log view
// ─────────────────────────────────────────────────────────────
function EventsScreen() {
  const { state } = useApp();
  const [q, setQ] = _vu('');
  const [vehicleFilter, setVehicleFilter] = _vu('all');
  const [sev, setSev] = _vu('all');

  const all = state.events.map((e) => ({
    ...e, vehicle: state.vehicles.find((v) => v.id === e.vehicleId),
  }));

  const filtered = all.filter((e) => {
    if (vehicleFilter !== 'all' && e.vehicleId !== vehicleFilter) return false;
    if (sev !== 'all' && e.severity !== sev) return false;
    if (q && !`${e.type} ${e.description} ${e.vehicle?.name || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: all.length,
    critical: all.filter((e) => e.severity === 'critical').length,
    perDay: (all.length / 1).toFixed(1),
    topType: (() => {
      const counts = {};
      all.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : '—';
    })(),
  };

  return (
    <Shell title="Events">
      <PageHead eyebrow="Activity log" title="Event history" lead="Every signal across every paired vehicle. Filter, search, export." />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="field">
            <label className="field-label">Search</label>
            <div style={{ position: 'relative' }}>
              <span className="ms sm" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}>search</span>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="type, description, vehicle…" style={{ paddingLeft: 32 }} />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Vehicle</label>
            <select className="select" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="all">All vehicles</option>
              {state.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
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
            <label className="field-label">Range</label>
            <select className="select">
              <option>Last 7 days</option>
              <option>Last 24 hours</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <button className="btn btn-ghost"><span className="ms sm">download</span>export CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiBox label="Total events" value={stats.total} sub="+12% vs prev" tone="brand" />
        <KpiBox label="Critical" value={stats.critical} sub={stats.critical ? `${stats.critical} need review` : 'no incidents'} tone="crit" />
        <KpiBox label="Avg / day" value={stats.perDay} sub="—" tone="muted" />
        <KpiBox label="Top trigger" value={stats.topType} sub="this week" tone="muted" small />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 140px 220px 110px 1fr 40px', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
          {['Time', 'Vehicle', 'Event', 'Severity', 'Details', ''].map((h, i) => (
            <div key={i} className="cap" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 'calc(100vh - 480px)', minHeight: 300, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div className="muted text-c" style={{ padding: 48 }}>No matching events.</div>
          )}
          {filtered.map((e) => (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '90px 140px 220px 110px 1fr 40px',
              gap: 12, padding: '12px 20px',
              borderBottom: '1px solid var(--line-soft)',
              alignItems: 'center',
              background: e.severity === 'critical' ? 'rgba(239,68,68,0.04)' : 'transparent',
            }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{fmtTime(e.timestamp)}</div>
              <div className="bold" style={{ fontSize: 13 }}>{e.vehicle?.name || '—'}</div>
              <div className="row gap-2">
                <span className="ms sm" style={{ color: e.severity === 'critical' ? 'var(--crit)' : e.severity === 'warning' ? 'var(--warn)' : e.severity === 'success' ? 'var(--good)' : 'var(--brand)' }}>
                  {e.severity === 'critical' ? 'crisis_alert' : e.severity === 'warning' ? 'warning' : e.severity === 'success' ? 'check_circle' : 'info'}
                </span>
                <span className="mono bold" style={{ fontSize: 12 }}>{e.type}</span>
              </div>
              <span className={`pill ${e.severity === 'critical' ? 'crit' : e.severity === 'warning' ? 'warn' : e.severity === 'success' ? 'good' : ''}`}>{e.severity}</span>
              <div className="muted" style={{ fontSize: 13 }}>{e.description}</div>
              <span className="ms sm muted" style={{ cursor: 'pointer' }}>more_horiz</span>
            </div>
          ))}
        </div>
        <div className="row between" style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <span className="muted mono" style={{ fontSize: 12 }}>{filtered.length} of {all.length} events</span>
          <div className="row gap-2">
            <button className="btn btn-sm btn-ghost">‹ prev</button>
            <button className="btn btn-sm">next ›</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function KpiBox({ label, value, sub, tone, small }) {
  const color = tone === 'brand' ? 'var(--brand)' : tone === 'crit' ? 'var(--crit)' : 'var(--ink)';
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color, fontSize: small ? 18 : 26, fontFamily: small ? 'var(--font-mono)' : 'var(--font-sans)', letterSpacing: small ? '0.04em' : '-0.02em' }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

Object.assign(window, { VehiclesScreen, VehicleDetailScreen, EventsScreen });
