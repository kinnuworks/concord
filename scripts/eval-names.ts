// Writes every prescribable medicine that has a WHO code in every offered language and has a second model,
// which never sees the English name, read each one back. A name is kept when the letters match.
// The kept names become the dictionary the site uses, so common medicines need no model call.
// Run: pnpm tsx --env-file=.env.local scripts/eval-names.ts [language code ...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import top from "../src/data/medicines.json";
import { hasLanguage } from "../src/lib/labels";
import { checkNames, letters, type NameCheck } from "../src/lib/localize";
import { LANGUAGE_LIST } from "../src/lib/schema";

const CHUNK = 366;
const dir = new URL("../training/names/", import.meta.url);
mkdirSync(dir, { recursive: true });

async function language(code: string): Promise<NameCheck[]> {
  const file = new URL(`${code}.json`, dir);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const all: NameCheck[] = [];
  for (let i = 0; i < top.names.length; i += CHUNK) {
    const part = top.names.slice(i, i + CHUNK);
    for (let attempt = 1; ; attempt++) {
      try {
        all.push(...(await checkNames(code, part)));
        break;
      } catch (e) {
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 15000 * attempt));
      }
    }
  }
  writeFileSync(file, JSON.stringify(all) + "\n");
  return all;
}

async function main() {
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

  // Every language that has a saved result goes into the report and the dictionary.
  const dictionary: Record<string, Record<string, string>> = {};
  const perLanguage: Record<string, { written: number; matched: number }> = {};
  for (const [code] of LANGUAGE_LIST) {
    const file = new URL(`${code}.json`, dir);
    if (!existsSync(file) || !hasLanguage(code)) continue;
    const checks: NameCheck[] = JSON.parse(readFileSync(file, "utf8"));
    perLanguage[code] = { written: checks.length, matched: checks.filter((c) => c.ok).length };
    dictionary[code] = {};
    // Only names that were read back correctly are used. One that reads the same in Latin letters is stored empty.
    for (const c of checks) if (c.ok) dictionary[code][c.name.toLowerCase()] = letters(c.local) === letters(c.name) ? "" : c.local;
  }
  const written = Object.values(perLanguage).reduce((n, l) => n + l.written, 0);
  const matched = Object.values(perLanguage).reduce((n, l) => n + l.matched, 0);
  writeFileSync(new URL("../src/data/medicine-names.json", import.meta.url), JSON.stringify(dictionary) + "\n");
  writeFileSync(
    new URL("../src/data/names-report.json", import.meta.url),
    JSON.stringify({ source: top.source, url: top.url, medicines: top.names.length, languages: Object.keys(perLanguage).length, written, matched, perLanguage }, null, 2) + "\n",
  );
  console.log(`${written} names written in ${Object.keys(perLanguage).length} languages, ${matched} read back as the same medicine`);
}

main();
