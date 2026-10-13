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
- https://dev.to/kinnuworks/seven-in-ten-could-read-the-label-one-in-three-could-take-the-right-dose-2jb2
- https://www.producthunt.com/products/concord-2?launch=concord-3
- https://doi.org/10.5281/zenodo.23346534
- https://doi.org/10.5281/zenodo.23346012

**Built with:** nextjs, typescript, react, fal, flux, lora, gemini, openai, huggingface, openmoji, wikidata, rxnorm, vercel

**AI tools used (the rules ask for this):** Claude Code for writing code and building the demo video (rendered with Remotion, music synthesized by a script). ElevenLabs for the narration, in a clone of my own voice. FLUX.1 [dev] with our own LoRA adapter for the pictures, and OpenAI gpt-image-2.5-flare for pictures drawn live on the site. Gemini 3.8 Flash, Gemini 2.5 Flash, Gemini 3.5 Flash-Lite, Gemini 3.1 Flash-Lite and GPT-6 Luna as readers.

**Upload a file (additional info for judges):** `docs/Concord-notes-for-judges.pdf`. Two pages: where to look for each judging criterion, how to try the site in two minutes, and the measured numbers.

## Write-up

Paste this into the "About the project" box, replacing what is there. It is under 500 words.

```markdown
## Inspiration

Researchers showed 395 adults a label that said "Take two tablets by mouth twice daily." Among patients with low literacy, 71% could say it back. Only 35% could count out the pills. A discharge sheet is a page of labels like that, and 35.7 million US hospital stays a year end with one.

Pictures close that gap. In a randomized trial, picture instructions cut parents' dosing errors from 47.8% to 5.4%. An image model can draw a picture for any instruction, but it also draws three pills when the dose is two. I wanted generated pictures safe enough to hand to a patient.

## What it does

Concord takes a discharge sheet, typed or photographed, and returns picture cards: a morning-to-night schedule with the dose under each time, the food rule, a box for every day, things to avoid, exercises, warning signs and the next visit. Cards come in 70 languages, with the medicine's name in the patient's own script, and can be read aloud.

It is built for 61.2 million Americans aged 65 or older, 28.9 million who speak English less than very well, and the 28% of working-age adults at the lowest literacy level.

## How image generation is used

Every pictogram on a card is generated. FLUX.1 [dev], with a LoRA style adapter I trained on 70 OpenMoji pictograms, draws one fact per picture.

Then two vision models from different companies look at each picture with no hint and no list of answers, and say what they see. A misread picture is thrown away and drawn again.

## Design process

Code places and counts, the model paints.

- Asked to draw a whole dose in one picture, an image model got the count wrong 83 times out of 168. Asked for a single pill, it was right 58 times out of 60, and the read-back caught the other two. So Concord draws one checked pill and code repeats it.
- My fine-tune gave the cards one drawing style: 21% of pictures came out as flat pictograms before it, 78% with it. That is style; for meaning, every picture has passed the read-back.
- Words are checked like pictures. I wrote 1,830 prescribable medicines in 69 languages, 126,270 names in all, and a second model read each one back unseen. 98% matched. Where Wikidata already has the name, the card uses it.
- The sheet reader got 100 of 100 test instructions right.

## Resources

FLUX.1 [dev] and LoRA training on fal. Gemini and GPT-6 Luna as readers. OpenMoji as the training set. Code written with Claude Code.

## Final product and what comes next

The live site needs no sign-in, opens on finished cards and scores 100 on Lighthouse. A technical report, the adapter and all 155,637 checked names are published with DOIs. Seven adults who take medicines daily tried it; all seven found the card easier to understand than the sheet. A 60-year-old who cannot read English counted out the right pills from the Telugu card. A study with a pharmacist comes next.
```

## Two more sections, if you want them

The strongest rival pages run to 700 words and more and use Devpost's usual headings, so the 500-word limit does not seem to be enforced. These two sections tell the build story. Paste them after "Design process" if you want the longer version.

```markdown
## Challenges I ran into

- The image model could not count. Asked for a whole dose, it drew the wrong number of pills in 83 of 168 pictures. I stopped asking it to count: it draws one pill, two readers confirm it is one, and code repeats it.
- A reader given a list of answers can guess the right one. So the readers get no list. They say what they see in their own words, and a separate judge compares that with what the picture was meant to show.
- My fine-tune fixed the drawing style but not the meaning. The first attempt now uses the fine-tune and a redraw uses the plain model, which cut the share of warning signs that needed a code-drawn stand-in from 53% to 23%.
- Translation hid two traps. In several languages evening and night came back as the same word, and "checked by two readers" came back as "two people". Both are now ruled out by the check itself.

## What I learned

A generated picture is a claim, and a claim about medicine has to be checked before anyone acts on it. Measuring first changed the design three times. And the most reliable part of the system is the part where the model is not asked to do the job at all: code counts, the model paints.
```

## Video

The final cut is `concord-demo-v3.mp4` in the project folder (1920 by 1080, 2 minutes 35 seconds, with voice, music and captions). It was built in code with Remotion from the real generated pictures, the recorded reader quotes, 70 cards captured from the live site and a screen capture of the live site. The voice is a clone of the author's own voice made with ElevenLabs, and the faces in the opening are free-licence stock photographs and footage from Pexels.

It opens on people, shows who a page of text leaves behind, the label study, the miscounting image model, the read-back, how it was built, the 70 languages, the seven-person test and the live site.

1. Watch it once with the sound on.
2. Upload it to YouTube as Public (the rules ask for public). Title: "Concord: visual discharge instructions, verified (Banana Hacks 2026)". Thumbnail: `docs/thumbnail-youtube.png`.
3. Replace the link in the Devpost video field.

On the paper sheet in the video, the hospital name and patient number are made up. Everything else on screen is real.

## What to update on Devpost

Edits are open until Wednesday 14 October, 2:30 AM.

- "About the project": paste the write-up above over the old one.
- "Built with": add `wikidata` and `rxnorm`.
- AI tools field: use the line at the top of this file.
- Upload: replace the PDF with the new `docs/Concord-notes-for-judges.pdf`.
- Image gallery: delete the six old images and upload the eight new ones from `docs/gallery/`.
- Try it out links: add the two Hugging Face links.
- Video: the new YouTube link.

## Checklist before you press submit

- [ ] Video is public on YouTube and under 3:00 (the final cut is 2:35).
- [ ] Live link opens in a private window and shows cards without any setup.
- [ ] GitHub repo is public.
- [ ] Write-up is under 500 words.
- [ ] AI tools are named in the Devpost field.
- [ ] Thumbnail is `docs/thumbnail.png`, and the eight images in `docs/gallery/` replace the old gallery, in their numbered order.
- [ ] You are listed as the only team member.
