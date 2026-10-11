import { falClient, MODELS } from "./models";
import { tilePrompt, type TileSpec } from "./tiles";

export type Generated = { url: string; seed: number; prompt: string; adapter: boolean };

type FalImageResult = { data: { images: { url: string }[]; seed: number } };

// The adapter URL is written to this variable once training finishes.
export function adapterUrl(): string | null {
  return process.env.READBACK_ADAPTER_URL || null;
}

export async function generateTile(
  t: TileSpec,
  opts: { seed?: number; adapter?: boolean; hint?: string } = {},
): Promise<Generated> {
  const lora = opts.adapter === false ? null : adapterUrl();
  const prompt = tilePrompt(t, lora !== null) + (opts.hint ? `, ${opts.hint}` : "");
  const res = (await falClient().subscribe(MODELS.falImage, {
    input: {
      prompt,
      image_size: "square",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: "png",
      ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
      ...(lora ? { loras: [{ path: lora, scale: 1 }] } : {}),
    },
  })) as unknown as FalImageResult;
  const img = res.data.images[0];
  if (!img) throw new Error("image model returned nothing");
  return { url: img.url, seed: res.data.seed, prompt, adapter: lora !== null };
}
