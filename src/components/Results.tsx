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

const KINDS: [string, string][] = [
  ["unit", "One unit of a medicine"],
  ["time", "Time of day"],
  ["meal", "Meal"],
  ["avoid", "Things to avoid"],
  ["warning", "Warning signs"],
];

const share = (x?: { agreeFlat: number; total: number }) => (x && x.total ? Math.round((x.agreeFlat / x.total) * 100) : null);

// Our own measurements. Every figure here is read from the evaluation logs at build time.
export function Results() {
  const total = (r.base?.pictures ?? 0) + (r.adapter?.pictures ?? 0);
  if (!total) return null;
  const counting = r.counting;
  const unit = r.adapter?.byKind.unit;
  const warnA = r.adapter?.byKind.warning;
  const warnB = r.base?.byKind.warning;
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
          <h2>We tested the generator before we trusted it.</h2>
          <p className="lead">
            {total} pictures drawn for a fixed set of 100 written instructions, each read by both readers. These
            are the results, including the ones that did not go our way.
          </p>
        </div>

        <div className="grid grid-2">
          {counting ? (
            <div className="card stat-card">
              <p className="stat-card__figure">
                {counting.n - counting.k} of {counting.n}
              </p>
              <p className="stat-card__text">
                pictures showed the wrong number of pills when the generator was asked to draw a whole dose at
                once. So Concord never asks it to count. It draws one unit, checks it, and code repeats it.
              </p>
            </div>
          ) : null}
          {unit ? (
            <div className="card stat-card">
              <p className="stat-card__figure">
                {unit.k} of {unit.n}
              </p>
              <p className="stat-card__text">
                single-unit pictures passed the read-back on the first try. The rest were thrown away and
                redrawn before anyone saw them.
              </p>
            </div>
          ) : null}
          {flatAdapter !== null && flatBase !== null ? (
            <div className="card stat-card">
              <p className="stat-card__figure">
                {flatBase}% to {flatAdapter}%
              </p>
              <p className="stat-card__text">
                The share of pictures both readers called a flat outlined pictogram, without and with our
                fine-tuned style adapter. The adapter gave the cards one look. It also made warning signs harder
                to read{warnA && warnB ? `: ${warnA.k} of ${warnA.n} passed first time, against ${warnB.k} of ${warnB.n} without it` : ""}.
                So a redraw drops the adapter.
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

        {r.base && r.adapter ? (
          <div className="card results-table">
            <p className="t-title">Pictures that passed the read-back on the first try</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Kind of picture</th>
                  <th scope="col">Plain model</th>
                  <th scope="col">With our adapter</th>
                </tr>
              </thead>
              <tbody>
                {KINDS.map(([kind, name]) => {
                  const b = r.base!.byKind[kind];
                  const a = r.adapter!.byKind[kind];
                  if (!a && !b) return null;
                  return (
                    <tr key={kind}>
                      <th scope="row">{name}</th>
                      <td>{b ? `${b.k} of ${b.n}` : "not run"}</td>
                      <td>{a ? `${a.k} of ${a.n}` : "not run"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="t-small">
              A picture that fails is redrawn up to three times, the first attempt in our style and the rest with
              the plain model. If none passes, the card shows a plain pictogram drawn by code.
              {r.redrawRule
                ? ` Worked out from these rates, that rule leaves about ${Math.round(r.redrawRule.styledThenPlainFallbackPct)}% of freshly drawn warning signs on the code-drawn marker, against ${Math.round(r.redrawRule.styledOnlyFallbackPct)}% if every attempt used the adapter.`
                : ""}
              {r.training
                ? ` The adapter was trained for ${r.training.steps} steps on ${r.training.images} OpenMoji pictograms in ${r.training.seconds} seconds.`
                : ""}
            </p>
          </div>
        ) : null}

        {r.caught?.length ? (
          <div className="card results-caught">
            <p className="t-title">Miscounted doses the check threw away</p>
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
            <p className="t-title">Warning signs the readers could not make sense of</p>
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

        <p className="results-note">
          What this does not show: the readers are models, the test instructions are written from templates, and
          no patient has used these cards yet.
        </p>
      </div>
    </section>
  );
}
