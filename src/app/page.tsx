"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CardSheet } from "@/components/Cards";
import { HowItIsChecked, Mark, Questions, WhoItIsFor, Why } from "@/components/Landing";
import { Results } from "@/components/Results";
import type { TileState } from "@/components/Tile";
import type { Card } from "@/lib/plan";
import { LANGUAGES, type Disagreement, type Lang, type Regimen } from "@/lib/schema";
import type { TileSpec } from "@/lib/tiles";
import samples from "@/data/samples.json";

type Parsed = {
  regimen: Regimen;
  disagreements: Disagreement[];
  cards: Card[];
  readers: [string, string];
};

// The sample sheets, with the reader's saved output for each, so finished cards are
// on screen when the page opens. "Make the cards" always runs the real reader again.
const SAMPLES = samples as unknown as { name: string; text: string; parsed: Parsed }[];

const SAMPLE_PHOTO = { src: "/samples/discharge-sheet.jpg", name: "discharge-sheet.jpg" };

type Report = { spec: TileSpec; state: TileState };

export default function Home() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [photo, setPhoto] = useState<{ mime: string; base64: string; name: string } | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [fresh, setFresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(SAMPLES[0].parsed);
  const [run, setRun] = useState(0);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const report = useCallback((key: string, spec: TileSpec, state: TileState) => {
    setReports((r) => (r[key]?.state === state ? r : { ...r, [key]: { spec, state } }));
  }, []);

  // Photos are shrunk in the browser before upload: a phone photo is far larger than
  // a reader needs, and small uploads keep the request inside hosting limits.
  async function onFile(file: File | undefined) {
    if (!file) return setPhoto(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPhoto({ mime: "image/jpeg", base64: dataUrl.slice(dataUrl.indexOf(",") + 1), name: file.name });
      setParsed(null);
    } catch {
      setError("That file could not be opened as a picture.");
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setReports({});
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(photo ? { image: { mime: photo.mime, base64: photo.base64 } } : { text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read the instructions.");
      setParsed(data as Parsed);
      setRun((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => {
    const all = Object.values(reports);
    const rejected = all.flatMap((r) =>
      r.state.attempts.filter((a) => a.verdict && !a.verdict.pass).map((a) => ({ ...a, spec: r.spec })),
    );
    return {
      total: all.length,
      done: all.filter((r) => r.state.status === "accepted" || r.state.status === "fallback").length,
      fallback: all.filter((r) => r.state.status === "fallback").length,
      rejected,
    };
  }, [reports]);

  return (
    <>
      <main id="top">
        <section className="hero hero--app">
          <div className="container">
            <p className="brand">
              <Mark />
              Concord
            </p>
            <h1>
              Visual discharge instructions,{" "}
              <span className="t-muted">verified before the patient sees them.</span>
            </h1>
            <p className="lead">
              Concord turns a discharge sheet into picture cards in the patient&rsquo;s language. Two independent
              models read every picture back, and a picture they misread is thrown away.
            </p>
            <div className="cta-row">
              <a className="btn btn-ink" href="#make">
                Make the cards
              </a>
              <a className="btn btn-outline" href="#why">
                Why it matters
              </a>
            </div>
            <p className="trust">
              <span>No account needed</span>
              <span>Text or a photo of the sheet</span>
              <span>A reading aid, not medical advice</span>
            </p>
          </div>
        </section>

        <section className="workspace" id="make">
          <div className="container">
            <div className="card block">
              <div className="chips">
                {SAMPLES.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className="chip"
                    aria-pressed={!photo && text === s.text}
                    onClick={() => {
                      setText(s.text);
                      setPhoto(null);
                      setError(null);
                      setReports({});
                      setParsed(s.parsed);
                      setRun((n) => n + 1);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="chip"
                  aria-pressed={photo?.name === SAMPLE_PHOTO.name}
                  onClick={async () => {
                    const blob = await (await fetch(SAMPLE_PHOTO.src)).blob();
                    await onFile(new File([blob], SAMPLE_PHOTO.name, { type: "image/jpeg" }));
                  }}
                >
                  A photo of a printed sheet
                </button>
              </div>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="sheet-photo" src={`data:${photo.mime};base64,${photo.base64}`} alt="The photographed discharge sheet" />
              ) : null}
              <textarea
                hidden={Boolean(photo)}
                className="input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                disabled={Boolean(photo)}
                aria-label="Discharge instructions"
              />
              <div className="toolbar">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  {photo ? `Photo: ${photo.name}` : "Use a photo of the sheet"}
                </button>
                {photo ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)}>
                    Remove photo
                  </button>
                ) : null}
                <label className="field">
                  Language
                  <select className="select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <input
                    type="checkbox"
                    className="switch"
                    checked={fresh}
                    onChange={(e) => setFresh(e.target.checked)}
                  />
                  Draw every picture new
                </label>
                <button type="button" className="btn btn-ink" onClick={submit} disabled={busy}>
                  {busy ? "Reading the sheet" : "Make the cards"}
                </button>
              </div>
              {error ? <p className="note note--bad">{error}</p> : null}
            </div>

            {parsed ? (
              <>
                <div className="card block">
                  <h2 className="t-title">What the two readers found</h2>
                  {parsed.disagreements.length === 0 ? (
                    <p className="note note--ok">Both readers agree on every field.</p>
                  ) : (
                    <ul className="list list--flag">
                      {parsed.disagreements.map((d) => (
                        <li key={d.path}>
                          <span className="t-mono">{d.path}</span>: {parsed.readers[0]} read{" "}
                          <b>{JSON.stringify(d.a)}</b>, {parsed.readers[1]} read <b>{JSON.stringify(d.b)}</b>.
                          Check the sheet.
                        </li>
                      ))}
                    </ul>
                  )}
                  {parsed.regimen.unparsed.length ? (
                    <>
                      <p className="note">Not drawn, shown as written:</p>
                      <ul className="list">
                        {parsed.regimen.unparsed.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>

                <div className="block">
                  <div className="block__head">
                    <h2 className="t-title">Cards</h2>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                      Print the cards
                    </button>
                    <div className="chips">
                      <span className="chip chip--soft">
                        <span className="stat">
                          {stats.done} of {stats.total}
                        </span>
                        pictures ready
                      </span>
                      <span className="chip chip--soft">
                        <span className="stat">{stats.rejected.length}</span> rejected by the check
                      </span>
                      <span className="chip chip--soft">
                        <span className="stat">{stats.fallback}</span> drawn from the numbers
                      </span>
                    </div>
                  </div>
                  <div className="stage stage--soft">
                    <CardSheet cards={parsed.cards} lang={lang} fresh={fresh} run={run} report={report} />
                  </div>
                </div>

                {stats.rejected.length ? (
                  <div className="card block">
                    <h2 className="t-title">What the check caught</h2>
                    <ul className="caught">
                      {stats.rejected.map((a) => (
                        <li key={a.url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.url} alt="Rejected picture" width={88} height={88} />
                          <div>
                            <p>
                              Wanted <span className="t-mono">{JSON.stringify(a.verdict!.expected)}</span>
                            </p>
                            {a.verdict!.mismatches.map((m) => (
                              <p key={m}>{m}</p>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        <Why />
        <HowItIsChecked />
        <Results />
        <WhoItIsFor />
        <Questions />
      </main>

      <footer className="footer">
        <div className="container">
          <span className="brand brand--sm">
            <Mark />
            Concord
          </span>
          <span>Visual discharge instructions, verified before the patient sees them.</span>
          <a className="link" href="https://github.com/kinnuworks/concord" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
