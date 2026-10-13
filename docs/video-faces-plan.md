# Video plan: one face, then millions

Saved on 13 October 2026 to pick up later. Nothing here is built yet.

## The move

1. Open tight on one real face, ideally a relative reading the prescription label.
2. Pull back: that face is one tile among nine, then a hundred, then several hundred faces.
3. The faces shrink into the dots, one dot for every million people, and the numbers land: 61.2 million, 28.9 million, 739 million.
4. At the end, run it in reverse: the crowd gathers back to that one person, now holding the card in their language and counting out the right pills.

The start says "she is one of millions". The end says "it worked for her". Without a relative on camera the same move starts on a stock face and loses the ending.

## Photos or clips

- The wall: still portrait photos, about 150 of them. At tile size motion reads as noise, and 150 clips would be over a gigabyte to download and slow to render.
- The hero tiles: moving clips, three to five at most. These are the faces seen large at the start and the end, where movement matters. A relative's clips go here; stock clips stand in if there are none.

## Rules for the stock faces

- Real photographs and clips under a free licence. No generated faces.
- No caption that pins a condition on one person. "739 million adults cannot read" sits over the crowd, never over a single face.
- Weight the selection toward older adults, with a wide mix of people.

## What is needed before building

1. A yes to downloading about 150 small portrait photos from Pexels (roughly 6 MB) and up to five short clips (roughly 10 MB each) into `video/public/concord/people/`.
2. A free Pexels API key in `.env.local` as `PEXELS_API_KEY`.
3. Whether a relative can be filmed. The shot list is in `docs/people-test.md`.

## Where it goes in the film

The film is defined in `video/scripts/make_film.py`. The face wall replaces the start of the `label` scene and feeds into `millions`. The reverse move replaces the start of `everyone`. The screens to extend are `CWall`, `CMillions`, `CGather` and `CFace` in `video/src/screens/concord/Impact.tsx`.

## Also agreed for the next cut

- Add the voice-over from `docs/voiceover.md`.
- Cut the on-screen numbers to three big moments.
- Move the eight spoons up to about 0:25.
- Bring the length down to about 2:15.
- A plainer tagline. Suggested: "Medicine instructions anyone can follow: pictures in 70 languages, each one checked before the patient sees it."
