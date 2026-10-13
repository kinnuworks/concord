"use client";

import { useState } from "react";
import data from "@/data/results.json";
import { label } from "@/lib/labels";
import type { Avoid, TimeOfDay, Warning } from "@/lib/schema";
import { tileFromKey } from "@/lib/tiles";
import { useTile } from "./Tile";

type Shot = { file: string; saw: string[]; plain?: boolean };
type Example = { key: string; prompt: string; meant: string; stopped: Shot; kept: Shot };

const examples = ((data as unknown as { examples?: Example[] }).examples ?? []) as Example[];
const READERS = ["Reader 1, Google", "Reader 2, OpenAI"];

// "warning-swelling" is printed on a card as "Swelling".
function nameOf(key: string): string {
  const value = key.split("-").slice(1).join("-") as TimeOfDay | Avoid | Warning;
  const word = label("en", value);
  return key.startsWith("avoid-") ? `Do not: ${word.toLowerCase()}` : word;
}

function Attempt({ shot, kept }: { shot: Shot; kept: boolean }) {
  return (
    <div className="follow__attempt" data-kept={kept}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.file} alt="" width={148} height={148} loading="lazy" />
      <div className="follow__said">
        {shot.saw.map((s, i) => (
          <p key={READERS[i]}>
            <span className="follow__who">{READERS[i]}</span>
            &ldquo;{s.replace(/\.$/, "")}&rdquo;
          </p>
        ))}
        <p className="follow__verdict">
          {kept
            ? shot.plain
              ? "Redrawn by the plain model, and kept."
              : "Kept. This one can go on a card."
            : "Thrown away and drawn again."}
        </p>
      </div>
    </div>
  );
}

const said = (reading: Record<string, unknown> | null | undefined) =>
  typeof reading?.shows === "string" ? reading.shows.replace(/\.$/, "") : "did not answer in time";

// The same picture drawn again while the visitor watches: the image model draws, both readers
// describe what they see, and a misread picture is drawn again.
function Live({ pictureKey, run }: { pictureKey: string; run: number }) {
  const state = useTile(tileFromKey(pictureKey), { fresh: true, run });
  const working = state.status === "working" || state.status === "idle";
  return (
    <div className="follow__live" aria-live="polite">
      {state.attempts.map((a) => (
        <div key={a.n} className="follow__attempt" data-kept={a.verdict ? a.verdict.pass : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt="" width={148} height={148} />
          <div className="follow__said">
            {a.verdict ? (
              <>
                {a.verdict.readers.map((r, i) => (
                  <p key={r.reader}>
                    <span className="follow__who">{READERS[i]}</span>
                    &ldquo;{said(r.reading)}&rdquo;
                  </p>
                ))}
                <p className="follow__verdict">
                  {a.verdict.pass
                    ? "Kept. This one can go on a card."
                    : a.verdict.readers.some((r) => !r.reading)
                      ? "A reader did not answer, so this picture cannot be used."
                      : "Thrown away and drawn again."}
                </p>
              </>
            ) : (
              <p className="follow__wait">Drawn. The two readers are looking at it now.</p>
            )}
          </div>
        </div>
      ))}
      {working && state.attempts.every((a) => a.verdict) ? <p className="follow__wait">The image model is drawing. This takes about fifteen seconds.</p> : null}
      {state.status === "accepted" && state.source === "library" ? (
        <p className="t-small">Live drawing has reached its limit for now, so nothing new was drawn. The pictures above are from the recorded run.</p>
      ) : null}
      {state.status === "fallback" ? <p className="t-small">No drawing passed both readers this time, so a card would use the plain pictogram drawn by code.</p> : null}
      {state.status === "error" ? <p className="t-small">The image model did not answer. Please try again in a minute.</p> : null}
    </div>
  );
}

// One real picture followed from prompt to card: what code asked for, what the image
// model drew, what each reader said, and whether it was kept.
export function Follow() {
  const [at, setAt] = useState(0);
  const [live, setLive] = useState<{ key: string; run: number } | null>(null);
  if (!examples.length) return null;
  const e = examples[Math.min(at, examples.length - 1)];
  return (
    <section className="section" id="pictures">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            Where the image model works
          </p>
          <h2>Every pictogram is generated, then read back.</h2>
          <p className="lead">
            FLUX.1 [dev] with our own fine-tuned style adapter draws each picture from a prompt that code writes.
            Pick one and follow it from prompt to card.
          </p>
        </div>

        <div className="card follow">
          <div className="chips" role="group" aria-label="Pictures to follow">
            {examples.map((x, i) => (
              <button key={x.key} type="button" className="chip" aria-pressed={i === at} onClick={() => setAt(i)}>
                {nameOf(x.key)}
              </button>
            ))}
          </div>

          <ol className="follow__steps">
            <li>
              <p className="t-title">1. Code writes the prompt</p>
              <p className="follow__prompt">{e.prompt}</p>
            </li>
            <li>
              <p className="t-title">2. The model draws, two readers describe what they see</p>
              <div className="follow__attempts">
                <Attempt shot={e.stopped} kept={false} />
                <Attempt shot={e.kept} kept />
              </div>
              <div className="follow__again">
                <button type="button" className="btn btn-ink btn-sm" onClick={() => setLive({ key: e.key, run: (live?.run ?? 0) + 1 })}>
                  Draw it again, live
                </button>
                <span className="t-micro">
                  A new picture is drawn now by OpenAI&rsquo;s image model and read by the same two readers.
                </span>
              </div>
              {live && live.key === e.key ? <Live key={live.run} pictureKey={live.key} run={1000 + live.run} /> : null}
            </li>
            <li>
              <p className="t-title">3. Code places the kept picture on the card</p>
              <p className="t-small">
                It sits under the words &ldquo;{nameOf(e.key)}&rdquo; in the patient&rsquo;s language. Numbers, order, the
                calendar and exercise angles are drawn by code, never by the image model.
              </p>
            </li>
          </ol>
          <p className="t-micro">
            The two pictures in step 2 are recorded from our evaluation run, drawn by FLUX.1 [dev] with our adapter. The
            readers were told nothing about what a picture was meant to show.
          </p>
        </div>
      </div>
    </section>
  );
}
