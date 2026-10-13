// Translates the card labels and keeps only the ones that survive a round trip.
// One model translates, a different model translates back without seeing the original,
// and a label is kept when the round trip still means the same thing. A language is
// offered on the site only when nearly all of its labels are kept.
// Run: pnpm tsx --env-file=.env.local scripts/labels.ts [language code ...]
// With codes, only those languages are translated and the others are kept as they are.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { EN } from "../src/lib/labels";
import { LANGUAGE_LIST } from "../src/lib/schema";
import { geminiJson, openaiJson, MODELS } from "../src/lib/models";

type Table = Record<string, string>;
type Report = Record<string, { kept: number; dropped: string[]; offered: boolean }>;

const source: Table = Object.fromEntries(Object.entries(EN).filter(([, v]) => v !== ""));
const TOTAL = Object.keys(source).length;
// A language may lose at most this many labels and still be offered; the lost ones show in English.
const MAY_DROP = 2;

const TIMES_OF_DAY = ["morning", "afternoon", "evening", "night"];

async function translate(lang: string, subset: Table, note = ""): Promise<Table> {
  return (await openaiJson(
    `Translate the values of this JSON object from English into ${lang}. They are short labels printed on medicine instruction cards for patients, so use plain everyday words a person with little schooling would know, in the usual script for ${lang}. ` +
      `The four parts of the day (morning, afternoon, evening, night) must be four different words or phrases; for evening, use the word for the time around sunset if the language has one, and if everyday speech uses one word for both evening and night, write evening as "at sunset" and keep the plain word for night. "do_not" is a heading that stands before a crossed-out picture of an action, and the action labels after it (such as "Drink alcohol" or "Drive") must read naturally under that heading. ` +
      `"read_back" follows a number, as in "7 pictures checked by two readers". ${note}Keep the keys unchanged. Return only the JSON object.\n\n${JSON.stringify(subset)}`,
  )) as Table;
}

async function backTranslate(lang: string, table: Table): Promise<Table> {
  return (await geminiJson(
    `The values of this JSON object are short labels in ${lang} from a medicine instruction card. Translate each value into plain English. Keep the keys unchanged. Return only the JSON object.\n\n${JSON.stringify(table)}`,
    [],
    MODELS.geminiFast,
  )) as Table;
}

async function sameMeaning(subset: Table, back: Table): Promise<Record<string, boolean>> {
  const pairs = Object.fromEntries(Object.keys(subset).map((k) => [k, { original: subset[k], roundTrip: back[k] ?? "" }]));
  return (await openaiJson(
    `For each key, decide whether "roundTrip" means the same as "original" for a patient reading a medicine card. Small wording differences are fine. A different time of day, a different food instruction, a different symptom or a missing negation is not. For the evening label, wording such as dusk, sunset time, nightfall or early evening counts as the same, as long as it is clearly later than afternoon and earlier than night. Return a JSON object mapping each key to true or false.\n\n${JSON.stringify(pairs)}`,
  )) as Record<string, boolean>;
}

// One round: translate, translate back, keep what still means the same.
async function round(name: string, subset: Table, note = ""): Promise<Table> {
  const forward = await translate(name, subset, note);
  const back = await backTranslate(name, forward);
  const ok = await sameMeaning(subset, back);
  const kept: Table = {};
  for (const key of Object.keys(subset)) if (ok[key] === true && typeof forward[key] === "string" && forward[key].trim()) kept[key] = forward[key].trim();
  return kept;
}

// Two parts of the day sharing one word would put the same label over two columns.
function clash(kept: Table): boolean {
  const times = TIMES_OF_DAY.map((k) => kept[k]);
  return times.some((t) => !t) || new Set(times).size < 4;
}

async function one(name: string): Promise<{ kept: Table; dropped: string[] }> {
  const kept = await round(name, source);
  if (clash(kept)) for (const k of TIMES_OF_DAY) delete kept[k];
  // Labels that did not survive get one more attempt with plainer wording.
  const missing = Object.fromEntries(Object.entries(source).filter(([k]) => !(k in kept)));
  if (Object.keys(missing).length) {
    const again = await round(name, missing, "A first attempt at these labels changed their meaning when translated back, so choose wording whose meaning is unmistakable. ");
    Object.assign(kept, again);
    if (clash(kept)) for (const k of TIMES_OF_DAY) delete kept[k];
  }
  return { kept, dropped: Object.keys(source).filter((k) => !(k in kept)) };
}

async function main() {
  const only = process.argv.slice(2);
  const tablesFile = new URL("../src/data/labels.json", import.meta.url);
  const reportFile = new URL("../src/data/labels-report.json", import.meta.url);
  const tables: Record<string, Table> = existsSync(tablesFile) ? JSON.parse(readFileSync(tablesFile, "utf8")) : {};
  const report: Report = existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, "utf8")) : {};
  const save = () => {
    writeFileSync(tablesFile, JSON.stringify(tables, null, 2) + "\n");
    writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");
  };
  const queue = LANGUAGE_LIST.filter(([code]) => code !== "en" && (only.length === 0 || only.includes(code)));
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [code, name] = job;
        // A busy model is not a failed language: wait and try the whole language again.
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            const { kept, dropped } = await one(name);
            const offered = dropped.length <= MAY_DROP;
            if (offered) tables[code] = kept;
            else delete tables[code];
            report[code] = { kept: TOTAL - dropped.length, dropped, offered };
            console.log(`${name}: ${TOTAL - dropped.length}/${TOTAL}${offered ? "" : " (not offered)"}${dropped.length ? ` dropped: ${dropped.join(", ")}` : ""}`);
            save();
            break;
          } catch (e) {
            console.log(`${name}: attempt ${attempt} failed (${e instanceof Error ? e.message.slice(0, 80) : e})`);
            await new Promise((r) => setTimeout(r, 15000 * attempt));
          }
        }
      }
    }),
  );
  save();
  console.log(`offered: ${Object.values(report).filter((r) => r.offered).length} languages besides English`);
}

main();
