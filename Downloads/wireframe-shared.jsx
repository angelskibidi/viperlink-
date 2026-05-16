/* global React */
// Shared sketchy wireframe primitives.

const Box = ({ className = '', children, style, ...rest }) => (
  <div className={`wf-box ${className}`} style={style} {...rest}>{children}</div>
);

const Pad = ({ className = '', children, style }) => (
  <div className={`wf-box wf-pad ${className}`} style={style}>{children}</div>
);

const Hatch = ({ className = '', children, style, dense = false, x = false }) => (
  <div
    className={`wf-box ${dense ? 'wf-hatch-dense' : 'wf-hatch'} ${x ? 'wf-x-placeholder' : ''} ${className}`}
    style={{ position: 'relative', overflow: 'hidden', ...style }}
  >
    {children}
  </div>
);

const Btn = ({ kind = 'default', sm = false, ghost = false, children, style }) => {
  const cls = [
    'wf-btn',
    kind === 'primary' ? 'wf-btn-primary' : '',
    kind === 'danger' ? 'wf-btn-danger' : '',
    ghost ? 'wf-btn-ghost' : '',
    sm ? 'wf-btn-sm' : '',
  ].filter(Boolean).join(' ');
  return <button type="button" className={cls} style={style}>{children}</button>;
};

const Input = ({ placeholder, value, style }) => (
  <div className={`wf-input ${value ? 'wf-filled' : ''}`} style={style}>{value || placeholder}</div>
);

const Pill = ({ tone = 'out', children, style }) => {
  const cls = tone === 'red' ? 'wf-pill-red' : tone === 'ink' ? 'wf-pill-ink' : 'wf-pill-out';
  return <span className={`wf-pill ${cls}`} style={style}>{children}</span>;
};

const Dot = ({ red = false, open = false }) => (
  <span className={`wf-dot ${red ? 'wf-dot-red' : ''} ${open ? 'wf-dot-open' : ''}`} />
);

const Lines = ({ count = 3, widths = null, soft = false, faint = false, style }) => {
  const cls = `wf-line ${soft ? 'wf-line-soft' : ''} ${faint ? 'wf-line-faint' : ''}`;
  const ws = widths || Array.from({ length: count }, (_, i) => `${100 - i * 6 - (i === count - 1 ? 20 : 0)}%`);
  return (
    <div style={style}>
      {ws.map((w, i) => <div key={i} className={cls} style={{ width: w }} />)}
    </div>
  );
};

const Note = ({ children, top, left, right, bottom, rotate, right_anchor = false }) => (
  <div
    className={`wf-note ${right_anchor ? 'r' : ''}`}
    style={{ top, left, right, bottom, transform: rotate != null ? `rotate(${rotate}deg)` : undefined }}
  >{children}</div>
);

const Arrow = ({ children, top, left, right, bottom, rotate, width = 80, height = 40, dir = 'br' }) => {
  // Curved arrow SVG. dir = 'br' (down-right), 'bl', 'tr', 'tl'
  const paths = {
    br: 'M 4 4 C 30 4, 60 20, 76 36',
    bl: 'M 76 4 C 50 4, 20 20, 4 36',
    tr: 'M 4 36 C 30 36, 60 20, 76 4',
    tl: 'M 76 36 C 50 36, 20 20, 4 4',
  };
  const heads = {
    br: { x: 76, y: 36, r: 135 },
    bl: { x: 4,  y: 36, r: 45 },
    tr: { x: 76, y: 4,  r: -135 },
    tl: { x: 4,  y: 4,  r: -45 },
  };
  const head = heads[dir];
  return (
    <div className="wf-arrow" style={{ top, left, right, bottom, transform: rotate != null ? `rotate(${rotate}deg)` : undefined }}>
      <svg width={width} height={height} viewBox={`0 0 80 40`} style={{ display: 'block' }}>
        <path d={paths[dir]} stroke="#5b5b5b" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
        <g transform={`translate(${head.x} ${head.y}) rotate(${head.r})`}>
          <path d="M 0 0 L 8 -3 M 0 0 L 8 3" stroke="#5b5b5b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
      {children && (
        <div style={{ marginTop: -2 }}>{children}</div>
      )}
    </div>
  );
};

// Mini sketch icons (label-as-glyph inside a sketched square)
const Icon = ({ glyph = '?', lg = false, style }) => (
  <span className={`wf-icon ${lg ? 'wf-icon-lg' : ''}`} style={style}>{glyph}</span>
);

// Sketched car silhouette (very simple, low-fi)
const CarSketch = ({ width = 220, height = 80, color = 'currentColor', stroke = 1.8 }) => (
  <svg width={width} height={height} viewBox="0 0 220 80" style={{ display: 'block' }}>
    <g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* body */}
      <path d="M 12 56 L 30 56 C 32 40, 70 26, 110 26 L 150 26 C 170 26, 188 42, 196 56 L 210 56" />
      {/* underline */}
      <path d="M 8 58 L 212 58" />
      {/* roof / window split */}
      <path d="M 60 42 L 88 28 L 152 28 L 168 42 Z" />
      <path d="M 112 28 L 112 42" />
      {/* wheels */}
      <circle cx="60" cy="60" r="11" />
      <circle cx="160" cy="60" r="11" />
      <circle cx="60" cy="60" r="3.5" />
      <circle cx="160" cy="60" r="3.5" />
    </g>
  </svg>
);

// Top-of-artboard variation tag
const VariantTag = ({ children }) => (
  <div className="wf-label-tag">{children}</div>
);

// Section divider with a label centered
const Hsep = ({ style }) => <div className="wf-hsep" style={style} />;

// Nav rail item
const NavItem = ({ glyph, label, active = false }) => (
  <div className={`wf-nav-item ${active ? 'wf-active' : ''}`}>
    <Icon glyph={glyph} />
    <span>{label}</span>
  </div>
);

// Top app header used across most screens
const TopBar = ({ title, right = null }) => (
  <div className="wf-between" style={{ marginBottom: 14 }}>
    <div className="wf-row" style={{ alignItems: 'center', gap: 14 }}>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>
        ViperLink
      </div>
      <div style={{ height: 22, width: 1.4, background: 'var(--ink-soft)', opacity: 0.5 }} />
      <div className="wf-cap">{title}</div>
    </div>
    <div className="wf-row" style={{ alignItems: 'center', gap: 10 }}>
      {right}
      <div className="wf-row" style={{ alignItems: 'center', gap: 6 }}>
        <Dot />
        <span className="wf-cap">online</span>
      </div>
      <Icon glyph="◔" />
      <Btn sm>Logout</Btn>
    </div>
  </div>
);

// Side nav rail used in most variations.
// Collapsed (icon-only) by default — hover to expand and reveal labels + PANIC.
const SideRail = ({ active = 'dashboard' }) => {
  const items = [
    { key: 'dashboard', glyph: '◧', label: 'Dashboard' },
    { key: 'vehicles',  glyph: '◇', label: 'Vehicles' },
    { key: 'events',    glyph: '≡', label: 'Events' },
    { key: 'security',  glyph: '✓', label: 'Security' },
    { key: 'settings',  glyph: '⚙', label: 'Settings' },
  ];
  return (
    <div className="wf-rail">
      {items.map((it) => (
        <div key={it.key} className={`wf-nav-item ${active === it.key ? 'wf-active' : ''}`}>
          <Icon glyph={it.glyph} />
          <span className="wf-rail-label">{it.label}</span>
        </div>
      ))}
      <div className="wf-rail-spacer" />
      <div className="wf-rail-panic-icon">
        <Icon glyph="!" lg style={{ borderColor: 'var(--red)', color: 'var(--red)' }} />
      </div>
      <div className="wf-rail-panic-full">
        <Btn kind="danger" style={{ width: '100%' }}>PANIC</Btn>
      </div>
    </div>
  );
};

Object.assign(window, {
  Box, Pad, Hatch, Btn, Input, Pill, Dot, Lines, Note, Arrow, Icon, CarSketch,
  VariantTag, Hsep, NavItem, TopBar, SideRail,
});
