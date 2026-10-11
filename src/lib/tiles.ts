import type { Avoid, Form, Movement, TimeOfDay, Warning } from "./schema";

// A tile is one small picture that shows one fact. Cards are assembled from tiles
// by code, so the order and the numbers never depend on the image model.
export type TileSpec =
  | { kind: "time"; time: TimeOfDay }
  | { kind: "dose"; form: Form; count: number }
  // One unit of a medicine. Cards repeat it by code, so the count is exact.
  | { kind: "unit"; form: Form }
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
    case "unit":
      return `unit-${t.form}`;
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

// Sunrise and sunset look alike, so morning and evening each carry a second cue.
const TIME_SCENE: Record<TimeOfDay, string> = {
  morning: "a yellow sun rising behind green hills in a light blue sky, with a rooster crowing in the foreground",
  afternoon: "a full round yellow sun with rays, high in a bright blue sky",
  evening: "an orange sun sinking into the sea under a purple dusk sky with one early star",
  night: "a crescent moon and a few stars in a dark blue night sky",
};

const FORM_OBJECT: Record<Form, (n: number) => string> = {
  tablet: (n) => `${NUMBER_WORDS[n]} round pale-blue tablet${n > 1 ? "s" : ""} with a score line`,
  capsule: (n) => `${NUMBER_WORDS[n]} medicine capsule${n > 1 ? "s" : ""}, each a short rounded pill lying on its side, one half red and one half white`,
  spoon: (n) => `${NUMBER_WORDS[n]} metal spoon${n > 1 ? "s" : ""} seen from the side, each holding red liquid medicine`,
  drops: (n) => `a dropper releasing ${NUMBER_WORDS[n]} separate drop${n > 1 ? "s" : ""}`,
  puff: (n) => `an inhaler with ${NUMBER_WORDS[n]} small puff cloud${n > 1 ? "s" : ""} beside it`,
};

const FORM_UNIT: Record<Form, string> = {
  tablet: "one small round pink medicine tablet pill seen from above, flat pink colour, thick black outline, with one straight black score line across its middle dividing it in two halves",
  capsule: "one medicine capsule pill lying on its side, one half red and one half white",
  spoon: "one metal spoon seen from the side, holding red liquid medicine",
  drops: "one dropper bottle with a single drop falling from its tip",
  puff: "one L-shaped asthma inhaler drawn with a thick black outline, a blue plastic body with a grey metal canister on top and a mouthpiece at the bottom pointing to the right",
};

const AVOID_OBJECT: Record<Avoid, string> = {
  alcohol: "a wine glass and a beer bottle",
  driving: "a car seen from the side",
  sunlight: "a person sweating under a huge blazing sun with long strong rays, shading the eyes with one hand, red sunburnt skin",
  smoking: "one large lit cigarette lying on its side, white with an orange filter, a glowing red tip and grey smoke curling up",
  heavy_lifting: "a person straining with bent knees to lift a very heavy barbell with big weight plates, sweat drops flying",
  dairy: "a glass of milk and a wedge of cheese",
};

const WARNING_SCENE: Record<Warning, string> = {
  fever: "the face of a sick person with red cheeks and sweat drops, holding a thermometer in the mouth",
  bleeding: "a bandaged arm with red drops falling from it",
  swelling: "one bare foot and ankle swollen up like a balloon, far bigger than a normal foot, red and puffy, with small arrows pointing outward from the swelling",
  chest_pain: "a person holding the chest with both hands, pain lines at the chest",
  breathlessness: "a person clutching the throat with one hand, mouth wide open gasping for air, face turning blue, a pair of lungs drawn on the chest",
  severe_pain: "a person bent forward clutching the belly with both hands, eyes shut tight and teeth clenched in pain, red jagged pain marks at the belly",
  vomiting: "the head and shoulders of a person in profile with the mouth wide open and green vomit pouring out of the mouth into a bucket",
  rash: "an arm covered in red spots",
  dizziness: "a person holding the head with small spirals circling above it",
  wound_discharge: "a forearm with a stitched cut, thick yellow-green pus oozing out of the cut and dripping down",
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
      case "unit":
        return `${FORM_UNIT[t.form]}, alone in the middle of the picture with wide empty margins, nothing else`;
      case "meal":
        return "a white round dinner plate filled with rice and vegetables seen from above, a fork lying to the left of the plate and a knife to the right";
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
