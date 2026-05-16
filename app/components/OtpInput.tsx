"use client";

import { useRef } from "react";

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = (value + "").split("");
    next[i] = clean || "";
    const out = next.join("").slice(0, length);
    onChange(out);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
    if (out.length === length && /^\d+$/.test(out)) {
      setTimeout(() => onComplete && onComplete(out), 80);
    }
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[i]) {
      if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const txt = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!txt) return;
    e.preventDefault();
    onChange(txt.slice(0, length));
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
          ref={(el) => { refs.current[i] = el; }}
          className={`otp-cell ${value[i] ? "filled" : ""}`}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </div>
  );
}
