import { AVOIDS, FORMS, TIMES, WARNINGS } from "./schema";
import { geminiJson, openaiJson, MODELS, type ImageInput } from "./models";
import type { TileSpec } from "./tiles";

export type Reading = Record<string, string | number | boolean | null>;
export type ReaderResult = { reader: string; reading: Reading | null; error?: string };
export type Verdict = {
  pass: boolean;
  expected: Reading;
  readers: ReaderResult[];
  // Human-readable reasons, one per mismatch.
  mismatches: string[];
};

// The reader is told nothing about what the picture is supposed to show.
function question(t: TileSpec): string {
  const head =
    "You are shown one pictogram. Describe only what is drawn. Answer with one JSON object and nothing else.";
  switch (t.kind) {
    case "time":
      return `${head}\nKeys: "time": which part of the day the picture shows, one of ${JSON.stringify(TIMES)} or "unclear".`;
    case "dose":
      return `${head}\nKeys: "form": what kind of medicine is drawn, one of ${JSON.stringify(FORMS)} or "unclear" (for "drops" count drops, for "puff" count puff clouds, for "spoon" count spoons). "count": how many of them are drawn, as a whole number. Count carefully, one by one.`;
    case "meal":
      return `${head}\nKeys: "food": true if the picture shows a meal or a plate of food, otherwise false.`;
    case "avoid":
      return `${head}\nKeys: "item": the thing or activity shown, one of ${JSON.stringify(AVOIDS)} or "unclear".`;
    case "warning":
      return `${head}\nKeys: "sign": the symptom the person in the picture has, one of ${JSON.stringify(WARNINGS)} or "unclear".`;
    case "exercise":
      return `${head}\nKeys: "person": true if exactly one whole person is drawn, otherwise false. "limbs_ok": true if the person has two arms and two legs with no extra or missing limbs, otherwise false.`;
  }
}

export function expectedReading(t: TileSpec): Reading {
  switch (t.kind) {
    case "time":
      return { time: t.time };
    case "dose":
      return { form: t.form, count: t.count };
    case "meal":
      return { food: true };
    case "avoid":
      return { item: t.item };
    case "warning":
      return { sign: t.sign };
    case "exercise":
      return { person: true, limbs_ok: true };
  }
}

function asReading(raw: unknown): Reading {
  if (!raw || typeof raw !== "object") throw new Error("reader returned no object");
  const out: Reading = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v.trim().toLowerCase();
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
  }
  return out;
}

const READERS: { name: string; run: (q: string, img: ImageInput) => Promise<unknown> }[] = [
  { name: "gemini", run: (q, img) => geminiJson(q, [img], MODELS.gemini) },
  { name: "openai", run: (q, img) => openaiJson(q, [img], MODELS.openaiFast) },
];

export const READER_NAMES = READERS.map((r) => r.name);

// Every reader must report every expected fact. One wrong or missing answer fails the tile.
export async function readBack(t: TileSpec, image: ImageInput): Promise<Verdict> {
  const q = question(t);
  const expected = expectedReading(t);
  const readers: ReaderResult[] = await Promise.all(
    READERS.map(async (r) => {
      try {
        return { reader: r.name, reading: asReading(await r.run(q, image)) };
      } catch (e) {
        return { reader: r.name, reading: null, error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );

  const mismatches: string[] = [];
  for (const r of readers) {
    if (!r.reading) {
      mismatches.push(`${r.reader} could not read the picture`);
      continue;
    }
    for (const [k, want] of Object.entries(expected)) {
      const got = r.reading[k];
      if (got !== want) mismatches.push(`${r.reader} read ${k} as ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
  }
  return { pass: mismatches.length === 0, expected, readers, mismatches };
}
