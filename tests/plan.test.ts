import assert from "node:assert/strict";
import { test } from "node:test";
import { planCards, planMedicine, tilesFor } from "../src/lib/plan";
import { AVOIDS, FOODS, FORMS, TIMES, type Medicine, type Regimen } from "../src/lib/schema";
import { tileKey } from "../src/lib/tiles";

const medicine = (over: Partial<Medicine> = {}): Medicine => ({
  name: "Amoxicillin 500 mg",
  form: "capsule",
  count: 2,
  times: ["morning", "night"],
  food: "after_food",
  days: 5,
  avoid: ["alcohol"],
  ...over,
});

const regimen = (over: Partial<Regimen> = {}): Regimen => ({
  medicines: [medicine()],
  exercises: [],
  warnings: [],
  followUp: null,
  unparsed: [],
  ...over,
});

test("a medicine card has one row per time, in the order given", () => {
  const card = planMedicine(medicine(), 0);
  assert.deepEqual(card.rows.map((r) => r.time), ["morning", "night"]);
});

test("the dose is one unit picture with the count held in code", () => {
  for (const count of [1, 2, 3, 4, 5, 6]) {
    const card = planMedicine(medicine({ count }), 0);
    for (const row of card.rows) {
      assert.deepEqual(row.doseTile, { kind: "unit", form: "capsule" });
      assert.equal(row.count, count);
    }
  }
});

test("no card ever asks the image model to draw a whole dose", () => {
  for (const form of FORMS) {
    for (const count of [1, 2, 3, 4, 5, 6]) {
      const tiles = tilesFor(planCards(regimen({ medicines: [medicine({ form, count })] })));
      assert.equal(tiles.some((t) => t.kind === "dose"), false);
    }
  }
});

test("after food puts the meal before the dose, before food puts it after", () => {
  assert.equal(planMedicine(medicine({ food: "after_food" }), 0).rows[0].meal, "before_dose");
  assert.equal(planMedicine(medicine({ food: "before_food" }), 0).rows[0].meal, "after_dose");
  assert.equal(planMedicine(medicine({ food: "with_food" }), 0).rows[0].meal, "with_dose");
  assert.equal(planMedicine(medicine({ food: "any" }), 0).rows[0].meal, "none");
});

test("every medicine card needs all four times of day", () => {
  const keys = tilesFor(planCards(regimen())).map(tileKey);
  for (const time of TIMES) assert.ok(keys.includes(`time-${time}`));
});

test("the meal picture is only needed when there is a food rule", () => {
  const withRule = tilesFor(planCards(regimen())).map(tileKey);
  const without = tilesFor(planCards(regimen({ medicines: [medicine({ food: "any" })] }))).map(tileKey);
  assert.ok(withRule.includes("meal"));
  assert.equal(without.includes("meal"), false);
});

test("the same picture is requested once however many cards use it", () => {
  const cards = planCards(regimen({ medicines: [medicine(), medicine({ name: "Ibuprofen 400 mg" })] }));
  const keys = tilesFor(cards).map(tileKey);
  assert.equal(new Set(keys).size, keys.length);
});

test("warnings share one card and a follow-up needs a date or a place", () => {
  const cards = planCards(
    regimen({ warnings: ["fever", "swelling"], followUp: { date: "2026-10-20", place: null } }),
  );
  assert.equal(cards.filter((c) => c.kind === "warning").length, 1);
  assert.equal(cards.filter((c) => c.kind === "followup").length, 1);
  const none = planCards(regimen({ followUp: { date: null, place: null } }));
  assert.equal(none.some((c) => c.kind === "followup"), false);
});

test("an exercise keeps the angle the sheet prescribed", () => {
  const cards = planCards(
    regimen({ exercises: [{ name: "Knee bends", movement: "knee_bend", angle: 90, reps: 10, sets: 2, timesPerDay: 3 }] }),
  );
  const exercise = cards.find((c) => c.kind === "exercise");
  assert.ok(exercise && exercise.kind === "exercise");
  assert.equal(exercise.tile.kind === "exercise" && exercise.tile.angle, 90);
});

test("the cards that can be built match the figure on the site", () => {
  const combinations = FORMS.length * 6 * (2 ** TIMES.length - 1) * FOODS.length * 2 ** AVOIDS.length;
  assert.equal(combinations, 115200);
  assert.equal(FORMS.length + TIMES.length + 1 + AVOIDS.length, 16);
});
