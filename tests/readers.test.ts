import assert from "node:assert/strict";
import { test } from "node:test";
import { compare } from "../src/lib/parse";
import type { Regimen } from "../src/lib/schema";

const sheet = (over: Partial<Regimen> = {}): Regimen => ({
  medicines: [{ name: "Amoxicillin 500 mg", form: "capsule", count: 2, times: ["morning", "night"], food: "after_food", days: 5, avoid: ["alcohol"] }],
  exercises: [{ name: "Knee bends", movement: "knee_bend", angle: 90, reps: 10, sets: 3, timesPerDay: 2 }],
  warnings: ["fever"],
  followUp: { date: "2026-10-26", place: "clinic" },
  unparsed: [],
  ...over,
});

test("two identical readings raise no flag", () => {
  assert.deepEqual(compare(sheet(), sheet()), []);
});

test("a different dose is flagged with both readings", () => {
  const other = sheet({ medicines: [{ ...sheet().medicines[0], count: 3 }] });
  const flags = compare(sheet(), other);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].path, "medicines[0].count");
  assert.equal(flags[0].a, 2);
  assert.equal(flags[0].b, 3);
});

test("a different time of day, food rule or number of days is flagged", () => {
  const med = sheet().medicines[0];
  assert.ok(compare(sheet(), sheet({ medicines: [{ ...med, times: ["morning"] }] })).some((f) => f.path.endsWith(".times")));
  assert.ok(compare(sheet(), sheet({ medicines: [{ ...med, food: "before_food" }] })).some((f) => f.path.endsWith(".food")));
  assert.ok(compare(sheet(), sheet({ medicines: [{ ...med, days: 7 }] })).some((f) => f.path.endsWith(".days")));
});

test("the same medicine written with and without its strength still pairs up", () => {
  const med = sheet().medicines[0];
  assert.deepEqual(compare(sheet(), sheet({ medicines: [{ ...med, name: "Amoxicillin" }] })), []);
  assert.deepEqual(compare(sheet(), sheet({ medicines: [{ ...med, name: "amoxicillin 500mg capsules" }] })), []);
});

test("a medicine only one reader saw is flagged", () => {
  const extra = sheet({ medicines: [...sheet().medicines, { name: "Ibuprofen 400 mg", form: "tablet", count: 1, times: ["night"], food: "with_food", days: 3, avoid: [] }] });
  assert.ok(compare(sheet(), extra).some((f) => f.path === "medicines[+]" && f.b === "Ibuprofen 400 mg"));
  assert.ok(compare(extra, sheet()).some((f) => f.a === "Ibuprofen 400 mg" && f.b === null));
});

test("a different exercise angle, warning list or follow-up date is flagged", () => {
  const ex = sheet().exercises[0];
  assert.ok(compare(sheet(), sheet({ exercises: [{ ...ex, angle: 45 }] })).some((f) => f.path === "exercises[0].angle"));
  assert.ok(compare(sheet(), sheet({ warnings: ["fever", "swelling"] })).some((f) => f.path === "warnings"));
  assert.ok(compare(sheet(), sheet({ followUp: { date: "2026-10-27", place: "clinic" } })).some((f) => f.path === "followUp.date"));
});
