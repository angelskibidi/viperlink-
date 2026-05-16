import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export type Vehicle = {
  id: string;
  user_id: string;
  name: string;
  vehicle_name?: string;
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
  created_at?: string;
};

type VehicleRow = {
  id: string;
  user_id: string;
  vehicle_name: string;
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
  created_at?: string;
};

type StatusRow = {
  id?: string;
  vehicle_id: string;
  armed: boolean | null;
  door_open: boolean | null;
  ignition_on: boolean | null;
  alarm_triggered: boolean | null;
  last_event: string | null;
  updated_at: string | null;
};

type CreateVehicleInput = {
  name?: string;
  vehicleName?: string;
  vehicle_name?: string;
  make?: string;
  model?: string;
  year?: string;
  moduleId?: string;
  module_id?: string;
};

type VehicleStatePatch = {
  alarm_status?: string;
  door_status?: string;
  engine_status?: string;
  last_event?: string;
};

function nowLabel() {
  return new Date().toLocaleString();
}

function mapVehicle(row: VehicleRow, status?: StatusRow | null): Vehicle {
  const alarmTriggered = Boolean(status?.alarm_triggered);
  const armed = Boolean(status?.armed);
  const doorOpen = Boolean(status?.door_open);
  const ignitionOn = Boolean(status?.ignition_on);

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.vehicle_name,
    vehicle_name: row.vehicle_name,
    make: row.make ?? null,
    model: row.model ?? null,
    year: row.year ?? null,
    module_id: row.module_id ?? null,
    module_secret: row.module_secret ?? null,
    module_status: row.module_status ?? "not_connected",
    last_seen: row.last_seen ? new Date(row.last_seen).toLocaleString() : null,
    firmware_version: row.firmware_version ?? null,
    gps_enabled: row.gps_enabled ?? false,
    last_lat: row.last_lat ?? null,
    last_lng: row.last_lng ?? null,
    alarm_status: alarmTriggered ? "TRIGGERED" : armed ? "ARMED" : "DISARMED",
    door_status: doorOpen ? "OPEN" : "CLOSED",
    engine_status: ignitionOn ? "RUNNING" : "OFF",
    last_event: status?.last_event ?? "System Ready",
    updated_at: status?.updated_at ? new Date(status.updated_at).toLocaleString() : nowLabel(),
    created_at: row.created_at,
  };
}

async function getStatuses(vehicleIds: string[]) {
  if (vehicleIds.length === 0) return new Map<string, StatusRow>();

  const { data, error } = await supabaseAdmin
    .from("vehicle_status")
    .select("*")
    .in("vehicle_id", vehicleIds);

  if (error) throw error;

  return new Map((data as StatusRow[]).map((status) => [status.vehicle_id, status]));
}

async function ensureStatus(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_status")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as StatusRow;

  const { data: created, error: createError } = await supabaseAdmin
    .from("vehicle_status")
    .insert({
      vehicle_id: vehicleId,
      armed: false,
      door_open: false,
      ignition_on: false,
      alarm_triggered: false,
      last_event: "System Ready",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created as StatusRow;
}

export async function getVehiclesByUser(userId: number | string) {
  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("user_id", String(userId))
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as VehicleRow[];
  const statuses = await getStatuses(rows.map((vehicle) => vehicle.id));

  return rows.map((vehicle) => mapVehicle(vehicle, statuses.get(vehicle.id)));
}

export async function createVehicle(userId: number | string, input: string | CreateVehicleInput) {
  const details = typeof input === "string" ? { name: input } : input;
  const vehicleName = details.vehicleName ?? details.vehicle_name ?? details.name;

  if (!vehicleName?.trim()) {
    throw new Error("Vehicle name is required.");
  }

  const { data: vehicle, error: vehicleError } = await supabaseAdmin
    .from("vehicles")
    .insert({
      user_id: String(userId),
      vehicle_name: vehicleName.trim(),
      make: details.make?.trim() || null,
      model: details.model?.trim() || null,
      year: details.year?.trim() || null,
      module_id: (details.moduleId ?? details.module_id)?.trim() || null,
      module_status: (details.moduleId ?? details.module_id)?.trim() ? "paired" : "not_connected",
      gps_enabled: false,
    })
    .select("*")
    .single();

  if (vehicleError) throw vehicleError;

  const { data: status, error: statusError } = await supabaseAdmin
    .from("vehicle_status")
    .insert({
      vehicle_id: vehicle.id,
      armed: false,
      door_open: false,
      ignition_on: false,
      alarm_triggered: false,
      last_event: "System Ready",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (statusError) throw statusError;

  return mapVehicle(vehicle as VehicleRow, status as StatusRow);
}

export async function getVehicle(userId: number | string, vehicleId: string) {
  const { data: vehicle, error } = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .eq("user_id", String(userId))
    .maybeSingle();

  if (error) throw error;
  if (!vehicle) return null;

  const status = await ensureStatus(vehicleId);
  return mapVehicle(vehicle as VehicleRow, status);
}

export async function deleteVehicle(vehicleId: string, userId: number | string) {
  const { error } = await supabaseAdmin
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("user_id", String(userId));

  if (error) throw error;
  return true;
}

export async function getVehicleStatus(vehicleId: string) {
  return ensureStatus(vehicleId);
}

export async function updateVehicleStatus(vehicleId: string, updates: Partial<StatusRow>) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_status")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("vehicle_id", vehicleId)
    .select("*")
    .single();

  if (error) throw error;
  return data as StatusRow;
}

function patchToStatusUpdate(patch: VehicleStatePatch) {
  const update: Partial<StatusRow> = {};

  if (patch.alarm_status) {
    const alarmStatus = patch.alarm_status.toUpperCase();
    update.armed = alarmStatus === "ARMED";
    update.alarm_triggered = alarmStatus === "TRIGGERED";
  }

  if (patch.door_status) {
    const doorStatus = patch.door_status.toUpperCase();
    update.door_open = doorStatus === "OPEN" || doorStatus === "UNLOCKED";
  }

  if (patch.engine_status) {
    const engineStatus = patch.engine_status.toUpperCase();
    update.ignition_on = engineStatus === "RUNNING" || engineStatus === "ON";
  }

  if (patch.last_event) update.last_event = patch.last_event;

  return update;
}

export async function updateVehicleState(userId: number | string, vehicleId: string, patch: VehicleStatePatch) {
  const vehicle = await getVehicle(userId, vehicleId);
  if (!vehicle) return null;

  await updateVehicleStatus(vehicleId, patchToStatusUpdate(patch));
  return getVehicle(userId, vehicleId);
}

export async function createVehicleEvent(vehicleId: string, eventType: string, message: string) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_events")
    .insert({
      vehicle_id: vehicleId,
      event_type: eventType,
      message,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listVehicleEvents(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_events")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .not("event_type", "like", "COMMAND_%")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as Array<{ id: string; event_type: string; message: string; created_at: string | null }>).map((event) => ({
    id: event.id,
    type: event.event_type,
    description: event.message,
    created_at: event.created_at ? new Date(event.created_at).toLocaleString() : nowLabel(),
  }));
}

export async function createVehicleCommand(vehicleId: string, command: string) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_events")
    .insert({
      vehicle_id: vehicleId,
      event_type: `COMMAND_${command}`,
      message: command,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listVehicleCommands(vehicleId: string) {
  const { data, error } = await supabaseAdmin
    .from("vehicle_events")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .like("event_type", "COMMAND_%")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as Array<{ id: string; event_type: string; message: string; created_at: string | null }>).map((command) => ({
    id: command.id,
    command: command.event_type.replace(/^COMMAND_/, "") || command.message,
    status: "SUCCESS",
    created_at: command.created_at ? new Date(command.created_at).toLocaleString() : nowLabel(),
  }));
}

export async function clearVehicleEvents(vehicleId: string) {
  const { error } = await supabaseAdmin
    .from("vehicle_events")
    .delete()
    .eq("vehicle_id", vehicleId)
    .not("event_type", "like", "COMMAND_%");
  if (error) throw error;
  return true;
}


export function generateModuleId() {
  const part = () => Math.random().toString(16).slice(2, 6).toUpperCase();
  return `VLK-${part()}-${part()}`;
}

export function generateModuleSecret() {
  return randomBytes(24).toString("hex");
}

export async function updateVehicleModule(
  userId: number | string,
  vehicleId: string,
  input: {
    module_id?: string | null;
    module_secret?: string | null;
    module_status?: string | null;
    firmware_version?: string | null;
    gps_enabled?: boolean | null;
  },
) {
  const existing = await getVehicle(userId, vehicleId);
  if (!existing) return null;

  const moduleId = input.module_id?.trim() || null;
  const moduleSecret = input.module_secret?.trim() || null;

  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .update({
      module_id: moduleId,
      module_secret: moduleSecret,
      module_status: moduleId ? input.module_status ?? "paired" : "not_connected",
      firmware_version: input.firmware_version ?? null,
      gps_enabled: input.gps_enabled ?? false,
    })
    .eq("id", vehicleId)
    .eq("user_id", String(userId))
    .select("*")
    .single();

  if (error) throw error;
  const status = await ensureStatus(vehicleId);
  return mapVehicle(data as VehicleRow, status);
}

export async function simulateModulePing(userId: number | string, vehicleId: string) {
  const existing = await getVehicle(userId, vehicleId);
  if (!existing) return null;

  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .update({
      module_status: "online",
      last_seen: new Date().toISOString(),
      firmware_version: existing.firmware_version ?? "sim-0.1.0",
    })
    .eq("id", vehicleId)
    .eq("user_id", String(userId))
    .select("*")
    .single();

  if (error) throw error;
  const status = await ensureStatus(vehicleId);
  await createVehicleEvent(vehicleId, "MODULE_PING", "Simulated physical module checked in");
  return mapVehicle(data as VehicleRow, status);
}

export async function handleModuleEvent(input: {
  moduleId: string;
  moduleSecret: string;
  eventType: string;
  message?: string;
  firmwareVersion?: string;
  lat?: number;
  lng?: number;
}) {
  const { data: vehicle, error } = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("module_id", input.moduleId)
    .eq("module_secret", input.moduleSecret)
    .maybeSingle();

  if (error) throw error;
  if (!vehicle) return null;

  const eventType = input.eventType.toUpperCase();
  const message = input.message ?? eventType.replaceAll("_", " ");

  await createVehicleEvent(vehicle.id, eventType, message);

  const patch: VehicleStatePatch = { last_event: message };
  if (["SHOCK", "SHOCK_TRIGGERED", "FULL_ALARM"].includes(eventType)) patch.alarm_status = "TRIGGERED";
  if (["ARM", "ARMED"].includes(eventType)) patch.alarm_status = "ARMED";
  if (["DISARM", "DISARMED"].includes(eventType)) patch.alarm_status = "DISARMED";
  if (["DOOR_OPEN", "DOOR_TRIGGER"].includes(eventType)) patch.door_status = "OPEN";
  if (["DOOR_CLOSED"].includes(eventType)) patch.door_status = "CLOSED";
  if (["IGNITION_ON", "REMOTE_START"].includes(eventType)) patch.engine_status = "RUNNING";
  if (["IGNITION_OFF", "ENGINE_OFF"].includes(eventType)) patch.engine_status = "OFF";

  await updateVehicleStatus(vehicle.id, patchToStatusUpdate(patch));

  const { data: updatedVehicle, error: updateError } = await supabaseAdmin
    .from("vehicles")
    .update({
      module_status: "online",
      last_seen: new Date().toISOString(),
      firmware_version: input.firmwareVersion ?? vehicle.firmware_version ?? "unknown",
      last_lat: typeof input.lat === "number" ? input.lat : vehicle.last_lat,
      last_lng: typeof input.lng === "number" ? input.lng : vehicle.last_lng,
    })
    .eq("id", vehicle.id)
    .select("*")
    .single();

  if (updateError) throw updateError;
  const status = await ensureStatus(vehicle.id);
  return mapVehicle(updatedVehicle as VehicleRow, status);
}
