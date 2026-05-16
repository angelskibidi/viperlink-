export default function Sparkline({
  values,
  color = "var(--brand)",
  fill = "rgba(59,130,246,0.15)",
}: {
  values: number[];
  color?: string;
  fill?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 100, h = 32;
  const xs = values.map((_, i) => (i / (values.length - 1)) * w);
  const ys = values.map((v) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={area} fill={fill} />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
