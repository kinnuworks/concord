# Devpost submission

Everything to paste into Devpost, then the video script.

## Fields

**Project name:** Concord

**Tagline:** Visual discharge instructions, verified before the patient sees them.

**Try it out links**

- https://concord-health.vercel.app
- https://github.com/kinnuworks/concord
- https://huggingface.co/heykinnu/concord-pictogram-lora
- https://huggingface.co/datasets/heykinnu/concord-medicine-names

**Built with:** nextjs, typescript, react, fal, flux, lora, gemini, openai, huggingface, openmoji, wikidata, rxnorm, vercel

**AI tools used (the rules ask for this):** Claude Code for writing code and building the demo video (rendered with Remotion, music synthesized by a script). FLUX.1 [dev] with our own LoRA adapter for the pictures, and OpenAI gpt-image-2.5-flare for pictures drawn live on the site. Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 3.5 Flash-Lite, Gemini 3.1 Flash-Lite and GPT-6 Luna as readers.

**Upload a file (additional info for judges):** `docs/Concord-notes-for-judges.pdf`. Two pages: where to look for each judging criterion, how to try the site in two minutes, and the measured numbers.

## Write-up

Paste this into the "About the project" box, replacing what is there. It is under 500 words.

```markdown
## Inspiration

Researchers showed 395 adults a label that said "Take two tablets by mouth twice daily." Among patients with low literacy, 71% could say it back. Only 35% could count out the pills. A discharge sheet is a page of labels like that, and 35.7 million US hospital stays a year end with one.

Pictures close that gap. In a randomized trial, picture instructions cut parents' dosing errors from 47.8% to 5.4%. An image model can draw a picture for any instruction, but it also draws three pills when the dose is two. I wanted generated pictures safe enough to hand to a patient.

## What it does

Concord takes a discharge sheet, typed or photographed, and returns picture cards: a morning-to-night schedule with the dose under each time, the food rule, a box for every day, things to avoid, exercises, warning signs and the next visit. Cards come in 70 languages, with the medicine's name in the patient's own script, and can be read aloud or printed.

It is built for the people a page of text leaves behind: 61.2 million Americans aged 65 or older, 28.9 million who speak English less than very well, and the 28% of working-age adults at the lowest literacy level.

## How image generation is used

Every pictogram on a card is generated. FLUX.1 [dev], with a LoRA style adapter I trained on 70 OpenMoji pictograms, draws one fact per picture. Code writes each prompt, so nothing from the patient's sheet reaches the image model.

Then two vision models from different companies look at each picture with no hint and no list of answers, and say what they see. A misread picture is thrown away and drawn again.

## Design process

Code places and counts, the model paints.

- Asked to draw a whole dose in one picture, an image model got the count wrong 83 times out of 168. Asked for a single pill, it was right 58 times out of 60, and the read-back caught the other two. So Concord draws one checked pill and code repeats it.
- My fine-tune gave the cards one drawing style: 21% of pictures came out as flat pictograms before it, 78% with it. That figure is about style. For meaning, every picture on a card has passed the read-back.
- Words are checked like pictures. I wrote 1,830 prescribable medicines in 69 languages, 126,270 names in all, and a second model read each one back unseen. 98% matched. Where Wikidata already has the name, the card uses it.
- The sheet reader got 100 of 100 test instructions right.

## Resources

FLUX.1 [dev] and LoRA training on fal. Gemini and GPT-6 Luna as readers. OpenMoji (CC BY-SA 4.0) as the training set. Code written with Claude Code.

## Final product and what comes next

The live site needs no sign-in, opens on finished cards and scores 100 on all four Lighthouse audits. Every figure on it links to its source. A comprehension study with patients and a pharmacist comes next.
```

## Video

The new cut is `concord-demo-v2.mp4` in the project folder (1920 by 1080, 2 minutes 51 seconds, music and captions). It was built in code with Remotion from the real generated pictures, the recorded reader quotes, 70 cards captured from the live site and a screen capture of the live site.

It opens on the prescription label, shows who a page of text leaves behind (one dot for every million people), the trials of picture instructions, the miscounting image model, the read-back, how it was built, the 70 languages and the live site.

1. Record the voice-over from `docs/voiceover.md` if you can. Send the recordings and they are mixed in under the music.
2. Watch the result once with the sound on.
3. Upload it to YouTube as Public (the rules ask for public). Title: "Concord: visual discharge instructions, verified (Banana Hacks 2026)". Thumbnail: `docs/thumbnail-youtube.png`.
4. Replace the link in the Devpost video field.

On the paper sheet in the video, the hospital name and patient number are made up. Everything else on screen is real.

## What to update on Devpost

Edits are open until Wednesday 14 October, 2:30 AM.

- "About the project": paste the write-up above over the old one.
- "Built with": add `wikidata` and `rxnorm`.
- AI tools field: use the line at the top of this file.
- Upload: replace the PDF with the new `docs/Concord-notes-for-judges.pdf`.
- Video: the new YouTube link.

## Checklist before you press submit

- [ ] Video is public on YouTube and under 3:00 (the new cut is 2:51).
- [ ] Live link opens in a private window and shows cards without any setup.
- [ ] GitHub repo is public.
- [ ] Write-up is under 500 words.
- [ ] AI tools are named in the Devpost field.
- [ ] Thumbnail is `docs/thumbnail.png`, and the six images in `docs/gallery/` are uploaded to the image gallery in their numbered order.
- [ ] You are listed as the only team member.
