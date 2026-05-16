/* global React, Shell, PageHead, useApp, useToast, navigate, Otp, copyText, fmtRel */
// ViperLink — Security center + 2FA enroll wizard

const { useState: _ssu, useEffect: _sse } = React;

// ─────────────────────────────────────────────────────────────
// /security
// ─────────────────────────────────────────────────────────────
function SecurityScreen() {
  const { state, set2FA } = useApp();
  const toast = useToast();

  const [pw, setPw] = _ssu({ cur: '', new: '' });
  const [showCodes, setShowCodes] = _ssu(false);

  const sessions = [
    { id: 's1', label: 'MacBook Pro · Safari',  sub: 'San Francisco · just now', icon: 'laptop_mac',  pill: 'this device' },
    { id: 's2', label: 'iPhone 15 · Mobile app', sub: 'San Francisco · 4m ago',   icon: 'smartphone',  pill: null },
    { id: 's3', label: 'Windows · Chrome',       sub: 'New York · 2 hours ago',   icon: 'desktop_windows', pill: null },
    { id: 's4', label: 'Unknown · curl 8.4',     sub: '— · 16 hours ago',         icon: 'terminal',    pill: 'review' },
  ];

  const recentLogins = [
    { t: 'just now',  res: '✓ TOTP',     ua: 'mac · safari',   ok: true },
    { t: '09:14',     res: '✓ TOTP',     ua: 'iphone · app',   ok: true },
    { t: '08:42',     res: '✓ password', ua: 'mac · safari',   ok: true },
    { t: 'yesterday', res: '✗ failed',   ua: 'unknown · curl', ok: false },
  ];

  return (
    <Shell title="Security">
      <PageHead
        eyebrow="Account security"
        title="Security & access"
        lead="2FA, sessions, password, sign-in activity. All your auth controls in one place."
        right={[
          <span key="pill" className={`pill ${state.has2FA ? 'good' : 'crit'} live`}>
            <span className="dot" />
            2FA {state.has2FA ? 'enabled · TOTP' : 'disabled'}
          </span>,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* LEFT */}
        <div className="col gap-4">
          {/* 2FA card */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="cap">Two-factor authentication</div>
                <div className="h2" style={{ fontSize: 20, marginTop: 4 }}>Authenticator app · TOTP</div>
              </div>
              <div className={`switch ${state.has2FA ? 'on' : ''}`} onClick={() => {
                set2FA(!state.has2FA);
                toast({ tone: state.has2FA ? 'crit' : 'good', icon: 'verified_user', title: state.has2FA ? '2FA disabled' : '2FA enabled', sub: state.has2FA ? 'Your account is less protected.' : 'Codes pulled from your authenticator.' });
              }} />
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              Codes pulled from your authenticator app (1Password, Authy, Google). Stops a stolen password from unlocking your fleet.
            </div>
            <div className="row gap-2" style={{ marginTop: 14, flexWrap: 'wrap' }}>
              <a href="#/security/2fa-enroll" className="btn btn-sm btn-outline"><span className="ms sm">qr_code_2</span>reconfigure</a>
              <button className="btn btn-sm btn-outline" onClick={() => setShowCodes((s) => !s)}>
                <span className="ms sm">vpn_key</span>{showCodes ? 'hide' : 'view'} recovery codes
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => toast({ tone: 'brand', icon: 'autorenew', title: 'New recovery codes generated', sub: 'Old codes are invalidated.' })}>
                <span className="ms sm">autorenew</span>regenerate
              </button>
            </div>

            {showCodes && (
              <div className="card card-pad fade-in" style={{ marginTop: 14, padding: 12, background: 'var(--bg-2)' }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div className="cap">10 recovery codes · use each once</div>
                  <button className="btn btn-sm btn-ghost" onClick={async () => {
                    const ok = await copyText(RECOVERY_CODES.join('\n'));
                    if (ok) toast({ tone: 'good', icon: 'content_copy', title: 'Codes copied' });
                  }}><span className="ms sm">content_copy</span>copy all</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {RECOVERY_CODES.map((c, i) => (
                    <div key={i} className="mono" style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12, background: 'var(--surface)' }}>{c}</div>
                  ))}
                </div>
              </div>
            )}

            <hr className="hr" style={{ margin: '18px 0' }} />

            <div className="cap" style={{ marginBottom: 10 }}>Other methods</div>
            <div className="col gap-2">
              {[
                { id: 'sms',     label: 'SMS to ••• ••• 7821',          sub: 'Backup method',           on: true },
                { id: 'hw',      label: 'Hardware key (YubiKey 5C)',    sub: 'Most resistant to phishing', on: false },
                { id: 'passkey', label: 'Passkey on this device',       sub: 'Recommended',             on: false },
              ].map((m) => (
                <div key={m.id} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--line-soft)' }}>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <span className="ms" style={{ color: 'var(--ink-2)' }}>{m.id === 'sms' ? 'sms' : m.id === 'hw' ? 'usb' : 'fingerprint'}</span>
                    <div>
                      <div className="bold" style={{ fontSize: 14 }}>{m.label}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{m.sub}</div>
                    </div>
                  </div>
                  {m.on ? <span className="pill good"><span className="dot" />on</span> : <button className="btn btn-sm btn-outline">set up</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="cap">Password</div>
              <span className="muted mono" style={{ fontSize: 11 }}>last changed 47 days ago</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field-label">Current</label>
                <input className="input" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="field">
                <label className="field-label">New</label>
                <input className="input" type="password" value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => {
                if (!pw.cur || !pw.new) { toast({ tone: 'crit', icon: 'error', title: 'Fill both fields' }); return; }
                setPw({ cur: '', new: '' });
                toast({ tone: 'good', icon: 'check_circle', title: 'Password updated', sub: 'Other sessions have been signed out.' });
              }}>Update password</button>
              <button className="btn btn-ghost"><span className="ms sm">forward_to_inbox</span>send reset link instead</button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col gap-4">
          {/* Sessions */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="cap">Active sessions</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Sign out anywhere you don't recognize.</div>
              </div>
              <button className="btn btn-sm" style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }} onClick={() => toast({ tone: 'crit', icon: 'logout', title: 'Signed out everywhere', sub: 'You\'ll need to sign back in.' })}>
                <span className="ms sm">logout</span>sign out everywhere
              </button>
            </div>
            <div>
              {sessions.map((s, i) => (
                <div key={s.id} className="row gap-3" style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', alignItems: 'center' }}>
                  <span className="ms" style={{ color: s.pill === 'review' ? 'var(--crit)' : 'var(--ink-2)' }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="bold" style={{ fontSize: 13 }}>{s.label}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{s.sub}</div>
                  </div>
                  {s.pill === 'this device'
                    ? <span className="pill good"><span className="dot" />this device</span>
                    : s.pill === 'review'
                    ? <span className="pill crit live"><span className="dot" />review</span>
                    : <button className="btn btn-sm btn-ghost" onClick={() => toast({ tone: 'good', icon: 'check_circle', title: 'Session revoked', sub: s.label })}>revoke</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Recent sign-in activity */}
          <div className="card card-pad-lg">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="cap">Recent sign-in activity</div>
              <button className="btn btn-ghost btn-sm">full log →</button>
            </div>
            {recentLogins.map((r, i) => (
              <div key={i} className="row gap-3" style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 11, width: 80, color: 'var(--ink-2)' }}>{r.t}</span>
                <span className="mono bold" style={{ fontSize: 12, width: 90, color: r.ok ? 'var(--ink)' : 'var(--crit)' }}>{r.res}</span>
                <span className="muted" style={{ fontSize: 13 }}>{r.ua}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

const RECOVERY_CODES = [
  '4F2A-9C04', 'V8E1-77RR', 'KQ2X-LM93', '0PNB-44XS', 'HJ7T-9AB1',
  '3DZE-WK20', 'YN6Q-8VV4', 'C5L0-EZ8M', '1RAX-PT0K', 'TF92-MN6Y',
];

// ─────────────────────────────────────────────────────────────
// /security/2fa-enroll
// ─────────────────────────────────────────────────────────────
function TwoFAEnrollScreen() {
  const toast = useToast();
  const { set2FA } = useApp();
  const [step, setStep] = _ssu(2); // start at QR step
  const [code, setCode] = _ssu('');
  const [seconds, setSeconds] = _ssu(30);
  const [confirmedSaved, setConfirmedSaved] = _ssu(false);

  _sse(() => {
    const t = setTimeout(() => setSeconds((s) => (s <= 0 ? 30 : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onComplete = (val) => {
    if (val.length === 6) {
      toast({ tone: 'good', icon: 'check_circle', title: 'Code verified' });
      setStep(4);
    }
  };

  return (
    <Shell title="Set up two-factor"
      crumbs={<><a href="#/security">Security</a><span>/</span><span style={{ color: 'var(--ink)' }}>2FA enroll</span></>}
    >
      <PageHead
        eyebrow="Two-factor authentication"
        title="Add an authenticator"
        lead="Codes generated by your authenticator app are required after your password. Takes ~60 seconds."
      />

      {/* Stepper */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="row gap-3" style={{ justifyContent: 'space-between' }}>
          {[
            { n: 1, label: 'Pick method' },
            { n: 2, label: 'Scan QR' },
            { n: 3, label: 'Verify code' },
            { n: 4, label: 'Save recovery codes' },
          ].map((s, i, arr) => {
            const st = step > s.n ? 'done' : step === s.n ? 'active' : 'todo';
            return (
              <React.Fragment key={s.n}>
                <div className={`step ${st === 'done' ? 'done' : st === 'active' ? 'active' : ''}`} style={{ flex: 1 }}>
                  <div className="step-bubble">{st === 'done' ? '✓' : s.n}</div>
                  <div className="step-label">{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className={`step-bar ${step > s.n ? 'done' : ''}`} style={{ flex: 0.5 }} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <div className="card card-pad-lg fade-in" key="s1">
          <div className="cap" style={{ marginBottom: 12 }}>Step 1 · pick a method</div>
          <div className="col gap-2">
            {[
              { k: 'totp', label: 'Authenticator app (recommended)', sub: 'Codes refreshed every 30s. Works offline.', icon: 'qr_code_2' },
              { k: 'sms',  label: 'SMS code',                         sub: 'Backup only — text messages can be intercepted.', icon: 'sms' },
              { k: 'hw',   label: 'Hardware key',                     sub: 'YubiKey, Solo Key, etc.', icon: 'usb' },
            ].map((m) => (
              <div key={m.k} className="row gap-3"
                onClick={() => m.k === 'totp' && setStep(2)}
                style={{
                  padding: 16,
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-2)',
                  cursor: m.k === 'totp' ? 'pointer' : 'not-allowed',
                  opacity: m.k === 'totp' ? 1 : 0.55,
                  transition: 'border-color 120ms ease',
                }}
                onMouseOver={(e) => m.k === 'totp' && (e.currentTarget.style.borderColor = 'var(--brand)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
              >
                <span className="ms lg" style={{ color: 'var(--brand)' }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="bold">{m.label}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{m.sub}</div>
                </div>
                <span className="ms muted">chevron_right</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} key="s2">
          <div className="card card-pad-lg">
            <div className="cap" style={{ marginBottom: 12 }}>Step 2 · scan with your authenticator</div>
            <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
              <div style={{ padding: 14, background: 'white', borderRadius: 'var(--r-2)', flex: 'none' }}>
                <QRBlock size={180} />
              </div>
              <div className="col gap-3" style={{ flex: 1 }}>
                <div>
                  <div className="cap">Account</div>
                  <div className="bold" style={{ fontSize: 14, marginTop: 2 }}>alex@viperlink.app</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>ViperLink · viperlink.app</div>
                </div>
                <div>
                  <div className="cap" style={{ marginBottom: 4 }}>Or paste this code</div>
                  <div className="mono" style={{
                    fontSize: 12, padding: '8px 10px',
                    border: '1px dashed var(--line)', borderRadius: 4,
                    background: 'var(--bg-2)', wordBreak: 'break-all', lineHeight: 1.4,
                  }}>JBSWY3DPEHPK3PXPVLKA3F29C04</div>
                  <button className="btn btn-sm btn-ghost" style={{ marginTop: 6 }} onClick={async () => {
                    const ok = await copyText('JBSWY3DPEHPK3PXPVLKA3F29C04');
                    if (ok) toast({ tone: 'good', icon: 'content_copy', title: 'Key copied to clipboard' });
                  }}><span className="ms sm">content_copy</span>copy</button>
                </div>
              </div>
            </div>
            <div className="row between" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: verify <span className="ms sm">arrow_forward</span></button>
            </div>
          </div>
          <div className="card card-pad-lg">
            <div className="cap" style={{ marginBottom: 12 }}>Don't have an authenticator app?</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Pick any of these:</div>
            <div className="col gap-2">
              {['1Password', 'Authy', 'Google Authenticator', 'Microsoft Authenticator', 'Aegis'].map((n) => (
                <div key={n} className="row gap-3" style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-2)' }}>
                  <span className="ms" style={{ color: 'var(--brand)' }}>shield</span>
                  <span className="bold" style={{ fontSize: 13 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card card-pad-lg fade-in" style={{ maxWidth: 600, margin: '0 auto' }} key="s3">
          <div className="cap" style={{ marginBottom: 6 }}>Step 3 · enter the 6-digit code</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
            Your authenticator should now show a 6-digit code refreshing every 30 seconds. Type it below.
          </div>
          <Otp value={code} onChange={setCode} onComplete={onComplete} />
          <div className="row gap-3" style={{ alignItems: 'center', marginTop: 16 }}>
            <span className="mono muted" style={{ fontSize: 12 }}>refreshes in 0:{seconds.toString().padStart(2, '0')}</span>
            <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(seconds / 30) * 100}%`, height: '100%', background: 'var(--brand)', transition: 'width 1s linear' }} />
            </div>
          </div>
          <div className="row between" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← back</button>
            <button className="btn btn-primary" disabled={code.length < 6} onClick={() => onComplete(code)}>Verify & continue <span className="ms sm">arrow_forward</span></button>
          </div>
          <div className="cap" style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-3)', textAlign: 'center' }}>
            demo · any 6 digits will verify
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card card-pad-lg fade-in" key="s4">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <div className="cap">Step 4 · save your recovery codes</div>
              <div className="h2" style={{ fontSize: 20, marginTop: 4 }}>Use one if you lose your authenticator</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Each code works once. Store them somewhere safe — a password manager is ideal.</div>
            </div>
            <div className="row gap-2">
              <button className="btn btn-sm btn-outline" onClick={async () => {
                const ok = await copyText(RECOVERY_CODES.join('\n'));
                if (ok) toast({ tone: 'good', icon: 'content_copy', title: 'All codes copied' });
              }}><span className="ms sm">content_copy</span>copy all</button>
              <button className="btn btn-sm btn-outline" onClick={() => {
                const blob = new Blob([RECOVERY_CODES.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'viperlink-recovery-codes.txt'; a.click();
                URL.revokeObjectURL(url);
                toast({ tone: 'good', icon: 'download', title: 'Downloaded' });
              }}><span className="ms sm">download</span>download</button>
              <button className="btn btn-sm btn-outline" onClick={() => window.print()}><span className="ms sm">print</span>print</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {RECOVERY_CODES.map((c, i) => (
              <div key={i} className="mono bold" style={{
                padding: '12px 10px', border: '1px solid var(--line)', borderRadius: 'var(--r-2)',
                background: 'var(--bg-2)', fontSize: 14, letterSpacing: '0.08em', textAlign: 'center',
              }}>{c}</div>
            ))}
          </div>

          <hr className="hr" style={{ margin: '20px 0' }} />

          <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 14 }}>
            <span className={`check ${confirmedSaved ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); setConfirmedSaved((c) => !c); }} />
            I've saved these recovery codes somewhere safe.
          </label>

          <div className="row between" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← back</button>
            <button className="btn btn-primary btn-lg" disabled={!confirmedSaved} onClick={() => {
              set2FA(true);
              toast({ tone: 'good', icon: 'verified_user', title: '2FA enabled', sub: 'Your account is now protected by TOTP.' });
              navigate('/security');
            }}>Finish setup <span className="ms sm">check</span></button>
          </div>
        </div>
      )}
    </Shell>
  );
}

// QR placeholder — render a plausible-looking QR code with stable cells.
function QRBlock({ size = 180 }) {
  // deterministic pseudo-pattern
  const cells = [];
  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const v = (x * 7 + y * 13 + ((x * 5) ^ (y * 3))) & 7;
      if (v < 3) cells.push([x, y]);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 170 170" shapeRendering="crispEdges">
      <rect x="0" y="0" width="170" height="170" fill="white" />
      {/* 3 finder squares */}
      {[[8, 8], [124, 8], [8, 124]].map(([fx, fy], i) => (
        <g key={i} fill="black">
          <rect x={fx} y={fy} width="38" height="38" />
          <rect x={fx + 4} y={fy + 4} width="30" height="30" fill="white" />
          <rect x={fx + 10} y={fy + 10} width="18" height="18" />
        </g>
      ))}
      {/* data cells */}
      {cells.map(([x, y], i) => {
        const px = x * 8 + 8, py = y * 8 + 8;
        if ((px < 50 && py < 50) || (px > 116 && py < 50) || (px < 50 && py > 116)) return null;
        return <rect key={i} x={px} y={py} width="6" height="6" fill="black" />;
      })}
    </svg>
  );
}

Object.assign(window, { SecurityScreen, TwoFAEnrollScreen });
