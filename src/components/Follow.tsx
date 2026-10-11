"use client";

import { useState } from "react";
import data from "@/data/results.json";
import { label } from "@/lib/labels";
import type { Avoid, TimeOfDay, Warning } from "@/lib/schema";

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

// One real picture followed from prompt to card: what code asked for, what the image
// model drew, what each reader said, and whether it was kept.
export function Follow() {
  const [at, setAt] = useState(0);
  if (!examples.length) return null;
  const e = examples[Math.min(at, examples.length - 1)];
  return (
    <section className="section section--alt" id="pictures">
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
            </li>
            <li>
              <p className="t-title">3. Code places the kept picture on the card</p>
              <p className="t-small">
                It sits under the words &ldquo;{nameOf(e.key)}&rdquo; in the patient&rsquo;s language. Numbers, order, the
                calendar and exercise angles are drawn by code, never by the image model.
              </p>
            </li>
          </ol>
          <p className="t-micro">Recorded from our evaluation run. The readers were told nothing about what the picture was meant to show.</p>
        </div>
      </div>
    </section>
  );
}
