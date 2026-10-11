// Draws every tile several times without the gate and records what the readers saw.
// One run per arm: "base" (no adapter) and "adapter". Results append to a JSON-lines
// file so an interrupted run resumes where it stopped.
// Run: pnpm tsx --env-file=.env.local scripts/eval-tiles.ts <base|adapter> [triesPerTile]
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { generateTile } from "../src/lib/generate";
import { readBack } from "../src/lib/readback";
import { planMedicine, tilesFor } from "../src/lib/plan";
import { MOVEMENTS, WARNINGS } from "../src/lib/schema";
import { tileKey, type TileSpec } from "../src/lib/tiles";
import { buildTestSet } from "./testset";

const arm = process.argv[2] === "adapter" ? "adapter" : "base";
const tries = Number(process.argv[3] ?? 5);
const dir = new URL(`../training/eval/${arm}/`, import.meta.url);
const logFile = new URL(`../training/eval/${arm}.jsonl`, import.meta.url);

function allSpecs(): TileSpec[] {
  const cases = buildTestSet();
  const fromCases = tilesFor(cases.map((c, i) => planMedicine(c.answer, i)));
  // Whole doses drawn in one picture. The cards no longer use these; they are measured
  // to show how often a generator miscounts when asked to draw several.
  const counted = new Map<string, TileSpec>();
  for (const c of cases) {
    const t: TileSpec = { kind: "dose", form: c.answer.form, count: c.answer.count };
    counted.set(tileKey(t), t);
  }
  const warnings: TileSpec[] = WARNINGS.map((sign) => ({ kind: "warning", sign }));
  const angles: Record<string, number> = {
    knee_bend: 90, straight_leg_raise: 45, arm_raise_front: 90, arm_raise_side: 90, elbow_bend: 90,
  };
  const exercises: TileSpec[] = MOVEMENTS.map((movement) => ({ kind: "exercise", movement, angle: angles[movement] }));
  return [...fromCases, ...counted.values(), ...warnings, ...exercises];
}

function seedFor(key: string, i: number) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1_000_000) + i * 7919;
}

type Row = {
  key: string;
  kind: string;
  i: number;
  seed: number;
  file: string;
  pass: boolean;
  expected: unknown;
  readings: { reader: string; reading: unknown; error?: string }[];
  mismatches: string[];
};

async function main() {
  mkdirSync(dir, { recursive: true });
  const done = new Set<string>();
  if (existsSync(logFile)) {
    for (const line of readFileSync(logFile, "utf8").split("\n")) {
      if (line.trim()) {
        const r = JSON.parse(line) as Row;
        done.add(`${r.key}#${r.i}`);
      }
    }
  }
  const jobs = allSpecs().flatMap((spec) =>
    Array.from({ length: tries }, (_, i) => ({ spec, i })).filter((j) => !done.has(`${tileKey(j.spec)}#${j.i}`)),
  );
  console.log(`${arm}: ${jobs.length} to draw, ${done.size} already done`);

  let finished = 0;
  const workers = Array.from({ length: 3 }, async () => {
    for (let job = jobs.shift(); job; job = jobs.shift()) {
      const key = tileKey(job.spec);
      const seed = seedFor(key, job.i);
      try {
        const g = await generateTile(job.spec, { adapter: arm === "adapter", seed });
        const res = await fetch(g.url);
        const buf = Buffer.from(await res.arrayBuffer());
        const file = `${key}__${job.i}.png`;
        writeFileSync(new URL(file, dir), buf);
        // A reader that is rate limited is not a failed picture. Wait and ask again.
        let verdict = await readBack(job.spec, { mime: "image/png", base64: buf.toString("base64") });
        for (let wait = 20; verdict.readers.some((r) => r.error) && wait <= 80; wait *= 2) {
          await new Promise((r) => setTimeout(r, wait * 1000));
          verdict = await readBack(job.spec, { mime: "image/png", base64: buf.toString("base64") });
        }
        if (verdict.readers.some((r) => r.error)) throw new Error(`reader unavailable: ${verdict.readers.find((r) => r.error)?.error}`);
        const row: Row = {
          key, kind: job.spec.kind, i: job.i, seed, file, pass: verdict.pass,
          expected: verdict.expected, readings: verdict.readers, mismatches: verdict.mismatches,
        };
        appendFileSync(logFile, JSON.stringify(row) + "\n");
      } catch (e) {
        console.log("failed", key, job.i, e instanceof Error ? e.message.slice(0, 140) : e);
      }
      finished += 1;
      if (finished % 20 === 0) console.log(`${arm}: ${finished} drawn`);
    }
  });
  await Promise.all(workers);
  console.log(`${arm}: done`);
}

main();
