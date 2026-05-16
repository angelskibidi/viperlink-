"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Vehicle = {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: string | null;
  module_id: string | null;
  module_secret?: string | null;
  module_status: string | null;
  last_seen: string | null;
  firmware_version: string | null;
  gps_enabled: boolean | null;
  last_lat: number | null;
  last_lng: number | null;
  alarm_status: string;
  door_status: string;
  engine_status: string;
  last_event: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: "admin" | "user";
};

type AppCtxType = {
  user: AppUser | null;
  vehicles: Vehicle[];
  vehiclesLoaded: boolean;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string) => void;
  reloadVehicles: () => Promise<void>;
  sendCommand: (command: string, vehicleId?: string) => Promise<void>;
};

const AppCtx = createContext<AppCtxType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const reloadVehicles = useCallback(async () => {
    const res = await fetch("/api/vehicles");
    if (!res.ok) return;
    const data = await res.json();
    const list: Vehicle[] = Array.isArray(data) ? data : [];
    setVehicles(list);
    setVehiclesLoaded(true);
    setSelectedVehicleId((cur) => cur ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user ?? null);
    });
    reloadVehicles();
  }, [reloadVehicles]);

  const sendCommand = useCallback(async (command: string, vehicleId?: string) => {
    const vid = vehicleId ?? selectedVehicleId;
    if (!vid) return;
    await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, vehicleId: vid }),
    });
    await reloadVehicles();
  }, [selectedVehicleId, reloadVehicles]);

  return (
    <AppCtx.Provider value={{ user, vehicles, vehiclesLoaded, selectedVehicleId, setSelectedVehicleId, reloadVehicles, sendCommand }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
