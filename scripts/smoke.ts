// One call to each service, to confirm keys and model names before a long run.
// Run: pnpm tsx --env-file=.env.local scripts/smoke.ts
import { geminiJson, openaiJson, fetchImage } from "../src/lib/models";
import { generateTile } from "../src/lib/generate";
import { readBack } from "../src/lib/readback";
import { parseSheet } from "../src/lib/parse";
import type { TileSpec } from "../src/lib/tiles";

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const out = await fn();
    console.log(`ok   ${name} (${Date.now() - t0} ms)`);
    return out;
  } catch (e) {
    console.log(`FAIL ${name}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function main() {
  const ask = 'Reply with the JSON object {"ok": true}.';
  await step("gemini text", () => geminiJson(ask));
  await step("openai text", () => openaiJson(ask));

  const parsed = await step("parse", () =>
    parseSheet({ text: "Amoxicillin 500 mg: take 2 capsules twice a day after meals for 5 days. Do not drink alcohol." }),
  );
  if (parsed) console.log(JSON.stringify(parsed.regimen.medicines), "disagreements:", parsed.disagreements.length);

  const spec: TileSpec = { kind: "dose", form: "tablet", count: 3 };
  const tile = await step("fal image", () => generateTile(spec, { adapter: false }));
  if (tile) {
    console.log(tile.url);
    const verdict = await step("read-back", async () => readBack(spec, await fetchImage(tile.url)));
    if (verdict) console.log(JSON.stringify(verdict.readers), "pass:", verdict.pass);
  }
}

main();
