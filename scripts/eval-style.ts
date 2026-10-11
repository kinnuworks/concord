// Two follow-up passes over the saved evaluation pictures, without drawing anything new.
// 1. Style: a reader labels each picture's drawing style, to measure what the adapter changes.
// 2. Time tiles: re-read with the current question (what the sky shows).
// Run: pnpm tsx --env-file=.env.local scripts/eval-style.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { googleVisionJson, openaiJson } from "../src/lib/models";
import { readBack } from "../src/lib/readback";
import type { TimeOfDay } from "../src/lib/schema";

type Row = { key: string; kind: string; i: number; file: string; pass: boolean; expected: unknown; readings: unknown; mismatches: string[] };

const STYLES = ["flat pictogram with outlines", "photo or 3d render", "other illustration"] as const;
const QUESTION = `Look only at how this picture is drawn, not at what it shows. Answer with one JSON object: {"style": one of ${JSON.stringify(STYLES)}}. "flat pictogram with outlines" means flat solid colours with clear dark outlines and no realistic shading.`;

const root = new URL("../", import.meta.url);

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => { for (let x = queue.shift(); x; x = queue.shift()) await fn(x); }));
}

async function main() {
  const out: Record<string, unknown> = {};
  for (const arm of ["base", "adapter"]) {
    const file = new URL(`training/eval/${arm}.jsonl`, root);
    if (!existsSync(file)) continue;
    const rows = readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Row);

    // Time tiles, read again with the sky question.
    const timeRows = rows.filter((r) => r.kind === "time");
    await pool(timeRows, 4, async (r) => {
      const buf = readFileSync(new URL(`training/eval/${arm}/${r.file}`, root));
      const time = r.key.replace("time-", "") as TimeOfDay;
      const v = await readBack({ kind: "time", time }, { mime: "image/png", base64: buf.toString("base64") });
      r.pass = v.pass; r.expected = v.expected; r.readings = v.readers; r.mismatches = v.mismatches;
    });
    writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

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
  writeFileSync(new URL("src/data/eval-style.json", root), JSON.stringify(out, null, 2) + "\n");
}

main();
