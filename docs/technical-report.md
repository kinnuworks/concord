# Concord: read-back verification of generated pictograms for medicine instructions

**Dhiraj Kavuri**  
Technical report, version 1.0, 13 October 2026. Not peer reviewed.  
Code: https://github.com/kinnuworks/concord · Live: https://concord-health.vercel.app

## Abstract

Patients often misunderstand written medicine instructions, and trials show that pictures help. An image model can draw a pictogram for any instruction, but it cannot be trusted to draw the right one: asked for a whole dose in one picture, the model we tested drew the wrong number of units in 83 of 168 pictures. Concord turns a hospital discharge sheet into picture cards and shows a generated picture only after two vision models from different companies, given no hint, have described it and a text-only judge has found both descriptions to carry the intended meaning. We describe the system and report measurements on 540 generated pictures, 100 written instructions, 2,484 translated card labels and 155,637 medicine names in 69 languages.

## 1. Background

In a study of 395 adults shown the label "Take two tablets by mouth twice daily", 70.7% of patients with low literacy could state the instruction and 34.7% could count out the pills for a day [1]. After discharge, 19% of patients in one cohort had an adverse event, two thirds of them caused by a medicine [2], and 78% of emergency patients in another had a gap in understanding their care [3].

Pictures reduce this. Recall of spoken medical instructions rose from 14% to 85% when pictographs accompanied them [4], and adults reading below a fifth-grade level recalled 85% of 236 instructions immediately and 71% after four weeks [5]. In a randomized trial with 245 caregivers, pictogram instruction sheets cut errors in a child's daily liquid dose from 47.8% to 5.4% [6]. Illustrated discharge instructions raised the share of emergency patients answering at least five of ten questions correctly from 43% to 65% [7]. A review found the benefit largest for patients with low literacy [8].

A fixed pictogram library cannot cover every instruction, form and warning sign. A generative model can, if its output is checked.

## 2. System

**Reading the sheet.** Two language models from different companies read the typed or photographed sheet separately into a fixed schema (medicines with form, whole-number count, times of day, food rule, days and things to avoid; exercises; warning signs; follow-up). Fields on which they disagree are shown to the user. Anything the schema cannot hold, such as a half tablet or a tapering dose, stays as text and is never drawn.

**Layout by code.** Card order, arrows, the calendar, numbers and exercise angles are placed by code. The image model draws single subjects only: one unit of a medicine, a time of day, a meal, a thing to avoid, a warning sign.

**Generation.** Prompts are built by code from the parsed fields, so no text from the patient's sheet reaches the image model. Pictures are drawn by FLUX.1 [dev] with a LoRA style adapter trained on 70 OpenMoji pictograms with captions (1,000 steps, learning rate 0.0005).

**Read-back.** Two vision models (one from Google, one from OpenAI) receive the picture with no hint and no list of answers. For a medicine unit they report the form and the count. For other pictures they describe what they see in their own words, and a text-only judge decides whether each description carries the intended meaning. Both readers must pass.

**Redraw and fallback.** A failed picture is redrawn up to three times, each attempt told what the last one got wrong. The first attempt uses the adapter and redraws use the plain model. If none passes, the card uses a plain pictogram drawn by code. A picture that passes is saved and reused.

**Counting.** The model is never asked to draw a dose. It draws one unit, the readers confirm it is exactly one, and code repeats it. Sixteen checked pictures (five units, four times of day, a meal, six things to avoid) therefore compose into 5 × 6 × 15 × 4 × 64 = 115,200 distinct medicine cards with an exact count on each.

**Languages.** Card labels and medicine names are checked in the same way as pictures: one model writes, a model from another company reads back without seeing the original, and the result is kept only if the meaning or the name survives.

## 3. Evaluation

### 3.1 Pictures

We generated 540 pictures for a fixed set of subjects drawn from 100 written instructions: 270 with the plain model and 270 with the adapter, with no check in the way. Both readers read every picture.

| Kind of picture | Pictures | Passed both readers |
|---|---|---|
| Whole dose (1 to 6 units in one picture) | 168 | 85 |
| Single unit | 60 | 58 |
| Time of day | 48 | 33 |
| Meal | 12 | 12 |
| Thing to avoid | 72 | 61 |
| Warning sign | 120 | 50 |
| Exercise figure | 60 | 32 |
| All | 540 | 331 |

Of the 209 pictures that failed, 85 had the wrong count, in 51 the two readers disagreed, in 45 neither reader described the intended meaning, and 28 exercise figures had unclear limbs.

Two results shaped the design. First, whole doses failed in 83 of 168 pictures while single units passed in 58 of 60, so the system draws one unit and repeats it in code. Second, exercise figures and counts are better drawn by code than by the model, so they are.

**Style adapter.** Each reader also labelled the drawing style of every picture. Both called it a flat outlined pictogram for 56 of 270 plain-model pictures (21%) and 210 of 270 adapter pictures (78%). The adapter did not improve meaning: 184 of 270 plain-model pictures passed the read-back on the first try against 147 of 270 with the adapter. For this reason the first attempt uses the adapter and a redraw uses the plain model. On the ten warning signs, that rule lowers the expected share that falls back to a code-drawn pictogram from 53.2% to 22.7%.

### 3.2 Sheet reader

On 100 written instructions with known answers, the parsed result was correct for all 100. The two readers agreed on 96. The other four were flagged for the user, and the reading shown was still the correct one.

### 3.3 Card labels

Thirty-six card labels were translated into 69 languages. A label was kept only if a second model's back-translation was judged to have the same meaning, and the four times of day had to be four different words. 2,469 of 2,484 labels were kept, and every language retained at least 34 of 36. One systematic error was found by inspection and corrected: "checked by two readers" had been rendered in many languages as "two people", so the source label was changed to "two AI models" and translated again.

### 3.4 Medicine names

We took every ingredient of a currently prescribable medicine in RxNorm that carries a WHO ATC code (1,830 medicines) and wrote each name in 69 languages, 126,270 names. A second model, given only the written name, was asked which medicine it is. A name was kept when the answer matched the original within a small spelling difference and the name did not mix two scripts.

| | Read back | Kept |
|---|---|---|
| Written by a model | 126,270 | 123,712 (98.0%) |
| Taken from Wikidata | 29,367 | 28,127 (95.8%) |

By language, the share kept ranged from 86.2% (Thai) to 100% (Igbo), with a median of 98.4%, and 59 of 69 languages were at or above 97%.

Wikidata entries were matched to medicines through their RxNorm id. Where both a model-written name and a Wikidata name passed, they were identical in 20,866 of 27,983 cases and within a few letters in 25,063. Many of the remaining differences are cases where the United States name differs from the name used locally, such as acetaminophen and paracetamol. The cards use the Wikidata name where one passed (22,199 names) and the model-written name otherwise.

### 3.5 Software checks

The repository has 56 automated tests that run on every commit. They include the properties the safety argument rests on: no card ever requests a whole-dose picture, a non-integer dose is refused, and every saved picture was checked by two readers. On the live site, Lighthouse reports 100 in all four categories on desktop and axe-core reports no WCAG 2.1 AA violations.

## 4. Limitations

No patient has yet been tested with these cards, so the comprehension benefit is inferred from the literature and not measured here. Every check in this report is one model checking another; two vision models from different companies can still share a mistake, and the text-only judge is strict in some borderline cases. The adapter was trained on 70 images. The medicine names have not been reviewed by a pharmacist or by native speakers, and Wikidata labels vary in quality. Pictures drawn live on the public site come from a different image model (OpenAI gpt-image-2.5-flare) than the evaluated one, though they pass through the same read-back. Concord restates what a sheet says and does not judge whether a dose is appropriate.

The next step is a comprehension study with patients and a pharmacist, comparing the text sheet with the cards.

## 5. Availability

- Code, scripts and raw readings for every picture and name: https://github.com/kinnuworks/concord (MIT)
- Style adapter: https://huggingface.co/heykinnu/concord-pictogram-lora
- Medicine names with read-back results (155,637 rows): https://huggingface.co/datasets/heykinnu/concord-medicine-names
- All 540 evaluation pictures with both readers' descriptions: the "Every picture" section of the live site

## References

1. Davis TC, et al. Literacy and misunderstanding prescription drug labels. Annals of Internal Medicine, 2006. PMID 17135578.
2. Forster AJ, et al. The incidence and severity of adverse events affecting patients after discharge from the hospital. Annals of Internal Medicine, 2003. PMID 12558354.
3. Engel KG, et al. Patient comprehension of emergency department care and instructions. Annals of Emergency Medicine, 2009.
4. Houts PS, et al. Using pictographs to enhance recall of spoken medical instructions. Patient Education and Counseling, 1998. PMID 10026551.
5. Houts PS, et al. Using pictographs to enhance recall of spoken medical instructions II. Patient Education and Counseling, 2001. PMID 11384821.
6. Yin HS, et al. Randomized controlled trial of a pictogram-based intervention to reduce liquid medication dosing errors and improve adherence among caregivers of young children. Archives of Pediatrics and Adolescent Medicine, 2008. PMID 18762597.
7. Austin PE, et al. Discharge instructions: do illustrations help our patients understand them? Annals of Emergency Medicine, 1995. PMID 7532382.
8. Katz MG, Kripalani S, Weiss BD. Use of pictorial aids in medication instructions: a review of the literature. American Journal of Health-System Pharmacy, 2006. PMID 17106013.
