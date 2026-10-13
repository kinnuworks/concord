import { runGate, type GateEvent, type GateResult } from "@/lib/gate";
import { libraryTile, saveToLibrary } from "@/lib/library";
import { adapterUrl } from "@/lib/generate";
import { tileKey, type TileSpec } from "@/lib/tiles";
import { allow } from "@/lib/limit";
import { fallbackDataUrl } from "@/lib/fallback";

export const maxDuration = 300;

// A ceiling on pictures drawn live in one day by one running copy of the server, so a busy
// day cannot run up a bill. Past it, the saved pictures are shown.
const DAILY_CAP = 60;
let day = "";
let drawnToday = 0;
function underDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    drawnToday = 0;
  }
  if (drawnToday >= DAILY_CAP) return false;
  drawnToday += 1;
  return true;
}

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

  // Without a request to draw fresh, or once the limits are reached, a picture comes from the
  // saved, already-checked set, or from the code-drawn pictogram where the set has none.
  const saved = () => {
    const hit = libraryTile(key);
    const event: GateEvent = hit
      ? { type: "accepted", n: 0, url: hit.file, seed: hit.seed, source: "library" }
      : { type: "fallback", url: fallbackDataUrl(body.spec), reason: "no saved picture for this one" };
    return new Response(JSON.stringify(event) + "\n", { headers: { "content-type": "application/x-ndjson" } });
  };
  const drawLive = body.fresh || process.env.READBACK_SAVE_TILES === "1";
  if (!drawLive) return saved();
  if (!allow(request, "tile", 12).ok || !underDailyCap()) return saved();

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
