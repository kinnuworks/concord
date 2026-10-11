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
    <section className="section" id="results">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            What we measured
          </p>
          <h2>We tested the generator before we trusted it.</h2>
          <p className="lead">
            {total} pictures drawn for a fixed set of 100 written instructions, each read by both readers. Every
            figure here comes from the evaluation logs in the repository.
          </p>
        </div>

        <div className="grid grid-2">
          {counting ? (
            <div className="card stat-card">
              <p className="stat-card__figure">
                {counting.n - counting.k} of {counting.n}
              </p>
              <p className="stat-card__text">
                times the image model drew the wrong number of pills when asked for a whole dose in one
                picture. Concord never asks it to count. It draws one unit, checks it, and code repeats it, so
                the number on a card is exact.
              </p>
            </div>
          ) : null}
          {unit && unitBase ? (
            <div className="card stat-card">
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
              <p className="stat-card__figure">
                {flatBase}% to {flatAdapter}%
              </p>
              <p className="stat-card__text">
                The share of pictures both readers called a flat outlined pictogram, before and after our
                fine-tuned style adapter. A set of cards now shares one look.
                {r.training
                  ? ` The adapter was trained for ${r.training.steps} steps on ${r.training.images} OpenMoji pictograms in ${r.training.seconds} seconds.`
                  : ""}
              </p>
            </div>
          ) : null}
          {reader ? (
            <div className="card stat-card">
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
            <p className="t-title">Miscounted doses the read-back stopped</p>
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
            <p className="t-title">Misleading pictures the read-back stopped</p>
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
