export default function VehicleSilhouette({
  tone = "var(--ink-3)",
  width = 260,
  height = 100,
}: {
  tone?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 260 100" style={{ display: "block" }}>
      <defs>
        <linearGradient id="vcar-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0" />
          <stop offset="0.7" stopColor={tone} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g fill={tone} stroke="none">
        <path d="M 10 70 C 14 60, 28 56, 40 56 L 60 56 C 64 48, 80 36, 108 33 L 168 33 C 188 33, 210 48, 222 56 L 244 58 C 252 60, 252 70, 244 72 L 222 72 C 218 80, 208 86, 196 86 C 184 86, 174 80, 170 72 L 90 72 C 86 80, 76 86, 64 86 C 52 86, 42 80, 38 72 L 18 72 C 12 72, 8 70, 10 70 Z" />
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
