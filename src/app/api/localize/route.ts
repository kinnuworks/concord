import { localize } from "@/lib/localize";
import { allow } from "@/lib/limit";
import { hasLanguage } from "@/lib/labels";

export const maxDuration = 60;

const tidy = (list: unknown) =>
  (Array.isArray(list) ? list : [])
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 12);

export async function POST(request: Request) {
  const gate = allow(request, "localize", 60);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: 429 });

  const body = (await request.json()) as { lang?: string; names?: unknown; phrases?: unknown };
  const lang = String(body.lang ?? "");
  if (!hasLanguage(lang)) return Response.json({ error: "That language is not available." }, { status: 400 });

  try {
    return Response.json(await localize(lang, tidy(body.names), tidy(body.phrases)));
  } catch (e) {
    // The cards still work with the printed names, so a failure here is not shown as an error.
    return Response.json({ names: {}, phrases: {}, note: e instanceof Error ? e.message : "unavailable" });
  }
}
