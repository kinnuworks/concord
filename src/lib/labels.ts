import translations from "@/data/labels.json";
import type { Avoid, Food, Lang, TimeOfDay, Warning } from "./schema";

// Every word printed on a card comes from this table. The English column is the
// source; other languages are generated once and kept only if their back-translation
// matches (see scripts/labels.mjs).
export const EN = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  before_food: "Before food",
  with_food: "With food",
  after_food: "After food",
  any: "",
  days: "days",
  every_day: "Every day",
  do_not: "Do not",
  alcohol: "Drink alcohol",
  driving: "Drive",
  sunlight: "Stay in strong sun",
  smoking: "Smoke",
  heavy_lifting: "Lift heavy things",
  dairy: "Take milk or cheese",
  come_back: "Come back to the hospital if you have",
  fever: "Fever",
  bleeding: "Bleeding",
  swelling: "Swelling",
  chest_pain: "Chest pain",
  breathlessness: "Trouble breathing",
  severe_pain: "Strong pain",
  vomiting: "Vomiting",
  rash: "Rash",
  dizziness: "Dizziness",
  wound_discharge: "Fluid from the wound",
  next_visit: "Next visit",
  times: "times",
  sets: "sets",
  times_a_day: "times a day",
  take: "Take",
  checked: "Checked",
  read_back: "pictures checked by two readers",
  exact_angle: "Figure drawn at the exact angle",
  drawn_by_code: "Drawn from the numbers",
} as const;

export type LabelKey = keyof typeof EN;
type Table = Partial<Record<LabelKey, string>>;

const tables = translations as Record<string, Table>;

export function label(lang: Lang, key: LabelKey | TimeOfDay | Food | Avoid | Warning): string {
  return tables[lang]?.[key as LabelKey] ?? EN[key as LabelKey];
}

export function hasLanguage(lang: Lang): boolean {
  return lang === "en" || Boolean(tables[lang]);
}
