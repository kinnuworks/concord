// Draws a handful of tiles without the gate and saves them, to judge style by eye.
// Run: pnpm tsx --env-file=.env.local scripts/sample.ts <outDir>
import { mkdirSync, writeFileSync } from "node:fs";
import { generateTile } from "../src/lib/generate";
import { tileKey, type TileSpec } from "../src/lib/tiles";

const SPECS: TileSpec[] = [
  { kind: "dose", form: "tablet", count: 2 },
  { kind: "dose", form: "capsule", count: 3 },
  { kind: "dose", form: "spoon", count: 1 },
  { kind: "time", time: "morning" },
  { kind: "time", time: "night" },
  { kind: "meal" },
  { kind: "avoid", item: "alcohol" },
  { kind: "warning", sign: "fever" },
  { kind: "exercise", movement: "knee_bend", angle: 90 },
];

async function main() {
  const out = process.argv[2] ?? "samples";
  mkdirSync(out, { recursive: true });
  await Promise.all(
    SPECS.map(async (spec) => {
      const t0 = Date.now();
      const g = await generateTile(spec, { adapter: process.argv[3] !== "base", seed: 7 });
      const res = await fetch(g.url);
      writeFileSync(`${out}/${tileKey(spec)}.png`, Buffer.from(await res.arrayBuffer()));
      console.log(tileKey(spec), `${Date.now() - t0} ms`);
    }),
  );
}
main();
