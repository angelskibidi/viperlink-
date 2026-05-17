import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAllCommands, listAllEvents } from "@/lib/vehicles";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = new URL(request.url).searchParams;
    const vehicleId = params.get("vehicleId") ?? undefined;
    const type = params.get("type") === "events" ? "events" : "commands";

    const data = type === "events"
      ? await listAllEvents(user.id, vehicleId)
      : await listAllCommands(user.id, vehicleId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/history error:", error);
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}
