import type { ReactNode } from "react";
import { hasLanguage } from "@/lib/labels";
import { LANGUAGE_LIST } from "@/lib/schema";

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

// A figure's source, named and linked, so every number on the page can be checked.
function Source({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="source-tag" href={href} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4.5" />
      </svg>
      {children}
    </a>
  );
}

// A saved picture that has already passed the read-back.
function Pic({ name, alt }: { name: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="mini-pic" src={`/tiles/${name}.png`} alt={alt} loading="lazy" />;
}

function Bar({ label, value, side }: { label: string; value: number; side: "without" | "with" }) {
  return (
    <div className="bar" data-side={side}>
      <span>{label}</span>
      <span className="bar__value">{value}%</span>
      <span className="bar__track">
        <span className="bar__fill" style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

const STATS: { figure: string; text: string; source: string; href: string }[] = [
  {
    figure: "35.7 million",
    text: "hospital admissions a year in the United States. Nearly every one ends with instructions to follow at home.",
    source: "American Hospital Association, 2024 survey",
    href: "https://www.aha.org/statistics/fast-facts-us-hospitals",
  },
  {
    figure: "1.5 million",
    text: "people a year go to a United States emergency department because of harm from a medicine. Almost 500,000 of them need a hospital stay.",
    source: "CDC, Medication Safety",
    href: "https://www.cdc.gov/medication-safety/data-research/facts-stats/index.html",
  },
  {
    figure: "78%",
    text: "of emergency patients went home with a gap in understanding their care or instructions in at least one area. Most did not know they had one.",
    source: "Engel et al., Annals of Emergency Medicine, 2009",
    href: "https://psnet.ahrq.gov/issue/patient-comprehension-emergency-department-care-and-instructions-are-patients-aware-when-they",
  },
  {
    figure: "19%",
    text: "of patients had an adverse event in the weeks after leaving hospital. Two thirds of those events were caused by a medicine.",
    source: "Forster et al., Annals of Internal Medicine, 2003",
    href: "https://pubmed.ncbi.nlm.nih.gov/12558354/",
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
          <h2>Patients can read the label and still take the wrong dose.</h2>
          <p className="lead">
            Researchers showed this label to 395 adults at primary care clinics in three states, then asked them
            to count out the pills.
          </p>
        </div>

        <div className="card label-demo">
          <div className="label-demo__sides">
            <div className="rxlabel">
              <p className="rxlabel__head">Prescription label</p>
              <p className="rxlabel__text">Take two tablets by mouth twice daily.</p>
            </div>
            <div className="pictured">
              <p className="rxlabel__head">The same instruction on a Concord card</p>
              <div className="pictured__row">
                <div className="pictured__slot">
                  <Pic name="time-morning" alt="Morning" />
                  <span className="pictured__dose">
                    <Pic name="unit-tablet" alt="One tablet" />
                    <Pic name="unit-tablet" alt="One tablet" />
                  </span>
                </div>
                <div className="pictured__slot">
                  <Pic name="time-night" alt="Night" />
                  <span className="pictured__dose">
                    <Pic name="unit-tablet" alt="One tablet" />
                    <Pic name="unit-tablet" alt="One tablet" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="label-demo__result">
            <p className="t-title">Among patients with low literacy</p>
            <div className="bars">
              <Bar label="Could say the instruction back" value={71} side="without" />
              <Bar label="Could count out the pills for a day" value={35} side="without" />
            </div>
            <p className="t-small">Across everyone in the study, 46% misread at least one of five labels.</p>
            <Source href="https://pubmed.ncbi.nlm.nih.gov/17135578/">Davis et al., Annals of Internal Medicine, 2006</Source>
          </div>
        </div>

        <div className="grid grid-2 stat-grid">
          {STATS.map((s) => (
            <div key={s.figure} className="card stat-card">
              <p className="stat-card__figure">{s.figure}</p>
              <p className="stat-card__text">{s.text}</p>
              <Source href={s.href}>{s.source}</Source>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TRIALS: {
  title: string;
  measure: string;
  without: [label: string, value: number];
  with: [label: string, value: number];
  note: string;
  source: string;
  href: string;
}[] = [
  {
    title: "Remembering what was said",
    measure: "Spoken medical instructions recalled",
    without: ["Spoken only", 14],
    with: ["Spoken with pictures", 85],
    note: "In a second study, adults who read below a fifth-grade level recalled 85% straight away and 71% four weeks later.",
    source: "Houts et al., Patient Education and Counseling, 1998 and 2001",
    href: "https://pubmed.ncbi.nlm.nih.gov/10026551/",
  },
  {
    title: "Giving a child the right dose",
    measure: "Parents and carers who measured a daily liquid medicine wrong",
    without: ["Standard counselling", 47.8],
    with: ["Picture instruction sheets", 5.4],
    note: "A randomized trial with 245 caregivers. Missed doses fell too, from 38% of families to 9%.",
    source: "Yin et al., Archives of Pediatrics and Adolescent Medicine, 2008",
    href: "https://pubmed.ncbi.nlm.nih.gov/18762597/",
  },
  {
    title: "Understanding the discharge sheet",
    measure: "Emergency patients who got at least five of ten answers right",
    without: ["Text only", 43],
    with: ["Text with illustrations", 65],
    note: "A randomized, blinded study with 101 patients. The gain was largest among patients with no more than a high school education.",
    source: "Austin et al., Annals of Emergency Medicine, 1995",
    href: "https://pubmed.ncbi.nlm.nih.gov/7532382/",
  },
];

export function PicturesWork() {
  return (
    <section className="section" id="evidence">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            What pictures change
          </p>
          <h2>People remember pictures.</h2>
          <p className="lead">
            A picture asks for no reading level and no shared language. Trials that added pictures to medical
            instructions measured the difference.
          </p>
        </div>

        <div className="grid grid-3">
          {TRIALS.map((t) => (
            <div key={t.title} className="card trial">
              <p className="t-title">{t.title}</p>
              <p className="t-small">{t.measure}</p>
              <div className="bars">
                <Bar label={t.without[0]} value={t.without[1]} side="without" />
                <Bar label={t.with[0]} value={t.with[1]} side="with" />
              </div>
              <p className="t-small">{t.note}</p>
              <Source href={t.href}>{t.source}</Source>
            </div>
          ))}
        </div>

        <div className="grid grid-2 compare">
          <div className="card card--flat">
            <p className="eyebrow">Across the research</p>
            <p className="t-title">Pictures improve recall, understanding and how well people keep to their medicines.</p>
            <p className="t-small">
              A review of the published studies found the gain is largest for patients who find reading hard.
            </p>
            <Source href="https://pubmed.ncbi.nlm.nih.gov/17106013/">
              Katz, Kripalani and Weiss, American Journal of Health-System Pharmacy, 2006
            </Source>
          </div>
          <div className="card card--chosen">
            <p className="eyebrow">But only when they are read correctly</p>
            <p className="t-title">In one study, 1 of 12 standard medicine pictograms was understood well enough to pass the ISO bar.</p>
            <p className="t-small">
              A picture that is misread is worse than none. Concord tests every picture before it is shown.
            </p>
            <Source href="https://turkmedline.net/detay/comprehensibility-of-pharmaceutical-pictograms-in-patient-information-leaflets-a-cross-sectional-study-in-ankara-turkiye/019dc352747347da/tr/409">
              Cross-sectional study, Ankara
            </Source>
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
    text: "Both readers describe the picture in their own words, with no list to choose from. A separate judge decides whether each one understood it.",
    icon: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M8 12.5l3 3 5-6" />
      </>
    ),
  },
  {
    title: "Wrong pictures are thrown away",
    text: "A picture that fails is redrawn up to three times, and each new attempt is told what the last one got wrong.",
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
    <section className="section section--alt" id="check">
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

const OFFERED = LANGUAGE_LIST.filter(([code]) => hasLanguage(code)).length;

const PEOPLE: { title: string; figure: string; text: string; help: string; pics: [name: string, alt: string][]; sources: [name: string, href: string][]; icon: ReactNode }[] = [
  {
    title: "Older adults",
    pics: [["time-morning", "Morning"], ["unit-tablet", "One tablet"], ["unit-tablet", "One tablet"]],
    figure: "61.2 million",
    text: "people in the United States are 65 or older. They go to an emergency department for harm from a medicine more than 600,000 times a year, over twice as often as younger people.",
    help: "Large pictures, one fact each, and a speaker button that reads the card aloud.",
    sources: [
      ["U.S. Census Bureau, 2024", "https://data.census.gov/table/ACSST1Y2024.S0101"],
      ["CDC", "https://www.cdc.gov/medication-safety/data-research/facts-stats/index.html"],
    ],
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
  {
    title: "People who find reading hard",
    pics: [["meal", "A meal"], ["unit-capsule", "One capsule"], ["avoid-alcohol", "No alcohol"]],
    figure: "739 million",
    text: "adults worldwide lack basic literacy skills. In the United States, 28% of adults aged 16 to 65 score at the lowest literacy level.",
    help: "The dose, the time of day and the food rule are all pictures. No sentence has to be read.",
    sources: [
      ["UNESCO, 2025", "https://www.unesco.org/sites/default/files/medias/fichiers/2025/09/ild-2025-factsheet.pdf"],
      ["NCES, PIAAC 2023", "https://nces.ed.gov/surveys/piaac/2023/national_results.asp"],
    ],
    icon: (
      <>
        <path d="M2 5h7a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H2V5z" />
        <path d="M22 5h-7a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H22V5z" />
      </>
    ),
  },
  {
    title: "People who read another language",
    pics: [["time-night", "Night"], ["unit-drops", "One drop"], ["avoid-driving", "No driving"]],
    figure: "28.9 million",
    text: "people in the United States speak English less than very well.",
    help: `Cards come in ${OFFERED} languages, with the medicine's name written in the patient's own script next to the printed one.`,
    sources: [["U.S. Census Bureau, 2024", "https://data.census.gov/table/ACSST1Y2024.S1601"]],
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  {
    title: "Family and carers",
    pics: [["warning-fever", "Fever"], ["warning-swelling", "Swelling"], ["warning-chest_pain", "Chest pain"]],
    figure: "63 million",
    text: "Americans care for a relative with a medical condition or disability, close to one adult in four.",
    help: "Keep a parent's medicines straight when you were not in the room for the instructions.",
    sources: [["AARP and National Alliance for Caregiving, 2025", "https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html"]],
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
    <section className="section section--alt" id="who">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">
            <span className="dot" />
            Who it helps
          </p>
          <h2>Built for the people a page of text leaves behind.</h2>
          <p className="lead">
            A picture asks for no reading level and no English. For tens of millions of people that decides
            whether the medicine is taken right.
          </p>
        </div>
        <div className="grid grid-2">
          {PEOPLE.map((p) => (
            <div key={p.title} className="card stat-card person">
              <p className="person__who">
                <span className="icon-tile">
                  <Icon>{p.icon}</Icon>
                </span>
                {p.title}
              </p>
              <p className="stat-card__figure">{p.figure}</p>
              <p className="stat-card__text">{p.text}</p>
              <div className="person__help">
                <span className="person__pics">
                  {p.pics.map(([name, alt], i) => (
                    <Pic key={i} name={name} alt={alt} />
                  ))}
                </span>
                <p>{p.help}</p>
              </div>
              <p className="person__sources">
                {p.sources.map(([name, href]) => (
                  <Source key={name} href={href}>
                    {name}
                  </Source>
                ))}
              </p>
            </div>
          ))}
        </div>
        <div className="tile person-desk">
          <span className="icon-tile">
            <Icon>
              <path d="M6 3v6a4 4 0 0 0 8 0V3M4 3h4M12 3h4" />
              <path d="M10 13v3a5 5 0 0 0 10 0v-1" />
              <circle cx="20" cy="13" r="2" />
            </Icon>
          </span>
          <div>
            <p className="t-title">And on the other side of the desk</p>
            <p>Doctors, nurses and pharmacists hand over a sheet the patient can talk them through before leaving the room.</p>
          </div>
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
    q: "How do you know a picture is right?",
    a: "Two vision models from different companies look at it with no hint and no list of answers, and say what they see. A separate judge compares each description with what the picture was meant to say. Both readers have to get it, or the picture is thrown away and drawn again.",
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
    <section className="section" id="questions">
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

const REFERENCES: [text: string, href: string][] = [
  ["Davis TC, et al. Literacy and misunderstanding prescription drug labels. Annals of Internal Medicine, 2006.", "https://pubmed.ncbi.nlm.nih.gov/17135578/"],
  ["Engel KG, et al. Patient comprehension of emergency department care and instructions. Annals of Emergency Medicine, 2009.", "https://psnet.ahrq.gov/issue/patient-comprehension-emergency-department-care-and-instructions-are-patients-aware-when-they"],
  ["Forster AJ, et al. The incidence and severity of adverse events affecting patients after discharge from the hospital. Annals of Internal Medicine, 2003.", "https://pubmed.ncbi.nlm.nih.gov/12558354/"],
  ["American Hospital Association. Fast facts on U.S. hospitals, from the 2024 annual survey.", "https://www.aha.org/statistics/fast-facts-us-hospitals"],
  ["Centers for Disease Control and Prevention. Medication safety data, 2024.", "https://www.cdc.gov/medication-safety/data-research/facts-stats/index.html"],
  ["Houts PS, et al. Using pictographs to enhance recall of spoken medical instructions. Patient Education and Counseling, 1998.", "https://pubmed.ncbi.nlm.nih.gov/10026551/"],
  ["Houts PS, et al. Using pictographs to enhance recall of spoken medical instructions II. Patient Education and Counseling, 2001.", "https://pubmed.ncbi.nlm.nih.gov/11384821/"],
  ["Yin HS, et al. Randomized controlled trial of a pictogram-based intervention to reduce liquid medication dosing errors. Archives of Pediatrics and Adolescent Medicine, 2008.", "https://pubmed.ncbi.nlm.nih.gov/18762597/"],
  ["Austin PE, et al. Discharge instructions: do illustrations help our patients understand them? Annals of Emergency Medicine, 1995.", "https://pubmed.ncbi.nlm.nih.gov/7532382/"],
  ["Katz MG, Kripalani S, Weiss BD. Use of pictorial aids in medication instructions: a review of the literature. American Journal of Health-System Pharmacy, 2006.", "https://pubmed.ncbi.nlm.nih.gov/17106013/"],
  ["U.S. Census Bureau. American Community Survey 2024, table S0101: age and sex.", "https://data.census.gov/table/ACSST1Y2024.S0101"],
  ["U.S. Census Bureau. American Community Survey 2024, table S1601: language spoken at home.", "https://data.census.gov/table/ACSST1Y2024.S1601"],
  ["National Center for Education Statistics. PIAAC 2023, United States results.", "https://nces.ed.gov/surveys/piaac/2023/national_results.asp"],
  ["UNESCO. Youth and adult literacy factsheet, International Literacy Day 2025.", "https://www.unesco.org/sites/default/files/medias/fichiers/2025/09/ild-2025-factsheet.pdf"],
  ["AARP and National Alliance for Caregiving. Caregiving in the US 2025.", "https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html"],
];

export function References() {
  return (
    <section className="section section--alt references" id="sources">
      <div className="container">
        <p className="eyebrow">
          <span className="dot" />
          Sources
        </p>
        <ol>
          {REFERENCES.map(([text, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer">
                {text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
