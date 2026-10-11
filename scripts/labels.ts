// Translates the card labels and keeps only the ones that survive a round trip.
// One model translates, a different model translates back without seeing the original,
// and a label is kept when the round trip still means the same thing.
// Run: pnpm tsx --env-file=.env.local scripts/labels.ts
import { writeFileSync } from "node:fs";
import { EN } from "../src/lib/labels";
import { LANGUAGES } from "../src/lib/schema";
import { geminiJson, openaiJson } from "../src/lib/models";

type Table = Record<string, string>;

const source: Table = Object.fromEntries(Object.entries(EN).filter(([, v]) => v !== ""));

async function translate(lang: string): Promise<Table> {
  const out = (await openaiJson(
    `Translate the values of this JSON object from English into ${lang}. They are short labels printed on medicine instruction cards for patients, so use plain everyday words a person with little schooling would know, in the usual script for ${lang}. Keep the keys unchanged. Return only the JSON object.\n\n${JSON.stringify(source)}`,
  )) as Table;
  return out;
}

async function backTranslate(lang: string, table: Table): Promise<Table> {
  return (await geminiJson(
    `The values of this JSON object are short labels in ${lang} from a medicine instruction card. Translate each value into plain English. Keep the keys unchanged. Return only the JSON object.\n\n${JSON.stringify(table)}`,
  )) as Table;
}

async function sameMeaning(back: Table): Promise<Record<string, boolean>> {
  const pairs = Object.fromEntries(Object.keys(source).map((k) => [k, { original: source[k], roundTrip: back[k] ?? "" }]));
  return (await openaiJson(
    `For each key, decide whether "roundTrip" means the same as "original" for a patient reading a medicine card. Small wording differences are fine. A different time of day, a different food instruction, a different symptom or a missing negation is not. Return a JSON object mapping each key to true or false.\n\n${JSON.stringify(pairs)}`,
  )) as Record<string, boolean>;
}

async function main() {
  const tables: Record<string, Table> = {};
  const report: Record<string, { kept: number; dropped: string[] }> = {};
  for (const [code, name] of Object.entries(LANGUAGES)) {
    if (code === "en") continue;
    const forward = await translate(name);
    const back = await backTranslate(name, forward);
    const ok = await sameMeaning(back);
    const kept: Table = {};
    const dropped: string[] = [];
    for (const key of Object.keys(source)) {
      if (ok[key] === true && typeof forward[key] === "string" && forward[key].trim()) kept[key] = forward[key].trim();
      else dropped.push(key);
    }
    tables[code] = kept;
    report[code] = { kept: Object.keys(kept).length, dropped };
    console.log(name, `${Object.keys(kept).length}/${Object.keys(source).length}`, dropped.length ? `dropped: ${dropped.join(", ")}` : "");
  }
  writeFileSync(new URL("../src/data/labels.json", import.meta.url), JSON.stringify(tables, null, 2) + "\n");
  writeFileSync(new URL("../src/data/labels-report.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
}

main();
