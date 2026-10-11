// Two follow-up passes over the saved evaluation pictures, without drawing anything new.
// 1. Pictures of things: the readers' saved descriptions are judged again with the current
//    written rules, so every row in the table was judged the same way.
// 2. Style: both readers label each picture's drawing style, to measure what the adapter changes.
// Run: pnpm tsx --env-file=.env.local scripts/eval-style.ts [judge|style]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { googleVisionJson, openaiJson } from "../src/lib/models";
import { judge, judged } from "../src/lib/readback";
import type { Avoid, TimeOfDay, Warning } from "../src/lib/schema";
import type { TileSpec } from "../src/lib/tiles";

type Row = {
  key: string; kind: string; i: number; file: string; pass: boolean; expected: unknown;
  readings: { reader: string; reading: Record<string, unknown> | null }[];
  mismatches: string[];
};
const only = process.argv[2];

const STYLES = ["flat pictogram with outlines", "photo or 3d render", "other illustration"] as const;
const QUESTION = `Look only at how this picture is drawn, not at what it shows. Answer with one JSON object: {"style": one of ${JSON.stringify(STYLES)}}. "flat pictogram with outlines" means flat solid colours with clear dark outlines and no realistic shading.`;

const root = new URL("../", import.meta.url);

function specFromKey(key: string): TileSpec {
  if (key === "meal") return { kind: "meal" };
  const [kind, ...rest] = key.split("-");
  const value = rest.join("-");
  if (kind === "time") return { kind: "time", time: value as TimeOfDay };
  if (kind === "avoid") return { kind: "avoid", item: value as Avoid };
  return { kind: "warning", sign: value as Warning };
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => { for (let x = queue.shift(); x; x = queue.shift()) await fn(x); }));
}

async function main() {
  const styleFile = new URL("src/data/eval-style.json", root);
  const out: Record<string, unknown> = existsSync(styleFile) ? JSON.parse(readFileSync(styleFile, "utf8")) : {};
  for (const arm of ["base", "adapter", "adapter-light"]) {
    const file = new URL(`training/eval/${arm}.jsonl`, root);
    if (!existsSync(file)) continue;
    const rows = readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Row);

    if (only !== "style") {
      const again = rows.filter((r) => ["time", "meal", "avoid", "warning"].includes(r.kind));
      await pool(again, 6, async (r) => {
        const j = judged(specFromKey(r.key))!;
        const described = r.readings.map((x) => (typeof x.reading?.shows === "string" ? x.reading.shows : "unclear"));
        const understood = await judge(j.intended, j.mustMention, described);
        r.expected = { meaning: j.intended };
        r.mismatches = [];
        r.readings.forEach((x, i) => {
          if (!x.reading) return void r.mismatches.push(`${x.reader} could not read the picture`);
          x.reading.understood = understood[i];
          if (!understood[i]) r.mismatches.push(`${x.reader} saw "${described[i]}", meant to show ${j.intended}`);
        });
        r.pass = r.mismatches.length === 0;
      });
      writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
      console.log(arm, "judged again:", again.filter((r) => r.pass).length, "of", again.length, "pass");
    }
    if (only === "judge" || arm === "adapter-light") continue;

    // Style labels from both readers; a picture counts as a flat pictogram only if both say so.
    const counts: Record<string, number> = { agreeFlat: 0, total: 0 };
    const perReader: Record<string, Record<string, number>> = { gemini: {}, openai: {} };
    await pool(rows, 5, async (r) => {
      const buf = readFileSync(new URL(`training/eval/${arm}/${r.file}`, root));
      const img = { mime: "image/png", base64: buf.toString("base64") };
      try {
        const [g, o] = (await Promise.all([googleVisionJson(QUESTION, [img]), openaiJson(QUESTION, [img])])) as { style?: string }[];
        counts.total += 1;
        perReader.gemini[g.style ?? "?"] = (perReader.gemini[g.style ?? "?"] ?? 0) + 1;
        perReader.openai[o.style ?? "?"] = (perReader.openai[o.style ?? "?"] ?? 0) + 1;
        if (g.style === STYLES[0] && o.style === STYLES[0]) counts.agreeFlat += 1;
      } catch (e) {
        console.log("style read failed", r.file, e instanceof Error ? e.message.slice(0, 100) : e);
      }
    });
    out[arm] = { ...counts, perReader };
    console.log(arm, JSON.stringify(out[arm]));
  }
  writeFileSync(styleFile, JSON.stringify(out, null, 2) + "\n");
}

main();
