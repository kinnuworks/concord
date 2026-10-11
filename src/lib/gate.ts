import { fetchImage } from "./models";
import { generateTile } from "./generate";
import { readBack, type Verdict } from "./readback";
import { fallbackDataUrl } from "./fallback";
import { tileKey, type TileSpec } from "./tiles";

export type GateEvent =
  | { type: "attempt"; n: number; url: string; seed: number; adapter: boolean }
  | { type: "verdict"; n: number; verdict: Verdict }
  | { type: "accepted"; n: number; url: string; seed: number; source: "generated" | "library" }
  | { type: "fallback"; url: string; reason: string }
  | { type: "error"; message: string };

export type GateResult = {
  key: string;
  spec: TileSpec;
  url: string;
  source: "generated" | "library" | "fallback";
  tries: number;
  log: { n: number; url: string; seed: number; verdict: Verdict }[];
};

// A failed read-back tells the next attempt what went wrong, in plain terms.
function hintFor(t: TileSpec, v: Verdict): string | undefined {
  if (t.kind === "dose") {
    const seen = v.readers.map((r) => r.reading?.count).filter((c) => typeof c === "number");
    return `there must be exactly ${t.count}, not ${seen.join(" or ") || "any other number"}, spaced well apart`;
  }
  if (t.kind === "unit") return "exactly one, alone, nothing beside it";
  if (t.kind === "time") return "make the position of the sun or moon in the sky unmistakable";
  if (t.kind === "exercise") return "one person only, two arms and two legs, simple figure";
  return "one clear subject, nothing else";
}

export async function* runGate(
  spec: TileSpec,
  opts: { maxTries?: number; adapter?: boolean; hint?: string } = {},
): AsyncGenerator<GateEvent, GateResult> {
  const maxTries = opts.maxTries ?? 3;
  const log: GateResult["log"] = [];
  let hint = opts.hint;

  for (let n = 1; n <= maxTries; n++) {
    let gen;
    try {
      gen = await generateTile(spec, { adapter: opts.adapter, hint });
    } catch (e) {
      yield { type: "error", message: e instanceof Error ? e.message : String(e) };
      break;
    }
    yield { type: "attempt", n, url: gen.url, seed: gen.seed, adapter: gen.adapter };

    const verdict = await readBack(spec, await fetchImage(gen.url));
    log.push({ n, url: gen.url, seed: gen.seed, verdict });
    yield { type: "verdict", n, verdict };

    if (verdict.pass) {
      yield { type: "accepted", n, url: gen.url, seed: gen.seed, source: "generated" };
      return { key: tileKey(spec), spec, url: gen.url, source: "generated", tries: n, log };
    }
    hint = hintFor(spec, verdict);
  }

  const url = fallbackDataUrl(spec);
  yield { type: "fallback", url, reason: `no attempt passed the read-back in ${maxTries} tries` };
  return { key: tileKey(spec), spec, url, source: "fallback", tries: log.length, log };
}

export async function gateOnce(spec: TileSpec, opts?: Parameters<typeof runGate>[1]): Promise<GateResult> {
  const it = runGate(spec, opts);
  for (;;) {
    const step = await it.next();
    if (step.done) return step.value;
  }
}
