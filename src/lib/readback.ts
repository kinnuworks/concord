import { FORMS, type Avoid, type TimeOfDay, type Warning } from "./schema";
import { googleVisionJson, openaiJson, MODELS, type ImageInput } from "./models";
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

// What each picture is meant to say. A reader never sees these. They are used only
// afterwards, to judge whether the reader's own description got the idea.
const SKY: Record<TimeOfDay, string> = {
  morning: "morning, shown by a rooster or a sun rising over land",
  afternoon: "daytime, with the sun up in the sky",
  evening: "a sunset or dusk",
  night: "night, with a moon or stars",
};
const AVOID_MEANING: Record<Avoid, string> = {
  alcohol: "alcoholic drinks",
  driving: "a car or driving",
  sunlight: "a person in strong sunlight",
  smoking: "a cigarette or smoking",
  heavy_lifting: "a person lifting or carrying something heavy",
  dairy: "milk, cheese or dairy food",
};
const WARNING_MEANING: Record<Warning, string> = {
  fever: "a person with a fever or high temperature",
  bleeding: "bleeding",
  swelling: "a swollen leg, foot or body part",
  chest_pain: "chest pain",
  breathlessness: "a person struggling to breathe",
  severe_pain: "a person in strong pain",
  vomiting: "a person vomiting or being sick",
  rash: "a skin rash or spots on the skin",
  dizziness: "a dizzy person",
  wound_discharge: "a wound that is leaking fluid or pus",
};

export function meaning(t: TileSpec): string | null {
  switch (t.kind) {
    case "time":
      return SKY[t.time];
    case "meal":
      return "a meal or a plate of food";
    case "avoid":
      return AVOID_MEANING[t.item];
    case "warning":
      return WARNING_MEANING[t.sign];
    default:
      return null;
  }
}

const HEAD = "You are shown one pictogram. Describe only what is drawn. Answer with one JSON object and nothing else.";

// Pictures of things are read open-ended: the reader gets no list to pick from, so it
// cannot land on the right answer by elimination.
const DESCRIBE = `${HEAD}\nKeys: "shows": what the picture shows, in at most ten plain words. If you cannot tell, say "unclear".`;

const COUNT = `${HEAD}\nKeys: "form": what kind of medicine is drawn, one of ${JSON.stringify(FORMS)} or "unclear" (for "drops" count dropper bottles or separate drops, for "puff" count inhalers, for "spoon" count spoons). "count": how many of them are drawn, as a whole number. Count carefully, one by one.`;

const FIGURE = `${HEAD}\nKeys: "person": true if exactly one whole person is drawn, otherwise false. "limbs_ok": true if the person has two arms and two legs with no extra or missing limbs, otherwise false.`;

export function expectedReading(t: TileSpec): Reading {
  switch (t.kind) {
    case "dose":
      return { form: t.form, count: t.count };
    case "unit":
      return { form: t.form, count: 1 };
    case "exercise":
      return { person: true, limbs_ok: true };
    default:
      return { meaning: meaning(t) };
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
  { name: "gemini", run: (q, img) => googleVisionJson(q, [img]) },
  { name: "openai", run: (q, img) => openaiJson(q, [img], MODELS.openaiFast) },
];

export const READER_NAMES = READERS.map((r) => r.name);

async function askReaders(q: string, image: ImageInput): Promise<ReaderResult[]> {
  return Promise.all(
    READERS.map(async (r) => {
      try {
        return { reader: r.name, reading: asReading(await r.run(q, image)) };
      } catch (e) {
        return { reader: r.name, reading: null, error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );
}

// Decides whether each free description carries the intended idea. It sees only text.
export async function judge(intended: string, descriptions: string[]): Promise<boolean[]> {
  const raw = (await openaiJson(
    `A pictogram on a patient's medicine card was meant to show: "${intended}".\n` +
      `People who were not told this looked at it and described what they saw:\n` +
      descriptions.map((d, i) => `${i + 1}. "${d}"`).join("\n") +
      `\nThe descriptions are literal: people say what is drawn, not what it means. For each one, decide whether a person who saw exactly what is described would take the picture to mean the intended idea. ` +
      `A crescent moon and stars means night. A rooster with a rising sun means morning. A wine glass and a bottle means alcoholic drinks. ` +
      `Say false when the description is of something else, is too vague to tell, or leaves out the part that carries the meaning: a person bending over is not vomiting, a bare arm is not a leaking wound, a smiling person is not in pain, a plain sun in a blue sky is daytime, not a sunset. "unclear" is always false.\n` +
      `Answer with one JSON object: {"understood": [true or false for each description, in order]}.`,
  )) as { understood?: unknown };
  const list = Array.isArray(raw.understood) ? raw.understood : [];
  return descriptions.map((_, i) => list[i] === true);
}

// Every reader must get every expected fact. One wrong or missing answer fails the tile.
export async function readBack(t: TileSpec, image: ImageInput): Promise<Verdict> {
  const expected = expectedReading(t);
  const intended = meaning(t);
  const mismatches: string[] = [];

  if (intended === null) {
    const readers = await askReaders(t.kind === "exercise" ? FIGURE : COUNT, image);
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

  const readers = await askReaders(DESCRIBE, image);
  const described = readers.map((r) => (typeof r.reading?.shows === "string" ? r.reading.shows : "unclear"));
  let understood: boolean[];
  try {
    understood = await judge(intended, described);
  } catch {
    understood = described.map(() => false);
  }
  readers.forEach((r, i) => {
    if (!r.reading) {
      mismatches.push(`${r.reader} could not read the picture`);
      return;
    }
    r.reading.understood = understood[i];
    if (!understood[i]) mismatches.push(`${r.reader} saw "${described[i]}", meant to show ${intended}`);
  });
  return { pass: mismatches.length === 0, expected, readers, mismatches };
}
