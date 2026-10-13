"use client";

import { useEffect, useState } from "react";

// Six pictures from the test run, exactly as the readers described them.
const EXAMPLES: { f: string; asked: string; saw: [string, string]; kept: boolean }[] = [
  { f: "b005", asked: "one spoonful of medicine", saw: ["8 spoonfuls", "8 spoonfuls"], kept: false },
  { f: "a095", asked: "one capsule", saw: ["1 capsule", "1 capsule"], kept: true },
  { f: "a223", asked: "a swollen foot", saw: ["a red sock", "a red sock"], kept: false },
  { f: "a144", asked: "morning", saw: ["rooster in a field with sun and sky", "a rooster standing in a sunny green landscape"], kept: true },
  { f: "a213", asked: "a fever", saw: ["a person's face with red tears and blue drool", "a person crying with tears and an open mouth"], kept: false },
  { f: "a198", asked: "alcohol", saw: ["wine glass with red wine and a bottle", "a glass of red wine beside a bottle"], kept: true },
];

// What the check is for, in one strip: a picture an image model drew on its own, what
// Concord's two readers said they saw, and what Concord did. It steps on by itself unless
// motion is reduced.
export function Proof() {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 3800);
    return () => clearInterval(timer);
  }, [held]);

  const e = EXAMPLES[i];
  return (
    <div className="proof" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="proof__row" key={e.f}>
        <div className="proof__step">
          <p className="proof__label">An image model, on its own, was asked for</p>
          <p className="proof__asked">{e.asked}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="proof__pic" src={`/gallery/${e.f}.webp`} alt={`The picture it drew when asked for ${e.asked}`} width={112} height={112} />
        <div className="proof__step">
          <p className="proof__label">Concord&rsquo;s two readers, told nothing, saw</p>
          <p className="proof__saw">&ldquo;{e.saw[0]}&rdquo;</p>
          <p className="proof__saw">&ldquo;{e.saw[1]}&rdquo;</p>
        </div>
        <p className="proof__verdict" data-kept={e.kept}>
          {e.kept ? "Concord kept it" : "Concord threw it away"}
        </p>
      </div>
      <div className="proof__dots">
        {EXAMPLES.map((x, n) => (
          <button key={x.f} type="button" aria-label={`Example ${n + 1}: ${x.asked}`} aria-pressed={n === i} onClick={() => setI(n)} />
        ))}
      </div>
    </div>
  );
}
