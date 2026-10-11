// Turns the raw evaluation logs into the numbers shown on the site and in the README.
// Run: pnpm tsx scripts/report.ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Row = {
  key: string;
  kind: string;
  i: number;
  file: string;
  pass: boolean;
  expected: Record<string, unknown>;
  readings: { reader: string; reading: Record<string, unknown> | null }[];
  mismatches: string[];
};

const root = new URL("../", import.meta.url);
const read = (arm: string): Row[] => {
  const f = new URL(`training/eval/${arm}.jsonl`, root);
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Row);
};

// 95% Wilson interval for a proportion.
function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96, p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
const pct = (x: number) => Math.round(x * 1000) / 10;
const rate = (k: number, n: number) => ({ k, n, pct: n ? pct(k / n) : 0, ci: wilson(k, n).map(pct) as [number, number] });

function summarise(rows: Row[]) {
  const byKind: Record<string, { k: number; n: number }> = {};
  const byKey: Record<string, { k: number; n: number }> = {};
  for (const r of rows) {
    (byKind[r.kind] ??= { k: 0, n: 0 }).n += 1;
    (byKey[r.key] ??= { k: 0, n: 0 }).n += 1;
    if (r.pass) {
      byKind[r.kind].k += 1;
      byKey[r.key].k += 1;
    }
  }
  const keys = Object.values(byKey);
  // With three tries per tile, a tile falls back to the code-drawn picture only when all three fail.
  const fallback = keys.length ? keys.reduce((s, t) => s + Math.pow(1 - t.k / t.n, 3), 0) / keys.length : 0;
  const neverPassed = Object.entries(byKey).filter(([, t]) => t.k === 0).map(([k]) => k);
  return {
    pictures: rows.length,
    tiles: keys.length,
    firstTry: rate(rows.filter((r) => r.pass).length, rows.length),
    byKind: Object.fromEntries(Object.entries(byKind).map(([kind, t]) => [kind, rate(t.k, t.n)])),
    expectedFallbackPct: pct(fallback),
    neverPassed,
  };
}

function main() {
  const base = read("base");
  const adapter = read("adapter");
  const out: Record<string, unknown> = { generatedAt: new Date().toISOString() };
  if (base.length) out.base = summarise(base);
  if (adapter.length) out.adapter = summarise(adapter);

  // Whole doses drawn in one picture, pooled over both arms: how often the count was right.
  const counted = [...base, ...adapter].filter((r) => r.kind === "dose");
  out.counting = rate(counted.filter((r) => r.pass).length, counted.length);

  // A few rejected dose pictures, copied into the site as examples of what the check catches.
  const dir = new URL("public/evidence/", root);
  mkdirSync(dir, { recursive: true });
  const caught = [...base, ...adapter]
    .filter((r) => !r.pass && r.kind === "dose")
    .slice(0, 12)
    .map((r) => {
      const arm = base.includes(r) ? "base" : "adapter";
      const name = `caught-${arm}-${r.file}`;
      copyFileSync(new URL(`training/eval/${arm}/${r.file}`, root), new URL(name, dir));
      return { file: `/evidence/${name}`, arm, expected: r.expected, readings: r.readings, mismatches: r.mismatches };
    });
  out.caught = caught;

  const parseFile = new URL("src/data/eval-parse.json", root);
  if (existsSync(parseFile)) out.reader = (JSON.parse(readFileSync(parseFile, "utf8")) as { summary: unknown }).summary;
  const style = new URL("src/data/eval-style.json", root);
  if (existsSync(style)) out.style = JSON.parse(readFileSync(style, "utf8"));
  const adapterFile = new URL("src/data/adapter.json", root);
  if (existsSync(adapterFile)) {
    const a = JSON.parse(readFileSync(adapterFile, "utf8")) as { steps: number; images: number; seconds: number; base: string; source: string };
    out.training = { steps: a.steps, images: a.images, seconds: a.seconds, base: a.base, source: a.source };
  }
  const labels = new URL("src/data/labels-report.json", root);
  if (existsSync(labels)) out.labels = JSON.parse(readFileSync(labels, "utf8"));

  writeFileSync(new URL("src/data/results.json", root), JSON.stringify(out, null, 2) + "\n");
  console.log(JSON.stringify({ base: out.base, adapter: out.adapter, caught: caught.length }, null, 2));
}

main();
