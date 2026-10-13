import data from "@/data/results.json";

type Rate = { k: number; n: number; pct: number; ci: [number, number] };
type Arm = { pictures: number; tiles: number; firstTry: Rate; byKind: Record<string, Rate>; expectedFallbackPct: number };
type Caught = {
  file: string;
  expected: { form?: string; count?: number };
  readings: { reader: string; reading: { count?: number } | null }[];
};
type Results = {
  base?: Arm;
  adapter?: Arm;
  counting?: Rate;
  caught?: Caught[];
  misread?: { file: string; meant: string; saw: string[] }[];
  redrawRule?: { signs: number; styledOnlyFallbackPct: number; styledThenPlainFallbackPct: number };
  reader?: { cases: number; correct: number; wrong: number; wrongAndUnflagged: number; errors: number };
  style?: Record<string, { agreeFlat: number; total: number }>;
  training?: { steps: number; images: number; seconds: number; base: string; source: string };
};

const r = data as unknown as Results;

const share = (x?: { agreeFlat: number; total: number }) => (x && x.total ? Math.round((x.agreeFlat / x.total) * 100) : null);

// Our own measurements. Every figure here is read from the evaluation logs at build time.
export function Results() {
  const total = (r.base?.pictures ?? 0) + (r.adapter?.pictures ?? 0);
  if (!total) return null;
  const counting = r.counting;
  const unit = r.adapter?.byKind.unit;
  const unitBase = r.base?.byKind.unit;
  const flatAdapter = share(r.style?.adapter);
  const flatBase = share(r.style?.base);
  const reader = r.reader && r.reader.errors === 0 ? r.reader : null;

  return (
    <section className="section section--alt" id="results">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            What we measured
          </p>
          <h2>Why an image model needs a check.</h2>
          <p className="lead">
            We asked FLUX.1 [dev] for {total} pictures from 100 written instructions, with no check in the way, and
            had two readers read every one. This is what an image model does on its own, and what Concord does
            about it.
          </p>
        </div>

        <div className="grid grid-2">
          {counting ? (
            <div className="card stat-card">
              <p className="stat-card__tag" data-side="alone">An image model on its own</p>
              <p className="stat-card__figure">
                {counting.n - counting.k} of {counting.n}
              </p>
              <p className="stat-card__text">
                whole-dose pictures showed the wrong number of pills when the model was asked to draw the dose
                in one picture.
              </p>
              <p className="stat-card__text stat-card__answer">
                <b>With Concord</b> the model draws one pill, two readers check that it is exactly one, and code
                repeats it. The number on a card is set by code, never by a picture.
              </p>
            </div>
          ) : null}
          {unit && unitBase ? (
            <div className="card stat-card">
              <p className="stat-card__tag" data-side="concord">With Concord</p>
              <p className="stat-card__figure">
                {unit.k + unitBase.k} of {unit.n + unitBase.n}
              </p>
              <p className="stat-card__text">
                single-unit pictures passed the read-back on the first try. The other{" "}
                {unit.n + unitBase.n - unit.k - unitBase.k} were thrown away and redrawn before anyone saw them.
              </p>
            </div>
          ) : null}
          {flatAdapter !== null && flatBase !== null ? (
            <div className="card stat-card">
              <p className="stat-card__tag" data-side="concord">With our fine-tuned adapter</p>
              <p className="stat-card__figure">
                {flatBase}% to {flatAdapter}%
              </p>
              <p className="stat-card__text">
                This one is about drawing style, not meaning: the share of pictures that came out as flat
                outlined pictograms, before and after our fine-tuned adapter. A set of cards now shares one look,
                and every picture on a card has still passed the read-back.
                {r.training
                  ? ` The adapter was trained for ${r.training.steps} steps on ${r.training.images} OpenMoji pictograms in ${r.training.seconds} seconds.`
                  : ""}
              </p>
            </div>
          ) : null}
          {reader ? (
            <div className="card stat-card">
              <p className="stat-card__tag" data-side="concord">With Concord</p>
              <p className="stat-card__figure">
                {reader.correct} of {reader.cases}
              </p>
              <p className="stat-card__text">
                written instructions were read correctly by the sheet reader.{" "}
                {reader.wrong === 0
                  ? "No reading was wrong."
                  : reader.wrongAndUnflagged === 0
                    ? "Every miss was flagged by a disagreement between the two readers."
                    : `${reader.wrongAndUnflagged} of the misses were not flagged.`}
              </p>
            </div>
          ) : null}
        </div>

        {r.caught?.length ? (
          <div className="card results-caught">
            <p className="t-title">Drawn by an image model on its own. Concord stopped every one.</p>
            <ul>
              {r.caught.slice(0, 6).map((c) => {
                const seen = [...new Set(c.readings.map((x) => x.reading?.count).filter((n) => typeof n === "number"))];
                return (
                  <li key={c.file}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.file} alt="" width={132} height={132} loading="lazy" />
                    <span>
                      Asked for <b>{c.expected.count}</b>, readers counted <b>{seen.join(" and ") || "none"}</b>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {r.misread?.length ? (
          <div className="card results-caught">
            <p className="t-title">Pictures that would mislead a patient. Concord stopped these too.</p>
            <ul>
              {r.misread.slice(0, 6).map((c) => (
                <li key={c.file}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.file} alt="" width={132} height={132} loading="lazy" />
                  <span>
                    Meant to show <b>{c.meant}</b>. A reader saw &ldquo;{c.saw[0].replace(/\.$/, "")}&rdquo;
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

      </div>
    </section>
  );
}
