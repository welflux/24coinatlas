import React, { useState } from "react";
import {
  Download,
  Plus,
  Search,
  X,
  Gem,
  Layers,
  Coins,
  ChevronRight,
  Bookmark,
  Trash2,
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Camera,
  ShieldCheck,
  Check,
  LoaderCircle,
} from "lucide-react";
import { api, download } from "./api";
import {
  Button,
  Notice,
  Empty,
  Loading,
  Tag,
  Field,
  Heading,
  Gate,
  Modal,
  useResource,
  money,
  date,
  conditions,
} from "./ui";
import { PhotoUpload, ValuationPanel } from "./workspace";
export function Collection({ session, navigate, openCoin, revision, notify }) {
  const [query, setQuery] = useState(""),
    [view, setView] = useState("Inventory"),
    r = useResource(
      session ? `/collection?q=${encodeURIComponent(query)}` : null,
      revision,
    ),
    w = useResource(session ? "/wishlist" : null, revision);
  async function exportCsv() {
    try {
      await download("/collection/export.csv", "24coinatlas-inventory.csv");
      notify("Your inventory was downloaded.");
    } catch (e) {
      notify(e.message);
    }
  }
  async function removeWish(id) {
    try {
      await api(`/wishlist/${id}`, { method: "DELETE" });
      w.reload();
    } catch (e) {
      notify(e.message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="YOUR PRIVATE COLLECTION"
        title="More than a box of coins."
        description="Keep the details, the provenance and the personal stories together."
      >
        {session && (
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>
              Export inventory
            </Button>
            <Button icon={Plus} onClick={() => openCoin()}>
              Add a coin
            </Button>
          </>
        )}
      </Heading>
      {!session ? (
        <Gate navigate={navigate} />
      ) : (
        <>
          <div className="collection-summary">
            <div>
              <span>COINS RECORDED</span>
              <strong>{r.data?.summary.coins ?? "—"}</strong>
            </div>
            <div>
              <span>ACQUISITION COST</span>
              <strong>
                {r.data ? money(r.data.summary.acquisition_minor) : "—"}
              </strong>
              <small>Recorded costs, not a valuation</small>
            </div>
            <div>
              <span>RECORD CAPACITY</span>
              <strong>
                {r.data?.summary.records ?? 0}
                <small>/ {session.entitlements.collection_limit}</small>
              </strong>
            </div>
            <div>
              <span>COLLECTOR VALUE</span>
              <strong className="no-value">Not established</strong>
              <small>Verified comparisons required</small>
            </div>
          </div>
          <div className="collection-controls">
            <div className="tabs">
              {["Inventory", "Research list", "Intelligence"].map((v) => (
                <button
                  className={view === v ? "selected" : ""}
                  key={v}
                  onClick={() => setView(v)}
                >
                  {v}
                  {v === "Research list" && (
                    <span>{w.data?.items.length || 0}</span>
                  )}
                  {v === "Intelligence" && <Gem size={13} />}
                </button>
              ))}
            </div>
            {view === "Inventory" && (
              <div className="search-input compact">
                <Search size={16} />
                <input
                  aria-label="Search your collection"
                  placeholder="Find a coin…"
                  value={query}
                  maxLength={100}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}
          </div>
          {view === "Inventory" ? (
            r.loading ? (
              <Loading />
            ) : r.error ? (
              <Notice tone="error">{r.error}</Notice>
            ) : r.data?.items.length ? (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>COIN / ISSUE</th>
                      <th>YEAR</th>
                      <th>CONDITION</th>
                      <th>QTY</th>
                      <th>UNIT COST</th>
                      <th>
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.items.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <a href={`/app/collection/${c.id}`} data-route>
                            <div className="table-coin">
                              {c.photos[0] ? (
                                <img
                                  src={`/api/photos/${c.photos[0].id}`}
                                  alt="Your coin"
                                />
                              ) : (
                                <Coins size={23} />
                              )}
                            </div>
                            <div>
                              <strong>{c.name}</strong>
                              <span>
                                {c.denomination || "Denomination not recorded"}
                              </span>
                            </div>
                          </a>
                        </td>
                        <td>{c.year || "—"}</td>
                        <td>
                          <Tag>{c.condition}</Tag>
                        </td>
                        <td>{c.quantity}</td>
                        <td>
                          {c.purchase_minor === null
                            ? "Not recorded"
                            : money(c.purchase_minor)}
                        </td>
                        <td>
                          <a
                            href={`/app/collection/${c.id}`}
                            data-route
                            aria-label={`Open ${c.name}`}
                          >
                            <ChevronRight size={18} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                icon={Layers}
                title={
                  query
                    ? "No matching coins."
                    : "Your collection starts with a single coin."
                }
                action={
                  <Button icon={Plus} onClick={() => openCoin()}>
                    Add a coin
                  </Button>
                }
              >
                {query
                  ? "Try another name, denomination or year."
                  : "Add an inherited piece or a recent find. You can record it before knowing exactly what it is."}
              </Empty>
            )
          ) : view === "Research list" ? (
            <>
              <Notice>
                A personal research list, not a calculated completeness score. A
                verified date-by-date catalogue is required to identify missing
                coins reliably.
              </Notice>
              {w.error && <Notice tone="error">{w.error}</Notice>}
              {w.loading ? (
                <Loading />
              ) : w.data?.items.length ? (
                <div className="wishlist-list">
                  {w.data.items.map((v) => (
                    <div key={v.id}>
                      <Bookmark size={18} />
                      <a href={`/app/catalogue/${v.catalogue_id}`} data-route>
                        {v.name}
                        <small>
                          {v.target_year || "Any year"} · {v.denomination}
                        </small>
                      </a>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${v.name} from research list`}
                        onClick={() => removeWish(v.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Bookmark}
                  title="Give your curiosity a place to land."
                  action={
                    <Button onClick={() => navigate("/app/catalogue")}>
                      Explore the catalogue
                    </Button>
                  }
                >
                  Save a catalogue entry to revisit it later.
                </Empty>
              )}
            </>
          ) : session.entitlements.plan === "pro" ? (
            <Analytics revision={revision} />
          ) : (
            <Empty
              icon={Gem}
              title="A clearer view of your whole collection."
              action={
                <Button onClick={() => navigate("/app/billing")}>
                  Explore Atlas Pro
                </Button>
              }
            >
              Pro adds era breakdowns, collection activity and
              evidence-supported estimates when qualifying data exists. No value
              history is manufactured.
            </Empty>
          )}
          {r.data?.summary.costs_missing > 0 && view === "Inventory" && (
            <p className="muted-note">
              {r.data.summary.costs_missing} records have no acquisition cost.
              Recorded spend excludes those coins.
            </p>
          )}
        </>
      )}
    </>
  );
}
function Analytics({ revision }) {
  const r = useResource("/collection/analytics", revision);
  if (r.loading) return <Loading />;
  if (r.error) return <Notice tone="error">{r.error}</Notice>;
  const total = r.data.by_era.reduce((s, e) => s + e.quantity, 0);
  return (
    <div className="analytics-grid">
      <section className="panel padded">
        <h2>A collection across eras.</h2>
        {r.data.by_era.map((e) => (
          <div className="era-chart" key={e.era}>
            <span>{e.era}</span>
            <strong>{e.quantity}</strong>
            <div>
              <i style={{ width: `${(e.quantity / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>
      <section className="panel padded">
        <h2>Evidence-supported estimates</h2>
        <strong className="analytics-value">
          {r.data.estimated_low_minor === null
            ? "Not available"
            : `${money(r.data.estimated_low_minor)} – ${money(r.data.estimated_high_minor)}`}
        </strong>
        <p>
          {r.data.valued_records} records have qualifying comparisons.{" "}
          {r.data.unvalued_records} have no defensible estimate.
        </p>
        <Notice>
          Value history requires genuine dated observations. Acquisition cost is
          tracked separately.
        </Notice>
        <Button
          variant="secondary"
          icon={Download}
          onClick={() =>
            download(
              "/collection/report",
              "24coinatlas-collection-report.html",
            ).catch((e) => window.alert(e.message))
          }
        >
          Download collection report
        </Button>
        {r.data.value_history.length > 0 && (
          <div className="history-table">
            <h3>Recorded historical estimates</h3>
            <p>
              Partial coverage at each observation date. Values are never
              backfilled.
            </p>
            {r.data.value_history.map((h) => (
              <div key={h.observed_on}>
                <span>
                  {date(h.observed_on)} · {h.covered_records} records
                </span>
                <strong>
                  {money(h.low_minor)} – {money(h.high_minor)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel padded activity-panel">
        <h2>Your collection history</h2>
        {r.data.history.map((h, i) => (
          <div className="activity-row" key={i}>
            <span>
              <i />
              {h.action} {h.coin_name}
            </span>
            <small>{date(h.created_at + "Z")}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

export function CollectionDetail({
  id,
  openCoin,
  notify,
  navigate,
  session,
  revision,
}) {
  const r = useResource(session ? `/collection/${id}` : null, revision),
    [deleting, setDeleting] = useState(false),
    [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await api(`/collection/${id}`, { method: "DELETE" });
      notify("Coin and attached photographs deleted.");
      navigate("/app/collection");
    } catch (e) {
      notify(e.message);
      setBusy(false);
    }
  }
  async function removePhoto(photo) {
    try {
      await api(`/photos/${photo.id}`, { method: "DELETE" });
      r.reload();
      notify("Photograph deleted.");
    } catch (e) {
      notify(e.message);
    }
  }
  async function report() {
    try {
      await download(
        `/collection/${id}/report`,
        "24coinatlas-coin-dossier.html",
      );
      notify("Dossier downloaded. Open it and use Print to save a PDF.");
    } catch (e) {
      notify(e.message);
    }
  }
  if (!session) return <Gate navigate={navigate} />;
  if (r.loading) return <Loading />;
  if (r.error) return <Notice tone="error">{r.error}</Notice>;
  const { coin: c, photos, valuation } = r.data;
  return (
    <>
      <a href="/app/collection" data-route className="back-link">
        <ArrowLeft size={15} /> Back to my collection
      </a>
      <Heading
        eyebrow="PRIVATE COIN RECORD"
        title={c.name}
        description={`${c.year || "Year not recorded"} · ${c.denomination || "Denomination not recorded"} · Quantity ${c.quantity}`}
      >
        <Button
          variant="secondary"
          icon={Pencil}
          onClick={() => openCoin({ ...c, photos })}
        >
          Edit record
        </Button>
        <Button icon={Download} onClick={report}>
          Download dossier{" "}
          {session.entitlements.plan !== "pro" && <Tag>PRO</Tag>}
        </Button>
      </Heading>
      <div className="record-layout">
        <section className="panel padded">
          <h2>Your photographs</h2>
          {photos.length ? (
            <div className="record-photos">
              {photos.map((p) => (
                <figure key={p.id}>
                  <img
                    src={`/api/photos/${p.id}`}
                    alt={`${p.side} of ${c.name}`}
                  />
                  <figcaption>
                    {p.side.toUpperCase()} · OWNER PHOTOGRAPH
                  </figcaption>
                  <button
                    className="text-link danger"
                    onClick={() => removePhoto(p)}
                  >
                    <Trash2 size={13} />
                    Remove photo
                  </button>
                </figure>
              ))}
            </div>
          ) : (
            <Empty
              icon={Camera}
              title="No photographs attached."
              action={
                <Button
                  variant="secondary"
                  onClick={() => openCoin({ ...c, photos: [] })}
                >
                  Add photographs
                </Button>
              }
            >
              Add both sides of your coin to keep its story together.
            </Empty>
          )}
          <h2>Collection details</h2>
          <dl className="facts">
            {[
              ["Condition (owner-reported)", c.condition],
              ["Mint mark", c.mint_mark || "Not recorded"],
              [
                "Unit acquisition cost",
                c.purchase_minor === null
                  ? "Not recorded"
                  : money(c.purchase_minor),
              ],
              ["Acquisition date", date(c.acquired_at)],
              ["Provenance", c.provenance || "Not recorded"],
              ["Personal notes", c.notes || "None yet"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="preserve-lines">{v}</dd>
              </div>
            ))}
          </dl>
          {c.catalogue_id && (
            <a
              href={`/app/catalogue/${c.catalogue_id}`}
              data-route
              className="text-link"
            >
              View linked catalogue entry <ArrowUpRight size={15} />
            </a>
          )}
          <div className="delete-record">
            <button
              className="text-link danger"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={15} /> Delete this coin record
            </button>
          </div>
        </section>
        <aside>
          <ValuationPanel valuation={valuation} />
          <div className="panel padded expert-panel">
            <ShieldCheck size={25} />
            <h3>Preparing for an assessment?</h3>
            <p>
              Record weight and diameter, keep original packaging, and
              photograph the edge. Never clean or alter the coin.
            </p>
            <p>
              No expert or dealer is connected. Referrals and commissions are
              disabled.
            </p>
          </div>
        </aside>
      </div>
      {deleting && (
        <Modal
          title="Delete this coin?"
          onClose={() => !busy && setDeleting(false)}
        >
          <p>
            The record and its photographs will be permanently removed. This
            cannot be undone.
          </p>
          <div className="modal-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDeleting(false)}
            >
              Keep record
            </Button>
            <Button
              variant="danger-button"
              icon={Trash2}
              disabled={busy}
              onClick={remove}
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function CoinForm({ initial, onClose, onSaved }) {
  const r = useResource("/catalogue"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(initial.catalogue_id || ""),
    [front, setFront] = useState(
      initial.photos?.find((p) => p.side === "obverse") || null,
    ),
    [back, setBack] = useState(
      initial.photos?.find((p) => p.side === "reverse") || null,
    );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      data = {
        catalogue_id: f.get("catalogue_id") || null,
        name: f.get("name"),
        denomination: f.get("denomination"),
        year: f.get("year") ? Number(f.get("year")) : null,
        mint_mark: f.get("mint_mark"),
        condition: f.get("condition"),
        quantity: Number(f.get("quantity")),
        purchase_minor: f.get("purchase")
          ? Math.round(Number(f.get("purchase")) * 100)
          : null,
        acquired_at: f.get("acquired_at") || null,
        provenance: f.get("provenance"),
        notes: f.get("notes"),
        photo_ids: [front?.id, back?.id].filter(Boolean),
      };
    try {
      await api(initial.id ? `/collection/${initial.id}` : "/collection", {
        method: initial.id ? "PATCH" : "POST",
        body: data,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        initial.id
          ? "Edit your coin record."
          : "A new chapter in your collection."
      }
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit} className="coin-form">
        <div className="form-grid">
          <Field
            label="Coin name *"
            name="name"
            defaultValue={initial.name || ""}
            placeholder="e.g. Grandad’s silver shilling"
            maxLength={180}
            required
          />
          <Field label="Catalogue link (optional)">
            <select
              name="catalogue_id"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Unidentified / no link</option>
              {r.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Denomination"
            name="denomination"
            defaultValue={initial.denomination || ""}
            maxLength={60}
            placeholder="e.g. R5, 1 shilling"
          />
          <Field
            label="Year"
            name="year"
            type="number"
            min="1500"
            max={new Date().getFullYear()}
            defaultValue={initial.year || ""}
          />
          <Field
            label="Mint mark"
            name="mint_mark"
            maxLength={30}
            defaultValue={initial.mint_mark || ""}
          />
          <Field label="Condition (your assessment)">
            <select
              name="condition"
              defaultValue={initial.condition || "Not assessed"}
            >
              {conditions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Quantity *"
            name="quantity"
            type="number"
            min="1"
            max="10000"
            defaultValue={initial.quantity || 1}
            required
          />
          <Field
            label="Unit acquisition cost (ZAR)"
            name="purchase"
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            defaultValue={
              initial.purchase_minor == null ? "" : initial.purchase_minor / 100
            }
            help="What you paid per coin. Leave blank if unknown."
          />
          <Field
            label="Acquisition date"
            name="acquired_at"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={initial.acquired_at || ""}
          />
          <Field
            label="Provenance"
            name="provenance"
            maxLength={2000}
            defaultValue={initial.provenance || ""}
            placeholder="e.g. Inherited from family"
          />
        </div>
        <Field label="Your notes">
          <textarea
            name="notes"
            maxLength={4000}
            defaultValue={initial.notes || ""}
            rows={3}
            placeholder="Inscriptions, history or questions to investigate…"
          />
        </Field>
        <details className="form-photo-details">
          <summary>
            <Camera size={16} /> Photographs
          </summary>
          <div className="photo-pair">
            <PhotoUpload
              side="obverse"
              label="Obverse / front"
              photo={front}
              setPhoto={setFront}
              disabled={busy}
            />
            <PhotoUpload
              side="reverse"
              label="Reverse / back"
              photo={back}
              setPhoto={setBack}
              disabled={busy}
            />
          </div>
        </details>
        {error && <Notice tone="error">{error}</Notice>}
        <p className="muted-note">
          Personal records are not verified catalogue facts. Purchase price is
          not a valuation.
        </p>
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            icon={null}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={busy ? LoaderCircle : Check}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save coin record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
