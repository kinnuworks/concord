// Builds the fixed test set: 100 written instructions with known answers.
// The text is produced from the answer, so the answer is exact by construction.
// Run: pnpm tsx scripts/testset.ts
import { writeFileSync } from "node:fs";
import { AVOIDS, type Avoid, type Food, type Form, type Medicine, type TimeOfDay } from "../src/lib/schema";
import { planMedicine, tilesFor } from "../src/lib/plan";
import { tileKey } from "../src/lib/tiles";

// Small seeded generator so the set is the same on every run.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261011);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

// Each medicine keeps its real form and a dose range a clinician would recognise, so a
// reader is never asked to chart something that looks like an overdose.
const DRUGS: { name: string; form: Form; max: number }[] = [
  { name: "Amoxicillin 500 mg", form: "capsule", max: 2 },
  { name: "Paracetamol 500 mg", form: "tablet", max: 2 },
  { name: "Ibuprofen 400 mg", form: "tablet", max: 1 },
  { name: "Metformin 500 mg", form: "tablet", max: 2 },
  { name: "Atorvastatin 20 mg", form: "tablet", max: 1 },
  { name: "Omeprazole 20 mg", form: "capsule", max: 1 },
  { name: "Cetirizine 10 mg", form: "tablet", max: 1 },
  { name: "Azithromycin 250 mg", form: "tablet", max: 2 },
  { name: "Prednisolone 5 mg", form: "tablet", max: 6 },
  { name: "Vitamin D 1000 IU", form: "capsule", max: 2 },
  { name: "Iron 100 mg", form: "tablet", max: 2 },
  { name: "Cough syrup", form: "spoon", max: 2 },
  { name: "Antacid suspension", form: "spoon", max: 2 },
  { name: "Eye drops", form: "drops", max: 2 },
  { name: "Ear drops", form: "drops", max: 4 },
  { name: "Salbutamol inhaler", form: "puff", max: 2 },
];
const UNIT: Record<Form, [string, string]> = {
  tablet: ["tablet", "tablets"], capsule: ["capsule", "capsules"], spoon: ["spoonful", "spoonfuls"],
  drops: ["drop", "drops"], puff: ["puff", "puffs"],
};
const SCHEDULES: { times: TimeOfDay[]; phrases: string[] }[] = [
  { times: ["morning"], phrases: ["once a day in the morning", "every morning"] },
  { times: ["night"], phrases: ["at bedtime", "once a day at night"] },
  { times: ["morning", "night"], phrases: ["twice a day", "in the morning and at night"] },
  { times: ["morning", "afternoon", "night"], phrases: ["three times a day", "morning, afternoon and night"] },
  { times: ["morning", "evening"], phrases: ["in the morning and in the evening"] },
  { times: ["morning", "afternoon", "evening", "night"], phrases: ["four times a day: morning, afternoon, evening and night"] },
];
const FOOD_PHRASE: Record<Food, string[]> = {
  after_food: ["after meals", "after food"],
  before_food: ["before meals", "on an empty stomach"],
  with_food: ["with meals", "with food"],
  any: [""],
};
const AVOID_PHRASE: Record<Avoid, string> = {
  alcohol: "Do not drink alcohol.", driving: "Do not drive.", sunlight: "Stay out of strong sunlight.",
  smoking: "Do not smoke.", heavy_lifting: "Do not lift heavy things.", dairy: "Do not take it with milk or cheese.",
};

export type Case = { id: string; text: string; answer: Medicine };

export function buildTestSet(n = 100): Case[] {
  const cases: Case[] = [];
  for (let i = 0; i < n; i++) {
    const drug = pick(DRUGS);
    const { name, form } = drug;
    const count = 1 + Math.floor(rand() * drug.max);
    const sched = pick(SCHEDULES);
    const food = pick(["after_food", "after_food", "before_food", "with_food", "any", "any"] as const);
    const days = rand() < 0.2 ? null : pick([3, 5, 7, 10, 14] as const);
    const avoid = rand() < 0.35 ? [pick(AVOIDS)] : [];
    const unit = UNIT[form][count === 1 ? 0 : 1];
    const foodText = pick(FOOD_PHRASE[food]);
    const text = [
      `${name}: take ${count} ${unit} ${pick(sched.phrases)}`,
      foodText ? ` ${foodText}` : "",
      days ? ` for ${days} days.` : ".",
      avoid.length ? ` ${AVOID_PHRASE[avoid[0]]}` : "",
    ].join("");
    cases.push({
      id: `t${String(i + 1).padStart(3, "0")}`,
      text,
      answer: { name, form, count, times: sched.times, food, days, avoid: [...avoid].sort() },
    });
  }
  return cases;
}

if (process.argv[1]?.endsWith("testset.ts")) {
  const cases = buildTestSet();
  writeFileSync(new URL("../src/data/testset.json", import.meta.url), JSON.stringify(cases, null, 2) + "\n");
  const unique = new Set(tilesFor(cases.map((c, i) => planMedicine(c.answer, i))).map(tileKey));
  const doses = [...unique].filter((k) => k.startsWith("dose-"));
  console.log(`${cases.length} cases, ${unique.size} unique tiles (${doses.length} dose tiles)`);
  console.log(cases.slice(0, 3).map((c) => c.text).join("\n"));
}
