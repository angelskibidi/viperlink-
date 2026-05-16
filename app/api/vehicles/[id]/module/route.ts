import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateModuleId, generateModuleSecret, simulateModulePing, updateVehicleModule } from "@/lib/vehicles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "pair");

    if (action === "ping") {
      const vehicle = await simulateModulePing(user.id, id);
      if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
      return NextResponse.json(vehicle);
    }

    if (action === "unpair") {
      const vehicle = await updateVehicleModule(user.id, id, {
        module_id: null,
        module_secret: null,
        module_status: "not_connected",
        firmware_version: null,
        gps_enabled: false,
      });
      if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
      return NextResponse.json(vehicle);
    }

    const moduleId = String(body.moduleId ?? body.module_id ?? generateModuleId()).trim();
    const moduleSecret = String(body.moduleSecret ?? body.module_secret ?? generateModuleSecret()).trim();
    const firmwareVersion = String(body.firmwareVersion ?? body.firmware_version ?? "sim-0.1.0").trim();

    const vehicle = await updateVehicleModule(user.id, id, {
      module_id: moduleId,
      module_secret: moduleSecret,
      module_status: "paired",
      firmware_version: firmwareVersion,
      gps_enabled: Boolean(body.gpsEnabled ?? body.gps_enabled ?? false),
    });

    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("POST /api/vehicles/[id]/module error:", error);
    return NextResponse.json({ error: "Failed to update module pairing." }, { status: 500 });
  }
}
