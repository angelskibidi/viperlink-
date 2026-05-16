/* global React, Shell, PageHead, useApp, useSelectedVehicle, useToast, navigate, Sparkline, VehicleSilhouette, fmtRel, fmtTime */
// ViperLink — Dashboard (B · Multi-card grid, the picked direction)

function DashboardScreen() {
  const { state, sendCommand, simulate } = useApp();
  const v = useSelectedVehicle();
  const toast = useToast();

  const vehicleEvents = state.events.filter((e) => e.vehicleId === v.id);
  const vehicleCommands = state.commands.filter((c) => c.vehicleId === v.id);

  const armed = v.alarm === 'ARMED';
  const triggered = v.alarm === 'TRIGGERED';

  const onCmd = (cmd, label, tone = 'good') => {
    sendCommand(cmd);
    toast({ tone: tone === 'crit' ? 'crit' : 'good', icon: 'check_circle', title: `${label} sent`, sub: `Delivered to ${v.name} in 142 ms.` });
  };

  // Compute mini "Last 24h" series for the sparkline
  const series = useMemo24hSeries(state.events, v.id);

  return (
    <Shell
      title="Dashboard"
      right={
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/setup/module')}>
          <span className="ms sm">add</span>add vehicle
        </button>
      }
    >
      {/* Status row + Commands */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Hero status card */}
        <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
          {/* faint grid pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px) 0 0 / 32px 32px',
            pointerEvents: 'none',
            mask: 'radial-gradient(ellipse at 80% 50%, black 0%, transparent 70%)',
          }} />
          <div className="row gap-6" style={{ alignItems: 'center', position: 'relative' }}>
            <div className={`status-disc ${triggered ? 'crit' : armed ? '' : 'off'}`}>
              <div className="status-disc-label">{v.alarm}</div>
              <div className="status-disc-sub">{v.alarm === 'ARMED' ? 'protected' : v.alarm === 'TRIGGERED' ? 'incident' : 'unprotected'}</div>
            </div>
            <div className="col gap-2" style={{ flex: 1 }}>
              <div className="cap" style={{ color: 'var(--ink-2)' }}>Live status · {v.year} {v.make} {v.model}</div>
              <div className="h1" style={{ fontSize: 32 }}>
                {triggered ? 'Alarm triggered.' : armed ? 'All systems normal.' : 'Alarm is disarmed.'}
              </div>
              <div className="muted" style={{ fontSize: 14 }}>
                {triggered ? 'Authorities notified · check the events log immediately.' :
                 armed ? `No events for ${vehicleEvents[0] ? fmtRel(vehicleEvents[0].timestamp) : '6 hours'}. Module pinging on schedule.` :
                 'Arm the alarm to resume monitoring.'}
              </div>
              <div className="row gap-2" style={{ marginTop: 8 }}>
                {armed
                  ? <button className="btn btn-lg" onClick={() => onCmd('DISARM', 'Disarm')}><span className="ms sm">lock_open</span>Disarm</button>
                  : <button className="btn btn-lg btn-primary" onClick={() => onCmd('ARM', 'Arm')}><span className="ms sm">lock</span>Arm</button>}
                {v.doors === 'LOCKED'
                  ? <button className="btn btn-lg" onClick={() => onCmd('UNLOCK', 'Unlock')}><span className="ms sm">lock_open</span>Unlock</button>
                  : <button className="btn btn-lg" onClick={() => onCmd('LOCK', 'Lock')}><span className="ms sm">lock</span>Lock</button>}
                <a href={`#/vehicles/${v.id}`} className="btn btn-lg btn-ghost"><span className="ms sm">tune</span>more</a>
              </div>
            </div>
            <div style={{ width: 320, opacity: 0.95 }}>
              <VehicleSilhouette tone={armed ? '#3b82f6' : triggered ? '#ef4444' : '#5a6371'} width={320} height={120} />
            </div>
          </div>
        </div>

        {/* Module identity / signal */}
        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="cap">Module</div>
            <div className={`pill live ${v.moduleStatus === 'online' ? 'good' : 'crit'}`}><span className="dot" />{v.moduleStatus}</div>
          </div>
          <div className="mono bold" style={{ fontSize: 14, marginBottom: 4 }}>{v.moduleId}</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>fw {v.firmware} · paired</div>

          <div className="cap" style={{ marginBottom: 8 }}>Signal</div>
          <div className="row gap-2" style={{ alignItems: 'flex-end', height: 40 }}>
            {[8, 14, 22, 30, 26].map((h, i) => (
              <div key={i} style={{
                width: 14, height: h,
                background: i < 4 ? 'var(--brand)' : 'var(--surface-3)',
                borderRadius: 2,
                boxShadow: i < 4 ? '0 0 8px var(--brand-glow)' : 'none',
              }} />
            ))}
            <div className="col" style={{ marginLeft: 8 }}>
              <div className="mono bold" style={{ fontSize: 16 }}>{v.signalDbm}<span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>dBm</span></div>
              <div className="cap" style={{ fontSize: 10 }}>LTE · strong</div>
            </div>
          </div>

          <hr className="hr" style={{ margin: '16px 0' }} />

          <div className="cap" style={{ marginBottom: 8 }}>Last seen</div>
          <div className="mono" style={{ fontSize: 13 }}>{v.lastSeen}</div>
        </div>
      </div>

      {/* Status quad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
        <StatTile label="Alarm" value={v.alarm} icon={v.alarm === 'ARMED' ? 'shield' : v.alarm === 'TRIGGERED' ? 'crisis_alert' : 'shield_lock'}
          tone={v.alarm === 'ARMED' ? 'good' : v.alarm === 'TRIGGERED' ? 'crit' : 'muted'} />
        <StatTile label="Doors" value={v.doors} icon={v.doors === 'LOCKED' ? 'lock' : v.doors === 'OPEN' ? 'door_open' : 'lock_open'}
          tone={v.doors === 'LOCKED' ? 'good' : v.doors === 'OPEN' ? 'crit' : 'warn'} />
        <StatTile label="Ignition" value={v.engine} icon={v.engine === 'OFF' ? 'power_off' : 'electric_car'}
          tone={v.engine === 'RUNNING' ? 'warn' : 'muted'} />
        <StatTile label="Battery" value={v.battery} icon="battery_full" tone="good" sub="12.4 V · normal" />
      </div>

      {/* Commands + Last 24h row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginTop: 20 }}>
        {/* Commands */}
        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 14 }}>
            <div>
              <div className="cap">Commands</div>
              <div className="h3" style={{ marginTop: 2 }}>Send to {v.name}</div>
            </div>
            <span className="muted mono" style={{ fontSize: 11 }}>avg latency · 142ms</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <CmdBtn icon="lock" label="Arm" tone="brand" onClick={() => onCmd('ARM', 'Arm')} disabled={v.alarm === 'ARMED'} />
            <CmdBtn icon="lock_open" label="Disarm" onClick={() => onCmd('DISARM', 'Disarm')} disabled={v.alarm === 'DISARMED'} />
            <CmdBtn icon="lock" label="Lock" onClick={() => onCmd('LOCK', 'Lock')} disabled={v.doors === 'LOCKED'} />
            <CmdBtn icon="lock_open" label="Unlock" onClick={() => onCmd('UNLOCK', 'Unlock')} disabled={v.doors === 'UNLOCKED'} />
            <CmdBtn icon="key" label="Start" onClick={() => onCmd('START', 'Start engine')} />
            <CmdBtn icon="power_settings_new" label="Stop" onClick={() => onCmd('STOP', 'Stop engine')} />
            <CmdBtn icon="luggage" label="Trunk" onClick={() => onCmd('TRUNK', 'Trunk release')} />
            <CmdBtn icon="campaign" label="Honk" onClick={() => onCmd('HONK', 'Horn')} />
          </div>

          <hr className="hr" style={{ margin: '16px 0' }} />

          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="cap" style={{ color: 'var(--ink-2)' }}>Simulate (dev)</div>
            <span className="pill">sim mode</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <CmdBtn icon="bolt" label="Shock" onClick={() => simulate('shock')} />
            <CmdBtn icon="door_open" label="Door" onClick={() => simulate('door')} />
            <CmdBtn icon="electric_car" label="Ignition" onClick={() => simulate('ignition')} />
            <CmdBtn icon="crisis_alert" label="Full alarm" tone="danger" onClick={() => simulate('alarm')} />
          </div>
        </div>

        {/* Last 24h */}
        <div className="card card-pad-lg">
          <div className="row between" style={{ marginBottom: 6 }}>
            <div className="cap">Last 24 hours</div>
            <span className="muted mono" style={{ fontSize: 11 }}>vs prev · <span style={{ color: 'var(--good)' }}>−18%</span></span>
          </div>
          <div className="row gap-6" style={{ alignItems: 'baseline', marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{vehicleEvents.length}</div>
              <div className="cap">events</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--crit)' }}>{vehicleEvents.filter((e) => e.severity === 'critical').length}</div>
              <div className="cap">criticals</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{vehicleCommands.length}</div>
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

          <hr className="hr" style={{ margin: '16px 0' }} />

          <div className="cap" style={{ marginBottom: 8 }}>Last drive</div>
          <div className="row between">
            <div>
              <div className="bold">14.2 mi · 32 min</div>
              <div className="muted" style={{ fontSize: 12 }}>Tue 8:42 → 9:14am · 28 mph avg</div>
            </div>
            <a href="#/events" className="btn btn-ghost btn-sm">trips →</a>
          </div>
        </div>
      </div>

      {/* Activity + Commands log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginTop: 20 }}>
        <ActivityCard events={vehicleEvents} title="Activity feed" />
        <CommandsCard commands={vehicleCommands} />
      </div>
    </Shell>
  );
}

function useMemo24hSeries(events, vehicleId) {
  return React.useMemo(() => {
    const buckets = Array(24).fill(0);
    const now = Date.now();
    for (const e of events) {
      if (e.vehicleId !== vehicleId) continue;
      const ageHr = (now - e.timestamp) / (60 * 60 * 1000);
      if (ageHr < 0 || ageHr > 24) continue;
      const idx = Math.max(0, Math.min(23, 23 - Math.floor(ageHr)));
      buckets[idx]++;
    }
    // smooth a touch
    return buckets.map((v, i) => v + (i % 3 === 0 ? 0.3 : 0));
  }, [events, vehicleId]);
}

function StatTile({ label, value, icon, tone = 'muted', sub }) {
  const colors = { good: 'var(--good)', crit: 'var(--crit)', warn: 'var(--warn)', brand: 'var(--brand)', muted: 'var(--ink-2)' };
  return (
    <div className="card card-pad">
      <div className="row between">
        <div className="cap">{label}</div>
        <span className="ms" style={{ color: colors[tone] }}>{icon}</span>
      </div>
      <div className="row between" style={{ marginTop: 8 }}>
        <div className="h2" style={{ fontSize: 22 }}>{value}</div>
        <span className={`pill ${tone === 'muted' ? '' : tone}`}><span className="dot" />{String(value).toLowerCase()}</span>
      </div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CmdBtn({ icon, label, tone, disabled, onClick }) {
  return (
    <button className={`cmd-btn ${tone === 'danger' ? 'danger' : ''} ${tone === 'brand' ? 'brand' : ''} ${disabled ? 'disabled' : ''}`} onClick={onClick} disabled={disabled}>
      <span className="ms">{icon}</span>
      <span className="cmd-btn-label">{label}</span>
    </button>
  );
}

function sevColor(s) {
  return s === 'critical' ? 'var(--crit)' : s === 'warning' ? 'var(--warn)' : s === 'success' ? 'var(--good)' : 'var(--brand)';
}
function sevIcon(s) {
  return s === 'critical' ? 'crisis_alert' : s === 'warning' ? 'warning' : s === 'success' ? 'check_circle' : 'info';
}

function ActivityCard({ events, title }) {
  return (
    <div className="card">
      <div className="row between" style={{ padding: '18px 20px 12px' }}>
        <div>
          <div className="cap">{title}</div>
          <div className="h3" style={{ marginTop: 2 }}>Live event stream</div>
        </div>
        <div className="row gap-2">
          <span className="pill live brand"><span className="dot" />live</span>
          <a href="#/events" className="btn btn-ghost btn-sm">view all →</a>
        </div>
      </div>
      <div style={{ padding: '0 20px 20px', maxHeight: 360, overflowY: 'auto' }}>
        {events.length === 0 && <div className="muted" style={{ padding: '20px 0' }}>No events yet for this vehicle.</div>}
        {events.slice(0, 12).map((e) => (
          <div key={e.id} className="list-row">
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r-2)',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: sevColor(e.severity),
              flex: 'none',
            }}>
              <span className="ms sm">{sevIcon(e.severity)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row gap-2">
                <span className="mono bold" style={{ fontSize: 13, letterSpacing: '0.03em' }}>{e.type}</span>
                <span className={`pill ${e.severity === 'critical' ? 'crit' : e.severity === 'warning' ? 'warn' : e.severity === 'success' ? 'good' : ''}`} style={{ padding: '1px 6px', fontSize: 9 }}>{e.severity}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{e.description}</div>
            </div>
            <div className="col" style={{ alignItems: 'flex-end', flex: 'none' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{fmtTime(e.timestamp)}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{fmtRel(e.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandsCard({ commands }) {
  return (
    <div className="card">
      <div className="row between" style={{ padding: '18px 20px 12px' }}>
        <div>
          <div className="cap">Command history</div>
          <div className="h3" style={{ marginTop: 2 }}>Recent dispatches</div>
        </div>
        <span className="pill good"><span className="dot" />{commands.length} delivered</span>
      </div>
      <div style={{ padding: '0 20px 20px', maxHeight: 360, overflowY: 'auto' }}>
        {commands.length === 0 && <div className="muted" style={{ padding: '20px 0' }}>No commands yet.</div>}
        {commands.slice(0, 10).map((c) => (
          <div key={c.id} className="list-row">
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r-2)',
              background: 'var(--brand-soft)',
              border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand)',
              flex: 'none',
            }}>
              <span className="ms sm">arrow_outward</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono bold" style={{ fontSize: 13, letterSpacing: '0.03em' }}>{c.command}</div>
              <div className="muted" style={{ fontSize: 12 }}>{c.status} · acked</div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{fmtTime(c.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
