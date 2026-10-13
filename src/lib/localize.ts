import { geminiJson, openaiJson, MODELS } from "./models";
import dictionary from "../data/medicine-names.json";
import { LANGUAGES } from "./schema";

// Free text on a card (the medicine's name, an exercise's name, the clinic) is not in the
// fixed label table, so it is put into the patient's language here, with the same rule as
// everything else: a second model that never saw the original has to read it back.
export type Localized = { names: Record<string, string | null>; phrases: Record<string, string | null> };

const cache = new Map<string, string | null>();

// Letters only, so "Amoxicillin 500 mg" and "amoxicillin 500mg" compare as equal.
export const letters = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length];
}

// A name read back counts as the same medicine when nearly every letter matches.
export function sameName(original: string, readBack: string): boolean {
  const a = letters(original);
  const b = letters(readBack);
  if (!a || !b) return false;
  return distance(a, b) / Math.max(a.length, b.length) <= 0.15;
}

export type NameCheck = { name: string; local: string; readBack: string; ok: boolean };

// One model writes each medicine name in the patient's language. A second model, which never
// sees the originals, reads the names back, and a name is kept when the letters still match.
export async function checkNames(lang: string, names: string[]): Promise<NameCheck[]> {
  const language = LANGUAGES[lang];
  if (!language || !names.length) return [];
  const forward = (await openaiJson(
    `You are preparing a medicine instruction card for a patient who reads ${language}.\n` +
      `"names" are medicine names exactly as printed on the box. Write each one the way it is written in ${language}, in the usual script for ${language}: use the standard ${language} name of the medicine if one exists, otherwise spell out how it sounds. Keep numbers and units such as "500 mg" in digits and Latin letters. If ${language} uses Latin letters and the name is used unchanged, return it unchanged.\n` +
      `Answer with one JSON object: {"names": {"<original>": "<in ${language}>"}}.\n\n` +
      JSON.stringify({ names }),
  )) as { names?: Record<string, string> };
  const local = names.map((n) => String(forward.names?.[n] ?? "").trim());
  // Numbered, so one skipped name cannot shift every answer after it.
  const back = (await geminiJson(
    `These medicine names are from an instruction card written in ${language}. For each, give the English name of the medicine in Latin letters as it is used in the United States (for example acetaminophen, albuterol, epinephrine), keeping any numbers and units.\n` +
      `Answer with one JSON object that has the same keys: {"1": "English name", "2": "English name"}.\n\n` +
      JSON.stringify(Object.fromEntries(local.map((l, i) => [String(i + 1), l]))),
    [],
    MODELS.geminiFast,
  )) as Record<string, string>;
  return names.map((name, i) => {
    const readBack = String(back[String(i + 1)] ?? "");
    return { name, local: local[i], readBack, ok: Boolean(local[i]) && sameName(name, readBack) };
  });
}

async function checkPhrases(lang: string, phrases: string[]): Promise<(string | null)[]> {
  const language = LANGUAGES[lang];
  if (!language || !phrases.length) return [];
  const forward = (await openaiJson(
    `These short phrases are from a patient's instruction card (an exercise name, a place). Translate each into plain everyday ${language}.\n` +
      `Answer with one JSON object: {"phrases": {"<original>": "<in ${language}>"}}.\n\n` +
      JSON.stringify({ phrases }),
  )) as { phrases?: Record<string, string> };
  const local = phrases.map((p) => String(forward.phrases?.[p] ?? "").trim());
  const back = (await geminiJson(
    `These short phrases are from an instruction card written in ${language}. Give a plain English translation of each.\n` +
      `Answer with one JSON object: {"phrases": [English for each, in order]}.\n\n` +
      JSON.stringify({ phrases: local }),
    [],
    MODELS.geminiFast,
  )) as { phrases?: string[] };
  const verdict = (await openaiJson(
    `For each pair, decide whether "readBack" means the same as "original" on a patient's instruction card. Small wording differences are fine. Answer with one JSON object: {"same": [true or false for each pair, in order]}.\n\n` +
      JSON.stringify(phrases.map((p, i) => ({ original: p, readBack: String(back.phrases?.[i] ?? "") }))),
  )) as { same?: unknown[] };
  return phrases.map((_, i) => (verdict.same?.[i] === true && local[i] ? local[i] : null));
}

// "Amoxicillin 500 mg" is looked up as "amoxicillin", and the strength is put back after it.
function fromDictionary(lang: string, name: string): string | null | undefined {
  const table = (dictionary as Record<string, Record<string, string>>)[lang];
  if (!table) return undefined;
  const m = name.trim().match(/^(.*?)(\s+\d.*)?$/);
  const base = (m?.[1] ?? name).trim().toLowerCase();
  if (!(base in table)) return undefined;
  // An empty entry means the name reads the same in this language and needs no second line.
  return table[base] ? table[base] + (m?.[2] ?? "") : null;
}

export async function localize(lang: string, names: string[], phrases: string[]): Promise<Localized> {
  const out: Localized = { names: {}, phrases: {} };
  if (!LANGUAGES[lang] || lang === "en") return out;

  const key = (kind: string, s: string) => `${lang}|${kind}|${s}`;
  for (const n of names) {
    const known = fromDictionary(lang, n);
    if (known !== undefined && !cache.has(key("n", n))) cache.set(key("n", n), known);
  }
  const needNames = names.filter((n) => !cache.has(key("n", n)));
  const needPhrases = phrases.filter((p) => !cache.has(key("p", p)));

  const [checkedNames, checkedPhrases] = await Promise.all([checkNames(lang, needNames), checkPhrases(lang, needPhrases)]);
  // A name that reads the same in Latin letters needs no second line.
  for (const c of checkedNames) cache.set(key("n", c.name), c.ok && letters(c.local) !== letters(c.name) ? c.local : null);
  needPhrases.forEach((p, i) => cache.set(key("p", p), checkedPhrases[i] ?? null));

  for (const n of names) out.names[n] = cache.get(key("n", n)) ?? null;
  for (const p of phrases) out.phrases[p] = cache.get(key("p", p)) ?? null;
  return out;
}
