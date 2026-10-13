import labelsReport from "@/data/labels-report.json";
import report from "@/data/names-report.json";
import { hasLanguage } from "@/lib/labels";
import { LANGUAGE_LIST, RTL } from "@/lib/schema";

type NamesReport = {
  url: string;
  medicines: number;
  languages: number;
  written: number;
  matched: number;
  readBack?: number;
  wikidata?: { names: number; kept: number; used: number };
  agreement?: { compared: number; identical: number; close: number };
  samples?: Record<string, Record<string, string>>;
};

const names = report as unknown as NamesReport;
const labels = Object.entries(labelsReport as Record<string, { kept: number; offered: boolean }>).filter(([, l]) => l.offered);
const OFFERED = LANGUAGE_LIST.filter(([code]) => hasLanguage(code));

// Scripts chosen to look different from one another, in the order they are shown.
const SHOWN = ["hi", "zh", "ar", "ru", "te", "ko", "th", "am", "el", "he", "ta", "ka"];

const count = (n: number) => n.toLocaleString("en-US");

// The words around the pictures are checked the same way the pictures are.
export function Languages() {
  const sample = names.samples?.metformin ?? {};
  const shown = SHOWN.filter((code) => sample[code]);
  const labelCount = labels.reduce((n, [, l]) => n + l.kept, 0);
  const wiki = names.wikidata;
  const agreement = names.agreement;
  // The figures always describe the languages whose run has finished, and say how many that is.
  if (names.languages < 20) return null;

  return (
    <section className="section section--alt" id="languages">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            Languages
          </p>
          <h2>One checked picture, {OFFERED.length} languages.</h2>
          <p className="lead">
            A picture needs no translation. The words around it do, and each one is checked the way a picture
            is: a second model that never saw the English reads it back.
          </p>
        </div>

        <div className="grid grid-3 stat-grid--compact">
          <div className="card stat-card">
            <p className="stat-card__tag" data-side="concord">Medicine names</p>
            <p className="stat-card__figure">{count(names.readBack ?? names.written)}</p>
            <p className="stat-card__text">
              medicine names read back by a model that never saw the English: {count(names.medicines)}{" "}
              prescribable medicines written in each of {names.languages} languages
              {wiki ? `, and ${count(wiki.names)} names from Wikidata` : ""}. A name that does not come back as
              the same medicine is left in Latin letters on the card.
            </p>
            <a className="source-tag" href={names.url} target="_blank" rel="noreferrer">
              Medicine list: RxNorm, U.S. National Library of Medicine
            </a>
          </div>
          {wiki && agreement ? (
            <div className="card stat-card">
              <p className="stat-card__tag" data-side="concord">Checked against Wikidata</p>
              <p className="stat-card__figure">{count(wiki.used)}</p>
              <p className="stat-card__text">
                names on the cards come from Wikidata, the open knowledge base behind Wikipedia, so a reader sees
                the name their own pharmacy uses. Where Concord had also written the name itself,{" "}
                {count(agreement.close)} of {count(agreement.compared)} agreed to within a letter or two.
              </p>
              <a className="source-tag" href="https://www.wikidata.org/wiki/Property:P3345" target="_blank" rel="noreferrer">
                Matched by RxNorm id on Wikidata
              </a>
            </div>
          ) : null}
          <div className="card stat-card">
            <p className="stat-card__tag" data-side="concord">Card labels</p>
            <p className="stat-card__figure">{count(labelCount)}</p>
            <p className="stat-card__text">
              card labels kept across {labels.length} languages. One model translates each label, a model from
              another company translates it back unseen, and it is kept only when the meaning survives the
              round trip. Right-to-left languages get a mirrored card.
            </p>
          </div>
        </div>

        {shown.length ? (
          <div className="card scripts">
            <p className="t-title">Metformin 500 mg, as the patient reads it</p>
            <ul>
              {shown.map((code) => (
                <li key={code} lang={code} dir={RTL.has(code) ? "rtl" : "ltr"}>
                  <span>{sample[code]} 500 mg</span>
                  <small lang="en" dir="ltr">
                    {LANGUAGE_LIST.find(([c]) => c === code)?.[1]}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
