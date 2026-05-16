"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = {
  id: string;
  tone: "good" | "crit" | "brand";
  icon: string;
  title: string;
  sub?: string;
  ttl?: number;
};

type ToastOptions = Partial<Omit<Toast, "id">>;

const ToastCtx = createContext<((opts: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Toast[]>([]);

  const push = useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: Toast = { id, tone: "brand", icon: "info", title: "", ttl: 3000, ...opts };
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

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
