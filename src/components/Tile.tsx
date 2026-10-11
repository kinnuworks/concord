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

type TileOpts = { fresh?: boolean; adapter?: boolean; run: number };

function tileId(spec: TileSpec, opts: TileOpts) {
  return `${opts.run}|${opts.fresh ? 1 : 0}|${opts.adapter ?? "auto"}|${tileKey(spec)}`;
}

export function useTile(spec: TileSpec, opts: TileOpts) {
  const id = tileId(spec, opts);

  useEffect(() => {
    void start(id, spec, { fresh: opts.fresh, adapter: opts.adapter });
    // The id already encodes the spec, so the spec object itself is left out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, opts.fresh, opts.adapter]);

  const subscribe = useCallback(
    (fn: () => void) => {
      // The entry may be created just after the first subscription, so look once more for it.
      const entry = store.get(id);
      if (entry) entry.subs.add(fn);
      else
        queueMicrotask(() => {
          store.get(id)?.subs.add(fn);
          fn();
        });
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

export type TileSummary = { total: number; ready: number; redrawn: number; fallback: number; failed: number };

// One line of status for a whole card: how many of its pictures are through the check.
export function useTileSummary(specs: TileSpec[], opts: TileOpts): TileSummary {
  const ids = [...new Set(specs.map((s) => tileId(s, opts)))];
  const idKey = ids.join(",");

  const subscribe = useCallback(
    (fn: () => void) => {
      let alive = true;
      const attach = () => {
        if (!alive) return;
        let missing = false;
        for (const id of idKey.split(",")) {
          const entry = store.get(id);
          if (entry) entry.subs.add(fn);
          else missing = true;
        }
        fn();
        if (missing) setTimeout(attach, 150);
      };
      attach();
      return () => {
        alive = false;
        for (const id of idKey.split(",")) store.get(id)?.subs.delete(fn);
      };
    },
    [idKey],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      let ready = 0, redrawn = 0, fallback = 0, failed = 0;
      for (const id of idKey.split(",")) {
        const st = store.get(id)?.state;
        if (!st) continue;
        if (st.status === "accepted" || st.status === "fallback") ready += 1;
        if (st.status === "fallback") fallback += 1;
        if (st.status === "error") failed += 1;
        redrawn += st.attempts.filter((a) => a.verdict && !a.verdict.pass).length;
      }
      return `${ready}|${redrawn}|${fallback}|${failed}`;
    },
    () => "0|0|0|0",
  );
  const [ready, redrawn, fallback, failed] = snapshot.split("|").map(Number);
  return { total: ids.length, ready, redrawn, fallback, failed };
}

export function TileView({
  state,
  size = 128,
  count,
  crossed,
  alt,
}: {
  state: TileState;
  size?: number;
  count?: number;
  crossed?: boolean;
  alt: string;
}) {
  const current = state.url ?? state.attempts[state.attempts.length - 1]?.url;
  const settled = state.status === "accepted" || state.status === "fallback";
  return (
    <span className="pic" style={{ "--pic": `${size}px` } as React.CSSProperties} data-status={state.status}>
      {current ? (
        // Tiles come from several hosts and from data URLs, so a plain img is used.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pic__img" src={current} alt={alt} data-settled={settled} />
      ) : (
        <span className="pic__wait" role="img" aria-label="Drawing the picture" />
      )}
      {crossed && settled ? (
        <svg className="pic__cross" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="7" />
          <line x1="18" y1="18" x2="82" y2="82" stroke="currentColor" strokeWidth="7" />
        </svg>
      ) : null}
      {count !== undefined ? (
        <span className="pic__count" aria-hidden>
          {count}
        </span>
      ) : null}
      {state.status === "error" ? <span className="pic__error">{state.message}</span> : null}
    </span>
  );
}

// A dose is one checked unit picture repeated by code, so the number shown is exact.
export function DoseView({ state, count, size = 120, alt }: { state: TileState; count: number; size?: number; alt: string }) {
  const current = state.url ?? state.attempts[state.attempts.length - 1]?.url;
  const settled = state.status === "accepted" || state.status === "fallback";
  return (
    <span
      className="pic dose"
      style={{ "--pic": `${size}px` } as React.CSSProperties}
      data-status={state.status}
      data-n={count}
      role="img"
      aria-label={alt}
    >
      {current ? (
        Array.from({ length: count }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} className="pic__img" src={current} alt="" data-settled={settled} />
        ))
      ) : (
        <span className="pic__wait" />
      )}
      <span className="pic__count" aria-hidden>
        {count}
      </span>
    </span>
  );
}
