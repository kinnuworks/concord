// Re-checks every saved library picture with the current read-back. A picture that no
// longer passes is redrawn through the gate, or dropped so the card falls back to code.
// Run: READBACK_SAVE_TILES=1 pnpm tsx --env-file=.env.local scripts/audit-library.ts [key ...]
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { AVOIDS, FORMS, TIMES, WARNINGS } from "../src/lib/schema";
import { gateOnce } from "../src/lib/gate";
import { readBack } from "../src/lib/readback";
import { tileKey, type TileSpec } from "../src/lib/tiles";

const root = new URL("../", import.meta.url);
const ALL: TileSpec[] = [
  ...FORMS.map((form): TileSpec => ({ kind: "unit", form })),
  ...TIMES.map((time): TileSpec => ({ kind: "time", time })),
  { kind: "meal" },
  ...AVOIDS.map((item): TileSpec => ({ kind: "avoid", item })),
  ...WARNINGS.map((sign): TileSpec => ({ kind: "warning", sign })),
];
type Entry = { file: string; seed: number; adapter: boolean; tries: number; checkedBy: string[] };

async function main() {
  const force = new Set(process.argv.slice(2));
  const manifestFile = new URL("src/data/library.json", root);
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as Record<string, Entry>;
  const queue = [...ALL];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let spec = queue.shift(); spec; spec = queue.shift()) {
        const key = tileKey(spec);
        const path = new URL(`public/tiles/${key}.png`, root);
        let ok = false;
        if (existsSync(path) && manifest[key] && !force.has(key)) {
          const v = await readBack(spec, { mime: "image/png", base64: readFileSync(path).toString("base64") });
          ok = v.pass;
          if (!ok) console.log(`${key}: no longer passes (${v.mismatches.join("; ").slice(0, 150)})`);
        }
        if (ok) {
          console.log(`${key}: kept`);
          continue;
        }
        const r = await gateOnce(spec, { adapter: true, maxTries: 5 });
        if (r.source === "generated") {
          const res = await fetch(r.url);
          writeFileSync(path, Buffer.from(await res.arrayBuffer()));
          const last = r.log[r.log.length - 1];
          manifest[key] = { file: `/tiles/${key}.png`, seed: last.seed, adapter: true, tries: r.tries, checkedBy: last.verdict.readers.map((x) => x.reader) };
          console.log(`${key}: redrawn, passed on try ${r.tries}`);
        } else {
          delete manifest[key];
          if (existsSync(path)) rmSync(path);
          console.log(`${key}: no drawing passed in ${r.tries} tries, card will use the code-drawn picture`);
        }
        writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
      }
    }),
  );
}
main();
