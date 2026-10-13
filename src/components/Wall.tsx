"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Picture = {
  f: string;
  adapter: boolean;
  kind: string;
  asked: string;
  saw: [reader: string, words: string][];
  kept: boolean;
  why: string;
};

const KINDS: [kind: string, name: string][] = [
  ["dose", "Whole doses"],
  ["unit", "Single units"],
  ["time", "Times of day"],
  ["meal", "Meals"],
  ["avoid", "Things to avoid"],
  ["warning", "Warning signs"],
  ["exercise", "Exercises"],
];
const READER: Record<string, string> = { gemini: "Google's reader", openai: "OpenAI's reader" };
const FIRST = 132;

// Every picture drawn in the evaluation, with what each vision model said it shows.
// The index is fetched when the wall comes near the screen, so the page loads without it.
export function Wall() {
  const [pictures, setPictures] = useState<Picture[] | null>(null);
  const [state, setState] = useState<"all" | "kept" | "stopped">("all");
  const [kind, setKind] = useState<string | null>(null);
  const [open, setOpen] = useState<Picture | null>(null);
  const [all, setAll] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const load = () =>
      fetch("/gallery/index.json")
        .then((r) => r.json())
        .then((d: Picture[]) => {
          setPictures(d);
          setOpen(d.find((p) => p.f === "b005") ?? d[0]);
        })
        .catch(() => setPictures([]));
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen.disconnect();
          load();
        }
      },
      { rootMargin: "800px" },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  const shown = useMemo(
    () => (pictures ?? []).filter((p) => (state === "all" || (state === "kept") === p.kept) && (!kind || p.kind === kind)),
    [pictures, state, kind],
  );
  const total = pictures?.length ?? 540;
  const stopped = pictures?.filter((p) => !p.kept).length ?? 209;
  const visible = all ? shown : shown.slice(0, FIRST);

  return (
    <section className="section section--alt" id="wall" ref={ref}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            Every picture
          </p>
          <h2>
            {total} generated pictures, each one read by Concord&rsquo;s two vision models.
          </h2>
          <p className="lead">
            This is what an image model draws on its own, with no check in the way. Concord&rsquo;s two readers read
            every one. Pick a picture to see what was asked for and what each reader said it shows. Concord
            stopped {stopped} of them before any could reach a card.
          </p>
        </div>

        <div className="wall">
          <div className="wall__main">
            <div className="chips">
              {(["all", "kept", "stopped"] as const).map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={state === s} onClick={() => setState(s)}>
                  {s === "all" ? `All ${total}` : s === "kept" ? `Kept ${total - stopped}` : `Stopped ${stopped}`}
                </button>
              ))}
              <span className="wall__gap" />
              {KINDS.map(([k, name]) => (
                <button key={k} type="button" className="chip chip--soft" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>
                  {name}
                </button>
              ))}
            </div>
            <div className="wall__grid">
              {visible.map((p) => (
                <button
                  key={p.f}
                  type="button"
                  className="wall__tile"
                  data-kept={p.kept}
                  aria-pressed={open?.f === p.f}
                  aria-label={`Asked for ${p.asked}. ${p.kept ? "Kept" : `Stopped: ${p.why}`}.`}
                  onClick={() => setOpen(p)}
                  onMouseEnter={() => setOpen(p)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/gallery/${p.f}.webp`} alt="" width={84} height={84} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
            {!all && shown.length > FIRST ? (
              <button type="button" className="btn btn-outline btn-sm wall__more" onClick={() => setAll(true)}>
                Show all {shown.length}
              </button>
            ) : null}
          </div>

          {open ? (
            <div className="card wall__detail" aria-live="polite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/gallery/${open.f}.webp`} alt={`Generated picture, asked for ${open.asked}`} width={168} height={168} />
              <p className="wall__label">Asked for</p>
              <p className="t-title">{open.asked}</p>
              {open.saw.map(([reader, words]) => (
                <div key={reader}>
                  <p className="wall__label">{READER[reader] ?? reader} saw</p>
                  <p className="wall__saw">{words}</p>
                </div>
              ))}
              <p className="stat-card__tag" data-side={open.kept ? "concord" : "alone"}>
                {open.kept ? "Kept by Concord" : `Stopped by Concord: ${open.why}`}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
