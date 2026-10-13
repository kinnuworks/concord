import { falClient, openaiClient, MODELS } from "./models";
import { tilePrompt, type TileSpec } from "./tiles";

export type Generated = { url: string; seed: number; prompt: string; adapter: boolean };

type FalImageResult = { data: { images: { url: string }[]; seed: number } };

// The adapter URL is written to this variable once training finishes.
export function adapterUrl(): string | null {
  return process.env.READBACK_ADAPTER_URL || null;
}

// How strongly the style adapter is applied. Lower keeps more of the base model's
// grip on the subject; higher pushes harder toward the pictogram look.
export function adapterScale(): number {
  const v = Number(process.env.READBACK_ADAPTER_SCALE);
  return Number.isFinite(v) && v > 0 ? v : 0.6;
}

// Which image model draws. The saved pictures and the evaluation were drawn by FLUX.1 [dev]
// with our adapter (IMAGE_BACKEND=fal). Pictures drawn live on the site come from OpenAI's
// image model, and go through the same read-back before they are shown.
export function imageBackend(): "fal" | "openai" {
  return process.env.IMAGE_BACKEND === "fal" ? "fal" : "openai";
}

async function drawWithOpenAI(t: TileSpec, hint?: string): Promise<Generated> {
  const prompt = tilePrompt(t, false) + (hint ? `, ${hint}` : "");
  const res = await openaiClient().images.generate({
    model: MODELS.openaiImage,
    prompt,
    size: "1024x1024",
    quality: "medium",
    n: 1,
    output_format: "webp",
    output_compression: 82,
  });
  const base64 = res.data?.[0]?.b64_json;
  if (!base64) throw new Error("image model returned nothing");
  // This model takes no seed, so none is recorded.
  return { url: `data:image/webp;base64,${base64}`, seed: 0, prompt, adapter: false };
}

export async function generateTile(
  t: TileSpec,
  opts: { seed?: number; adapter?: boolean; hint?: string } = {},
): Promise<Generated> {
  if (imageBackend() === "openai") return drawWithOpenAI(t, opts.hint);
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
      ...(lora ? { loras: [{ path: lora, scale: adapterScale() }] } : {}),
    },
  })) as unknown as FalImageResult;
  const img = res.data.images[0];
  if (!img) throw new Error("image model returned nothing");
  return { url: img.url, seed: res.data.seed, prompt, adapter: lora !== null };
}
