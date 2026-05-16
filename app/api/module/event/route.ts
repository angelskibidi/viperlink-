import { NextResponse } from "next/server";
import { handleModuleEvent } from "@/lib/vehicles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const moduleId = String(body.moduleId ?? body.module_id ?? "").trim();
    const moduleSecret = String(body.moduleSecret ?? body.module_secret ?? "").trim();
    const eventType = String(body.eventType ?? body.event_type ?? body.type ?? "").trim();

    if (!moduleId || !moduleSecret || !eventType) {
      return NextResponse.json(
        { error: "moduleId, moduleSecret, and eventType are required." },
        { status: 400 },
      );
    }

    const vehicle = await handleModuleEvent({
      moduleId,
      moduleSecret,
      eventType,
      message: body.message ? String(body.message) : undefined,
      firmwareVersion: body.firmwareVersion ? String(body.firmwareVersion) : undefined,
      lat: typeof body.lat === "number" ? body.lat : undefined,
      lng: typeof body.lng === "number" ? body.lng : undefined,
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Invalid module credentials." }, { status: 401 });
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("POST /api/module/event error:", error);
    return NextResponse.json({ error: "Failed to process module event." }, { status: 500 });
  }
}
