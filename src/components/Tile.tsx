"use client";

import { useEffect, useRef, useState } from "react";
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

export function useTile(spec: TileSpec, opts: { fresh?: boolean; adapter?: boolean; run: number }) {
  const [state, setState] = useState<TileState>({ status: "idle", attempts: [] });
  const key = tileKey(spec);
  const specRef = useRef(spec);
  specRef.current = spec;

  useEffect(() => {
    let cancelled = false;
    setState({ status: "working", attempts: [] });
    (async () => {
      try {
        const res = await fetch("/api/tile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ spec: specRef.current, fresh: opts.fresh, adapter: opts.adapter }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(err?.error ?? `Request failed (${res.status})`);
        }
        for await (const e of readEvents(res)) {
          if (cancelled) return;
          setState((s) => {
            switch (e.type) {
              case "attempt":
                return { ...s, attempts: [...s.attempts, { n: e.n, url: e.url }] };
              case "verdict":
                return {
                  ...s,
                  attempts: s.attempts.map((a) => (a.n === e.n ? { ...a, verdict: e.verdict } : a)),
                };
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
        if (!cancelled) setState((s) => ({ ...s, status: "error", message: e instanceof Error ? e.message : String(e) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, opts.fresh, opts.adapter, opts.run]);

  return state;
}

export function TileView({
  state,
  size = 128,
  badge,
  crossed,
  alt,
}: {
  state: TileState;
  size?: number;
  badge?: string;
  crossed?: boolean;
  alt: string;
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
      <figcaption className="pic__note">
        {state.status === "working" && state.attempts.length > 0 ? `Checking try ${state.attempts.length}` : null}
        {state.status === "working" && state.attempts.length === 0 ? "Drawing" : null}
        {state.status === "accepted" && rejected.length > 0
          ? `Passed on try ${rejected.length + 1}, ${rejected.length} rejected`
          : null}
        {state.status === "fallback" ? "Drawn from the numbers" : null}
        {state.status === "error" ? state.message : null}
      </figcaption>
    </figure>
  );
}
