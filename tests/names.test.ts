import assert from "node:assert/strict";
import { test } from "node:test";
import { letters, sameName } from "../src/lib/localize";

test("spacing, case and punctuation do not change a medicine's name", () => {
  assert.equal(letters("Amoxicillin 500 mg"), letters("amoxicillin 500mg"));
  assert.ok(sameName("Amoxicillin 500 mg", "amoxicillin 500mg"));
});

test("a small spelling difference in the read-back still matches", () => {
  assert.ok(sameName("atorvastatin", "Atorvastatine"));
  assert.ok(sameName("levothyroxine", "levothyroxin"));
});

test("a different medicine is not accepted", () => {
  assert.equal(sameName("atogepant", "icosapent ethyl"), false);
  assert.equal(sameName("metformin", "metoprolol"), false);
  assert.equal(sameName("hydroxyzine", "hydralazine"), false);
});

test("an empty read-back never matches", () => {
  assert.equal(sameName("metformin", ""), false);
  assert.equal(sameName("", "metformin"), false);
});
