import { getCurrentUser } from "@/lib/auth";
import { getVehicle, listVehicleCommands, listVehicleEvents } from "@/lib/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Snapshot = {
  vehicle: unknown;
  events: unknown[];
  commands: unknown[];
};

async function getSnapshot(userId: string, vehicleId: string): Promise<Snapshot> {
  const vehicle = await getVehicle(userId, vehicleId);
  const events = await listVehicleEvents(vehicleId);
  const commands = await listVehicleCommands(vehicleId);

  return { vehicle, events: events.slice(0, 25), commands: commands.slice(0, 25) };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const currentUser = user;
  const vehicleId = new URL(request.url).searchParams.get("vehicleId") ?? "";
  if (!vehicleId || !(await getVehicle(currentUser.id, vehicleId))) {
    return new Response("Valid vehicleId is required.", { status: 400 });
  }

  const encoder = new TextEncoder();
  let lastPayload = "";
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      function send(eventName: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      async function tick() {
        if (closed) return;

        try {
          const snapshot = await getSnapshot(currentUser.id, vehicleId);
          const payload = JSON.stringify(snapshot);

          if (payload !== lastPayload) {
            lastPayload = payload;
            send("vehicle-update", snapshot);
          } else {
            send("ping", { ok: true, at: new Date().toISOString() });
          }
        } catch {
          send("error", { message: "Realtime update failed." });
        }
      }

      void tick();
      interval = setInterval(() => void tick(), 1000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        if (interval) clearInterval(interval);
        controller.close();
      });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
