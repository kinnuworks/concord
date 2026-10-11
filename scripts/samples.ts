// Runs the three sample sheets through the real reader once and saves the result, so
// the page can show finished cards the moment it opens.
// Run: pnpm tsx --env-file=.env.local scripts/samples.ts
import { readFileSync, writeFileSync } from "node:fs";
import { parseSheet } from "../src/lib/parse";
import { planCards } from "../src/lib/plan";

async function main() {
  const texts = JSON.parse(readFileSync(new URL("../src/data/sample-texts.json", import.meta.url), "utf8")) as { name: string; text: string }[];
  const out = [];
  for (const s of texts) {
    const parsed = await parseSheet({ text: s.text });
    out.push({ ...s, parsed: { ...parsed, cards: planCards(parsed.regimen) } });
    console.log(s.name, "medicines", parsed.regimen.medicines.length, "disagreements", parsed.disagreements.length);
  }
  writeFileSync(new URL("../src/data/samples.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
}
main();
