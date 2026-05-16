import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clearVehicleEvents, createVehicleEvent, getVehicle, listVehicleEvents, updateVehicleState } from "@/lib/vehicles";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? "";
    if (!vehicleId || !(await getVehicle(user.id, vehicleId))) {
      return NextResponse.json([], { status: 200 });
    }

    const events = await listVehicleEvents(vehicleId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const vehicleId = String(body.vehicleId ?? "");
    const type = String(body.type ?? "EVENT").toUpperCase();
    const description = String(body.description ?? "No description");

    if (!vehicleId || !(await getVehicle(user.id, vehicleId))) {
      return NextResponse.json({ error: "Valid vehicleId is required." }, { status: 400 });
    }

    await createVehicleEvent(vehicleId, type, description);

    const patch: Record<string, string> = { last_event: description };
    if (type === "SHOCK") patch.alarm_status = "TRIGGERED";
    if (type === "DOOR_OPEN") patch.door_status = "OPEN";
    if (type === "DOOR_CLOSED") patch.door_status = "CLOSED";
    await updateVehicleState(user.id, vehicleId, patch);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? "";
    if (vehicleId && (await getVehicle(user.id, vehicleId))) await clearVehicleEvents(vehicleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events error:", error);
    return NextResponse.json({ error: "Failed to clear events." }, { status: 500 });
  }
}
