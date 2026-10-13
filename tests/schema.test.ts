import assert from "node:assert/strict";
import { test } from "node:test";
import { LANGUAGE_LIST, Medicine, RTL } from "../src/lib/schema";

const base = { name: "Metformin 500 mg", form: "tablet", count: 1, times: ["morning"], food: "with_food", days: 30, avoid: [] };

test("a whole-number dose is accepted", () => {
  assert.equal(Medicine.safeParse(base).success, true);
});

test("a half tablet is refused, so it is shown as text and never drawn", () => {
  assert.equal(Medicine.safeParse({ ...base, count: 0.5 }).success, false);
  assert.equal(Medicine.safeParse({ ...base, count: 1.5 }).success, false);
});

test("a dose of zero or more than six units is refused", () => {
  assert.equal(Medicine.safeParse({ ...base, count: 0 }).success, false);
  assert.equal(Medicine.safeParse({ ...base, count: 7 }).success, false);
});

test("a medicine needs at least one time of day and a known form", () => {
  assert.equal(Medicine.safeParse({ ...base, times: [] }).success, false);
  assert.equal(Medicine.safeParse({ ...base, form: "patch" }).success, false);
  assert.equal(Medicine.safeParse({ ...base, times: ["midnight"] }).success, false);
});

test("language codes are unique and every right-to-left code is a listed language", () => {
  const codes = LANGUAGE_LIST.map(([code]) => code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of RTL) assert.ok(codes.includes(code));
});
