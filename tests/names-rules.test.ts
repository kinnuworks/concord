import assert from "node:assert/strict";
import { test } from "node:test";
import { mixedScript, sameName } from "../src/lib/localize";

test("a name half in the patient's script and half in Latin letters is rejected", () => {
  assert.equal(mixedScript("أسبرومazine"), true);
  assert.equal(mixedScript("मेटformin"), true);
});

test("a name written fully in one script is accepted", () => {
  assert.equal(mixedScript("मेटफॉर्मिन"), false);
  assert.equal(mixedScript("二甲双胍"), false);
  assert.equal(mixedScript("metformina"), false);
  assert.equal(mixedScript("ميتفورمين"), false);
});

test("digits, units and a single letter do not count as mixing scripts", () => {
  assert.equal(mixedScript("विटामिन B12"), false);
  assert.equal(mixedScript("维生素 D3"), false);
});

test("the United States name and the local name are different words", () => {
  assert.equal(sameName("acetaminophen", "paracetamol"), false);
  assert.equal(sameName("albuterol", "salbutamol"), false);
});

test("look-alike medicine names are told apart", () => {
  for (const [a, b] of [["hydroxyzine", "hydralazine"], ["clonidine", "clonazepam"], ["metformin", "metronidazole"], ["prednisone", "prednisolone acetate"]]) {
    assert.equal(sameName(a, b), false, `${a} / ${b}`);
  }
});
