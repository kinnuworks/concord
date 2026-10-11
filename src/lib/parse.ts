import {
  AVOIDS,
  FOODS,
  FORMS,
  MOVEMENTS,
  Regimen,
  TIMES,
  WARNINGS,
  type Disagreement,
} from "./schema";
import { geminiJson, openaiJson, type ImageInput } from "./models";

const INSTRUCTIONS = `You convert hospital discharge instructions into JSON. Copy what the sheet says. Do not add advice, do not fix doses, do not guess.

Return one JSON object with these keys:
- "medicines": array of { "name": the medicine name with its strength as written on the sheet (for example "Amoxicillin 500 mg"), "form": one of ${JSON.stringify(FORMS)}, "count": whole number of units per dose, "times": array from ${JSON.stringify(TIMES)}, "food": one of ${JSON.stringify(FOODS)}, "days": whole number of days or null if not stated, "avoid": array from ${JSON.stringify(AVOIDS)} }
- "exercises": array of { "name": string, "movement": one of ${JSON.stringify(MOVEMENTS)}, "angle": target joint angle in degrees, "reps": number, "sets": number, "timesPerDay": number }
- "warnings": array from ${JSON.stringify(WARNINGS)} for symptoms the sheet says should bring the patient back
- "followUp": { "date": "YYYY-MM-DD" or null, "place": string or null } or null
- "unparsed": array of strings, one per instruction on the sheet that does not fit the keys above (half tablets, tapering doses, "as needed", dressings, diet, anything else). Quote the sheet.

Rules:
- "twice a day" with no times means ["morning","night"]. "three times a day" means ["morning","afternoon","night"]. "once a day" with no time means ["morning"]. "at bedtime" means ["night"].
- "after meals" is "after_food", "with meals" is "with_food", "on an empty stomach" or "before meals" is "before_food". If food is not mentioned use "any".
- "avoid" belongs on the medicine it was written for. If the sheet gives a general restriction, put it on every medicine.
- If a dose is not a whole number of units, or changes over time, leave that medicine out of "medicines" and put its full text in "unparsed".
- You are transcribing, not prescribing. Record a dose exactly as written even when it looks high, low or unusual to you. Never move a medicine to "unparsed" because of how its dose looks.
- Sort "times" in day order and "avoid" and "warnings" alphabetically.`;

function prompt(text: string | null) {
  return text
    ? `${INSTRUCTIONS}\n\nDischarge instructions:\n"""\n${text}\n"""`
    : `${INSTRUCTIONS}\n\nThe discharge instructions are in the attached photo. Read every line.`;
}

const TIME_ORDER = new Map(TIMES.map((t, i) => [t as string, i]));

function canonical(raw: unknown): Regimen {
  const r = Regimen.parse(raw);
  for (const m of r.medicines) {
    m.times = [...new Set(m.times)].sort((a, b) => TIME_ORDER.get(a)! - TIME_ORDER.get(b)!);
    m.avoid = [...new Set(m.avoid)].sort();
    m.name = m.name.trim();
  }
  r.warnings = [...new Set(r.warnings)].sort();
  return r;
}

// Two readers may name the same medicine with or without its form ("Moxifloxacin eye
// drops", "Moxifloxacin"). The form is compared as its own field, so it is left out here.
function key(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(eye|ear|nose|oral)\b|\b(tablets?|capsules?|drops?|syrup|suspension|solution|inhaler|puffs?)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Field-by-field comparison of two independent readings of the same sheet.
export function compare(a: Regimen, b: Regimen): Disagreement[] {
  const out: Disagreement[] = [];
  const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);

  const bMeds = new Map(b.medicines.map((m) => [key(m.name), m]));
  for (const [i, m] of a.medicines.entries()) {
    // The same medicine written with and without its strength still pairs up.
    const k = key(m.name);
    const match = bMeds.has(k) ? k : [...bMeds.keys()].find((o) => o.startsWith(k) || k.startsWith(o));
    const other = match === undefined ? undefined : bMeds.get(match);
    if (match === undefined || !other) {
      out.push({ path: `medicines[${i}]`, a: m.name, b: null });
      continue;
    }
    bMeds.delete(match);
    for (const f of ["form", "count", "times", "food", "days", "avoid"] as const) {
      if (!same(m[f], other[f])) {
        out.push({ path: `medicines[${i}].${f}`, a: m[f], b: other[f] });
      }
    }
  }
  for (const m of bMeds.values()) out.push({ path: "medicines[+]", a: null, b: m.name });

  const bEx = new Map(b.exercises.map((e) => [e.movement, e]));
  for (const [i, e] of a.exercises.entries()) {
    const other = bEx.get(e.movement);
    if (!other) {
      out.push({ path: `exercises[${i}]`, a: e.name, b: null });
      continue;
    }
    bEx.delete(e.movement);
    for (const f of ["angle", "reps", "sets", "timesPerDay"] as const) {
      if (!same(e[f], other[f])) out.push({ path: `exercises[${i}].${f}`, a: e[f], b: other[f] });
    }
  }
  for (const e of bEx.values()) out.push({ path: "exercises[+]", a: null, b: e.name });

  if (!same(a.warnings, b.warnings)) out.push({ path: "warnings", a: a.warnings, b: b.warnings });
  if (!same(a.followUp?.date ?? null, b.followUp?.date ?? null)) {
    out.push({ path: "followUp.date", a: a.followUp?.date ?? null, b: b.followUp?.date ?? null });
  }
  return out;
}

export type ParseResult = {
  regimen: Regimen;
  disagreements: Disagreement[];
  readers: [string, string];
};

// Two models from different vendors read the sheet separately. The first reading is
// used, and every field where the second disagrees is returned for a person to settle.
export async function parseSheet(input: { text?: string; image?: ImageInput }): Promise<ParseResult> {
  const images = input.image ? [input.image] : [];
  const p = prompt(input.text ?? null);
  const [a, b] = await Promise.all([geminiJson(p, images), openaiJson(p, images)]);
  const ra = canonical(a);
  const rb = canonical(b);
  return { regimen: ra, disagreements: compare(ra, rb), readers: ["gemini", "openai"] };
}
