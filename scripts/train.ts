// Trains the pictogram style adapter and records where its weights are.
// Run: pnpm tsx --env-file=.env.local scripts/train.ts
import { readFileSync, writeFileSync } from "node:fs";
import { falClient, MODELS } from "../src/lib/models";
import { STYLE_TRIGGER } from "../src/lib/tiles";

type TrainResult = { data: { diffusers_lora_file: { url: string }; config_file: { url: string } }; requestId: string };

async function main() {
  const fal = falClient();
  const zip = readFileSync(new URL("../training/dataset.zip", import.meta.url));
  const archive = await fal.storage.upload(new File([zip], "dataset.zip", { type: "application/zip" }));
  console.log("uploaded", archive);

  const steps = Number(process.env.TRAIN_STEPS ?? 1000);
  const t0 = Date.now();
  const res = (await fal.subscribe(MODELS.falTrain, {
    input: { images_data_url: archive, trigger_word: STYLE_TRIGGER, steps, is_style: true, create_masks: false },
    logs: true,
    onQueueUpdate: (u) => {
      if (u.status === "IN_PROGRESS") {
        const last = u.logs?.[u.logs.length - 1]?.message;
        if (last) console.log(`${Math.round((Date.now() - t0) / 1000)}s`, last.slice(0, 120));
      }
    },
  })) as unknown as TrainResult;

  const record = {
    url: res.data.diffusers_lora_file.url,
    config: res.data.config_file.url,
    requestId: res.requestId,
    base: "FLUX.1 [dev]",
    trainer: MODELS.falTrain,
    steps,
    images: 70,
    source: "OpenMoji 15 (CC BY-SA 4.0), 70 pictograms with written captions",
    seconds: Math.round((Date.now() - t0) / 1000),
    trainedAt: new Date().toISOString(),
  };
  writeFileSync(new URL("../src/data/adapter.json", import.meta.url), JSON.stringify(record, null, 2) + "\n");
  console.log(JSON.stringify(record, null, 2));
}

main().catch((e) => {
  console.error("training failed:", e instanceof Error ? e.message : e, JSON.stringify((e as { body?: unknown }).body ?? "").slice(0, 600));
  process.exit(1);
});
