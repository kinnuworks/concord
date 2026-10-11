import type { ReactNode } from "react";

// Lucide-style line icons, drawn inline so the page has no icon dependency.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export function Mark() {
  return (
    <span className="app-icon app-mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5l4 4L15 9" />
        <path d="M12 16.5l1 1L21 9" />
      </svg>
    </span>
  );
}

const STATS: { figure: string; text: string; source: string; href: string }[] = [
  {
    figure: "78%",
    text: "of emergency patients went home with a gap in understanding their care or instructions in at least one area. Most did not know they had one.",
    source: "Engel et al., Annals of Emergency Medicine, 2009. 140 patients.",
    href: "https://psnet.ahrq.gov/issue/patient-comprehension-emergency-department-care-and-instructions-are-patients-aware-when-they",
  },
  {
    figure: "46%",
    text: "of patients misread the instructions on at least one of five prescription labels.",
    source: "Davis et al., Annals of Internal Medicine, 2006. 395 patients.",
    href: "https://psnet.ahrq.gov/issue/literacy-and-misunderstanding-prescription-drug-labels",
  },
  {
    figure: "19%",
    text: "of patients had an adverse event in the weeks after leaving hospital. For 6% of patients it was one that could have been prevented.",
    source: "Forster et al., Annals of Internal Medicine, 2003. 400 patients.",
    href: "https://pubmed.ncbi.nlm.nih.gov/12558354/",
  },
  {
    figure: "12%",
    text: "of adults in the United States have proficient health literacy. 36% are at a basic level or below.",
    source: "National Assessment of Adult Literacy, 2003.",
    href: "https://nces.ed.gov/NAAL/health.asp",
  },
];

export function Why() {
  return (
    <section className="section section--alt" id="why">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            The problem
          </p>
          <h2>Patients go home with instructions they misread.</h2>
          <p className="lead">
            A discharge sheet packs medicines, exercises and warning signs into a page or two of dense text,
            handed over at the moment a patient is least able to take it in.
          </p>
        </div>

        <div className="grid grid-2">
          {STATS.map((s) => (
            <div key={s.figure} className="card stat-card">
              <p className="stat-card__figure">{s.figure}</p>
              <p className="stat-card__text">{s.text}</p>
              <a className="stat-card__source" href={s.href} target="_blank" rel="noreferrer">
                {s.source}
              </a>
            </div>
          ))}
        </div>

        <div className="grid grid-2 compare">
          <div className="card card--flat">
            <p className="eyebrow">Pictures help</p>
            <p className="t-title">Patients given pictogram labels understood and followed their medicines better.</p>
            <p className="t-small">
              A randomized trial with 134 low-literacy patients found higher understanding and adherence in the
              group whose medicines carried pictograms.{" "}
              <a
                className="link"
                href="https://www.ijpsonline.com/articles/development-and-evaluation-of-a-pictogram-for-thai-patients-with-low-literate-skills-3590.html"
                target="_blank"
                rel="noreferrer"
              >
                Indian Journal of Pharmaceutical Sciences, 2019
              </a>
              .
            </p>
          </div>
          <div className="card card--chosen">
            <p className="eyebrow">But only when they are read correctly</p>
            <p className="t-title">In one study, 1 of 12 standard medicine pictograms was understood well enough to pass the ISO bar.</p>
            <p className="t-small">
              A picture that is misread is worse than none. Concord tests every picture before it is shown.{" "}
              <a
                className="link"
                href="https://turkmedline.net/detay/comprehensibility-of-pharmaceutical-pictograms-in-patient-information-leaflets-a-cross-sectional-study-in-ankara-turkiye/019dc352747347da/tr/409"
                target="_blank"
                rel="noreferrer"
              >
                Cross-sectional study, Ankara
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Two readers, one sheet",
    text: "Two models from different companies read the sheet separately. Any field they disagree on is flagged for you to check.",
    icon: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    title: "Code sets the layout",
    text: "The order, the arrows, the calendar and every number are placed by code. The image model only draws single pictures.",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    title: "Every picture is read back",
    text: "Both readers describe the picture in their own words, with no list to choose from. A separate judge checks each description against a written rule for that picture.",
    icon: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M8 12.5l3 3 5-6" />
      </>
    ),
  },
  {
    title: "Wrong pictures are thrown away",
    text: "A picture that fails is redrawn up to three times. Each new attempt is told what the last one got wrong, and drops our style adapter, because the plain model was easier to read in our tests.",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </>
    ),
  },
  {
    title: "Nothing unchecked is shown",
    text: "If no drawing passes, a plain pictogram is drawn straight from the numbers, so the count can't be wrong.",
    icon: (
      <>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4.5" />
      </>
    ),
  },
  {
    title: "Anything unusual stays as text",
    text: "Half tablets, tapering doses and take-as-needed medicines are shown exactly as written and are never drawn.",
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
  },
];

export function HowItIsChecked() {
  return (
    <section className="section" id="check">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            How it is checked
          </p>
          <h2>A picture has to pass a reading test.</h2>
          <p className="lead">
            Image models miscount. A card that shows three pills for a dose of two is dangerous, so no picture
            reaches a patient on trust.
          </p>
        </div>
        <div className="grid grid-3">
          {STEPS.map((s) => (
            <div key={s.title} className="tile">
              <span className="icon-tile">
                <Icon>{s.icon}</Icon>
              </span>
              <div>
                <p className="t-title">{s.title}</p>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PEOPLE: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Doctors, nurses and pharmacists",
    text: "Hand over a sheet the patient can talk you through before they leave the room.",
    icon: (
      <>
        <path d="M6 3v6a4 4 0 0 0 8 0V3M4 3h4M12 3h4" />
        <path d="M10 13v3a5 5 0 0 0 10 0v-1" />
        <circle cx="20" cy="13" r="2" />
      </>
    ),
  },
  {
    title: "Patients",
    text: "See what to take, when to take it and when to come back, without reading a page of small print.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
  {
    title: "Family and carers",
    text: "Keep a parent's medicines straight when you were not in the room for the instructions.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17.5" cy="9" r="2.5" />
        <path d="M17 14.2a5 5 0 0 1 4.5 5" />
      </>
    ),
  },
];

export function WhoItIsFor() {
  return (
    <section className="section" id="who">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            Who it is for
          </p>
          <h2>One card, on both sides of the desk.</h2>
        </div>
        <div className="grid grid-3">
          {PEOPLE.map((p) => (
            <div key={p.title} className="tile">
              <span className="icon-tile">
                <Icon>{p.icon}</Icon>
              </span>
              <div>
                <p className="t-title">{p.title}</p>
                <p>{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Is this medical advice?",
    a: "No. Concord redraws what the sheet says and adds nothing of its own. Check the cards against the sheet, and ask your doctor or pharmacist about anything that is unclear.",
  },
  {
    q: "Has it been tested with patients?",
    a: "Not yet. The read-back uses models as a stand-in for a reader. That catches a wrong drawing, but it is not the same as a patient understanding the card, and that study still has to be done.",
  },
  {
    q: "What happens to the sheet I enter?",
    a: "The text or photo is sent to Google and OpenAI to be read, and this site keeps no copy. The pictures are drawn from generic descriptions such as two tablets or a rising sun, so nothing from your sheet reaches the image model.",
  },
  {
    q: "Which instructions can it draw?",
    a: "Whole-number doses of tablets, capsules, spoonfuls, drops and puffs, the time of day, food, the number of days, six things to avoid, five exercises, ten warning signs and the follow-up date. Everything else is shown as text.",
  },
  {
    q: "What if the two readers disagree about the sheet?",
    a: "You are shown the field and both readings, and asked to check the sheet. The cards are still drawn from the first reading so you can compare.",
  },
];

export function Questions() {
  return (
    <section className="section section--alt" id="questions">
      <div className="container">
        <div className="section-head">
          <h2>Plain answers.</h2>
        </div>
        <div className="faq">
          {QUESTIONS.map((x) => (
            <details key={x.q}>
              <summary>{x.q}</summary>
              <p>{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
