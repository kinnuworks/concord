import type { Avoid, Form, Movement, TimeOfDay, Warning } from "./schema";

// A tile is one small picture that shows one fact. Cards are assembled from tiles
// by code, so the order and the numbers never depend on the image model.
export type TileSpec =
  | { kind: "time"; time: TimeOfDay }
  | { kind: "dose"; form: Form; count: number }
  | { kind: "meal" }
  | { kind: "avoid"; item: Avoid }
  | { kind: "warning"; sign: Warning }
  | { kind: "exercise"; movement: Movement; angle: number };

export function tileKey(t: TileSpec): string {
  switch (t.kind) {
    case "time":
      return `time-${t.time}`;
    case "dose":
      return `dose-${t.form}-${t.count}`;
    case "meal":
      return "meal";
    case "avoid":
      return `avoid-${t.item}`;
    case "warning":
      return `warning-${t.sign}`;
    case "exercise":
      return `exercise-${t.movement}-${Math.round(t.angle)}`;
  }
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

const TIME_SCENE: Record<TimeOfDay, string> = {
  morning: "a sun rising over a low horizon, half of the sun visible, pale morning sky",
  afternoon: "a full round sun high in the middle of a clear sky",
  evening: "a sun setting behind a low horizon, orange sky",
  night: "a crescent moon and a few stars in a dark sky",
};

const FORM_OBJECT: Record<Form, (n: number) => string> = {
  tablet: (n) => `${NUMBER_WORDS[n]} round pale-blue tablet${n > 1 ? "s" : ""} with a score line`,
  capsule: (n) => `${NUMBER_WORDS[n]} red-and-white capsule${n > 1 ? "s" : ""}`,
  spoon: (n) => `${NUMBER_WORDS[n]} spoon${n > 1 ? "s" : ""} filled with liquid medicine`,
  drops: (n) => `a dropper releasing ${NUMBER_WORDS[n]} separate drop${n > 1 ? "s" : ""}`,
  puff: (n) => `an inhaler with ${NUMBER_WORDS[n]} small puff cloud${n > 1 ? "s" : ""} beside it`,
};

const AVOID_OBJECT: Record<Avoid, string> = {
  alcohol: "a wine glass and a beer bottle",
  driving: "a car seen from the side",
  sunlight: "a person standing under a strong sun with rays",
  smoking: "a lit cigarette with smoke",
  heavy_lifting: "a person lifting a heavy box",
  dairy: "a glass of milk and a wedge of cheese",
};

const WARNING_SCENE: Record<Warning, string> = {
  fever: "a person with a thermometer in the mouth and a flushed face",
  bleeding: "a bandaged arm with red drops falling from it",
  swelling: "two legs side by side, one clearly swollen and larger",
  chest_pain: "a person holding the chest with both hands, pain lines at the chest",
  breathlessness: "a person bent forward breathing hard, short breath marks at the mouth",
  severe_pain: "a person grimacing and clutching the stomach, pain lines",
  vomiting: "a person leaning over a bowl being sick",
  rash: "an arm covered in red spots",
  dizziness: "a person holding the head with small spirals circling above it",
  wound_discharge: "a stitched wound with yellow fluid leaking from it",
};

const EXERCISE_SCENE: Record<Movement, (angle: number) => string> = {
  knee_bend: (a) =>
    `a person lying on the back, one leg flat, the other knee bent so the angle at the knee is ${a} degrees, seen from the side`,
  straight_leg_raise: (a) =>
    `a person lying on the back, one leg flat, the other leg held straight and raised ${a} degrees off the floor, seen from the side`,
  arm_raise_front: (a) =>
    `a person standing, seen from the side, one straight arm raised forward ${a} degrees from the body`,
  arm_raise_side: (a) =>
    `a person standing, seen from the front, one straight arm raised out to the side ${a} degrees from the body`,
  elbow_bend: (a) =>
    `a person standing, seen from the side, upper arm by the body and the elbow bent so the angle at the elbow is ${a} degrees`,
};

export const STYLE_TRIGGER = "rdbk pictogram";

const STYLE =
  "flat vector pictogram icon, bold thick black outlines, solid flat colours, simple rounded shapes, pure white background, centred with wide margins, no shadows, no gradients, no texture, no text, no letters, no numbers";

export function tilePrompt(t: TileSpec, useTrigger: boolean): string {
  const subject = (() => {
    switch (t.kind) {
      case "time":
        return TIME_SCENE[t.time];
      case "dose":
        return `exactly ${FORM_OBJECT[t.form](t.count)} laid out in a row on a plain surface, each one fully visible and separate, nothing else in the picture`;
      case "meal":
        return "a plate of food with a fork and a spoon beside it";
      case "avoid":
        return AVOID_OBJECT[t.item];
      case "warning":
        return WARNING_SCENE[t.sign];
      case "exercise":
        return `${EXERCISE_SCENE[t.movement](Math.round(t.angle))}, whole body in frame, simple figure, limbs clearly separated`;
    }
  })();
  return `${useTrigger ? `${STYLE_TRIGGER}, ` : ""}${subject}, ${STYLE}`;
}
