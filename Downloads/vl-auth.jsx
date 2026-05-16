/* global React, AuthLayout, AuthAsideHero, navigate, useApp, useToast, Otp, Strength, scorePassword, useRoute, copyText */
// ViperLink — auth screens (login, signup, forgot, reset, 2fa challenge)

const { useState: _u, useEffect: _e, useRef: _r } = React;

// ─────────────────────────────────────────────────────────────
// /login
// ─────────────────────────────────────────────────────────────
function LoginScreen() {
  const { state, signIn } = useApp();
  const toast = useToast();
  const [username, setUsername] = _u('alex');
  const [password, setPassword] = _u('viper123');
  const [remember, setRemember] = _u(true);
  const [busy, setBusy] = _u(false);
  const [err, setErr] = _u('');

  const submit = (e) => {
    e?.preventDefault();
    setErr('');
    if (!username || !password) { setErr('Username and password are required.'); return; }
    if (username !== 'alex' || password !== 'viper123') {
      setErr('Invalid credentials. Try alex / viper123 (demo).');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (state.has2FA && !state.trustedDevice) {
        navigate('/2fa');
      } else {
        signIn();
        toast({ tone: 'good', icon: 'check_circle', title: 'Signed in', sub: `Welcome back, ${state.user.first}.` });
        navigate('/');
      }
    }, 500);
  };

  return (
    <AuthLayout
      title="Sign in"
      sub="Welcome back. Use your username and password to continue."
      aside={<AuthAsideHero />}
      footer={
        <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
          <span className="muted">No account?</span>
          <a href="#/signup" style={{ fontWeight: 700, color: 'var(--brand)' }}>Register a vehicle</a>
        </div>
      }
    >
      <form className="col gap-4" onSubmit={submit}>
        <div className="field">
          <label className="field-label">Username</label>
          <input className="input" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your handle" />
        </div>
        <div className="field">
          <div className="row between">
            <label className="field-label">Password</label>
            <a href="#/forgot-password" className="muted" style={{ fontSize: 12, textDecoration: 'underline' }}>Forgot?</a>
          </div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
          <span className={`check ${remember ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); setRemember((r) => !r); }} />
          Keep me signed in on this device
        </label>

        {err && <div className="field-error">{err}</div>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Signing in…' : <>Sign in <span className="ms sm">arrow_forward</span></>}
        </button>

        <div className="row gap-3" style={{ marginTop: 4, alignItems: 'center' }}>
          <hr className="hr" style={{ flex: 1 }} />
          <span className="cap" style={{ fontSize: 10 }}>or</span>
          <hr className="hr" style={{ flex: 1 }} />
        </div>
        <button type="button" className="btn btn-outline btn-block">
          <span className="ms sm">fingerprint</span> Continue with passkey
        </button>

        <div className="cap" style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-3)', textAlign: 'center' }}>
          demo creds · alex / viper123
        </div>
      </form>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// /signup
// ─────────────────────────────────────────────────────────────
function SignupScreen() {
  const { setUser } = useApp();
  const [form, setForm] = _u({
    first: '', last: '', username: '', email: '',
    country: '+1', phone: '', password: '', agree: false,
  });
  const [busy, setBusy] = _u(false);
  const [err, setErr] = _u('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const score = scorePassword(form.password);
  const phoneClean = form.phone.replace(/\D/g, '');

  const valid =
    form.first.trim() && form.last.trim() && form.username.length >= 3 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    phoneClean.length >= 10 &&
    score >= 3 && form.agree;

  const submit = (e) => {
    e?.preventDefault();
    setErr('');
    if (!valid) { setErr('Fill every field, choose a strong password, and accept the terms.'); return; }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setUser({
        first: form.first, last: form.last,
        username: form.username, email: form.email,
        phone: `${form.country} ${form.phone}`,
        avatar: form.first[0]?.toUpperCase() || 'V',
      });
      navigate('/verify-phone');
    }, 500);
  };

  return (
    <AuthLayout
      title="Create your account"
      sub="Takes about a minute. You'll pair your alarm module next."
      aside={<AuthAsideHero />}
      footer={
        <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
          <span className="muted">Already have an account?</span>
          <a href="#/login" style={{ fontWeight: 700, color: 'var(--brand)' }}>Sign in</a>
        </div>
      }
    >
      <form className="col gap-4" onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">First name</label>
            <input className="input" autoFocus value={form.first} onChange={(e) => set('first', e.target.value)} placeholder="Alex" />
          </div>
          <div className="field">
            <label className="field-label">Last name</label>
            <input className="input" value={form.last} onChange={(e) => set('last', e.target.value)} placeholder="Rivera" />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Username</label>
          <input className="input" value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="your_handle" />
          <span className="field-hint">3-24 chars · letters, numbers, underscores</span>
        </div>

        <div className="field">
          <label className="field-label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@somewhere.com" />
        </div>

        <div className="field">
          <div className="row between">
            <label className="field-label">Phone number</label>
            <span className="cap" style={{ color: 'var(--crit)' }}>for 2FA</span>
          </div>
          <div className="row gap-2">
            <select className="select" value={form.country} onChange={(e) => set('country', e.target.value)} style={{ width: 90, flex: 'none' }}>
              <option>+1</option><option>+44</option><option>+33</option><option>+49</option><option>+81</option><option>+61</option>
            </select>
            <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <span className="field-hint">We'll text a 6-digit code to verify. Used as SMS backup for two-factor.</span>
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          <Strength score={score} />
        </div>

        <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13, alignItems: 'flex-start' }}>
          <span className={`check ${form.agree ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); set('agree', !form.agree); }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>
            I agree to the{' '}
            <a style={{ textDecoration: 'underline', fontWeight: 700, color: 'var(--brand)' }}>Terms</a>{' '}
            and the{' '}
            <a style={{ textDecoration: 'underline', fontWeight: 700, color: 'var(--brand)' }}>Privacy Policy</a>.
          </span>
        </label>

        {err && <div className="field-error">{err}</div>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Creating account…' : <>Create account <span className="ms sm">arrow_forward</span></>}
        </button>
      </form>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// /verify-phone (sits between signup and module setup)
// ─────────────────────────────────────────────────────────────
function VerifyPhoneScreen() {
  const { state } = useApp();
  const toast = useToast();
  const [code, setCode] = _u('');
  const [seconds, setSeconds] = _u(60);
  const [err, setErr] = _u('');

  _e(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onComplete = (val) => {
    setErr('');
    if (val === '123456' || val.length === 6) {
      toast({ tone: 'good', icon: 'check_circle', title: 'Phone verified', sub: state.user.phone });
      navigate('/setup/module');
    } else {
      setErr('Invalid code. Try 123456 (demo).');
    }
  };

  return (
    <AuthLayout
      title="Verify your phone"
      sub={<>We texted a 6-digit code to <span className="bold">{state.user.phone}</span>. Tap any 6 digits to continue.</>}
      aside={<AuthAsideHero />}
    >
      <div className="col gap-4">
        <Otp value={code} onChange={setCode} onComplete={onComplete} />
        <div className="row gap-3 muted" style={{ fontSize: 13 }}>
          <span>Didn't get the text?</span>
          {seconds > 0 ? (
            <span className="mono">resend in 0:{seconds.toString().padStart(2, '0')}</span>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSeconds(60); toast({ tone: 'brand', icon: 'sms', title: 'Code resent', sub: 'Check your messages.' }); }}>resend</button>
          )}
        </div>
        {err && <div className="field-error">{err}</div>}
        <hr className="hr" />
        <div className="row gap-3 between">
          <a href="#/signup" className="btn btn-ghost btn-sm">← back</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/setup/module'); }} className="btn btn-ghost btn-sm">skip — verify later</a>
        </div>
        <div className="cap" style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink-3)' }}>
          demo code · 123456 (or any 6 digits)
        </div>
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// /forgot-password
// ─────────────────────────────────────────────────────────────
function ForgotScreen() {
  const [val, setVal] = _u('');
  const [sent, setSent] = _u(false);
  const [seconds, setSeconds] = _u(60);

  _e(() => {
    if (!sent || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sent, seconds]);

  const submit = (e) => { e.preventDefault(); setSent(true); setSeconds(60); };

  return (
    <AuthLayout
      title="Forgot password?"
      sub={sent ? 'If that account exists, a link is on its way. Check spam too.' : "Enter the email tied to your ViperLink account. We'll send a reset link that's valid for 30 minutes."}
      aside={<AuthAsideHero />}
      footer={
        <div className="col gap-2" style={{ alignItems: 'center' }}>
          <a href="#/login" style={{ fontWeight: 700, color: 'var(--brand)' }}>← back to sign in</a>
          <span className="muted" style={{ fontSize: 12 }}>still stuck? <a style={{ textDecoration: 'underline' }}>contact your admin</a></span>
        </div>
      }
    >
      {!sent ? (
        <form className="col gap-4" onSubmit={submit}>
          <div className="field">
            <label className="field-label">Email or username</label>
            <input className="input" autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="you@somewhere.com" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block">Send reset link <span className="ms sm">arrow_forward</span></button>
        </form>
      ) : (
        <div className="col gap-4">
          <div className="card card-pad row gap-3" style={{ alignItems: 'flex-start', borderColor: 'rgba(16,185,129,0.3)' }}>
            <span className="ms fill" style={{ color: 'var(--good)' }}>mark_email_read</span>
            <div style={{ flex: 1 }}>
              <div className="bold">Email sent (if account exists)</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                For security, we don't say whether the email is registered. Open the link to continue.
              </div>
              <div className="row gap-3" style={{ marginTop: 12 }}>
                {seconds > 0 ? (
                  <span className="mono muted" style={{ fontSize: 12 }}>resend in 0:{seconds.toString().padStart(2, '0')}</span>
                ) : (
                  <button className="btn btn-sm" onClick={() => { setSent(true); setSeconds(60); }}>resend</button>
                )}
                <a href="#/reset-password?token=demo123" className="btn btn-sm btn-outline">
                  <span className="ms sm">open_in_new</span> simulate the email link
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// /reset-password
// ─────────────────────────────────────────────────────────────
function ResetScreen() {
  const { params } = useRoute();
  const toast = useToast();
  const token = params.token || '';
  const valid = token === 'demo123' || token.length > 4;
  const [pw, setPw] = _u('');
  const [pw2, setPw2] = _u('');
  const [show, setShow] = _u(false);
  const score = scorePassword(pw);
  const rules = [
    { ok: pw.length >= 12, label: 'at least 12 characters' },
    { ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw), label: 'mix of letters & numbers' },
    { ok: /[^A-Za-z0-9]/.test(pw), label: 'at least one symbol' },
    { ok: pw && pw === pw2, label: 'matches the confirmation' },
  ];
  const canSubmit = rules.every((r) => r.ok);

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    toast({ tone: 'good', icon: 'check_circle', title: 'Password updated', sub: 'All other sessions have been signed out.' });
    setTimeout(() => navigate('/login'), 400);
  };

  return (
    <AuthLayout
      title="Set a new password"
      sub={<>For <span className="bold">{`alex@viperlink.app`}</span>. After this, every other session is signed out.</>}
      aside={<AuthAsideHero />}
    >
      <div className="col gap-4">
        <div className={`card card-pad row gap-3 ${valid ? '' : ''}`} style={{
          alignItems: 'flex-start',
          borderColor: valid ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)',
          background: valid ? 'var(--brand-soft)' : 'var(--crit-soft)',
        }}>
          <span className="ms" style={{ color: valid ? 'var(--brand)' : 'var(--crit)' }}>{valid ? 'link' : 'link_off'}</span>
          <div style={{ flex: 1 }}>
            <div className="bold">{valid ? 'Token valid · expires 23 min' : 'Token invalid or expired'}</div>
            <div className="mono muted" style={{ fontSize: 11, marginTop: 2 }}>token={token || '—'}</div>
          </div>
        </div>

        {valid && (
          <form className="col gap-4" onSubmit={submit}>
            <div className="field">
              <div className="row between">
                <label className="field-label">New password</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow((s) => !s)}>
                  <span className="ms sm">{show ? 'visibility_off' : 'visibility'}</span>{show ? 'hide' : 'show'}
                </button>
              </div>
              <input className="input" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
              <Strength score={score} />
            </div>
            <div className="field">
              <label className="field-label">Confirm new password</label>
              <input className="input" type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>

            <div className="card card-pad" style={{ padding: 12 }}>
              <div className="cap" style={{ marginBottom: 8 }}>Password must</div>
              <div className="col gap-1">
                {rules.map((r, i) => (
                  <div key={i} className="row gap-2" style={{ fontSize: 13 }}>
                    <span className="ms sm" style={{ color: r.ok ? 'var(--good)' : 'var(--ink-4)' }}>
                      {r.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span style={{ color: r.ok ? 'var(--ink)' : 'var(--ink-3)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!canSubmit}>
              Reset &amp; sign me in <span className="ms sm">arrow_forward</span>
            </button>
            <div className="text-c" style={{ marginTop: 2 }}>
              <span className="muted" style={{ fontSize: 12 }}>Didn't request this? </span>
              <a style={{ fontWeight: 700, textDecoration: 'underline', fontSize: 12 }}>Lock my account</a>
            </div>
          </form>
        )}
        {!valid && (
          <div className="col gap-3">
            <p className="muted">This link has expired or already been used. Request a new one.</p>
            <a href="#/forgot-password" className="btn btn-primary">Request new link</a>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// /2fa  — post-password challenge
// ─────────────────────────────────────────────────────────────
function TwoFAScreen() {
  const { state, signIn, setState } = useApp();
  const toast = useToast();
  const [code, setCode] = _u('');
  const [trust, setTrust] = _u(false);
  const [seconds, setSeconds] = _u(30);
  const [err, setErr] = _u('');

  _e(() => {
    const t = setTimeout(() => setSeconds((s) => (s <= 0 ? 30 : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onComplete = (val) => {
    setErr('');
    if (val === '123456' || val.length === 6) {
      if (trust) setState((s) => ({ ...s, trustedDevice: true }));
      signIn();
      toast({ tone: 'good', icon: 'verified_user', title: 'Verified · signed in', sub: `Welcome back, ${state.user.first}.` });
      navigate('/');
    } else {
      setErr('Wrong code. Try 123456 (demo).');
    }
  };

  return (
    <AuthLayout
      title="Enter your 6-digit code"
      sub={<>Open your authenticator app and type the code for <span className="bold">{state.user.email}</span>.</>}
      aside={<AuthAsideHero />}
    >
      <div className="col gap-4">
        <div className="row gap-2">
          <span className="ms" style={{ color: 'var(--brand)' }}>verified_user</span>
          <span className="cap">step 2 of 2 · authenticator</span>
        </div>
        <Otp value={code} onChange={setCode} onComplete={onComplete} />

        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span className="mono muted" style={{ fontSize: 12 }}>refreshes in 0:{seconds.toString().padStart(2, '0')}</span>
          <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${(seconds / 30) * 100}%`, height: '100%', background: 'var(--brand)', transition: 'width 1s linear' }} />
          </div>
        </div>

        <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
          <span className={`check ${trust ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); setTrust((t) => !t); }} />
          Trust this device for 30 days
        </label>

        {err && <div className="field-error">{err}</div>}

        <hr className="hr" />

        <div className="col gap-2" style={{ alignItems: 'center', textAlign: 'center' }}>
          <a style={{ fontWeight: 700, color: 'var(--brand)' }}>Use a recovery code instead</a>
          <span className="muted" style={{ fontSize: 12 }}>or <a style={{ textDecoration: 'underline', fontWeight: 700 }}>send SMS to ••• 7821</a></span>
          <div className="cap" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 6 }}>demo code · 123456</div>
        </div>
      </div>
    </AuthLayout>
  );
}

Object.assign(window, { LoginScreen, SignupScreen, VerifyPhoneScreen, ForgotScreen, ResetScreen, TwoFAScreen });
