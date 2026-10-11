"use client";

import { useEffect } from "react";
import type { Card, DoseRow, ExerciseCard, MedicineCard, WarningCard } from "@/lib/plan";
import type { Lang } from "@/lib/schema";
import { label } from "@/lib/labels";
import { tileKey, type TileSpec } from "@/lib/tiles";
import { TileView, useTile, type TileState } from "./Tile";

export type TileReport = (key: string, spec: TileSpec, state: TileState) => void;

type Shared = { lang: Lang; fresh: boolean; adapter?: boolean; run: number; report: TileReport };

function GatedTile({
  spec,
  shared,
  size,
  badge,
  crossed,
  alt,
  caption,
}: {
  spec: TileSpec;
  shared: Shared;
  size?: number;
  badge?: string;
  crossed?: boolean;
  alt: string;
  caption?: string;
}) {
  const state = useTile(spec, { fresh: shared.fresh, adapter: shared.adapter, run: shared.run });
  const { report } = shared;
  const key = tileKey(spec);
  useEffect(() => {
    report(key, spec, state);
    // The spec is stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state, report]);
  return <TileView state={state} size={size} badge={badge} crossed={crossed} alt={alt} caption={caption} />;
}

const Arrow = () => (
  <svg className="step-mark" viewBox="0 0 40 24" aria-hidden>
    <path d="M2 12h32m-10 -9l10 9l-10 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Plus = () => (
  <svg className="step-mark" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function Row({ row, shared }: { row: DoseRow; shared: Shared }) {
  const meal = <GatedTile spec={{ kind: "meal" }} shared={shared} size={96} alt="A meal" />;
  const dose = (
    <GatedTile spec={row.doseTile} shared={shared} size={96} badge={String(row.count)} alt={`${row.count} to take`} />
  );
  return (
    <div className="dose-row">
      <div className="dose-when">
        <GatedTile spec={row.timeTile} shared={shared} size={96} alt={row.time} caption={label(shared.lang, row.time)} />
      </div>
      <div className="dose-steps">
        {row.meal === "before_dose" ? (
          <>
            {meal}
            <Arrow />
            {dose}
          </>
        ) : row.meal === "after_dose" ? (
          <>
            {dose}
            <Arrow />
            {meal}
          </>
        ) : row.meal === "with_dose" ? (
          <>
            {meal}
            <Plus />
            {dose}
          </>
        ) : (
          dose
        )}
      </div>
    </div>
  );
}

// The calendar is drawn by code: one box per day, so the count can't be wrong.
function Calendar({ days, lang }: { days: number | null; lang: Lang }) {
  if (days === null) return <p className="word word--strong">{label(lang, "every_day")}</p>;
  const shown = Math.min(days, 31);
  return (
    <div className="calendar">
      <div className="calendar__boxes" aria-hidden>
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className="calendar__day">
            {i + 1}
          </span>
        ))}
      </div>
      <p className="word word--strong">
        <span className="t-mono">{days}</span> {label(lang, "days")}
      </p>
    </div>
  );
}

function MedicineView({ card, shared }: { card: MedicineCard; shared: Shared }) {
  const m = card.medicine;
  const food = label(shared.lang, m.food);
  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>{m.name}</h3>
        {food ? <span className="chip chip--soft">{food}</span> : null}
      </header>
      <div className="dose-rows">
        {card.rows.map((row) => (
          <Row key={row.time} row={row} shared={shared} />
        ))}
      </div>
      <Calendar days={card.days} lang={shared.lang} />
      {card.avoid.length ? (
        <div className="group">
          <p className="word word--strong">{label(shared.lang, "do_not")}</p>
          <div className="group__items">
            {card.avoid.map((t) =>
              t.kind === "avoid" ? (
                <div key={t.item} className="group__item">
                  <GatedTile spec={t} shared={shared} size={88} crossed alt={t.item} caption={label(shared.lang, t.item)} />
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : null}
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
        <p className="word word--strong">
          {e.reps} {label(shared.lang, "times")} × {e.sets} {label(shared.lang, "sets")}
          <br />
          {e.timesPerDay} {label(shared.lang, "times_a_day")}
        </p>
      </div>
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
            <GatedTile spec={tile} shared={shared} size={110} alt={sign} caption={label(shared.lang, sign)} />
          </div>
        ))}
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
            return (
              <article key={card.id} className="card rx">
                <header className="rx__head">
                  <h3>{label(shared.lang, "next_visit")}</h3>
                </header>
                <p className="word word--big">
                  {card.date
                    ? new Date(`${card.date}T00:00:00`).toLocaleDateString(shared.lang, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : null}
                </p>
                {card.place ? <p className="word">{card.place}</p> : null}
              </article>
            );
        }
      })}
    </div>
  );
}
