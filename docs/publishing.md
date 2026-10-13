# Where to publish Concord, step by step

Hugging Face is done. Everything below is in the order worth doing it. After each one, send the link and it is added to the "Published on" row of the site.

Before anything else, two things have a deadline of Wednesday 14 October, 2:30 AM: uploading the new video to YouTube and updating the Devpost page. The list for that is in `docs/SUBMISSION.md`.

## 1. Zenodo: a DOI for the code and one for the report

Zenodo is a free research archive run by CERN. It gives a permanent, citable identifier (a DOI). It is not peer review.

### A. The code (5 minutes)

1. Go to https://zenodo.org and choose "Log in", then "Log in with GitHub". Approve the access it asks for.
2. Click your name, top right, then "GitHub".
3. Find `kinnuworks/concord` in the list and flip its switch to on. If the list is empty, click "Sync now" and wait a minute.
4. Say "Zenodo is on". A release `v1.0.0` is then created on GitHub, and Zenodo archives it and mints the DOI within a few minutes.
5. Back on the same Zenodo page, the repository now shows a DOI badge. Send that DOI.

### B. The technical report (5 minutes)

1. On Zenodo, click "New upload".
2. Upload `docs/Concord-technical-report.pdf`.
3. Fill in:
   - Resource type: Publication, then Report (or Technical note)
   - Title: `Concord: read-back verification of generated pictograms for medicine instructions`
   - Creators: your full name
   - Description: paste the Abstract from the report
   - Licence: Creative Commons Attribution 4.0
   - Keywords: health literacy, pictograms, discharge instructions, image generation, verification, multilingual
   - Related works: "Is supplemented by" `https://github.com/kinnuworks/concord`
4. Click "Publish". The record page shows the DOI. Send it.

On the site this must be called a technical report. It is not peer reviewed, and the report says so on its first page.

## 2. dev.to: the article (10 minutes)

1. Sign up at https://dev.to (GitHub login works).
2. Click "Create Post".
3. Title: `Seven in ten could read the label. One in three could take the right dose.`
4. Paste the body of `docs/article.md`, leaving out the title line and the italic note under it.
5. Cover image: `docs/cards.png`.
6. Tags: `healthtech`, `ai`, `opensource`, `a11y`.
7. Where the article says "[image: ...]", upload `docs/gallery/4-drawn-live-and-read-back.jpg`. It shows the red sock being thrown away and a new picture being drawn and kept.
8. Publish, then send the link.

## 3. LinkedIn (5 minutes)

Attach the video (`concord-demo-v2.mp4`) and post:

> In one study, 395 adults were shown a pill bottle that said "Take two tablets by mouth twice daily." Among those who struggle with reading, seven in ten could say it back. One in three could count out the right pills.
>
> I built Concord for that gap. It turns a hospital discharge sheet into picture cards in 70 languages. Every picture is drawn by an image model, and none is shown until two other models have looked at it and said what they see. If they get it wrong, it is thrown away and drawn again.
>
> It is free, open source, and needs no account: https://concord-health.vercel.app
>
> It has not been tested with patients yet. If you work in a pharmacy or on a ward and would look at it for ten minutes, I would be grateful.

## 4. Hacker News: Show HN (10 minutes, then stay for the comments)

1. Sign up at https://news.ycombinator.com. How the site treats posts from brand-new accounts was not verified, so read its guidelines page first.
2. Click "submit".
3. Title: `Show HN: Concord – medicine instructions as pictures, each checked by two vision models`
4. URL: `https://concord-health.vercel.app`
5. Leave the text box empty, submit, then add the first comment yourself.

Write that comment in your own words. Hacker News does not allow comments written by an AI, so here are only the points to cover:

- why you built it (the label study)
- what is different: a generated picture has to pass a read-back by two models from different companies
- what you measured: 83 of 168 whole doses miscounted by the image model on its own; one unit drawn and repeated by code instead
- what is not done: no patient test yet
- the code is open, with every raw reading

Do not ask anyone to upvote. Answer every comment, especially the critical ones.

## 5. Product Hunt (30 minutes, best after the video has a voice)

1. Sign up at https://www.producthunt.com with a personal account. Check whether a new account has to wait before it can post; this could not be confirmed.
2. Click "Submit", then "Launch a product".
3. Fill in:
   - Name: `Concord`
   - Tagline (60 characters at most): `Medicine instructions as pictures, checked before use`
   - Link: `https://concord-health.vercel.app`
   - Description (260 characters at most): `Concord turns a hospital discharge sheet into picture cards in 70 languages. Every picture is drawn by an image model, and none is shown until two other models have read it back correctly. Free, open source, no account.`
   - Topics: Health, Artificial Intelligence, Open Source, Accessibility
   - Thumbnail: `docs/logo.png`
   - Gallery: the eight images in `docs/gallery/`, in their numbered order
   - Video: the YouTube link
   - Pricing: Free
4. First comment, as the maker: the same points as the Hacker News comment, in your own words.
5. A launch runs for one day starting at 12:01 AM Pacific time. Schedule it for a day you can answer comments.

## 6. Smaller listings (5 minutes each, when you have time)

These are free listings for makers. Their terms were not verified, so read each submission page first.

| Site | What to post |
|---|---|
| Peerlist (Launchpad) | Name, the tagline above, the link, two gallery images |
| Uneed | The same |
| Indie Hackers | A short post telling the story, with the link |
| Reddit, r/SideProject | The story in a few lines and the link. Read the subreddit's rules on self-promotion first. |

Skip BetaList. It is for products that have not launched.

## 7. A DOI on Hugging Face (2 minutes each, optional)

On each of your two Hugging Face pages, open "Settings" and click "Generate DOI". It asks to share your name with the registry that issues it.

- https://huggingface.co/heykinnu/concord-pictogram-lora
- https://huggingface.co/datasets/heykinnu/concord-medicine-names

## What changes on the site as each one lands

| When this exists | The site shows |
|---|---|
| Zenodo DOI for the code | "Zenodo" in the "Published on" row, and a DOI badge in the README |
| Zenodo DOI for the report | "Technical report" with its DOI |
| dev.to post | "Write-up on dev.to" |
| Product Hunt launch | "Product Hunt", after launch day |
| Hacker News post | Nothing, unless it draws real discussion worth linking |

Nothing is shown before it is real.
