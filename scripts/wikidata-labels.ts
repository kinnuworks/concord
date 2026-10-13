// Collects the name Wikidata gives each medicine in each offered language.
// Medicines are matched through their RxNorm id (Wikidata property P3345), never by name.
// Run: pnpm tsx scripts/wikidata-labels.ts
import { mkdirSync, writeFileSync } from "node:fs";
import medicines from "../src/data/medicines.json";
import { LANGUAGE_LIST } from "../src/lib/schema";

const AGENT = { "User-Agent": "ConcordEval/1.0 (https://github.com/kinnuworks/concord)" };
// Wikidata's codes for the few languages it names differently, in order of preference.
const CODES: Record<string, string[]> = { zh: ["zh-hans", "zh-cn", "zh"], "zh-Hant": ["zh-hant", "zh-tw", "zh-hk"], no: ["nb", "no"] };
const codesFor = (code: string) => CODES[code] ?? [code];

async function json(url: string): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: AGENT });
    if (res.ok) return res.json();
    if (attempt === 4) throw new Error(`${res.status} from ${new URL(url).host}`);
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
}

async function main() {
  const query = "SELECT ?item ?rx WHERE { ?item wdt:P3345 ?rx }";
  const rows = (
    (await json(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)) as {
      results: { bindings: { item: { value: string }; rx: { value: string } }[] };
    }
  ).results.bindings;
  const items = new Map<string, string[]>();
  for (const row of rows) items.set(row.rx.value, [...(items.get(row.rx.value) ?? []), row.item.value.split("/").pop()!]);

  // A medicine with more than one Wikidata entry is left out, so no name is taken from the wrong one.
  const rxcui = medicines.rxcui as Record<string, string>;
  const entry = new Map<string, string>();
  for (const name of medicines.names) {
    const found = items.get(rxcui[name]);
    if (found?.length === 1) entry.set(name, found[0]);
  }

  const languages = LANGUAGE_LIST.map(([code]) => code).filter((code) => code !== "en");
  const wanted = [...new Set(languages.flatMap(codesFor))];
  const labels = new Map<string, Record<string, string>>();
  const ids = [...new Set(entry.values())];
  for (let i = 0; i < ids.length; i += 45) {
    // The API takes at most 50 languages in one request.
    for (let l = 0; l < wanted.length; l += 40) {
      const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels&ids=${ids.slice(i, i + 45).join("|")}&languages=${wanted.slice(l, l + 40).join("|")}`;
      const reply = (await json(url)) as { entities: Record<string, { labels?: Record<string, { value: string }> }> };
      for (const [id, e] of Object.entries(reply.entities)) {
        const have = labels.get(id) ?? {};
        for (const [code, v] of Object.entries(e.labels ?? {})) have[code] = v.value;
        labels.set(id, have);
      }
    }
  }

  const out: Record<string, Record<string, string>> = {};
  for (const code of languages) {
    const table: Record<string, string> = {};
    for (const [name, id] of entry) {
      const have = labels.get(id) ?? {};
      const found = codesFor(code).find((c) => have[c]);
      if (found) table[name] = have[found];
    }
    if (Object.keys(table).length) out[code] = table;
  }
  mkdirSync(new URL("../training/wikidata/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../training/wikidata/labels.json", import.meta.url), JSON.stringify(out) + "\n");
  console.log(`${entry.size} of ${medicines.names.length} medicines found on Wikidata, ${Object.values(out).reduce((n, t) => n + Object.keys(t).length, 0)} names in ${Object.keys(out).length} languages`);
}

main();
