import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import library from "../src/data/library.json";
import samples from "../src/data/samples.json";
import { planCards, tilesFor } from "../src/lib/plan";
import { AVOIDS, FORMS, TIMES, WARNINGS, type Regimen } from "../src/lib/schema";
import { tileFromKey, tileKey, tilePrompt, STYLE_TRIGGER } from "../src/lib/tiles";

type Entry = { file: string; checkedBy: string[] };
const saved = library as Record<string, Entry>;

test("every saved picture was checked by two readers and its file exists", () => {
  for (const [key, entry] of Object.entries(saved)) {
    assert.equal(new Set(entry.checkedBy).size, 2, key);
    assert.ok(existsSync(new URL(`../public${entry.file}`, import.meta.url)), entry.file);
  }
});

test("every picture a medicine card can need is in the saved set", () => {
  const needed = [
    ...FORMS.map((form) => `unit-${form}`),
    ...TIMES.map((time) => `time-${time}`),
    "meal",
    ...AVOIDS.map((item) => `avoid-${item}`),
  ];
  assert.equal(needed.length, 16);
  for (const key of needed) assert.ok(saved[key], key);
});

test("every sample on the site is drawn only from saved pictures", () => {
  for (const sample of samples as unknown as { name: string; parsed: { regimen: Regimen } }[]) {
    for (const tile of tilesFor(planCards(sample.parsed.regimen))) {
      if (tile.kind === "warning" && !saved[tileKey(tile)]) continue; // drawn by code instead
      assert.ok(saved[tileKey(tile)], `${sample.name}: ${tileKey(tile)}`);
    }
  }
});

test("a picture's key turns back into the same picture", () => {
  const keys = [...TIMES.map((t) => `time-${t}`), "meal", ...AVOIDS.map((a) => `avoid-${a}`), ...WARNINGS.map((w) => `warning-${w}`)];
  for (const key of keys) assert.equal(tileKey(tileFromKey(key)), key);
});

test("the prompt for one unit asks for it alone, and uses the adapter's trigger only when told to", () => {
  const withAdapter = tilePrompt({ kind: "unit", form: "tablet" }, true);
  const plain = tilePrompt({ kind: "unit", form: "tablet" }, false);
  assert.ok(withAdapter.startsWith(STYLE_TRIGGER));
  assert.equal(plain.includes(STYLE_TRIGGER), false);
  assert.ok(plain.includes("alone in the middle of the picture"));
});
