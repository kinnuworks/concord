import type { Exercise, Medicine, Regimen, TimeOfDay, Warning } from "./schema";
import { tileKey, type TileSpec } from "./tiles";

// A card is a fixed layout of tiles. Everything about order, arrows, numbers and the
// calendar is decided here from the parsed data, never by the image model.

export type DoseRow = {
  time: TimeOfDay;
  timeTile: TileSpec;
  doseTile: TileSpec;
  // Where the meal tile sits relative to the dose: before it, after it, joined, or absent.
  meal: "before_dose" | "after_dose" | "with_dose" | "none";
  count: number;
};

export type MedicineCard = {
  kind: "medicine";
  id: string;
  medicine: Medicine;
  rows: DoseRow[];
  days: number | null;
  avoid: TileSpec[];
};

export type ExerciseCard = {
  kind: "exercise";
  id: string;
  exercise: Exercise;
  tile: TileSpec;
};

export type WarningCard = { kind: "warning"; id: string; signs: { sign: Warning; tile: TileSpec }[] };
export type FollowUpCard = { kind: "followup"; id: string; date: string | null; place: string | null };
export type Card = MedicineCard | ExerciseCard | WarningCard | FollowUpCard;

const MEAL_POSITION = {
  // "After food" means the meal comes first, so the meal tile sits before the dose.
  after_food: "before_dose",
  before_food: "after_dose",
  with_food: "with_dose",
  any: "none",
} as const;

export function planMedicine(m: Medicine, index: number): MedicineCard {
  return {
    kind: "medicine",
    id: `med-${index}`,
    medicine: m,
    rows: m.times.map((time) => ({
      time,
      timeTile: { kind: "time", time },
      doseTile: { kind: "dose", form: m.form, count: m.count },
      meal: MEAL_POSITION[m.food],
      count: m.count,
    })),
    days: m.days,
    avoid: m.avoid.map((item) => ({ kind: "avoid", item })),
  };
}

export function planCards(r: Regimen): Card[] {
  const cards: Card[] = r.medicines.map(planMedicine);
  r.exercises.forEach((e, i) =>
    cards.push({
      kind: "exercise",
      id: `ex-${i}`,
      exercise: e,
      tile: { kind: "exercise", movement: e.movement, angle: e.angle },
    }),
  );
  if (r.warnings.length) {
    cards.push({
      kind: "warning",
      id: "warnings",
      signs: r.warnings.map((sign) => ({ sign, tile: { kind: "warning", sign } })),
    });
  }
  if (r.followUp && (r.followUp.date || r.followUp.place)) {
    cards.push({ kind: "followup", id: "followup", date: r.followUp.date, place: r.followUp.place });
  }
  return cards;
}

export function tilesFor(cards: Card[]): TileSpec[] {
  const seen = new Map<string, TileSpec>();
  const add = (t: TileSpec) => seen.set(tileKey(t), t);
  for (const c of cards) {
    if (c.kind === "medicine") {
      for (const row of c.rows) {
        add(row.timeTile);
        add(row.doseTile);
        if (row.meal !== "none") add({ kind: "meal" });
      }
      c.avoid.forEach(add);
    } else if (c.kind === "exercise") add(c.tile);
    else if (c.kind === "warning") c.signs.forEach((s) => add(s.tile));
  }
  return [...seen.values()];
}
