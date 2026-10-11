import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { fal } from "@fal-ai/client";

export const MODELS = {
  geminiFast: "gemini-3.5-flash-lite",
  gemini: "gemini-3.8-flash",
  openaiFast: "gpt-6-luna",
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

export async function geminiJson(
  prompt: string,
  images: ImageInput[] = [],
  model: string = MODELS.gemini,
): Promise<unknown> {
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
    config: { responseMimeType: "application/json", temperature: 0 },
  });
  return extractJson(res.text ?? "");
}

export async function openaiJson(
  prompt: string,
  images: ImageInput[] = [],
  model: string = MODELS.openaiFast,
): Promise<unknown> {
  const res = await openaiClient().chat.completions.create({
    model,
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
}

export async function fetchImage(url: string): Promise<ImageInput> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { mime, base64 };
}
