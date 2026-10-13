// Writes every prescribable medicine that has a WHO code in every offered language and has a second model,
// which never sees the English name, read each one back. A name is kept when the letters match.
// The kept names, together with the names Wikidata already has (scripts/wikidata-names.ts),
// become the dictionary the site uses, so common medicines need no model call.
// Run: pnpm tsx --env-file=.env.local scripts/eval-names.ts [language code ...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import top from "../src/data/medicines.json";
import { hasLanguage } from "../src/lib/labels";
import { checkNames, letters, mixedScript, type NameCheck } from "../src/lib/localize";
import { LANGUAGE_LIST } from "../src/lib/schema";

const CHUNK = 366;
const dir = new URL("../training/names/", import.meta.url);
mkdirSync(new URL("parts/", dir), { recursive: true });

// Each chunk is saved as it finishes, so a stopped run picks up where it left off.
async function language(code: string): Promise<NameCheck[]> {
  const file = new URL(`${code}.json`, dir);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const all: NameCheck[] = [];
  for (let i = 0; i < top.names.length; i += CHUNK) {
    const part = new URL(`parts/${code}-${i}.json`, dir);
    if (existsSync(part)) {
      all.push(...JSON.parse(readFileSync(part, "utf8")));
      continue;
    }
    const names = top.names.slice(i, i + CHUNK);
    for (let attempt = 1; ; attempt++) {
      const started = Date.now();
      try {
        const checked = await checkNames(code, names);
        writeFileSync(part, JSON.stringify(checked) + "\n");
        all.push(...checked);
        console.log(`  ${code} ${i + names.length}/${top.names.length} in ${Math.round((Date.now() - started) / 1000)}s`);
        break;
      } catch (e) {
        console.log(`  ${code} chunk ${i} attempt ${attempt} failed after ${Math.round((Date.now() - started) / 1000)}s (${e instanceof Error ? e.message.slice(0, 120) : e})`);
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 15000 * attempt));
      }
    }
  }
  writeFileSync(file, JSON.stringify(all) + "\n");
  return all;
}

// Letters and digits only, in any script, for comparing two spellings of one name.
const plain = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

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

const saved = (folder: string, code: string): NameCheck[] | null => {
  const file = new URL(`../training/${folder}/${code}.json`, import.meta.url);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
};

// Builds the dictionary and the report from every language that has a finished run.
// Where Wikidata has the medicine's name in that language and it passes the read-back, the
// card uses it, because it is the name local readers already know. Otherwise the card uses
// the model-written name, if that passed.
function report() {
  const dictionary: Record<string, Record<string, string>> = {};
  const perLanguage: Record<string, { written: number; matched: number; wikidata: number; wikidataKept: number }> = {};
  const agreement = { compared: 0, identical: 0, close: 0 };
  let fromWikidata = 0;
  for (const [code] of LANGUAGE_LIST) {
    const checks = saved("names", code);
    if (!checks || !hasLanguage(code)) continue;
    const written = new Map(checks.map((c) => [c.name, c.ok && !mixedScript(c.local) ? c.local : null]));
    const wiki = saved("wikidata", code) ?? [];
    const known = new Map(wiki.map((c) => [c.name, c.ok && !mixedScript(c.local) ? c.local : null]));
    perLanguage[code] = {
      written: checks.length,
      matched: [...written.values()].filter(Boolean).length,
      wikidata: wiki.length,
      wikidataKept: [...known.values()].filter(Boolean).length,
    };
    dictionary[code] = {};
    for (const name of top.names) {
      const ours = written.get(name) ?? null;
      const theirs = known.get(name) ?? null;
      if (ours && theirs) {
        agreement.compared++;
        const a = plain(ours);
        const b = plain(theirs);
        if (a === b) agreement.identical++;
        if (a === b || distance(a, b) / Math.max(a.length, b.length) <= 0.25) agreement.close++;
      }
      // A Wikidata name that only repeats the English one tells the reader nothing new.
      const useTheirs = theirs && letters(theirs) !== letters(name);
      const local = useTheirs ? theirs : ours;
      if (!local) continue;
      if (useTheirs) fromWikidata++;
      // One that reads the same in Latin letters is stored empty and needs no second line.
      dictionary[code][name.toLowerCase()] = letters(local) === letters(name) ? "" : local;
    }
  }
  // A few names in every language, small enough to show on the page.
  const samples: Record<string, Record<string, string>> = {};
  for (const name of ["metformin", "amoxicillin", "ibuprofen"]) {
    samples[name] = {};
    for (const code of Object.keys(dictionary)) if (dictionary[code][name]) samples[name][code] = dictionary[code][name];
  }
  const sum = (pick: (l: (typeof perLanguage)[string]) => number) => Object.values(perLanguage).reduce((n, l) => n + pick(l), 0);
  const out = {
    source: top.source,
    url: top.url,
    medicines: top.names.length,
    languages: Object.keys(perLanguage).length,
    written: sum((l) => l.written),
    matched: sum((l) => l.matched),
    wikidata: { names: sum((l) => l.wikidata), kept: sum((l) => l.wikidataKept), used: fromWikidata },
    readBack: sum((l) => l.written + l.wikidata),
    agreement,
    perLanguage,
    samples,
  };
  writeFileSync(new URL("../src/data/medicine-names.json", import.meta.url), JSON.stringify(dictionary) + "\n");
  writeFileSync(new URL("../src/data/names-report.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log(
    `${out.written} names written in ${out.languages} languages, ${out.matched} read back as the same medicine. ` +
      `${out.wikidata.names} Wikidata names read back, ${out.wikidata.kept} kept, ${out.wikidata.used} used. ` +
      `Where both exist: ${agreement.identical} of ${agreement.compared} identical, ${agreement.close} close.`,
  );
}

async function main() {
  // With "report", only the saved results are compiled and no model is called.
  if (process.argv[2] === "report") return report();
  const only = process.argv.slice(2);
  const queue = LANGUAGE_LIST.filter(([code]) => code !== "en" && hasLanguage(code) && (only.length === 0 || only.includes(code)));
  const results: Record<string, NameCheck[]> = {};
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [code, name] = job;
        try {
          results[code] = await language(code);
          console.log(`${name}: ${results[code].filter((c) => c.ok).length}/${results[code].length}`);
        } catch (e) {
          console.log(`${name}: failed (${e instanceof Error ? e.message.slice(0, 80) : e})`);
        }
      }
    }),
  );
  report();
}

main();
