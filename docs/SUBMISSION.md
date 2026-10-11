# Devpost submission

Everything to paste into Devpost, then the video script.

## Fields

**Project name:** Concord

**Tagline:** Visual discharge instructions, verified before the patient sees them.

**Try it out links**

- https://concord-health.vercel.app
- https://github.com/kinnuworks/concord

**Built with:** nextjs, typescript, react, fal, flux, lora, gemini, openai, openmoji, vercel

**AI tools used (the rules ask for this):** Claude Code for writing code and building the demo video (rendered with Remotion, music synthesized by a script). FLUX.1 [dev] with our own LoRA adapter for the pictures. Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 3.5 Flash-Lite and GPT-6 Luna as readers.

**Upload a file (additional info for judges):** `docs/Concord-notes-for-judges.pdf`. Two pages: where to look for each judging criterion, how to try the site in two minutes, and the measured numbers.

## Write-up

Paste this into the "About the project" box. It is under 500 words.

```markdown
## Inspiration

A discharge sheet is a page of dense text handed to someone who is unwell and about to go home. In one study, 78% of emergency patients left with a gap in understanding their care. Pictures help, and an image model can now draw one for any instruction. It also draws three pills when the dose is two. I wanted to make generated pictures safe enough to hand to a patient.

## What it does

Concord takes a discharge sheet, typed or photographed, and returns picture cards. Each medicine gets a card with a morning-to-night schedule, the dose under each time, the food rule, a box for every day, and things to avoid. Exercises, warning signs and the next visit get cards too. Labels come in nine languages, and a card can be read aloud or printed.

## How image generation is used

Every pictogram on a card is generated. FLUX.1 [dev], with a LoRA style adapter I trained on 70 OpenMoji pictograms, draws one fact per picture: a time of day, one unit of a medicine, a meal, a thing to avoid, a warning sign. Code writes each prompt from the parsed instruction, so nothing from the patient's sheet reaches the image model.

Then two vision models from different companies look at each picture with no hint and no list of answers, and say what they see. A separate judge decides whether each one understood it. A picture they misread is thrown away and drawn again, up to three times.

## Design process

Code places and counts, the model paints. Two models read the sheet separately and any field they disagree on is flagged. I measured before trusting anything: 540 pictures for 100 test instructions.

- On its own, an image model asked for a whole dose drew the wrong number 83 times out of 168. With Concord it draws one unit, readers check that it is exactly one, and code repeats it, so the count is exact.
- The adapter gave the cards one look: pictures both readers call a flat pictogram went from 21% to 78%.
- The read-back stopped a "swollen foot" that both readers saw as a red sock.
- The sheet reader got 100 of 100 test instructions right.

## Resources

FLUX.1 [dev] and LoRA training on fal. Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 3.5 Flash-Lite and GPT-6 Luna as readers. OpenMoji (CC BY-SA 4.0) as the training set. Code written with Claude Code.

## Final product and what comes next

The live site runs with no sign-in and opens on finished cards. A section called "Where the image model works" follows real pictures from prompt to card, and the repository holds every script and raw reading behind the numbers. A comprehension study with patients and a pharmacist comes next.
```

## Video

The video is ready: `concord-demo.mp4` in the project folder (1920 by 1080, 1 minute 45 seconds, music and captions, no voice-over). It was built in code with Remotion from the real generated pictures, the recorded reader quotes and a screen capture of the live site.

1. Watch it once with the sound on.
2. Upload it to YouTube as Public (not Unlisted, the rules ask for public). Title: "Concord: visual discharge instructions, verified (Banana Hacks 2026)". Use `docs/thumbnail-youtube.png` as the thumbnail if YouTube lets you set one (it is optional).
3. Paste the link into the Devpost video field.

On the paper sheet in the video, the hospital name and patient number are made up. Everything else on screen is real.

## Spoken script (only if you want to add your voice or record the screen yourself)

Target length 2:42. The limit is 3:00 and it is strict, so the final cut must end by 2:55.

### Before you record

- Open https://concord-health.vercel.app in a clean browser window, 1440 by 900, zoom 100%, bookmarks bar hidden.
- Do one silent run first so you know where to scroll.
- Record the screen and your voice together (QuickTime: File, New Screen Recording, pick the microphone under Options). One take per block is fine. Join them in iMovie or CapCut.

### Blocks

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:14 | Scroll to "Why an image model needs a check" and hold on the first picture in the row of spoons. | "I asked an image model to draw one spoonful of medicine. It drew eight. On a patient's medicine card, that picture is dangerous. This is Concord." |
| 0:14 to 0:34 | Top of the page, then scroll slowly through the statistics. | "When people leave hospital they get a page of dense text. In one study, 78% of emergency patients went home with a gap in understanding their care. Pictures help, and image models can draw anything now. But they miscount, and nobody checks the pictures." |
| 0:34 to 0:58 | Click "A photo of a printed sheet", then "Make the cards". Hold on the readers panel, then the cards. | "Concord takes a discharge sheet, typed or photographed. Two models from different companies read it separately, and any field they disagree on is flagged. Then code lays out the cards: the schedule, the calendar, every number." |
| 0:58 to 1:34 | Scroll to "Where the image model works". "Swelling" is already selected: pause on the two pictures, then click "Fever". | "Every pictogram on these cards is generated. Code writes the prompt, and FLUX with my own fine-tuned adapter draws it. Then two vision models look at the picture. They get no hint and no list to pick from. Here the model was asked for a swollen foot. Both readers saw a red sock, so it was thrown away. This one they read correctly, so it was kept. A picture the readers cannot read never reaches a card." |
| 1:34 to 1:58 | Scroll up. Click "After knee surgery". Scroll the cards. Change the language to Spanish. Press the speaker button. Click "Print the cards" and cancel. | "Here is a full set. Four parts of the day, the dose under each one, food, and a box for every day. The dose is one checked picture repeated by code, so the count is always right. Labels come in nine languages, and a card can be read aloud or printed." |
| 1:58 to 2:30 | Scroll to "Why an image model needs a check". Point at each number as you say it. | "This is why an image model needs a check. I asked for 540 pictures. On its own, the model drew the wrong number of pills 83 times out of 168. With Concord, code repeats one checked pill, so the count is always right. My adapter took flat pictograms from 21 percent of pictures to 78. And the sheet reader got 100 out of 100 test instructions right." |
| 2:30 to 2:42 | Back to the top of the page. | "Next is a comprehension study with patients and a pharmacist. Concord: visual discharge instructions, verified before the patient sees them." |

### If something goes wrong while recording

- "Make the cards" is slow on the photo: keep recording and cut the wait in the editor. It usually takes 5 to 10 seconds.
- The site shows a limit message: wait a few minutes, or record that block on http://localhost:3210 with `pnpm dev`.
- You run long: drop the language switch in the fifth block first.

### Upload

Upload to YouTube as Public (not Unlisted, the rules ask for public). Title: "Concord: visual discharge instructions, verified (Banana Hacks 2026)". Paste the link into the Devpost video field.

## Checklist before you press submit

- [ ] Video is public on YouTube and under 3:00.
- [ ] Live link opens in a private window and shows cards without any setup.
- [ ] GitHub repo is public.
- [ ] Write-up is under 500 words.
- [ ] AI tools are named in the Devpost field.
- [ ] Thumbnail is `docs/thumbnail.png`, and the six images in `docs/gallery/` are uploaded to the image gallery in their numbered order.
- [ ] You are listed as the only team member.
