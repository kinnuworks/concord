// Draws the standing set of tiles through the read-back gate and saves the ones that pass.
// Run: READBACK_SAVE_TILES=1 pnpm tsx --env-file=.env.local scripts/library.ts [kind ...]
import { AVOIDS, FORMS, TIMES, WARNINGS } from "../src/lib/schema";
import { gateOnce } from "../src/lib/gate";
import { saveToLibrary } from "../src/lib/library";
import { tileKey, type TileSpec } from "../src/lib/tiles";

const ALL: TileSpec[] = [
  ...FORMS.map((form): TileSpec => ({ kind: "unit", form })),
  ...TIMES.map((time): TileSpec => ({ kind: "time", time })),
  { kind: "meal" },
  ...AVOIDS.map((item): TileSpec => ({ kind: "avoid", item })),
  ...WARNINGS.map((sign): TileSpec => ({ kind: "warning", sign })),
];

async function main() {
  const only = process.argv.slice(2);
  const specs = ALL.filter((s) => only.length === 0 || only.includes(s.kind) || only.includes(tileKey(s)));
  const queue = [...specs];
  const rows: string[] = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let spec = queue.shift(); spec; spec = queue.shift()) {
        const r = await gateOnce(spec, { adapter: true, maxTries: 4 });
        await saveToLibrary(r, true);
        rows.push(`${tileKey(spec).padEnd(26)} ${r.source.padEnd(9)} tries ${r.tries}`);
        console.log(rows[rows.length - 1]);
      }
    }),
  );
}
main();
