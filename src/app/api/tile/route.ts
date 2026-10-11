import { runGate, type GateEvent, type GateResult } from "@/lib/gate";
import { libraryTile, saveToLibrary } from "@/lib/library";
import { adapterUrl } from "@/lib/generate";
import { tileKey, type TileSpec } from "@/lib/tiles";
import { allow } from "@/lib/limit";

export const maxDuration = 300;

type Body = {
  spec: TileSpec;
  // Skip the library and draw a new tile. Used by the live demo and by the pose check.
  fresh?: boolean;
  adapter?: boolean;
  hint?: string;
};

// Streams one JSON object per line so the page can show each attempt and its verdict
// as they happen.
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const key = tileKey(body.spec);

  if (!body.fresh) {
    const hit = libraryTile(key);
    if (hit) {
      const event: GateEvent = { type: "accepted", n: 0, url: hit.file, seed: hit.seed, source: "library" };
      return new Response(JSON.stringify(event) + "\n", { headers: { "content-type": "application/x-ndjson" } });
    }
  }

  const limit = allow(request, "tile", 40);
  if (!limit.ok) return Response.json({ error: limit.message }, { status: 429 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: GateEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        const it = runGate(body.spec, { adapter: body.adapter, hint: body.hint });
        let result: GateResult | undefined;
        for (;;) {
          const step = await it.next();
          if (step.done) {
            result = step.value;
            break;
          }
          send(step.value);
        }
        if (result && !body.fresh) await saveToLibrary(result, adapterUrl() !== null && body.adapter !== false);
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson" } });
}
