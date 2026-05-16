import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteVehicle, getVehicle, updateVehicleState, createVehicleEvent } from "@/lib/vehicles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const vehicle = await getVehicle(user.id, id);
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("GET /api/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Failed to load vehicle." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const vehicle = await updateVehicleState(user.id, id, body);
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });

    if (body.last_event) await createVehicleEvent(id, "status_update", body.last_event);
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("PATCH /api/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Failed to update vehicle." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteVehicle(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete vehicle." }, { status: 500 });
  }
}
