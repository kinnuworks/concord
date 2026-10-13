import assert from "node:assert/strict";
import { test } from "node:test";
import tables from "../src/data/labels.json";
import { EN, hasLanguage, label } from "../src/lib/labels";
import { AVOIDS, FOODS, LANGUAGE_LIST, TIMES, WARNINGS } from "../src/lib/schema";

const offered = LANGUAGE_LIST.map(([code]) => code).filter(hasLanguage);
const all = tables as Record<string, Record<string, string>>;

test("at least seventy languages are offered", () => {
  assert.ok(offered.length >= 70, `only ${offered.length}`);
});

test("every offered language has four different words for the four times of day", () => {
  for (const code of offered) {
    const words = TIMES.map((time) => label(code, time));
    assert.equal(new Set(words).size, 4, `${code}: ${words.join(", ")}`);
  }
});

test("every offered language is missing at most two labels", () => {
  const total = Object.values(EN).filter((v) => v !== "").length;
  for (const code of offered.filter((c) => c !== "en")) {
    assert.ok(Object.keys(all[code]).length >= total - 2, code);
  }
});

test("a missing label falls back to English and is never blank", () => {
  for (const code of offered) {
    for (const key of [...TIMES, ...FOODS, ...AVOIDS, ...WARNINGS]) {
      if (key === "any") continue;
      assert.ok(label(code, key).trim().length > 0, `${code} ${key}`);
    }
  }
});

test("a language without checked labels is not offered", () => {
  assert.equal(hasLanguage("xx"), false);
  assert.equal(hasLanguage("en"), true);
});
