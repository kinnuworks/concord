import assert from "node:assert/strict";
import { test } from "node:test";
import { expectedReading, meaning, READER_NAMES } from "../src/lib/readback";
import { AVOIDS, FORMS, TIMES, WARNINGS } from "../src/lib/schema";

test("there are two readers and they are different", () => {
  assert.equal(READER_NAMES.length, 2);
  assert.equal(new Set(READER_NAMES).size, 2);
});

test("a single unit must be read as exactly one of its kind", () => {
  for (const form of FORMS) assert.deepEqual(expectedReading({ kind: "unit", form }), { form, count: 1 });
});

test("a dose must be read with its exact count", () => {
  assert.deepEqual(expectedReading({ kind: "dose", form: "tablet", count: 3 }), { form: "tablet", count: 3 });
});

test("every time of day, thing to avoid and warning sign has a meaning to check against", () => {
  for (const time of TIMES) assert.ok(meaning({ kind: "time", time }));
  for (const item of AVOIDS) assert.ok(meaning({ kind: "avoid", item }));
  for (const sign of WARNINGS) assert.ok(meaning({ kind: "warning", sign }));
  assert.ok(meaning({ kind: "meal" }));
});

test("the four times of day have four different meanings", () => {
  assert.equal(new Set(TIMES.map((time) => meaning({ kind: "time", time }))).size, 4);
});

test("an exercise figure must be one whole person with clear limbs", () => {
  assert.deepEqual(expectedReading({ kind: "exercise", movement: "knee_bend", angle: 90 }), { person: true, limbs_ok: true });
});
