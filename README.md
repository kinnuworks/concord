# Concord

Visual discharge instructions, verified before the patient sees them.

**Live site:** https://concord-health.vercel.app
**Built for:** Banana Hacks 2026 (image AI), solo, 9 to 12 October 2026

Concord turns a hospital discharge sheet into picture cards a patient can follow. An image model draws the pictures. Before a picture is shown, two other models have to look at it and say, in their own words, what it shows. If they get it wrong, the picture is thrown away and drawn again.

![A set of Concord cards](docs/cards.png)

## The problem

A discharge sheet packs medicines, exercises and warning signs into a page or two of dense text. Published studies put numbers on what happens next:

- 78% of emergency patients went home with a gap in understanding their care or instructions in at least one area, and most did not know it ([Engel et al., 2009](https://psnet.ahrq.gov/issue/patient-comprehension-emergency-department-care-and-instructions-are-patients-aware-when-they), 140 patients).
- 46% of patients misread at least one of five prescription labels ([Davis et al., 2006](https://psnet.ahrq.gov/issue/literacy-and-misunderstanding-prescription-drug-labels), 395 patients).
- 19% of patients had an adverse event in the weeks after leaving hospital, and for 6% it was preventable ([Forster et al., 2003](https://pubmed.ncbi.nlm.nih.gov/12558354/), 400 patients).

Pictures help. In a randomized trial, low-literacy patients given pictogram labels understood and followed their medicines better ([trial, 2019](https://www.ijpsonline.com/articles/development-and-evaluation-of-a-pictogram-for-thai-patients-with-low-literate-skills-3590.html)). But a picture only helps if it is read correctly, and in one study just 1 of 12 standard medicine pictograms met the ISO bar for being understood ([study](https://turkmedline.net/detay/comprehensibility-of-pharmaceutical-pictograms-in-patient-information-leaflets-a-cross-sectional-study-in-ankara-turkiye/019dc352747347da/tr/409)).

An image generator can draw a pictogram for any instruction. It also miscounts pills, which a patient cannot afford. Concord is built around that fact.

## What it does

Paste the text of a discharge sheet, or photograph it. Concord returns:

- **A card for each medicine.** The four parts of the day always appear in the same order, with the dose under the times it is taken. Below that are the food rule, a calendar with one box per day, and anything to avoid.
- **Exercise cards** with a figure at the prescribed angle and the angle written on it.
- **A warning card** for the symptoms that should bring the patient back.
- **A follow-up card** with the date.

Labels come in nine languages: English, Spanish, Chinese, Tagalog, Vietnamese, Arabic, Hindi, Telugu and Tamil. A card can be read aloud or printed. Anything the sheet says that the cards cannot hold (half tablets, tapering doses, "as needed") is shown as text and never drawn.

## How it works

| Step | What happens | Who decides |
|---|---|---|
| 1. Read the sheet | Two models from different vendors read the text or photo separately into a fixed structure. | Any field they disagree on is flagged for the user. |
| 2. Lay out the cards | Order, arrows, numbers, the calendar and the labels are placed by code. | Code. The image model never writes a number. |
| 3. Draw | FLUX.1 [dev] with a style adapter we trained draws one fact per picture: a time of day, one unit of a medicine, a meal, a thing to avoid, a symptom. | The image model, under the checks below. |
| 4. Read back | Two vision models are shown the picture with no hint and no list to choose from, and describe it in their own words. A separate text-only judge decides whether each reader understood it. Pills are counted. | Both readers must pass. |
| 5. Redraw or fall back | A failed picture is redrawn up to three times. Each attempt is told what the last one got wrong. If none passes, the card uses a plain pictogram drawn by code. | Code. Nothing unchecked is shown. |

A picture that passes is saved and reused, so "morning" is drawn and checked once.

### Where the image model works

- **Every pictogram on a card is generated.** FLUX.1 [dev] with our LoRA adapter draws each time of day, each medicine unit, the meal, each thing to avoid and each warning sign.
- **Code writes the prompt.** It is built from the parsed instruction ("one red and white capsule, alone in the middle of the picture"), so nothing from a patient's sheet reaches the image model.
- **Vision models read every generated picture back** before it can be used.
- **Code composes the card.** It repeats the checked unit for the dose, puts the pictures in schedule order and writes the numbers and labels.

The site has a section, "Where the image model works", that follows real pictures from prompt to card.

### The style adapter

The plain model returns a different drawing style for almost every picture. We trained a LoRA adapter on 70 [OpenMoji](https://openmoji.org) pictograms with written captions (1,000 steps, 218 seconds on fal) so every picture shares one flat, outlined look. The training set is in [`training/`](training/) and the recipe is [`scripts/train.ts`](scripts/train.ts).

## What we measured

<!-- results:start -->
540 pictures were drawn for a fixed set of 100 written instructions, and both readers read every one.

| What was measured | Result |
|---|---|
| Whole doses an image model on its own drew with the wrong number of pills | 83 of 168 |
| Single-unit pictures that passed the read-back on the first try | 58 of 60 |
| Pictures both readers called a flat outlined pictogram, before our adapter | 56 of 270 (21%) |
| The same, with our adapter | 210 of 270 (78%) |
| Written instructions the sheet reader got right | 100 of 100 |

The read-back earns its place on warning signs. One "fever" picture came back as "a person's face with red tears and blue drool". A "swollen foot" came back as "a red sock". The check stopped both before they reached a card, and the site shows them next to the pictures it kept.
<!-- results:end -->

Everything above is reproducible from the scripts in [`scripts/`](scripts/). The raw readings for every picture are in [`training/eval/`](training/eval/).

## Design decisions the measurements drove

1. **Code counts, the model draws.** Asked for a whole dose in one picture, the image model got the number wrong about half the time. Concord asks for one unit, checks that it is exactly one, and repeats it by code. The count on a card is exact by construction.
2. **Readers describe, they do not choose.** Given a list of answers, a reader can land on the right one by elimination. Concord's readers get no list. They say what they see, and a separate judge compares that with what the picture was meant to say.
3. **Angles are exact.** Exercise figures are drawn by code at the prescribed angle, like the calendar and the numbers.
4. **Style and meaning are separate jobs.** Our adapter gives a set of cards one look: 78% of pictures read as flat pictograms, up from 21%. The first attempt at a picture is drawn in that style. If the readers cannot read it, the redraw goes to the plain model, because meaning comes before style.

## Scope

Concord redraws what a sheet says. It is a reading aid: it gives no medical advice and does not check whether a dose is appropriate. The next step is a comprehension study with patients and a pharmacist.

## Run it

```bash
pnpm install
cp .env.example .env.local   # add GEMINI_API_KEY, OPENAI_API_KEY, FAL_KEY
pnpm dev
```

The site draws from a saved set of pictures that have already passed the read-back. Set `NEXT_PUBLIC_LIVE_DRAWING=1` to add a switch that draws every picture again through the full generate, read back and redraw loop.

| Script | What it does |
|---|---|
| `scripts/train.ts` | Trains the style adapter |
| `scripts/testset.ts` | Builds the 100-instruction test set |
| `scripts/eval-parse.ts` | Measures the sheet reader |
| `scripts/eval-tiles.ts` | Draws every tile several times and records the readings |
| `scripts/eval-style.ts` | Labels drawing style and judges the saved descriptions again |
| `scripts/audit-library.ts` | Re-checks the saved picture library |
| `scripts/labels.ts` | Translates labels and keeps those that survive a round trip |
| `scripts/report.ts` | Compiles the numbers shown on the site |

## Credits and licences

- **Pictures:** FLUX.1 [dev] by Black Forest Labs, run and fine-tuned on [fal](https://fal.ai).
- **Training set:** [OpenMoji](https://openmoji.org), CC BY-SA 4.0. The adapter and the pictures in `public/tiles/` are derived from it and are shared under the same licence.
- **Readers:** Gemini 3.8 Flash and Gemini 2.5 Flash (Google), GPT-6 Luna (OpenAI). Gemini 3.5 Flash-Lite is the last fallback for reading a sheet when the others are busy.
- **Libraries:** Next.js, React, zod, the fal, Google GenAI and OpenAI clients.
- **Evidence:** the studies linked above.

### AI tools used

The hackathon rules ask entrants to name these. Code was written with the help of Claude Code. The product itself uses the image and language models listed under Credits.

The code in this repository is MIT licensed.
