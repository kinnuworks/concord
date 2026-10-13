import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import OpenAI from "openai";
import { fal } from "@fal-ai/client";

export const MODELS = {
  geminiFast: "gemini-3.5-flash-lite",
  gemini: "gemini-3.8-flash",
  openaiFast: "gpt-6-luna",
  routerVision: "openrouter/router/vision",
  routerText: "openrouter/router",
  routerGoogle: "google/gemini-2.5-flash",
  falImage: "fal-ai/flux-lora",
  falTrain: "fal-ai/flux-lora-fast-training",
} as const;

let gemini: GoogleGenAI | null = null;
let openai: OpenAI | null = null;
let falReady = false;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function geminiClient() {
  gemini ??= new GoogleGenAI({ apiKey: need("GEMINI_API_KEY") });
  return gemini;
}

export function openaiClient() {
  openai ??= new OpenAI({ apiKey: need("OPENAI_API_KEY") });
  return openai;
}

export function falClient() {
  if (!falReady) {
    fal.config({ credentials: need("FAL_KEY") });
    falReady = true;
  }
  return fal;
}

export type ImageInput = { mime: string; base64: string };

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("model returned no JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isBusy(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /\b(429|500|502|503|504)\b|UNAVAILABLE|overloaded|high demand|rate limit/i.test(msg);
}

// Retries a busy service with a short backoff, then gives the caller's fallback a turn.
async function withRetry<T>(run: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (const wait of [0, 700]) {
    if (wait) await sleep(wait);
    try {
      return await run();
    } catch (e) {
      last = e;
      if (!isBusy(e)) throw e;
    }
  }
  if (fallback) return fallback();
  throw last;
}

// Google's lighter models, in the order they are tried. Each has its own daily allowance, so
// when one is used up the next takes over and the second reader stays a Google model.
const GOOGLE_LIGHT = [MODELS.geminiFast, "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemma-4-26b-a4b-it"];
const usedUp = new Map<string, number>();

async function googleLight(prompt: string, images: ImageInput[]): Promise<unknown> {
  let last: unknown;
  for (const model of GOOGLE_LIGHT) {
    // A model that hit its daily limit is skipped for an hour, then tried again.
    if ((usedUp.get(model) ?? 0) > Date.now()) continue;
    try {
      return await geminiOnce(prompt, images, model);
    } catch (e) {
      last = e;
      // Over its daily limit: skip it for an hour. Busy right now: try the next one this time.
      if (/PerDay/.test(e instanceof Error ? e.message : String(e))) usedUp.set(model, Date.now() + 60 * 60 * 1000);
      else if (!isBusy(e)) throw e;
    }
  }
  throw last ?? new Error("every Google reader is busy or over its daily limit");
}

async function geminiOnce(prompt: string, images: ImageInput[], model: string): Promise<unknown> {
  const res = await geminiClient().models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          ...images.map((i) => ({ inlineData: { mimeType: i.mime, data: i.base64 } })),
          { text: prompt },
        ],
      },
    ],
    config: {
      httpOptions: { timeout: 25000 },
      // Gemma has no JSON mode. Its reply is still parsed as JSON below.
      ...(model.startsWith("gemma") ? {} : { responseMimeType: "application/json" }),
      temperature: 0,
      // Reading a pictogram or a short sheet needs little deliberation, and low keeps it fast.
      ...(model === MODELS.gemini ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
    },
  });
  return extractJson(res.text ?? "");
}

export async function geminiJson(
  prompt: string,
  images: ImageInput[] = [],
  model: string = MODELS.gemini,
): Promise<unknown> {
  // If the direct service is busy or over its quota, the same vendor's model is reached
  // through the router instead, so one reader's bad minute doesn't stop the sheet being read.
  return withRetry(
    () => (model === MODELS.geminiFast ? googleLight(prompt, images) : geminiOnce(prompt, images, model)),
    async () => {
      try {
        return await (images.length ? googleVisionJson(prompt, images) : googleTextJson(prompt));
      } catch {
        // Last resort: the vendor's lighter models, each with its own allowance.
        return googleLight(prompt, images);
      }
    },
  );
}

type RouterResult = { data: { output?: string; error?: string | null } };

// The router is an extra path, so it gets little time, and after a failure it is left alone
// for ten minutes so a request does not wait on it again.
let routerDownUntil = 0;
async function viaRouter<T>(run: () => Promise<T>): Promise<T> {
  if (Date.now() < routerDownUntil) throw new Error("router unavailable");
  try {
    return await Promise.race([
      run(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("router timed out")), 8000)),
    ]);
  } catch (e) {
    routerDownUntil = Date.now() + 10 * 60 * 1000;
    throw e;
  }
}

// The Google reader for pictures. It goes through fal's model router, which has no
// free-tier request cap, so a busy hour cannot be mistaken for an unreadable picture.
export async function googleVisionJson(prompt: string, images: ImageInput[]): Promise<unknown> {
  try {
    return await viaRouter(async () => {
      const res = (await falClient().subscribe(MODELS.routerVision, {
        input: {
          model: MODELS.routerGoogle,
          prompt,
          temperature: 0,
          image_urls: images.map((i) => `data:${i.mime};base64,${i.base64}`),
        },
      })) as unknown as RouterResult;
      if (res.data.error) throw new Error(res.data.error);
      return extractJson(res.data.output ?? "");
    });
  } catch {
    // The router is unreachable: ask the same vendor directly instead.
    return withRetry(() => googleLight(prompt, images));
  }
}

export async function googleTextJson(prompt: string): Promise<unknown> {
  return viaRouter(async () => {
    const res = (await falClient().subscribe(MODELS.routerText, {
      input: { model: MODELS.routerGoogle, prompt, temperature: 0 },
    })) as unknown as RouterResult;
    if (res.data.error) throw new Error(res.data.error);
    return extractJson(res.data.output ?? "");
  });
}

export async function openaiJson(
  prompt: string,
  images: ImageInput[] = [],
  model: string = MODELS.openaiFast,
  effort?: "low",
): Promise<unknown> {
  return withRetry(async () => {
    const res = await openaiClient().chat.completions.create({
      model,
      // Long lists of names need little deliberation, and low keeps them inside the rate limit.
      ...(effort ? { reasoning_effort: effort } : {}),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...images.map((i) => ({
              type: "image_url" as const,
              image_url: { url: `data:${i.mime};base64,${i.base64}` },
            })),
          ],
        },
      ],
    });
    return extractJson(res.choices[0]?.message?.content ?? "");
  });
}

export async function fetchImage(url: string): Promise<ImageInput> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { mime, base64 };
}
