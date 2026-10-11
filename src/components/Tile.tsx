"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { GateEvent } from "@/lib/gate";
import type { Verdict } from "@/lib/readback";
import { tileKey, type TileSpec } from "@/lib/tiles";

export type Attempt = { n: number; url: string; verdict?: Verdict };
export type TileState = {
  status: "idle" | "working" | "accepted" | "fallback" | "error";
  url?: string;
  source?: "generated" | "library" | "fallback";
  attempts: Attempt[];
  message?: string;
};

async function* readEvents(res: Response): AsyncGenerator<GateEvent> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) yield JSON.parse(line) as GateEvent;
    }
  }
}

// One request per tile per run. A card sheet shows the same tile many times (every
// "after food" row has the meal picture), and they all share a single drawing and check.
type Entry = { state: TileState; subs: Set<() => void> };
const store = new Map<string, Entry>();
const IDLE: TileState = { status: "idle", attempts: [] };

function update(id: string, change: (s: TileState) => TileState) {
  const entry = store.get(id);
  if (!entry) return;
  entry.state = change(entry.state);
  entry.subs.forEach((fn) => fn());
}

async function start(id: string, spec: TileSpec, opts: { fresh?: boolean; adapter?: boolean }) {
  if (store.has(id)) return;
  store.set(id, { state: { status: "working", attempts: [] }, subs: new Set() });
  try {
    const res = await fetch("/api/tile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ spec, fresh: opts.fresh, adapter: opts.adapter }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(err?.error ?? `Request failed (${res.status})`);
    }
    for await (const e of readEvents(res)) {
      update(id, (s) => {
        switch (e.type) {
          case "attempt":
            return { ...s, attempts: [...s.attempts, { n: e.n, url: e.url }] };
          case "verdict":
            return { ...s, attempts: s.attempts.map((a) => (a.n === e.n ? { ...a, verdict: e.verdict } : a)) };
          case "accepted":
            return { ...s, status: "accepted", url: e.url, source: e.source };
          case "fallback":
            return { ...s, status: "fallback", url: e.url, source: "fallback", message: e.reason };
          case "error":
            return { ...s, status: "error", message: e.message };
        }
      });
    }
  } catch (e) {
    update(id, (s) => ({ ...s, status: "error", message: e instanceof Error ? e.message : String(e) }));
  }
}

export function useTile(spec: TileSpec, opts: { fresh?: boolean; adapter?: boolean; run: number }) {
  const id = `${opts.run}|${opts.fresh ? 1 : 0}|${opts.adapter ?? "auto"}|${tileKey(spec)}`;

  useEffect(() => {
    void start(id, spec, { fresh: opts.fresh, adapter: opts.adapter });
    // The id already encodes the spec, so the spec object itself is left out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, opts.fresh, opts.adapter]);

  const subscribe = useCallback(
    (fn: () => void) => {
      // The entry may be created just after the first subscription, so poll once for it.
      let entry = store.get(id);
      const attach = () => {
        entry = store.get(id);
        entry?.subs.add(fn);
        fn();
      };
      if (entry) entry.subs.add(fn);
      else queueMicrotask(attach);
      return () => {
        store.get(id)?.subs.delete(fn);
      };
    },
    [id],
  );
  return useSyncExternalStore(
    subscribe,
    () => store.get(id)?.state ?? IDLE,
    () => IDLE,
  );
}

export function TileView({
  state,
  size = 128,
  badge,
  crossed,
  alt,
  caption,
}: {
  state: TileState;
  size?: number;
  badge?: string;
  crossed?: boolean;
  alt: string;
  caption?: string;
}) {
  const rejected = state.attempts.filter((a) => a.verdict && !a.verdict.pass);
  const current = state.url ?? state.attempts[state.attempts.length - 1]?.url;
  return (
    <figure className="pic" style={{ width: size }}>
      <div className="pic__frame" style={{ width: size, height: size }} data-status={state.status}>
        {current ? (
          // Tiles come from several hosts and from data URLs, so a plain img is used.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={alt} width={size} height={size} />
        ) : (
          <span className="pic__wait" aria-label="Drawing" />
        )}
        {crossed && state.url ? (
          <svg className="pic__cross" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" />
            <line x1="19" y1="19" x2="81" y2="81" stroke="currentColor" strokeWidth="8" />
          </svg>
        ) : null}
        {badge ? <span className="pic__count">{badge}</span> : null}
      </div>
      {caption ? <span className="word pic__caption">{caption}</span> : null}
      <figcaption className="pic__note">
        {state.status === "working" && state.attempts.length > 0 ? `Checking try ${state.attempts.length}` : null}
        {state.status === "working" && state.attempts.length === 0 ? "Drawing" : null}
        {state.status === "accepted" && rejected.length > 0
          ? `Passed on try ${rejected.length + 1}, ${rejected.length} rejected`
          : null}
        {state.status === "error" ? state.message : null}
      </figcaption>
    </figure>
  );
}
