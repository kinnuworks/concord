import { promises as fs } from "node:fs";
import path from "node:path";
import manifest from "@/data/library.json";
import type { GateResult } from "./gate";

// Tiles that already passed the read-back are kept and reused. "Morning" is drawn and
// checked once, then appears on every card that needs it.
export type LibraryEntry = {
  file: string; // path under /public
  seed: number;
  adapter: boolean;
  tries: number;
  checkedBy: string[];
};

const entries = manifest as Record<string, LibraryEntry>;

export function libraryTile(key: string): LibraryEntry | null {
  return entries[key] ?? null;
}

export function librarySize(): number {
  return Object.keys(entries).length;
}

// Local development only: Vercel's filesystem is read-only at runtime.
export async function saveToLibrary(result: GateResult, adapter: boolean): Promise<void> {
  if (process.env.READBACK_SAVE_TILES !== "1" || result.source !== "generated") return;
  const res = await fetch(result.url);
  if (!res.ok) return;
  const file = `/tiles/${result.key}.png`;
  const root = process.cwd();
  await fs.mkdir(path.join(root, "public", "tiles"), { recursive: true });
  await fs.writeFile(path.join(root, "public", file), Buffer.from(await res.arrayBuffer()));
  const last = result.log[result.log.length - 1];
  entries[result.key] = {
    file,
    seed: last?.seed ?? 0,
    adapter: last?.adapter ?? adapter,
    tries: result.tries,
    checkedBy: last?.verdict.readers.map((r) => r.reader) ?? [],
  };
  await fs.writeFile(
    path.join(root, "src", "data", "library.json"),
    JSON.stringify(entries, null, 2) + "\n",
  );
}
