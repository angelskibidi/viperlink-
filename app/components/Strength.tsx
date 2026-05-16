export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function Strength({ score }: { score: number }) {
  const labels = ["", "weak", "fair", "good", "strong"];
  return (
    <div className="col gap-1">
      <div className="strength">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={i <= score ? `on-${score}` : ""} />
        ))}
      </div>
      <div className="cap" style={{ fontSize: 10 }}>{labels[score] || "·"}</div>
    </div>
  );
}
