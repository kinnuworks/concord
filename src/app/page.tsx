"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CardSheet } from "@/components/Cards";
import type { TileState } from "@/components/Tile";
import type { Card } from "@/lib/plan";
import { LANGUAGES, type Disagreement, type Lang, type Regimen } from "@/lib/schema";
import type { TileSpec } from "@/lib/tiles";

const SAMPLES: { name: string; text: string }[] = [
  {
    name: "Antibiotic",
    text: "Amoxicillin 500 mg: take 2 capsules twice a day after meals for 5 days. Do not drink alcohol while taking this medicine.",
  },
  {
    name: "After knee surgery",
    text: "Paracetamol 500 mg: 1 tablet three times a day after food for 7 days.\nIbuprofen 400 mg: 1 tablet in the morning and at night with food for 5 days. Do not drive.\nKnee bends: lying on your back, bend the knee to 90 degrees, 10 times, 3 sets, twice a day.\nStraight leg raise: lift the leg to 45 degrees, 10 times, 2 sets, twice a day.\nCome back to the hospital if you have fever, swelling in the leg, or fluid from the wound.\nFollow-up appointment on 2026-10-26 at the orthopaedic clinic.",
  },
  {
    name: "Heart medicines",
    text: "Atorvastatin 20 mg: 1 tablet at bedtime.\nAspirin 75 mg: 1 tablet every morning after breakfast.\nReturn immediately if you have chest pain, trouble breathing or dizziness.",
  },
];

type Parsed = {
  regimen: Regimen;
  disagreements: Disagreement[];
  cards: Card[];
  readers: [string, string];
};

type Report = { spec: TileSpec; state: TileState };

export default function Home() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [photo, setPhoto] = useState<{ mime: string; base64: string; name: string } | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [fresh, setFresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [run, setRun] = useState(0);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const report = useCallback((key: string, spec: TileSpec, state: TileState) => {
    setReports((r) => (r[key]?.state === state ? r : { ...r, [key]: { spec, state } }));
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return setPhoto(null);
    const buf = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (const b of buf) bin += String.fromCharCode(b);
    setPhoto({ mime: file.type || "image/jpeg", base64: btoa(bin), name: file.name });
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
    <main className="page">
      <header className="top">
        <h1>Readback</h1>
        <p>
          Discharge instructions as picture cards. Every picture is read back by two separate models before
          you see it, and a picture they misread is thrown away.
        </p>
      </header>

      <section className="panel">
        <div className="samples">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              className="ghost"
              onClick={() => {
                setText(s.text);
                setPhoto(null);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          disabled={Boolean(photo)}
          aria-label="Discharge instructions"
        />
        <div className="controls">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
            {photo ? `Photo: ${photo.name}` : "Use a photo of the sheet"}
          </button>
          {photo ? (
            <button type="button" className="ghost" onClick={() => setPhoto(null)}>
              Remove photo
            </button>
          ) : null}
          <label className="field">
            Language
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field check">
            <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />
            Draw every picture new
          </label>
          <button type="button" className="primary" onClick={submit} disabled={busy}>
            {busy ? "Reading the sheet" : "Make the cards"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {parsed ? (
        <>
          <section className="panel">
            <h2>What the two readers found</h2>
            {parsed.disagreements.length === 0 ? (
              <p className="ok">Both readers agree on every field.</p>
            ) : (
              <ul className="disagree">
                {parsed.disagreements.map((d) => (
                  <li key={d.path}>
                    <code>{d.path}</code>: {parsed.readers[0]} read <b>{JSON.stringify(d.a)}</b>,{" "}
                    {parsed.readers[1]} read <b>{JSON.stringify(d.b)}</b>. Check the sheet.
                  </li>
                ))}
              </ul>
            )}
            {parsed.regimen.unparsed.length ? (
              <div className="unparsed">
                <p>Not drawn, shown as written:</p>
                <ul>
                  {parsed.regimen.unparsed.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <div className="sheet-head">
              <h2>Cards</h2>
              <p className="muted">
                {stats.done} of {stats.total} pictures ready · {stats.rejected.length} rejected by the check ·{" "}
                {stats.fallback} drawn from the numbers
              </p>
            </div>
            <CardSheet cards={parsed.cards} lang={lang} fresh={fresh} run={run} report={report} />
          </section>

          {stats.rejected.length ? (
            <section className="panel">
              <h2>What the check caught</h2>
              <ul className="caught">
                {stats.rejected.map((a) => (
                  <li key={a.url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="Rejected picture" width={96} height={96} />
                    <div>
                      <p>
                        Wanted <b>{JSON.stringify(a.verdict!.expected)}</b>
                      </p>
                      {a.verdict!.mismatches.map((m) => (
                        <p key={m} className="muted">
                          {m}
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
