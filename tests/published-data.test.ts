import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import dictionary from "../src/data/medicine-names.json";
import medicines from "../src/data/medicines.json";
import report from "../src/data/names-report.json";
import results from "../src/data/results.json";
import { hasLanguage } from "../src/lib/labels";
import { mixedScript } from "../src/lib/localize";
import { LANGUAGE_LIST } from "../src/lib/schema";

const names = dictionary as Record<string, Record<string, string>>;
type Picture = { f: string; kind: string; asked: string; saw: [string, string][]; kept: boolean; why: string };
const wall: Picture[] = JSON.parse(readFileSync(new URL("../public/gallery/index.json", import.meta.url), "utf8"));

test("the medicine list has 1,830 different medicines, each with its RxNorm id", () => {
  assert.equal(medicines.names.length, 1830);
  assert.equal(new Set(medicines.names).size, 1830);
  for (const name of medicines.names) assert.ok((medicines.rxcui as Record<string, string>)[name], name);
});

test("the name report adds up", () => {
  assert.equal(report.written, report.medicines * report.languages);
  assert.equal(report.readBack, report.written + report.wikidata.names);
  assert.ok(report.matched <= report.written);
  assert.ok(report.wikidata.used <= report.wikidata.kept && report.wikidata.kept <= report.wikidata.names);
  const perLanguage = Object.values(report.perLanguage);
  assert.equal(perLanguage.reduce((n, l) => n + l.written, 0), report.written);
  assert.equal(perLanguage.reduce((n, l) => n + l.matched, 0), report.matched);
});

test("every language with names is an offered language", () => {
  const codes = LANGUAGE_LIST.map(([code]) => code);
  for (const code of Object.keys(names)) assert.ok(codes.includes(code) && hasLanguage(code), code);
  assert.equal(Object.keys(names).length, report.languages);
});

test("no name on a card mixes two scripts or is for an unknown medicine", () => {
  const known = new Set(medicines.names.map((n) => n.toLowerCase()));
  for (const [code, table] of Object.entries(names)) {
    for (const [medicine, local] of Object.entries(table)) {
      assert.ok(known.has(medicine), `${code}: ${medicine}`);
      assert.equal(mixedScript(local), false, `${code}: ${local}`);
    }
  }
});

test("the picture wall holds all 540 pictures, each with two readings and its file", () => {
  assert.equal(wall.length, 540);
  for (const p of wall) {
    assert.equal(p.saw.length, 2, p.f);
    assert.ok(existsSync(new URL(`../public/gallery/${p.f}.webp`, import.meta.url)), p.f);
    assert.equal(p.kept, p.why === "", p.f);
  }
});

test("the wall agrees with the published results", () => {
  const doses = wall.filter((p) => p.kind === "dose");
  assert.equal(doses.length, results.counting.n);
  assert.equal(doses.filter((p) => !p.kept).length, results.counting.n - results.counting.k);
  assert.equal(wall.length, results.base.pictures + results.adapter.pictures);
});
