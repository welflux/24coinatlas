import React, { useState, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  BookOpen,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  ScanLine,
  Camera,
  Upload,
  X,
  LoaderCircle,
  Eye,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { api } from "./api";
import {
  Button,
  Notice,
  Empty,
  Loading,
  Tag,
  Field,
  Heading,
  Gate,
  CoinArt,
  useResource,
  money,
  date,
  conditions,
  eras,
} from "./ui";
export { Collection, CollectionDetail, CoinForm } from "./collection";

export function Catalogue() {
  const [query, setQuery] = useState(""),
    [era, setEra] = useState(() => {
      const requested = new URLSearchParams(window.location.search).get("era");
      return eras.includes(requested) ? requested : "All eras";
    }),
    r = useResource(
      `/catalogue?q=${encodeURIComponent(query)}${era === "All eras" ? "" : `&era=${encodeURIComponent(era)}`}`,
    );
  return (
    <>
      <Heading
        eyebrow="THE SOUTH AFRICAN CATALOGUE"
        title="History, in the palm of your hand."
        description="Start with the identity, then follow the references."
      />
      <div className="catalogue-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Search catalogue"
            placeholder="Search a coin, denomination or era…"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <label className="filter-select">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Filter by era"
            value={era}
            onChange={(e) => setEra(e.target.value)}
          >
            <option>All eras</option>
            {eras.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
      </div>
      <Notice>
        <strong>A carefully labelled starting point.</strong> Introductory
        records link to official reference organisations and await source
        verification. This is not a complete date, variety or mintage catalogue.
      </Notice>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Notice tone="error">{r.error}</Notice>
      ) : (
        <>
          <div className="results-caption">
            {r.data.items.length} research entries{" "}
            <span>NO VERIFIED VALUATIONS CONNECTED</span>
          </div>
          <div className="catalogue-grid">
            {r.data.items.map((c) => (
              <a
                href={`/app/catalogue/${c.id}`}
                data-route
                className="catalogue-card"
                key={c.id}
              >
                <div className="catalogue-art">
                  <CoinArt kind={c.image} />
                  <span>ILLUSTRATION · NOT A REFERENCE PHOTO</span>
                  <span className="art-denomination">{c.denomination}</span>
                </div>
                <div className="catalogue-card-copy">
                  <div className="card-topline">
                    <Tag>{c.era}</Tag>
                    <ArrowUpRight size={18} />
                  </div>
                  <h2>{c.name}</h2>
                  <p>
                    {c.start_year}
                    {c.end_year && c.end_year !== c.start_year
                      ? ` – ${c.end_year}`
                      : !c.end_year
                        ? " onward"
                        : ""}
                    <span>
                      {new Intl.DisplayNames(["en"], { type: "region" }).of(
                        c.country_code || "ZA",
                      )}
                    </span>
                  </p>
                  <div className="catalogue-source">
                    <BookOpen size={13} />
                    Source verification pending
                  </div>
                </div>
              </a>
            ))}
          </div>
          {!r.data.items.length && (
            <Empty
              title="No entries match this search."
              icon={Search}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setEra("All eras");
                  }}
                >
                  Clear filters
                </Button>
              }
            >
              Try a denomination or another era.
            </Empty>
          )}
        </>
      )}
    </>
  );
}

export function CatalogueDetail({ id, session, navigate, openCoin, notify }) {
  const { data, loading, error } = useResource(`/catalogue/${id}`),
    [tab, setTab] = useState("Overview"),
    [valuation, setValuation] = useState(null),
    [busy, setBusy] = useState(false),
    [researchError, setResearchError] = useState("");
  async function research(e) {
    e.preventDefault();
    setBusy(true);
    setResearchError("");
    setValuation(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await api(`/catalogue/${id}/valuation`, {
        method: "POST",
        body: {
          year: Number(f.get("year")),
          condition: f.get("condition"),
          mint_mark: f.get("mint_mark"),
        },
      });
      setValuation(r.valuation);
    } catch (e) {
      setResearchError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function wishlist() {
    if (!session) return navigate("/register");
    try {
      await api("/wishlist", { method: "POST", body: { catalogue_id: id } });
      notify("Added to your private research list.");
    } catch (e) {
      notify(e.message);
    }
  }
  if (loading) return <Loading />;
  if (error) return <Notice tone="error">{error}</Notice>;
  const c = data.coin;
  return (
    <>
      <a href="/app/catalogue" data-route className="back-link">
        <ArrowLeft size={15} /> Back to the catalogue
      </a>
      <div className="coin-detail-heading">
        <div>
          <div className="eyebrow">{c.era.toUpperCase()} / SOUTH AFRICA</div>
          <h1>{c.name}</h1>
          <p>
            {c.start_year}
            {c.end_year && c.end_year !== c.start_year
              ? `–${c.end_year}`
              : !c.end_year
                ? " onward"
                : ""}{" "}
            · {c.denomination}
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() =>
            openCoin({
              catalogue_id: c.id,
              name: c.name,
              denomination: c.denomination,
              year: c.start_year === c.end_year ? c.start_year : null,
            })
          }
        >
          Add to collection
        </Button>
      </div>
      <div className="detail-layout">
        <div className="detail-art-panel">
          <CoinArt kind={c.image} />
          <small>STYLISED ILLUSTRATION · NOT FOR IDENTIFICATION</small>
          <div>
            <button className="text-link" onClick={wishlist}>
              <Bookmark size={16} /> Save to research list
            </button>
          </div>
        </div>
        <div className="detail-information">
          <div className="tabs" role="tablist" aria-label="Coin research">
            {["Overview", "Valuation evidence", "Rarity & varieties"].map(
              (t) => (
                <button
                  role="tab"
                  aria-selected={tab === t}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "Overview" ? (
            <>
              <Tag tone={c.verification === "verified" ? "green" : "amber"}>
                {c.verification === "verified"
                  ? "Source verified"
                  : "Source verification pending"}
              </Tag>
              <h2>A starting point for your research.</h2>
              <p>{c.description}</p>
              <dl className="facts">
                <div>
                  <dt>Country</dt>
                  <dd>
                    {new Intl.DisplayNames(["en"], { type: "region" }).of(
                      c.country_code || "ZA",
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Denomination / category</dt>
                  <dd>{c.denomination}</dd>
                </div>
                <div>
                  <dt>Metal</dt>
                  <dd>{c.metal || "Not verified for this issue"}</dd>
                </div>
                <div>
                  <dt>Documented mintage</dt>
                  <dd>{c.mintage?.toLocaleString() || "Not connected"}</dd>
                </div>
                <div>
                  <dt>Record type</dt>
                  <dd>
                    {c.verification === "verified"
                      ? "Verified catalogue fact"
                      : "Editorial introduction · review pending"}
                  </dd>
                </div>
              </dl>
              <div className="source-card">
                <BookOpen size={20} />
                <div>
                  <strong>Continue at the original source</strong>
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.source_name}
                    <ExternalLink size={14} />
                  </a>
                  <small>
                    A reference link is not proof of every issue-level detail.
                    No source images or proprietary catalogue text have been
                    copied.
                  </small>
                </div>
              </div>
            </>
          ) : tab === "Valuation evidence" ? (
            <>
              <div className="eyebrow">EVIDENCE BEFORE ESTIMATES</div>
              <h2>Start with what actually sold.</h2>
              <p>
                We need verified matches for the issue, year, mint mark and
                condition before calculating a range.
              </p>
              <Notice>
                {data.evidence_count === 0
                  ? "No verified market transactions are connected to this entry. No valuation is available."
                  : `${data.evidence_count} documented observations are connected. A range requires matching the exact issue and condition.`}
              </Notice>
              {session?.entitlements.plan === "pro" ? (
                <form className="research-form" onSubmit={research}>
                  <div className="form-grid">
                    <Field
                      label="Year"
                      name="year"
                      type="number"
                      min="1500"
                      max={new Date().getFullYear()}
                      defaultValue={c.start_year}
                      required
                    />
                    <Field
                      label="Mint mark (blank if none)"
                      name="mint_mark"
                      maxLength={30}
                    />
                    <Field label="Condition (owner-reported)">
                      <select name="condition">
                        {conditions.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Button disabled={busy} icon={Search}>
                    {busy ? "Researching…" : "Check comparable evidence"}
                  </Button>
                  {researchError && (
                    <Notice tone="error">{researchError}</Notice>
                  )}
                  {valuation && <ValuationPanel valuation={valuation} />}
                </form>
              ) : (
                <div className="premium-callout">
                  <div>
                    <GemIcon />
                    <strong>
                      Advanced valuation research is an Atlas Pro feature.
                    </strong>
                    <p>
                      Paid checkout remains disabled while the underlying
                      services are connected.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/app/billing")}
                  >
                    View membership
                  </Button>
                </div>
              )}
              <EvidenceLegend />
            </>
          ) : (
            <>
              <div className="eyebrow">A CLOSER LOOK</div>
              <h2>Interesting doesn’t always mean rare.</h2>
              <p>{c.variety_notes}</p>
              <div className="research-checks">
                {[
                  "Check the exact date, inscriptions and mint mark.",
                  "Photograph the edge and both sides in natural light.",
                  "Distinguish striking anomalies from wear and alterations.",
                  "Compare with an issue-specific published reference.",
                  "Ask a qualified numismatist before claiming rarity.",
                ].map((t) => (
                  <p key={t}>
                    <CheckCircle2 size={16} />
                    {t}
                  </p>
                ))}
              </div>
              {data.varieties.length ? (
                data.varieties.map((v) => (
                  <section className="source-card variety-record" key={v.id}>
                    <div>
                      <Tag tone="green">
                        Reviewed reference ·{" "}
                        {v.year || "Date-specific details in source"}
                      </Tag>
                      <h3>{v.name}</h3>
                      <p>{v.distinguishing_features}</p>
                      <p>{v.evidence_summary}</p>
                      <a
                        href={v.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {v.source_name}
                        <ExternalLink size={14} />
                      </a>
                      <small>
                        Reviewed {date(v.reviewed_at)}. A match still requires
                        physical assessment.
                      </small>
                    </div>
                  </section>
                ))
              ) : (
                <Notice>
                  {data.variety_count > 0
                    ? "Reviewed variety research is available to Pro members."
                    : "No verified rare-date or die-variety dataset is connected to this entry."}{" "}
                  A possible error may need in-person inspection.
                </Notice>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
function GemIcon() {
  return <span className="small-diamond">◇</span>;
}
function EvidenceLegend() {
  return (
    <div className="evidence-legend">
      <h3>Different prices answer different questions.</h3>
      {[
        ["Completed sale", "A documented transaction, with date and context."],
        ["Asking price", "A seller’s request. It may never become a sale."],
        ["Dealer bid", "An offer to buy, allowing for margin and risk."],
        [
          "Melt value",
          "Metal content × a documented metal price; not collector value.",
        ],
      ].map(([a, b]) => (
        <div key={a}>
          <strong>{a}</strong>
          <p>{b}</p>
        </div>
      ))}
    </div>
  );
}
export function ValuationPanel({ valuation }) {
  return (
    <section className="valuation-panel">
      <div className="eyebrow">CALCULATED ESTIMATE / ZAR</div>
      <h3>
        {valuation.status === "available"
          ? `${money(valuation.low_minor)} – ${money(valuation.high_minor)}`
          : "No defensible estimate available."}
      </h3>
      <p>{valuation.reason}</p>
      <small>
        As of {date(valuation.as_of)} · Confidence: {valuation.confidence} · Not
        a professional appraisal
      </small>
      {valuation.evidence.map((e) => (
        <a
          key={e.id}
          href={e.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {e.source_name} · {date(e.observed_at)}
          <strong>
            {money(e.amount_minor)} <ExternalLink size={13} />
          </strong>
        </a>
      ))}
    </section>
  );
}

export function PhotoUpload({ side, label, photo, setPhoto, disabled }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    input = useRef(),
    camera = useRef();
  async function upload(file) {
    if (!file) return;
    setError("");
    if (file.size > 6 * 1024 * 1024) {
      setError("Choose a photo smaller than 6 MB.");
      return;
    }
    setBusy(true);
    try {
      const f = new FormData();
      f.append("side", side);
      f.append("photo", file);
      const r = await api("/photos", { method: "POST", body: f });
      setPhoto(r.photo);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      if (camera.current) camera.current.value = "";
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/photos/${photo.id}`, { method: "DELETE" });
      setPhoto(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="photo-upload">
      <div className="photo-upload-title">
        <strong>{label}</strong>
        <span>{side === "obverse" ? "01" : "02"}</span>
      </div>
      <div
        className={`upload-target ${photo ? "has-photo" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy && !disabled && !photo) upload(e.dataTransfer.files[0]);
        }}
      >
        {photo ? (
          <>
            <img src={`/api/photos/${photo.id}`} alt={`${label} photograph`} />
            <button
              type="button"
              disabled={busy || disabled}
              className="remove-photo"
              aria-label={`Remove ${label} photograph`}
              onClick={remove}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="upload-coin-outline">
              <ScanLine size={28} />
            </div>
            <p>
              {busy
                ? "Preparing your photograph…"
                : "A clear view of the whole coin"}
            </p>
            <button
              type="button"
              className="upload-choose"
              disabled={busy || disabled}
              onClick={() => input.current.click()}
            >
              {busy ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Upload size={14} />
              )}{" "}
              Choose photo
            </button>
            <button
              type="button"
              className="camera-button"
              disabled={busy || disabled}
              onClick={() => camera.current.click()}
            >
              <Camera size={13} /> Use camera
            </button>
          </>
        )}
      </div>
      <input
        hidden
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={`Upload ${label}`}
        onChange={(e) => upload(e.target.files[0])}
      />
      <input
        hidden
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label={`Capture ${label}`}
        onChange={(e) => upload(e.target.files[0])}
      />
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function Identify({ session, navigate, caps, openCoin, setSession }) {
  const [front, setFront] = useState(null),
    [back, setBack] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [result, setResult] = useState(null);
  async function identify() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await api("/assessments", {
        method: "POST",
        body: {
          obverse_id: front.id,
          ...(back ? { reverse_id: back.id } : {}),
          consent: true,
        },
      });
      setResult(r.assessment);
      setSession({ ...session, entitlements: r.entitlements });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="A CLOSER LOOK"
        title="Let’s get to know your coin."
        description="Start with clear photographs of both sides. Good identification begins with the details."
      />
      {!session ? (
        <Gate navigate={navigate} title="Your photographs belong to you." />
      ) : (
        <>
          <div className="identify-layout">
            <section className="panel upload-panel">
              <div className="panel-heading">
                <div>
                  <h2>Two sides. A better perspective.</h2>
                  <p>
                    JPEG, PNG or WebP · up to 6 MB per photo · at least 200 ×
                    200 px
                  </p>
                </div>
                <Tag>PRIVATE</Tag>
              </div>
              <div className="photo-pair">
                <PhotoUpload
                  side="obverse"
                  label="Obverse / front"
                  photo={front}
                  setPhoto={(p) => {
                    setFront(p);
                    setResult(null);
                  }}
                  disabled={busy}
                />
                <PhotoUpload
                  side="reverse"
                  label="Reverse / back"
                  photo={back}
                  setPhoto={(p) => {
                    setBack(p);
                    setResult(null);
                  }}
                  disabled={busy}
                />
              </div>
              <div className="photo-tips">
                <Camera size={20} />
                <p>
                  Use soft, even light and a plain background. Keep the whole
                  coin in frame. Never clean a coin just to photograph it.
                </p>
              </div>
              {!caps.ai.available && (
                <Notice tone="warning">
                  <strong>AI identification isn’t connected yet.</strong> You
                  can upload photographs and save a manual record. No scan
                  allowance will be used.
                </Notice>
              )}
              {caps.ai.available && (
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I agree to send these photographs to the configured AI
                    provider. Avoid including people or personal information.
                  </span>
                </label>
              )}
              <div className="upload-actions">
                <Button
                  icon={busy ? LoaderCircle : ScanLine}
                  disabled={!front || !consent || !caps.ai.available || busy}
                  onClick={identify}
                >
                  {busy ? "Examining your photographs…" : "Identify this coin"}
                </Button>
                <Button
                  variant="secondary"
                  icon={Plus}
                  disabled={busy}
                  onClick={() =>
                    openCoin({ photos: [front, back].filter(Boolean) })
                  }
                >
                  Record manually
                </Button>
              </div>
              {error && <Notice tone="error">{error}</Notice>}
              <small className="scan-allowance">
                {session.entitlements.scans_used} of{" "}
                {session.entitlements.scan_limit} monthly scans used. Resets
                each calendar month (UTC).
              </small>
            </section>
            <aside className="identification-notes">
              <div className="eyebrow">KNOW WHAT YOU’RE SEEING</div>
              <h2>
                A helpful first look.
                <br />
                <em>Not the final word.</em>
              </h2>
              {[
                [
                  Eye,
                  "Visible observations",
                  "What can be seen is separated from what is inferred.",
                ],
                [
                  CircleHelp,
                  "Honest uncertainty",
                  "A faint date should never become a confident claim.",
                ],
                [
                  ShieldCheck,
                  "Expert assessment",
                  "Photographs cannot certify grade, metal or authenticity.",
                ],
              ].map(([Icon, h, p]) => (
                <div className="note-item" key={h}>
                  <Icon size={19} />
                  <div>
                    <h3>{h}</h3>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </aside>
          </div>
          {result && (
            <section className="panel scan-result">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">
                    AI PREDICTION · NOT VERIFIED CATALOGUE INFORMATION
                  </div>
                  <h2>{result.prediction.likely_name}</h2>
                </div>
                <Tag tone="amber">
                  {result.prediction.confidence} model confidence
                </Tag>
              </div>
              <Notice>
                {result.prediction.image_quality === "insufficient"
                  ? "Insufficient image quality. Try clearer images of both sides."
                  : "Tentative interpretation, not an authenticated identification. Model confidence is not a calibrated probability."}
              </Notice>
              <dl className="facts">
                {[
                  ["Country", result.prediction.country],
                  ["Denomination", result.prediction.denomination],
                  ["Year", result.prediction.year],
                  ["Design", result.prediction.design],
                  ["Series", result.prediction.series],
                  ["Mint mark", result.prediction.mint_mark],
                  ["Metal (tentative)", result.prediction.metal],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "Not established"}</dd>
                  </div>
                ))}
              </dl>
              <h3>Visible observations</h3>
              <ul>
                {result.prediction.observations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
              <h3>What remains uncertain</h3>
              <ul>
                {result.prediction.uncertainties.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
              <p>{result.prediction.condition_guidance}</p>
              {result.prediction.possible_variety && (
                <Notice>
                  Possible variety for investigation only:{" "}
                  {result.prediction.possible_variety}
                </Notice>
              )}
              {result.prediction.expert_review_recommended && (
                <Tag tone="amber">Independent expert review recommended</Tag>
              )}
              <Button
                icon={Plus}
                onClick={() =>
                  openCoin({
                    name: result.prediction.likely_name,
                    denomination: result.prediction.denomination || "",
                    year: result.prediction.year,
                    notes: `Unverified AI suggestion (${result.prediction.confidence} model confidence). ${result.prediction.uncertainties.join(" ")}`,
                    photos: [front, back].filter(Boolean),
                  })
                }
              >
                Review and save a record
              </Button>
            </section>
          )}
        </>
      )}
    </>
  );
}
