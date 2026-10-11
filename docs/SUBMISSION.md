# Devpost submission

Everything to paste into Devpost, then the video script.

## Fields

**Project name:** Concord

**Tagline:** Visual discharge instructions, verified before the patient sees them.

**Try it out links**

- https://concord-beryl.vercel.app
- https://github.com/kinnuworks/concord

**Built with:** nextjs, typescript, react, fal, flux, lora, gemini, openai, openmoji, vercel

**AI tools used (the rules ask for this):** Claude Code for writing code. FLUX.1 [dev] with our own LoRA adapter for the pictures. Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 3.5 Flash-Lite and GPT-6 Luna as readers.

## Write-up

Paste this into the "About the project" box. It is under 500 words.

```markdown
## Inspiration

A discharge sheet is a page of dense text handed to someone who is unwell and about to go home. In one study, 78% of emergency patients left with a gap in understanding their care.

Pictures help, and an image model can now draw one for any instruction. It also draws three pills when the dose is two. I wanted to know whether generated pictures could be made safe enough to hand to a patient.

## What it does

Concord takes a discharge sheet, typed or photographed, and returns picture cards. Each medicine gets a card with a morning-to-night schedule, the dose under each time, the food rule, a box for every day, and things to avoid. Exercises, warning signs and the next visit get cards too. Labels come in seven languages, and a card can be read aloud or printed.

## How I built it

Two models from different companies read the sheet separately, and any field they disagree on is flagged. Code lays out every card and writes every number. FLUX.1 [dev], with a LoRA style adapter I trained on 70 OpenMoji pictograms, draws one fact per picture.

Two vision models look at each picture with no hint and no list of answers, and describe it in their own words. A text-only judge checks each description against a written rule. A picture that fails is redrawn up to three times. If none passes, code draws a plain pictogram.

## What I measured

I drew 540 pictures for 100 test instructions, and the numbers changed the design.

- Asked for a whole dose in one picture, the generator miscounted 83 times out of 168. Concord now asks for one unit, checks that it is exactly one, and repeats it by code.
- My first check was multiple choice. It passed a smiling man as "strong pain", so I replaced it with free description.
- Generated exercise figures failed too often. Code draws them at the prescribed angle.
- The adapter gave the cards one look: pictures both readers call a flat pictogram went from 21% to 78%. It also made warning signs harder to read (12 of 60 passed first time, against 30 of 60 without it), so a redraw now drops the adapter.

The sheet reader got 100 of 100 test instructions right.

## Resources

FLUX.1 [dev] and LoRA training on fal. Gemini 3.8 Flash, Gemini 2.5 Flash and GPT-6 Luna as readers. OpenMoji (CC BY-SA 4.0) as the training set. Code written with Claude Code.

## Final product and what comes next

The live site runs the whole pipeline with no sign-in, and the repository holds every script and raw reading behind the numbers. The limits are on the page: the readers are models, and no patient has used the cards yet. A comprehension test with patients and a pharmacist comes next.
```

## Video script

Target length 2:45. The limit is 3:00 and it is strict, so stop recording at 2:55 whatever happens.

### Before you record

- Open https://concord-beryl.vercel.app in a clean browser window, 1440 by 900, zoom 100%, bookmarks bar hidden.
- Do one silent run first so you know where to scroll.
- Record the screen and your voice together (QuickTime: File, New Screen Recording, pick the microphone under Options). One take per block is fine. Join them in iMovie or CapCut.
- The live drawing in block 4 takes about a minute. Record it, then speed that clip up 4x in the editor so it fits.

### Blocks

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:14 | Scroll to "Miscounted doses the check threw away" and hold on the first picture (spoons). | "I asked an image model to draw one spoonful of medicine. It drew eight. On a patient's medicine card, that picture is dangerous. This is Concord." |
| 0:14 to 0:34 | Top of the page, then scroll slowly through the three statistics. | "When people leave hospital they get a page of dense text. In one study, 78% of emergency patients went home with a gap in understanding their care. Pictures help, and image models can draw anything now. But they miscount, and nobody checks the pictures." |
| 0:34 to 0:58 | Click "A photo of a printed sheet", then "Make the cards". Hold on the readers panel. | "Concord takes a discharge sheet, typed or photographed. Two models from different companies read it separately, and any field they disagree on is flagged. Then code lays out the cards: the schedule, the calendar, every number. The image model only draws single pictures." |
| 0:58 to 1:32 | Click "Heart medicines", turn on "Draw every picture new", click "Make the cards". Let the pictures arrive (speed up 4x). End on "What the check caught". | "Now I turn off the saved pictures, so everything is drawn live. Each picture goes to two vision models. They get no hint and no list to pick from. They say what they see, and a judge compares that with what the picture was meant to say. A picture that fails is thrown away and drawn again. After three failures the card uses a plain pictogram drawn by code. Nothing unchecked is shown." |
| 1:32 to 1:56 | Click "After knee surgery". Scroll the cards. Change the language to Telugu or Hindi. Press the speaker button. Click "Print the cards" and cancel. | "Here is a full set. Four parts of the day, the dose under each one, food, and a box for every day. The dose is one checked picture repeated by code, so the count is always right. Labels come in seven languages, and a card can be read aloud or printed." |
| 1:56 to 2:32 | Scroll to "What we measured". Point at each number as you say it. End on the red sock picture in the last row. | "I measured before I trusted any of this. 540 pictures. Whole doses were wrong 83 times out of 168, which is why code repeats a single unit. My fine-tuned adapter took flat pictograms from 21 percent of pictures to 78. It also made warning signs harder to read, so a failed picture is redrawn without it. The failures are on the site too. This swollen foot was read as a red sock." |
| 2:32 to 2:45 | The limits line under the results, then back to the top of the page. | "The readers are models, and no patient has tested these cards yet. That comes next. Concord: visual discharge instructions, verified before the patient sees them." |

### If something goes wrong while recording

- A live picture takes longer than a minute: cut to the finished card. The saved pictures load at once when "Draw every picture new" is off.
- Nothing fails during the live run: say the same line and scroll to "Miscounted doses the check threw away" to show failures from the evaluation.
- The site shows a limit message: wait a few minutes or record that block on http://localhost:3210 with `pnpm dev`.

### Upload

Upload to YouTube as Public (not Unlisted, the rules ask for public). Title: "Concord: visual discharge instructions, verified (Banana Hacks 2026)". Paste the link into the Devpost video field.

## Checklist before you press submit

- [ ] Video is public on YouTube and under 3:00.
- [ ] Live link opens in a private window and shows cards without any setup.
- [ ] GitHub repo is public.
- [ ] Write-up is under 500 words.
- [ ] AI tools are named in the Devpost field.
- [ ] Thumbnail (`docs/thumbnail.png`) and screenshots (`docs/card.png`, `docs/cards.png`, `docs/results.png`) are uploaded.
- [ ] You are listed as the only team member.
