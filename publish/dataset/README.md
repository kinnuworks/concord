---
license: cc-by-4.0
pretty_name: Concord medicine names in 69 languages
task_categories:
  - translation
language:
  - multilingual
tags:
  - medicine
  - health-literacy
  - transliteration
  - rxnorm
  - wikidata
size_categories:
  - 100K<n<1M
---

# Concord medicine names in 69 languages

155,637 medicine names in 69 languages, each one read back by a second model that never saw the English name. It was built for [Concord](https://concord-health.vercel.app), which turns a hospital discharge sheet into picture cards and writes each medicine's name in the patient's own script next to the printed one.

- **Medicines:** 1,830 ingredients of currently prescribable medicines that carry a WHO ATC code, from [RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/) (U.S. National Library of Medicine).
- **Rows:** 126,270 names written by a language model (1,830 in each of 69 languages) and 29,367 names that [Wikidata](https://www.wikidata.org) already has for the same medicines, matched through their RxNorm id.
- **Code:** https://github.com/kinnuworks/concord (`scripts/eval-names.ts`, `scripts/wikidata-labels.ts`, `scripts/wikidata-names.ts`)

## How each name was checked

1. One model (OpenAI GPT-6 Luna) writes the name the way it is written in the language, in its usual script.
2. A second model from another company (a Google Gemini model), given only that name, says which medicine it is.
3. The name is kept when the answer matches the original, letter for letter or within a small spelling difference, and the name does not mix two scripts.

Names from Wikidata go through steps 2 and 3 in the same way.

| | Read back | Kept |
|---|---|---|
| Written by a model | 126,270 | 123,712 |
| From Wikidata | 29,367 | 28,127 |

## Columns

| Column | Meaning |
|---|---|
| `language` | Language code |
| `language_name` | Language name in English |
| `medicine` | The medicine's name in English, as RxNorm gives it |
| `rxcui` | RxNorm concept id |
| `name` | The name in that language |
| `source` | `model` or `wikidata` |
| `read_back` | What the second model said the name was |
| `kept` | Whether the name passed the check |

## Use and limits

The check is done by models. No pharmacist or native speaker has reviewed these names, so treat a kept name as likely right, not certified. Concord shows a name only next to the printed one, never in place of it.

The Wikidata names are CC0. The model-written names and the read-back results are shared under CC BY 4.0.
