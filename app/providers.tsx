"use client";

import { ToastProvider } from "./components/Toast";
import { AppProvider } from "./context/AppContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppProvider>
  );
}
