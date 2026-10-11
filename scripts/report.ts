// Turns the raw evaluation logs into the numbers shown on the site and in the README.
// Run: pnpm tsx scripts/report.ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tileFromKey, tilePrompt } from "../src/lib/tiles";

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
  const light = read("adapter-light");
  if (light.length) out.adapterLight = summarise(light);

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
  // What the redraw rule is worth, worked out from the measured first-try rates for
  // warning signs: three styled attempts, against one styled attempt and two plain ones.
  const passRate = (rows: Row[]) => {
    const m: Record<string, { k: number; n: number }> = {};
    for (const r of rows.filter((x) => x.kind === "warning")) {
      (m[r.key] ??= { k: 0, n: 0 }).n += 1;
      if (r.pass) m[r.key].k += 1;
    }
    return m;
  };
  const pa = passRate(adapter);
  const pb = passRate(base);
  const signs = Object.keys(pa).filter((k) => pb[k]);
  if (signs.length) {
    const miss = (t: { k: number; n: number }) => 1 - t.k / t.n;
    const mean = (f: (k: string) => number) => pct(signs.reduce((s, k) => s + f(k), 0) / signs.length);
    out.redrawRule = {
      signs: signs.length,
      styledOnlyFallbackPct: mean((k) => Math.pow(miss(pa[k]), 3)),
      styledThenPlainFallbackPct: mean((k) => miss(pa[k]) * Math.pow(miss(pb[k]), 2)),
    };
  }

  out.caught = caught;

  // Hand-picked pictures from the adapter arm that the read-back stopped, chosen so the
  // mistake is plain at a glance. Each is listed as [picture, attempt number].
  const find = (rows: Row[], key: string, i: number) => rows.find((r) => r.key === key && r.i === i);
  const said = (r: Row) => r.readings.map((x) => String(x.reading?.shows ?? ""));
  const STOPPED: [string, number][] = [
    ["warning-swelling", 1],
    ["warning-chest_pain", 1],
    ["warning-severe_pain", 3],
    ["warning-fever", 3],
    ["warning-bleeding", 0],
    ["warning-breathlessness", 0],
  ];
  const misread = STOPPED.flatMap(([key, i]) => {
    const r = find(adapter, key, i);
    if (!r || r.pass) return [];
    const name = `misread-adapter-${r.file}`;
    copyFileSync(new URL(`training/eval/adapter/${r.file}`, root), new URL(name, dir));
    return [{ file: `/evidence/${name}`, arm: "adapter", meant: String(r.expected.meaning ?? ""), saw: said(r) }];
  });
  out.misread = misread;

  // For the walk-through on the site: the prompt code wrote, the stopped picture above,
  // and a picture of the same thing that both readers understood. A redraw goes to the
  // plain model, so where the styled arm has no clear pass the kept picture comes from there.
  const KEPT: Record<string, ["adapter" | "base", number]> = {
    "warning-swelling": ["base", 0],
    "warning-chest_pain": ["base", 0],
    "warning-severe_pain": ["adapter", 1],
  };
  const examples = STOPPED.flatMap(([key, i]) => {
    const stopped = find(adapter, key, i);
    const want = KEPT[key];
    const kept = want ? find(want[0] === "base" ? base : adapter, key, want[1]) : adapter.find((r) => r.key === key && r.pass);
    if (!stopped || stopped.pass || !kept || !kept.pass) return [];
    const save = (r: Row) => {
      const arm = adapter.includes(r) ? "adapter" : "base";
      const name = `example-${arm}-${r.file}`;
      copyFileSync(new URL(`training/eval/${arm}/${r.file}`, root), new URL(name, dir));
      return { file: `/evidence/${name}`, saw: said(r), ...(arm === "base" ? { plain: true } : {}) };
    };
    return [{ key, prompt: tilePrompt(tileFromKey(key), true), meant: String(kept.expected.meaning ?? ""), stopped: save(stopped), kept: save(kept) }];
  });
  out.examples = examples;

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
