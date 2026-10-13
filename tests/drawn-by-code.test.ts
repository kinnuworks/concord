import assert from "node:assert/strict";
import { test } from "node:test";
import { exerciseSvg, fallbackDataUrl, fallbackSvg } from "../src/lib/fallback";
import { AVOIDS, FORMS, MOVEMENTS, TIMES, WARNINGS } from "../src/lib/schema";
import type { TileSpec } from "../src/lib/tiles";

const count = (svg: string, tag: string) => (svg.match(new RegExp(`<${tag}\\b`, "g")) ?? []).length;

test("every exercise is drawn with the prescribed angle written on it", () => {
  for (const movement of MOVEMENTS) {
    for (const angle of [30, 45, 90, 120]) {
      const svg = exerciseSvg(movement, angle);
      assert.ok(svg.startsWith("<svg"), movement);
      assert.ok(svg.includes(`${angle}°`), `${movement} at ${angle}`);
    }
  }
});

test("a different angle gives a different drawing", () => {
  for (const movement of MOVEMENTS) assert.notEqual(exerciseSvg(movement, 30), exerciseSvg(movement, 90));
});

test("there is a code-drawn pictogram for every picture a card can need", () => {
  const specs: TileSpec[] = [
    ...FORMS.map((form): TileSpec => ({ kind: "unit", form })),
    ...TIMES.map((time): TileSpec => ({ kind: "time", time })),
    { kind: "meal" },
    ...AVOIDS.map((item): TileSpec => ({ kind: "avoid", item })),
    ...WARNINGS.map((sign): TileSpec => ({ kind: "warning", sign })),
  ];
  for (const spec of specs) {
    const svg = fallbackSvg(spec);
    assert.ok(svg.startsWith("<svg") && svg.trim().endsWith("</svg>"), JSON.stringify(spec));
    assert.ok(fallbackDataUrl(spec).startsWith("data:image/svg+xml"));
  }
});

test("a code-drawn dose shows exactly the number of units asked for", () => {
  for (const n of [1, 2, 3, 4, 5, 6]) {
    const one = fallbackSvg({ kind: "dose", form: "tablet", count: 1 });
    const many = fallbackSvg({ kind: "dose", form: "tablet", count: n });
    const perUnit = count(one, "circle") || count(one, "rect") || count(one, "ellipse");
    const total = count(many, "circle") || count(many, "rect") || count(many, "ellipse");
    assert.equal(total, perUnit * n, `count ${n}`);
  }
});
