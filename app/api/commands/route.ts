import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVehicleCommand, getVehicle, listVehicleCommands, updateVehicleState } from "@/lib/vehicles";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? "";
    if (!vehicleId || !(await getVehicle(user.id, vehicleId))) {
      return NextResponse.json([], { status: 200 });
    }

    const commands = await listVehicleCommands(vehicleId);
    return NextResponse.json(commands);
  } catch (error) {
    console.error("GET /api/commands error:", error);
    return NextResponse.json({ error: "Failed to load commands." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const vehicleId = String(body.vehicleId ?? "");
    const command = String(body.command ?? "UNKNOWN").toUpperCase();

    if (!vehicleId || !(await getVehicle(user.id, vehicleId))) {
      return NextResponse.json({ error: "Valid vehicleId is required." }, { status: 400 });
    }

    await createVehicleCommand(vehicleId, command);

    const patches: Record<string, Record<string, string>> = {
      ARM: { alarm_status: "ARMED", last_event: "Alarm was armed" },
      DISARM: { alarm_status: "DISARMED", last_event: "Alarm was disarmed" },
      LOCK: { door_status: "LOCKED", last_event: "Doors were locked" },
      UNLOCK: { door_status: "UNLOCKED", last_event: "Doors were unlocked" },
      REMOTE_START: { engine_status: "RUNNING", last_event: "Vehicle remote start activated" },
      ENGINE_OFF: { engine_status: "OFF", last_event: "Engine stopped" },
    };

    const vehicle = await updateVehicleState(user.id, vehicleId, patches[command] ?? { last_event: command });

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("POST /api/commands error:", error);
    return NextResponse.json({ error: "Failed to send command." }, { status: 500 });
  }
}
