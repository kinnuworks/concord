// Reads back the name Wikidata gives each medicine, with the same rule as a model-written name:
// a model that never sees the English name has to say which medicine it is.
// Run: pnpm tsx --env-file=.env.local scripts/wikidata-names.ts [language code ...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hasLanguage } from "../src/lib/labels";
import { mixedScript, readNamesBack, sameName, type NameCheck } from "../src/lib/localize";
import { LANGUAGE_LIST } from "../src/lib/schema";

const CHUNK = 366;
const dir = new URL("../training/wikidata/", import.meta.url);
mkdirSync(dir, { recursive: true });
const labels: Record<string, Record<string, string>> = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));

async function language(code: string): Promise<NameCheck[]> {
  const file = new URL(`${code}.json`, dir);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const pairs = Object.entries(labels[code] ?? {});
  const all: NameCheck[] = [];
  for (let i = 0; i < pairs.length; i += CHUNK) {
    const part = pairs.slice(i, i + CHUNK);
    for (let attempt = 1; ; attempt++) {
      try {
        const back = await readNamesBack(code, part.map(([, local]) => local));
        part.forEach(([name, local], n) => all.push({ name, local, readBack: back[n], ok: !mixedScript(local) && sameName(name, back[n]) }));
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
  const queue = LANGUAGE_LIST.filter(([code]) => labels[code] && hasLanguage(code) && (only.length === 0 || only.includes(code)));
  let names = 0;
  let kept = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [code, name] = job;
        try {
          const checks = await language(code);
          names += checks.length;
          kept += checks.filter((c) => c.ok).length;
          console.log(`${name}: ${checks.filter((c) => c.ok).length}/${checks.length}`);
        } catch (e) {
          console.log(`${name}: failed (${e instanceof Error ? e.message.slice(0, 80) : e})`);
        }
      }
    }),
  );
  console.log(`${names} Wikidata names read back, ${kept} as the same medicine`);
}

main();
