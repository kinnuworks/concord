import { parseSheet } from "@/lib/parse";
import { planCards, tilesFor } from "@/lib/plan";
import { allow } from "@/lib/limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = allow(request, "parse", 20);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: 429 });

  const body = (await request.json()) as { text?: string; image?: { mime: string; base64: string } };
  const text = body.text?.trim();
  if (!text && !body.image) return Response.json({ error: "Send text or a photo." }, { status: 400 });
  if (text && text.length > 6000) return Response.json({ error: "That text is too long." }, { status: 400 });

  try {
    const parsed = await parseSheet({ text: text || undefined, image: body.image });
    const cards = planCards(parsed.regimen);
    return Response.json({ ...parsed, cards, tiles: tilesFor(cards) });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not read the instructions." },
      { status: 502 },
    );
  }
}
