"use client";

import { useEffect } from "react";
import type { Card, ExerciseCard, MedicineCard, WarningCard } from "@/lib/plan";
import { TIMES, type Lang } from "@/lib/schema";
import { label } from "@/lib/labels";
import { tileKey, type TileSpec } from "@/lib/tiles";
import { DoseView, TileView, useTile, useTileSummary, type TileState } from "./Tile";

export type TileReport = (key: string, spec: TileSpec, state: TileState) => void;

type Shared = { lang: Lang; fresh: boolean; adapter?: boolean; run: number; report: TileReport };

function GatedTile({
  spec,
  shared,
  size,
  count,
  crossed,
  alt,
}: {
  spec: TileSpec;
  shared: Shared;
  size?: number;
  count?: number;
  crossed?: boolean;
  alt: string;
}) {
  const state = useTile(spec, { fresh: shared.fresh, adapter: shared.adapter, run: shared.run });
  const { report } = shared;
  const key = tileKey(spec);
  useEffect(() => {
    report(key, spec, state);
    // The spec is stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state, report]);
  return <TileView state={state} size={size} count={count} crossed={crossed} alt={alt} />;
}

function Dose({ spec, shared, count, size }: { spec: TileSpec; shared: Shared; count: number; size?: number }) {
  const state = useTile(spec, { fresh: shared.fresh, adapter: shared.adapter, run: shared.run });
  const { report } = shared;
  const key = tileKey(spec);
  useEffect(() => {
    report(key, spec, state);
    // The spec is stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state, report]);
  return <DoseView state={state} count={count} size={size} alt={`${count} to take`} />;
}

// One line under each card saying how its pictures fared in the check.
function Checked({ specs, shared }: { specs: TileSpec[]; shared: Shared }) {
  const s = useTileSummary(specs, { fresh: shared.fresh, adapter: shared.adapter, run: shared.run });
  const done = s.ready === s.total;
  const parts = [
    done ? `${s.total} pictures read back by two readers` : `Checking pictures, ${s.ready} of ${s.total} ready`,
    s.redrawn ? `${s.redrawn} redrawn` : null,
    s.fallback ? `${s.fallback} drawn from the numbers` : null,
  ].filter(Boolean);
  return (
    <p className="rx__check" data-done={done}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 6v6l3.5 2" />}
      </svg>
      {parts.join(" · ")}
    </p>
  );
}

const Then = () => (
  <svg className="step-mark" viewBox="0 0 40 24" aria-hidden>
    <path d="M3 12h30m-9 -8l9 8l-9 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const With = () => (
  <svg className="step-mark" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// The calendar is drawn by code: one box per day, so the count can't be wrong.
function Calendar({ days, lang }: { days: number | null; lang: Lang }) {
  if (days === null) return <p className="word word--strong">{label(lang, "every_day")}</p>;
  const shown = Math.min(days, 31);
  return (
    <div className="calendar">
      <p className="word word--strong">
        <span className="t-mono">{days}</span> {label(lang, "days")}
      </p>
      <div className="calendar__boxes" aria-hidden>
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className="calendar__day">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function MedicineView({ card, shared }: { card: MedicineCard; shared: Shared }) {
  const m = card.medicine;
  const dose: TileSpec = { kind: "unit", form: m.form };
  const meal: TileSpec = { kind: "meal" };
  const mealPos = card.rows[0]?.meal ?? "none";
  const specs: TileSpec[] = [
    ...TIMES.map((time): TileSpec => ({ kind: "time", time })),
    dose,
    ...(mealPos !== "none" ? [meal] : []),
    ...card.avoid,
  ];
  const mealPic = <GatedTile spec={meal} shared={shared} size={72} alt="A meal" />;
  const dosePic = <GatedTile spec={dose} shared={shared} size={72} alt="The medicine" />;

  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>{m.name}</h3>
      </header>

      {/* The four parts of the day always appear in the same order, taken or not. */}
      <div className="schedule">
        {TIMES.map((time) => {
          const on = m.times.includes(time);
          return (
            <div key={time} className="slot" data-on={on}>
              <GatedTile spec={{ kind: "time", time }} shared={shared} size={84} alt={time} />
              <span className="slot__label">{label(shared.lang, time)}</span>
              <div className="slot__dose">
                {on ? (
                  <Dose spec={dose} shared={shared} count={m.count} size={132} />
                ) : (
                  <span className="slot__none" aria-label="None">
                    &ndash;
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rx__facts">
        {mealPos !== "none" ? (
          <div className="fact">
            <div className="fact__pics">
              {mealPos === "before_dose" ? (
                <>
                  {mealPic}
                  <Then />
                  {dosePic}
                </>
              ) : mealPos === "after_dose" ? (
                <>
                  {dosePic}
                  <Then />
                  {mealPic}
                </>
              ) : (
                <>
                  {mealPic}
                  <With />
                  {dosePic}
                </>
              )}
            </div>
            <p className="word word--strong">{label(shared.lang, m.food)}</p>
          </div>
        ) : null}
        <div className="fact">
          <Calendar days={card.days} lang={shared.lang} />
        </div>
      </div>

      {card.avoid.length ? (
        <div className="group">
          <p className="word word--strong">{label(shared.lang, "do_not")}</p>
          <div className="group__items">
            {card.avoid.map((t) =>
              t.kind === "avoid" ? (
                <div key={t.item} className="group__item">
                  <GatedTile spec={t} shared={shared} size={96} crossed alt={t.item} />
                  <span className="word">{label(shared.lang, t.item)}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

      <Checked specs={specs} shared={shared} />
    </article>
  );
}

function ExerciseView({ card, shared }: { card: ExerciseCard; shared: Shared }) {
  const e = card.exercise;
  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>{e.name}</h3>
        <span className="chip chip--soft t-mono">{Math.round(e.angle)}°</span>
      </header>
      <div className="exercise">
        <GatedTile spec={card.tile} shared={shared} size={200} alt={e.name} />
        <div className="exercise__facts">
          <p className="word word--big">
            <span className="t-mono">{e.reps}</span> {label(shared.lang, "times")}
          </p>
          <p className="word word--strong">
            <span className="t-mono">{e.sets}</span> {label(shared.lang, "sets")}
          </p>
          <p className="word word--strong">
            <span className="t-mono">{e.timesPerDay}</span> {label(shared.lang, "times_a_day")}
          </p>
        </div>
      </div>
      <Checked specs={[card.tile]} shared={shared} />
    </article>
  );
}

function WarningView({ card, shared }: { card: WarningCard; shared: Shared }) {
  return (
    <article className="card rx rx--warning">
      <header className="rx__head">
        <h3>{label(shared.lang, "come_back")}</h3>
      </header>
      <div className="group__items">
        {card.signs.map(({ sign, tile }) => (
          <div key={sign} className="group__item">
            <GatedTile spec={tile} shared={shared} size={120} alt={sign} />
            <span className="word word--strong">{label(shared.lang, sign)}</span>
          </div>
        ))}
      </div>
      <Checked specs={card.signs.map((s) => s.tile)} shared={shared} />
    </article>
  );
}

function FollowUpView({ date, place, lang }: { date: string | null; place: string | null; lang: Lang }) {
  const d = date ? new Date(`${date}T00:00:00`) : null;
  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>{label(lang, "next_visit")}</h3>
      </header>
      <div className="visit">
        {d ? (
          // A calendar leaf drawn by code, so the date is exactly the one on the sheet.
          <div className="leaf" aria-hidden>
            <span className="leaf__month">{d.toLocaleDateString(lang, { month: "short" })}</span>
            <span className="leaf__day">{d.getDate()}</span>
          </div>
        ) : null}
        <div>
          {d ? (
            <p className="word word--big">
              {d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          ) : null}
          {place ? <p className="word">{place}</p> : null}
        </div>
      </div>
    </article>
  );
}

export function CardSheet({ cards, ...shared }: { cards: Card[] } & Shared) {
  return (
    <div className="sheet">
      {cards.map((card) => {
        switch (card.kind) {
          case "medicine":
            return <MedicineView key={card.id} card={card} shared={shared} />;
          case "exercise":
            return <ExerciseView key={card.id} card={card} shared={shared} />;
          case "warning":
            return <WarningView key={card.id} card={card} shared={shared} />;
          case "followup":
            return <FollowUpView key={card.id} date={card.date} place={card.place} lang={shared.lang} />;
        }
      })}
    </div>
  );
}
