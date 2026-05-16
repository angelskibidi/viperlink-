import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVehicle, getVehiclesByUser } from "@/lib/vehicles";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicles = await getVehiclesByUser(user.id);
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("GET /api/vehicles error:", error);
    return NextResponse.json({ error: "Failed to load vehicles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = String(body.name ?? body.vehicleName ?? body.vehicle_name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Vehicle name is required." }, { status: 400 });

    const vehicle = await createVehicle(user.id, {
      name,
      make: String(body.make ?? ""),
      model: String(body.model ?? ""),
      year: String(body.year ?? ""),
      moduleId: String(body.moduleId ?? body.module_id ?? ""),
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles error:", error);
    return NextResponse.json({ error: "Failed to create vehicle." }, { status: 500 });
  }
}
