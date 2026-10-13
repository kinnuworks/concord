# Seven in ten could read the label. One in three could take the right dose.

*Post this on dev.to, Medium or LinkedIn under your own name. Suggested tags: healthtech, ai, opensource, accessibility. Attach `docs/cards.png` as the cover and `docs/gallery/` images where marked.*

In 2006, researchers handed 395 adults a pill bottle. The label said "Take two tablets by mouth twice daily." Then they asked each person to count out the pills they would take in a day.

Among patients with low literacy, 71% could say the instruction back. Only 35% could count out the right number of pills ([Davis et al., Annals of Internal Medicine](https://pubmed.ncbi.nlm.nih.gov/17135578/)).

I keep coming back to that gap. People could read the words and still take the wrong dose.

## A page of labels like that one

A hospital discharge sheet is a page or two of instructions like that label, handed over when a patient is tired, unwell and about to leave. There are about 35.7 million hospital admissions a year in the United States ([American Hospital Association](https://www.aha.org/statistics/fast-facts-us-hospitals)). The CDC counts more than 1.5 million emergency visits a year for harm from a medicine ([CDC](https://www.cdc.gov/medication-safety/data-research/facts-stats/index.html)).

Some people are hit harder than others:

- 61.2 million people in the United States are 65 or older ([Census Bureau](https://data.census.gov/table/ACSST1Y2024.S0101)). They land in an emergency department for a medicine problem more than twice as often as younger people.
- 28.9 million speak English less than very well ([Census Bureau](https://data.census.gov/table/ACSST1Y2024.S1601)).
- 28% of adults aged 16 to 65 score at the lowest literacy level ([NCES](https://nces.ed.gov/surveys/piaac/2023/national_results.asp)).

## Pictures work

This part surprised me most. The evidence for pictures is old and strong.

In one study, people remembered 14% of spoken medical instructions. With pictographs next to the same instructions, they remembered 85% ([Houts et al.](https://pubmed.ncbi.nlm.nih.gov/10026551/)). In a randomized trial with 245 caregivers, picture instruction sheets cut the share of parents who measured a child's medicine wrong from 47.8% to 5.4% ([Yin et al.](https://pubmed.ncbi.nlm.nih.gov/18762597/)).

So why doesn't every patient get pictures? Because someone has to draw them, for every medicine, dose and language.

## Image models can draw them. They also miscount.

An image model will draw a pictogram for any instruction you give it. I tried it for a hackathon. I asked for one spoonful of medicine and got eight spoons. Across 168 pictures of whole doses, the model drew the wrong number of pills 83 times.

On a medicine card, a picture with three pills for a dose of two is worse than no picture.

## Concord: every picture has to pass a reading test

So I built Concord around one rule. A generated picture is shown to a patient only after two other models, from two different companies, have looked at it with no hint and said in their own words what it shows. If they misread it, it is thrown away and drawn again.

The image model is never asked to count. It draws one pill. The check confirms it is exactly one. Code repeats it for the dose, so the number on a card is exact.

*[image: docs/gallery/2 or the "red sock" example]*

The check earns its place. Asked for a swollen foot, the model drew something both readers called "a red sock". That picture never reached a card.

## The same card in 70 languages

A picture needs no translation. The words around it do, so they go through the same kind of check. One model writes the label or the medicine's name in the patient's language. A second model, which never saw the English, reads it back.

I ran that on every prescribable medicine with a WHO classification code: 1,830 medicines in 69 languages, 126,270 names. 98% came back as the same medicine. The ones that did not stay in Latin letters on the card.

So a patient who reads Hindi sees "Metformin 500 mg" and, under it, "मेटफॉर्मिन 500 mg".

## Try it

Concord is free, needs no account, and the code is open.

- Live: https://concord-health.vercel.app
- Code: https://github.com/kinnuworks/concord

It is a reading aid. It redraws what the sheet says and adds no medical advice. The next step is a comprehension study with patients and a pharmacist, and if you work in a pharmacy or on a ward I would like to hear from you.
