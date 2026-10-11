import { z } from "zod";

export const TIMES = ["morning", "afternoon", "evening", "night"] as const;
export const FOODS = ["before_food", "with_food", "after_food", "any"] as const;
export const FORMS = ["tablet", "capsule", "spoon", "drops", "puff"] as const;
export const AVOIDS = [
  "alcohol",
  "driving",
  "sunlight",
  "smoking",
  "heavy_lifting",
  "dairy",
] as const;
export const WARNINGS = [
  "fever",
  "bleeding",
  "swelling",
  "chest_pain",
  "breathlessness",
  "severe_pain",
  "vomiting",
  "rash",
  "dizziness",
  "wound_discharge",
] as const;
export const MOVEMENTS = [
  "knee_bend",
  "straight_leg_raise",
  "arm_raise_front",
  "arm_raise_side",
  "elbow_bend",
] as const;

export const TimeOfDay = z.enum(TIMES);
export const Food = z.enum(FOODS);
export const Form = z.enum(FORMS);
export const Avoid = z.enum(AVOIDS);
export const Warning = z.enum(WARNINGS);
export const Movement = z.enum(MOVEMENTS);

export const Medicine = z.object({
  name: z.string().min(1),
  form: Form,
  // Whole units only. A half tablet is flagged for a person to handle.
  count: z.number().int().min(1).max(6),
  times: z.array(TimeOfDay).min(1).max(4),
  food: Food,
  days: z.number().int().min(1).max(365).nullable(),
  avoid: z.array(Avoid),
});

export const Exercise = z.object({
  name: z.string().min(1),
  movement: Movement,
  // Target joint angle in degrees, as the prescription states it.
  angle: z.number().min(0).max(180),
  reps: z.number().int().min(1).max(100),
  sets: z.number().int().min(1).max(20),
  timesPerDay: z.number().int().min(1).max(12),
});

export const FollowUp = z.object({
  date: z.string().nullable(), // ISO yyyy-mm-dd when the sheet gives one
  place: z.string().nullable(),
});

export const Regimen = z.object({
  medicines: z.array(Medicine),
  exercises: z.array(Exercise),
  warnings: z.array(Warning),
  followUp: FollowUp.nullable(),
  // Anything on the sheet the schema can't hold. Shown to the user as text, never drawn.
  unparsed: z.array(z.string()),
});

export type TimeOfDay = z.infer<typeof TimeOfDay>;
export type Food = z.infer<typeof Food>;
export type Form = z.infer<typeof Form>;
export type Avoid = z.infer<typeof Avoid>;
export type Warning = z.infer<typeof Warning>;
export type Movement = z.infer<typeof Movement>;
export type Medicine = z.infer<typeof Medicine>;
export type Exercise = z.infer<typeof Exercise>;
export type Regimen = z.infer<typeof Regimen>;

export type Disagreement = { path: string; a: unknown; b: unknown };

export const LANGUAGES = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  es: "Spanish",
  zh: "Chinese",
  ar: "Arabic",
} as const;
export type Lang = keyof typeof LANGUAGES;
