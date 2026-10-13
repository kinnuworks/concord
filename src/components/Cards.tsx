"use client";

import { useEffect, useState } from "react";
import type { Card, ExerciseCard, MedicineCard, WarningCard } from "@/lib/plan";
import { RTL, TIMES, type Lang } from "@/lib/schema";
import { exerciseSvg, svgDataUrl } from "@/lib/fallback";
import { label } from "@/lib/labels";
import { tileKey, type TileSpec } from "@/lib/tiles";
import { DoseView, TileView, useTile, useTileSummary, type TileState } from "./Tile";

export type TileReport = (key: string, spec: TileSpec, state: TileState) => void;

// Names and phrases that are not in the label table, written in the patient's language.
type Local = { names: Record<string, string | null>; phrases: Record<string, string | null> };
const NO_LOCAL: Local = { names: {}, phrases: {} };

type Shared = { lang: Lang; fresh: boolean; adapter?: boolean; run: number; report: TileReport; local?: Local };

// Asks the server to put the medicine names and free phrases on these cards into the chosen
// language. The cards show the printed names until an answer comes back, and keep them if
// the read-back check turns a name down.
function useLocal(cards: Card[], lang: Lang): Local {
  const names = cards.flatMap((c) => (c.kind === "medicine" ? [c.medicine.name] : []));
  const phrases = cards.flatMap((c) => (c.kind === "exercise" ? [c.exercise.name] : c.kind === "followup" && c.place ? [c.place] : []));
  const key = `${lang}|${names.join("|")}|${phrases.join("|")}`;
  const [got, setGot] = useState<{ key: string; local: Local }>({ key: "", local: NO_LOCAL });
  useEffect(() => {
    if (lang === "en" || (!names.length && !phrases.length)) return;
    let alive = true;
    fetch("/api/localize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang, names, phrases }) })
      .then((res) => res.json())
      .then((data: Partial<Local>) => {
        if (alive) setGot({ key, local: { names: data.names ?? {}, phrases: data.phrases ?? {} } });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // The key already encodes the language and every string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return lang !== "en" && got.key === key ? got.local : NO_LOCAL;
}

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

// Speech voices are named by region for a few languages; the rest go by their code.
const VOICE: Record<string, string> = { en: "en-US", es: "es-US", zh: "zh-CN", "zh-Hant": "zh-TW", tl: "fil-PH", pt: "pt-BR", hmn: "hmn" };

// Reads a card aloud in the chosen language, for people who would rather listen.
function Speak({ text, lang }: { text: string; lang: Lang }) {
  return (
    <button
      type="button"
      className="rx__speak"
      aria-label="Read this card aloud"
      onClick={() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = VOICE[lang] ?? lang;
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" />
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
      </svg>
    </button>
  );
}

// One line under each card saying how its pictures fared in the check.
function Checked({ specs, shared }: { specs: TileSpec[]; shared: Shared }) {
  const s = useTileSummary(specs, { fresh: shared.fresh, adapter: shared.adapter, run: shared.run });
  const done = s.ready === s.total;
  const parts = [
    done ? `${s.total} ${label(shared.lang, "read_back")}` : `Checking pictures, ${s.ready} of ${s.total} ready`,
    s.redrawn ? `${s.redrawn} redrawn` : null,
    s.fallback ? `${s.fallback} · ${label(shared.lang, "drawn_by_code")}` : null,
  ].filter(Boolean);
  return (
    <p className="rx__check" data-done={done}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {done ? (
          <>
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4.5" />
          </>
        ) : (
          <path d="M12 6v6l3.5 2" />
        )}
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
  const localName = shared.local?.names[m.name] ?? null;
  const mealPic = <GatedTile spec={meal} shared={shared} size={72} alt="A meal" />;
  const dosePic = <GatedTile spec={dose} shared={shared} size={72} alt="The medicine" />;

  return (
    <article className="card rx">
      <header className="rx__head">
        {/* The name stays exactly as printed on the box; the patient's script goes under it. */}
        <h3>
          {m.name}
          {localName ? <span className="rx__local">{localName}</span> : null}
        </h3>
        <Speak
          lang={shared.lang}
          text={[
            localName ?? m.name,
            ...m.times.map((t) => `${label(shared.lang, t)}: ${m.count}`),
            label(shared.lang, m.food),
            card.days === null ? label(shared.lang, "every_day") : `${card.days} ${label(shared.lang, "days")}`,
            ...(m.avoid.length ? [`${label(shared.lang, "do_not")}: ${m.avoid.map((x) => label(shared.lang, x)).join(", ")}`] : []),
          ]
            .filter(Boolean)
            .join(". ")}
        />
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
  // Exercise figures are drawn by code, like the calendar, so the angle shown is exact.
  const figure = svgDataUrl(exerciseSvg(e.movement, e.angle));
  const localTitle = shared.local?.phrases[e.name] ?? null;
  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>
          {localTitle ?? e.name}
          {localTitle ? <span className="rx__local">{e.name}</span> : null}
        </h3>
      </header>
      <div className="exercise">
        <span className="pic" style={{ "--pic": "220px" } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pic__img" src={figure} alt={`${e.name}, ${Math.round(e.angle)} degrees`} />
        </span>
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
      <p className="rx__check" data-done="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        {label(shared.lang, "exact_angle")}
      </p>
    </article>
  );
}

function WarningView({ card, shared }: { card: WarningCard; shared: Shared }) {
  return (
    <article className="card rx rx--warning">
      <header className="rx__head">
        <h3>{label(shared.lang, "come_back")}</h3>
        <Speak
          lang={shared.lang}
          text={`${label(shared.lang, "come_back")}: ${card.signs.map((x) => label(shared.lang, x.sign)).join(", ")}`}
        />
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

function FollowUpView({ date, place, lang, local }: { date: string | null; place: string | null; lang: Lang; local?: Local }) {
  const d = date ? new Date(`${date}T00:00:00`) : null;
  const localPlace = place ? (local?.phrases[place] ?? null) : null;
  // A language the browser has no calendar words for falls back to its default.
  const say = (options: Intl.DateTimeFormatOptions) => {
    try {
      return d!.toLocaleDateString(lang, options);
    } catch {
      return d!.toLocaleDateString(undefined, options);
    }
  };
  return (
    <article className="card rx">
      <header className="rx__head">
        <h3>{label(lang, "next_visit")}</h3>
      </header>
      <div className="visit">
        {d ? (
          // A calendar leaf drawn by code, so the date is exactly the one on the sheet.
          <div className="leaf" aria-hidden>
            <span className="leaf__month">{say({ month: "short" })}</span>
            <span className="leaf__day">{d.getDate()}</span>
          </div>
        ) : null}
        <div>
          {d ? (
            <p className="word word--big">
              {say({ weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          ) : null}
          {place ? <p className="word">{localPlace ?? place}</p> : null}
        </div>
      </div>
    </article>
  );
}

export function CardSheet({ cards, ...given }: { cards: Card[] } & Shared) {
  const local = useLocal(cards, given.lang);
  const shared: Shared = { ...given, local };
  return (
    <div className="sheet" lang={shared.lang} dir={RTL.has(shared.lang) ? "rtl" : "ltr"}>
      {cards.map((card) => {
        switch (card.kind) {
          case "medicine":
            return <MedicineView key={card.id} card={card} shared={shared} />;
          case "exercise":
            return <ExerciseView key={card.id} card={card} shared={shared} />;
          case "warning":
            return <WarningView key={card.id} card={card} shared={shared} />;
          case "followup":
            return <FollowUpView key={card.id} date={card.date} place={card.place} lang={shared.lang} local={local} />;
        }
      })}
    </div>
  );
}
