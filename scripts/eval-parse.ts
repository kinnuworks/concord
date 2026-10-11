// Measures the sheet reader on the fixed test set.
// For each written instruction it records whether the reading matches the known answer,
// whether the two readers agreed, and whether a wrong reading was flagged by a disagreement.
// Run: pnpm tsx --env-file=.env.local scripts/eval-parse.ts
import { writeFileSync } from "node:fs";
import { parseSheet } from "../src/lib/parse";
import type { Medicine } from "../src/lib/schema";
import { buildTestSet, type Case } from "./testset";

const FIELDS = ["form", "count", "times", "food", "days", "avoid"] as const;

type Row = {
  id: string;
  text: string;
  correct: boolean;
  wrongFields: string[];
  agreed: boolean;
  flagged: string[];
  error?: string;
};

function wrongFields(got: Medicine | undefined, want: Medicine): string[] {
  if (!got) return ["missing"];
  return FIELDS.filter((f) => JSON.stringify(got[f]) !== JSON.stringify(want[f]));
}

async function one(c: Case): Promise<Row> {
  try {
    const r = await parseSheet({ text: c.text });
    const wrong = wrongFields(r.regimen.medicines[0], c.answer);
    return {
      id: c.id,
      text: c.text,
      correct: wrong.length === 0 && r.regimen.medicines.length === 1,
      wrongFields: wrong,
      agreed: r.disagreements.length === 0,
      flagged: r.disagreements.map((d) => d.path),
    };
  } catch (e) {
    return {
      id: c.id,
      text: c.text,
      correct: false,
      wrongFields: ["error"],
      agreed: false,
      flagged: [],
      error: e instanceof Error ? e.message.slice(0, 200) : String(e),
    };
  }
}

async function main() {
  const cases = buildTestSet();
  const rows: Row[] = [];
  const queue = [...cases];
  const workers = Array.from({ length: 4 }, async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      rows.push(await one(c));
      if (rows.length % 10 === 0) console.log(`${rows.length}/${cases.length}`);
    }
  });
  await Promise.all(workers);
  rows.sort((a, b) => a.id.localeCompare(b.id));

  const n = rows.length;
  const correct = rows.filter((r) => r.correct).length;
  const wrong = rows.filter((r) => !r.correct);
  const wrongFlagged = wrong.filter((r) => !r.agreed).length;
  const agreed = rows.filter((r) => r.agreed);
  const summary = {
    cases: n,
    correct,
    wrong: wrong.length,
    // A wrong reading that both readers shared would reach the cards unflagged.
    wrongAndFlagged: wrongFlagged,
    wrongAndUnflagged: wrong.length - wrongFlagged,
    agreed: agreed.length,
    correctWhenAgreed: agreed.filter((r) => r.correct).length,
    flaggedButCorrect: rows.filter((r) => r.correct && !r.agreed).length,
    errors: rows.filter((r) => r.error).length,
    ranAt: new Date().toISOString(),
  };
  writeFileSync(
    new URL("../src/data/eval-parse.json", import.meta.url),
    JSON.stringify({ summary, wrong, rows }, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary, null, 2));
  for (const r of wrong.slice(0, 8)) console.log(r.id, r.wrongFields.join(","), "|", r.text.slice(0, 110), r.error ?? "");
}

main();
