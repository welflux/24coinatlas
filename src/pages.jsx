import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  ScanLine,
  ShieldCheck,
  BookOpen,
  Layers,
  Gem,
  Plus,
  Coins,
  LockKeyhole,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ExternalLink,
  Trash2,
  LogOut,
} from "lucide-react";
import { api, setCsrf } from "./api";
import {
  Brand,
  Button,
  Notice,
  Empty,
  Loading,
  Tag,
  Field,
  Heading,
  Gate,
  Modal,
  CoinArt,
  useResource,
  money,
  date,
} from "./ui";
export function Landing({ navigate, session }) {
  return (
    <div className="landing">
      <header className="landing-header container">
        <a href="/" data-route>
          <Brand />
        </a>
        <nav>
          <a data-route href="/app/catalogue">
            The catalogue
          </a>
          <a data-route href="/app/research">
            Rarity research
          </a>
          <a data-route href="/app/billing">
            Membership
          </a>
        </nav>
        <div className="landing-header-actions">
          <a data-route href={session ? "/app" : "/login"}>
            {session ? "My workspace" : "Sign in"}
          </a>
          <Button onClick={() => navigate(session ? "/app" : "/register")}>
            Start your collection
          </Button>
        </div>
      </header>
      <main id="main">
        <section className="landing-hero container">
          <div className="landing-copy">
            <div className="eyebrow">
              <span className="sa-flag" /> SOUTH AFRICAN COINS. EXTRAORDINARY
              STORIES.
            </div>
            <h1>
              There’s more to
              <br />
              your coin than
              <br />
              <em>meets the eye.</em>
            </h1>
            <p>
              From an inherited shilling to a treasured Krugerrand. Discover
              what you’re holding, explore the evidence, and build a collection
              worth knowing.
            </p>
            <div className="landing-cta">
              <Button onClick={() => navigate("/app/identify")}>
                Explore your coin
              </Button>
              <a data-route href="/app/catalogue">
                Browse the catalogue <ArrowRight size={16} />
              </a>
            </div>
            <div className="landing-trust">
              <ShieldCheck size={17} />
              <span>
                Private collections. Clear sources. No inflated promises.
              </span>
            </div>
          </div>
          <div className="hero-collection">
            <div className="hero-art-grid" />
            <span className="hero-caption-top">
              THE SOUTH AFRICAN COLLECTION <span>EST. IN CURIOSITY</span>
            </span>
            <div className="hero-coin hero-gold">
              <CoinArt kind="krugerrand" />
            </div>
            <div className="hero-coin hero-silver">
              <CoinArt kind="mandela" />
            </div>
            <span className="hero-coordinate">
              26°12′ S<br />
              28°02′ E
            </span>
            <div className="coin-label">
              <span>
                <i /> A LEGACY IN YOUR HANDS
              </span>
              <strong>
                Small objects.
                <br />
                Remarkable histories.
              </strong>
            </div>
            <span className="illustration-label">
              COIN ILLUSTRATIONS · NOT IDENTIFICATION REFERENCES
            </span>
          </div>
        </section>
        <div className="landing-strip">
          <div className="container">
            <span>ONE HOME FOR YOUR COINS</span>
            <span>
              <ScanLine size={18} /> Thoughtful identification
            </span>
            <span>
              <BookOpen size={18} /> Source-led research
            </span>
            <span>
              <Layers size={18} /> Private collection records
            </span>
          </div>
        </div>
        <section className="landing-intro container">
          <div className="eyebrow">COLLECT WITH CONTEXT</div>
          <div className="intro-heading">
            <h2>
              A little knowledge.
              <br />
              <em>A different perspective.</em>
            </h2>
            <p>
              A worn date. An unfamiliar portrait. A box left by a grandparent.
              Start with the questions, then follow the evidence.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                ScanLine,
                "01",
                "Look closer.",
                "Upload both sides and keep photographs with a coin’s record. AI observations, when connected, are clearly labelled as predictions.",
                "Identify a coin",
                "/app/identify",
              ],
              [
                Gem,
                "02",
                "Research the details.",
                "Investigate dates and possible varieties. See what is documented, what is uncertain, and when to ask an expert.",
                "Explore the catalogue",
                "/app/catalogue",
              ],
              [
                Layers,
                "03",
                "Keep the whole story.",
                "Track acquisition costs, condition notes and provenance. A private inventory that grows with your collection.",
                "Create your collection",
                "/register",
              ],
            ].map(([Icon, n, title, text, label, href]) => (
              <a href={href} data-route className="feature-card" key={n}>
                <div>
                  <Icon size={26} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <strong>
                  {label}
                  <ArrowUpRight size={17} />
                </strong>
              </a>
            ))}
          </div>
        </section>
        <section className="heritage-section">
          <div className="container heritage-inner">
            <div>
              <div className="eyebrow">ROOTED HERE. BUILT WITH CARE.</div>
              <h2>
                Our history,
                <br />
                one coin at a time.
              </h2>
              <p>
                From ZAR and Union-era issues to modern commemoratives. A
                focused starting point for exploring South Africa’s numismatic
                heritage.
              </p>
              <a href="/app/catalogue" data-route className="text-link">
                Explore South African coinage <ArrowRight size={17} />
              </a>
            </div>
            <div className="heritage-timeline">
              {[
                ["1892", "ZAR & historical"],
                ["1923", "Union & pre-decimal"],
                ["1961", "The decimal era"],
                ["Today", "Modern rand & commemoratives"],
              ].map(([year, label]) => (
                <div key={year}>
                  <span>{year}</span>
                  <p>{label}</p>
                  <ArrowUpRight size={17} />
                </div>
              ))}
              <small>
                Historical orientation, not a complete catalogue of issues.
              </small>
            </div>
          </div>
        </section>
        <section className="evidence-section container">
          <ShieldCheck size={33} />
          <div>
            <div className="eyebrow">EVIDENCE BEFORE ESTIMATES</div>
            <h2>A big asking price isn’t a valuation.</h2>
            <p>
              We distinguish documented sales from listings, bullion value and
              AI guesses. When reliable evidence is missing, we say so. No
              verified sale dataset is currently connected.
            </p>
          </div>
        </section>
        <section className="landing-end container">
          <div>
            <div className="eyebrow">START WITH WHAT YOU HAVE.</div>
            <h2>
              Your next discovery
              <br />
              could be in your drawer.
            </h2>
          </div>
          <Button variant="light" onClick={() => navigate("/register")}>
            Create your free account
          </Button>
        </section>
      </main>
      <footer className="landing-footer container">
        <Brand />
        <p>South African coins. A clearer understanding.</p>
        <span>© {new Date().getFullYear()} 24CoinAtlas</span>
      </footer>
    </div>
  );
}

export function Auth({ mode, navigate, setSession, notify, session }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    register = mode === "register";
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const result = await api(`/auth/${mode}`, {
        method: "POST",
        body: {
          email: f.get("email"),
          password: f.get("password"),
          ...(register ? { name: f.get("name") } : {}),
        },
      });
      setCsrf(result.csrf);
      setSession(result.user);
      if (result.verification_required) {
        notify(result.message);
        navigate("/verify-email");
      } else {
        notify(
          register ? "Your private collection is ready." : "Welcome back.",
        );
        navigate("/app");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <a href="/" data-route className="auth-brand">
        <Brand />
      </a>
      <main id="main" className="auth-card">
        <div className="eyebrow">YOUR COLLECTION STARTS HERE</div>
        <h1>{register ? "A home for your coins." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create a free account. No payment details required."
            : "Sign in to your private collection and research."}
        </p>
        {session ? (
          <Notice>
            You’re already signed in.{" "}
            <a data-route href="/app">
              Open your workspace →
            </a>
          </Notice>
        ) : (
          <form onSubmit={submit}>
            {register && (
              <Field
                label="Your name"
                name="name"
                autoComplete="name"
                maxLength={80}
                required
              />
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
            <label className="field" htmlFor="auth-password">
              <span>Password</span>
              <div className="password-input">
                <input
                  id="auth-password"
                  aria-label="Password"
                  name="password"
                  type={show ? "text" : "password"}
                  minLength={register ? 12 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {register && (
                <small>
                  At least 12 characters. A memorable passphrase works well.
                </small>
              )}
            </label>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : register
                  ? "Create free account"
                  : "Sign in"}
            </Button>
          </form>
        )}
        <p className="auth-switch">
          {register ? "Already a collector here?" : "New to 24CoinAtlas?"}{" "}
          <a href={register ? "/login" : "/register"} data-route>
            {register ? "Sign in" : "Create an account"}
          </a>
        </p>
        <p className="auth-recovery">
          <a href="/forgot-password" data-route>
            Forgot password?
          </a>
          <a href="/verify-email" data-route>
            Verify email
          </a>
        </p>
        <div className="auth-privacy">
          <LockKeyhole size={14} />
          <span>
            Your inventory and photographs are private. Photo analysis is
            optional and requires your consent.
          </span>
        </div>
      </main>
      <a href="/" data-route className="back-link">
        <ArrowLeft size={14} /> Back to 24CoinAtlas
      </a>
    </div>
  );
}

export function Dashboard({ session, navigate, caps, openCoin, revision }) {
  const collection = useResource(session ? "/collection" : null, revision),
    catalogue = useResource("/catalogue");
  return (
    <>
      <Heading
        eyebrow="A NEW PERSPECTIVE ON YOUR COLLECTION"
        title={
          session
            ? `Welcome back, ${session.name.split(" ")[0]}.`
            : "Every coin has a story."
        }
        description="Discover the history. Follow the evidence. Know your collection."
      >
        <Button onClick={() => navigate("/app/identify")} icon={ScanLine}>
          Identify a coin
        </Button>
      </Heading>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <Tag tone="dark">MADE FOR SOUTH AFRICAN COLLECTORS</Tag>
          <h2>
            What’s the story
            <br />
            behind <em>your coin?</em>
          </h2>
          <p>
            From an inherited penny to a modern R5.
            <br />
            Start with a closer look.
          </p>
          <button
            onClick={() => navigate("/app/identify")}
            className="hero-text-button"
          >
            Explore a coin <ArrowRight size={17} />
          </button>
        </div>
        <div className="dashboard-coin-art">
          <div className="orbital-ring" />
          <CoinArt kind="krugerrand" />
          <CoinArt kind="mandela" />
          <span>ILLUSTRATED SOUTH AFRICAN COINAGE</span>
        </div>
      </section>
      <section className="stat-grid">
        <div className="stat-card">
          <span>
            <Layers size={17} /> COLLECTION
          </span>
          <strong>
            {session ? (collection.data?.summary.coins ?? "—") : "—"}
            <small>coins recorded</small>
          </strong>
          <div>
            {session
              ? `${collection.data?.summary.records ?? 0} collection records`
              : "Your story starts with one coin"}
          </div>
        </div>
        <div className="stat-card">
          <span>
            <Coins size={17} /> ACQUISITION COST
          </span>
          <strong>
            {session && collection.data
              ? money(collection.data.summary.acquisition_minor)
              : "—"}
            <small>recorded spend</small>
          </strong>
          <div>
            {collection.data?.summary.costs_missing
              ? `${collection.data.summary.costs_missing} records have no cost`
              : "Owner-entered costs, not market value"}
          </div>
        </div>
        <div className="stat-card">
          <span>
            <ScanLine size={17} /> MONTHLY IDENTIFICATIONS
          </span>
          <strong>
            {session ? session.entitlements.scans_used : "0"}
            <small>
              /{" "}
              {session
                ? session.entitlements.scan_limit
                : caps.plans.free.monthly_scans}{" "}
              scans
            </small>
          </strong>
          <div>
            <i className={`status-dot ${caps.ai.available ? "" : "amber"}`} />
            {caps.ai.available
              ? "AI service configured"
              : "AI connection pending"}
          </div>
        </div>
      </section>
      {collection.error && <Notice tone="error">{collection.error}</Notice>}
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your collection, at a glance</h2>
              <p>A record of the coins and stories you’re keeping.</p>
            </div>
            <button
              className="text-link"
              onClick={() => navigate("/app/collection")}
            >
              View collection <ArrowRight size={15} />
            </button>
          </div>
          {collection.data?.items.length ? (
            <div className="mini-collection">
              {collection.data.items.slice(0, 4).map((c) => (
                <a href={`/app/collection/${c.id}`} data-route key={c.id}>
                  <div className="mini-coin">
                    {c.photos[0] ? (
                      <img
                        src={`/api/photos/${c.photos[0].id}`}
                        alt="Your coin"
                      />
                    ) : (
                      <Coins size={25} />
                    )}
                  </div>
                  <div>
                    <strong>{c.name}</strong>
                    <span>
                      {c.year || "Year not recorded"} · {c.condition}
                    </span>
                  </div>
                  <span>×{c.quantity}</span>
                  <ChevronRight size={16} />
                </a>
              ))}
            </div>
          ) : (
            <Empty
              title={
                session
                  ? "Make room for your first coin."
                  : "Build a collection worth knowing."
              }
              icon={Layers}
              action={
                <Button
                  variant="secondary"
                  icon={Plus}
                  onClick={() => openCoin()}
                >
                  Add your first coin
                </Button>
              }
            >
              Keep photographs, acquisition details and provenance together. No
              market value is assumed.
            </Empty>
          )}
        </section>
        <aside className="field-note">
          <div className="eyebrow">
            <BookOpen size={14} /> THE COLLECTOR’S NOTEBOOK
          </div>
          <h3>
            Before you polish
            <br />
            that old coin…
          </h3>
          <p>
            Pause. Cleaning can permanently alter the surface and affect
            collector interest. Photograph it as found and seek advice before
            any treatment.
          </p>
          <button
            className="text-link"
            onClick={() => navigate("/app/research")}
          >
            A considered next step <ArrowRight size={16} />
          </button>
          <div className="notebook-line" />
          <small>CARE & CONDITION / FIELD NOTE 01</small>
        </aside>
      </div>
      <div className="section-heading">
        <div>
          <div className="eyebrow">OUR NUMISMATIC HERITAGE</div>
          <h2>Explore the South African story.</h2>
        </div>
        <a data-route href="/app/catalogue" className="text-link">
          Browse catalogue <ArrowRight size={16} />
        </a>
      </div>
      <div className="catalogue-preview">
        {catalogue.data?.items.slice(0, 3).map((c) => (
          <a href={`/app/catalogue/${c.id}`} data-route key={c.id}>
            <div className="preview-art">
              <CoinArt kind={c.image} />
              <small>ILLUSTRATION</small>
            </div>
            <div>
              <Tag>{c.era}</Tag>
              <h3>{c.name}</h3>
              <p>
                {c.start_year}
                {c.end_year && c.end_year !== c.start_year
                  ? `–${c.end_year}`
                  : !c.end_year
                    ? " onward"
                    : ""}{" "}
                <ArrowUpRight size={17} />
              </p>
            </div>
          </a>
        ))}
      </div>
      <div className="evidence-bar">
        <ShieldCheck size={20} />
        <span>
          <strong>Knowledge before value.</strong> Catalogue starters await
          source review. No verified sale dataset is connected, so no collector
          prices are invented.
        </span>
        <a data-route href="/app/research">
          Our approach <ArrowUpRight size={15} />
        </a>
      </div>
    </>
  );
}

export function Research({ navigate }) {
  return (
    <>
      <Heading
        eyebrow="SOUTH AFRICAN RARITY INTELLIGENCE"
        title="A closer look. A stronger case."
        description="Dates, dies and details matter. So does knowing the limits of the evidence."
      />
      <div className="research-hero">
        <div>
          <Tag tone="dark">RESEARCH, BEFORE RARITY</Tag>
          <h2>
            Could it be unusual?
            <br />
            <em>Start with the details.</em>
          </h2>
          <p>
            A striking anomaly, a scarce date and ordinary damage can look
            similar in a photograph. Build an evidence trail before drawing a
            conclusion.
          </p>
          <Button
            variant="light"
            icon={ScanLine}
            onClick={() => navigate("/app/identify")}
          >
            Photograph your coin
          </Button>
        </div>
        <div>
          <CoinArt kind="shilling" />
          <span>ILLUSTRATION</span>
        </div>
      </div>
      <Notice>
        <strong>No verified rare-variety dataset is connected yet.</strong> This
        guidance does not identify a particular rare date, certify a minting
        error or estimate a premium.
      </Notice>
      <div className="research-guide-grid">
        {[
          [
            "01",
            "Identify the issue.",
            "Record the denomination, full date, inscriptions and mint mark. Compare both sides and the edge against an issue-specific reference.",
          ],
          [
            "02",
            "Separate damage from striking.",
            "Scratches, corrosion, wear and post-mint alterations are not mint errors. A photograph often cannot establish when an unusual feature arose.",
          ],
          [
            "03",
            "Document the physical details.",
            "Use a non-abrasive surface and accurate scales. Record weight and diameter without scraping, polishing or applying chemicals.",
          ],
          [
            "04",
            "Build a sourced case.",
            "Keep original photos, reference links and comparable examples. For valuable or ambiguous pieces, consult an independent numismatist.",
          ],
        ].map(([n, h, p]) => (
          <article className="panel padded" key={n}>
            <span className="guide-number">{n}</span>
            <h2>{h}</h2>
            <p>{p}</p>
          </article>
        ))}
      </div>
      <section className="panel padded references">
        <div className="eyebrow">START WITH PRIMARY REFERENCES</div>
        <h2>Go back to the source.</h2>
        <p>No partnership or endorsement is implied.</p>
        {[
          [
            "South African Reserve Bank",
            "Banknotes, coin and circulation context",
            "https://www.resbank.co.za/en/home/what-we-do/banknotes-and-coin",
          ],
          [
            "South African Mint",
            "Official mint and product information",
            "https://www.samint.co.za/",
          ],
        ].map(([title, subtitle, href]) => (
          <a href={href} target="_blank" rel="noopener noreferrer" key={href}>
            <BookOpen size={20} />
            <div>
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
            <ExternalLink size={16} />
          </a>
        ))}
      </section>
      <div className="evidence-bar">
        <ShieldCheck size={22} />
        <span>
          <strong>Expert referrals are not available.</strong> They will only be
          enabled with genuine participating partners and operational
          agreements.
        </span>
      </div>
    </>
  );
}

export function Plans({ session, navigate, caps, setSession, notify }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    pro = session?.entitlements.plan === "pro",
    status = useResource(session ? "/billing/status" : null);
  useEffect(() => {
    if (status.data)
      setSession((s) =>
        s ? { ...s, entitlements: status.data.entitlements } : s,
      );
  }, [status.data]);
  async function checkout() {
    if (!session) return navigate("/register");
    setBusy(true);
    setError("");
    try {
      const r = await api("/billing/checkout", { method: "POST", body: {} });
      window.location.assign(r.url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const r = await api("/billing/cancel", { method: "POST", body: {} });
      setSession({ ...session, entitlements: r.entitlements });
      notify(
        "Renewal cancelled. Access continues to the end of the paid period.",
      );
      status.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ATLAS MEMBERSHIP"
        title="Go deeper. Stay grounded."
        description="Simple limits. Clear evidence. A collection that grows with you."
      />
      {window.location.search.includes("reference=") && (
        <Notice>
          Returning from checkout does not activate Pro. Access requires a
          signed, server-verified payment event.{" "}
          <button className="text-link" onClick={status.reload}>
            Refresh billing status
          </button>
        </Notice>
      )}
      {!caps.billing.available && (
        <Notice tone="warning">
          <strong>Pro checkout is not open yet.</strong> AI credentials,
          verified market evidence and payment-provider setup are still
          required. No payment details are collected and no charges can be made
          here.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="plans-grid">
        <section className="plan-card">
          <div className="eyebrow">THE CURIOUS COLLECTOR</div>
          <h2>Atlas Free</h2>
          <div className="plan-price">
            R0 <span>/ always</span>
          </div>
          <p>A considered home for your first discoveries.</p>
          <Button
            variant="secondary"
            onClick={() => navigate(session ? "/app/collection" : "/register")}
          >
            {session ? "Open my collection" : "Create free account"}
          </Button>
          <ul>
            {[
              `${caps.plans.free.collection_limit} private collection records`,
              "Acquisition costs, condition & provenance",
              "Private obverse and reverse photographs",
              "Searchable starter catalogue",
              "CSV inventory export",
              `Up to ${caps.plans.free.monthly_scans} AI scans / month when connected`,
            ].map((f) => (
              <li key={f}>
                <Check size={16} />
                {f}
              </li>
            ))}
          </ul>
        </section>
        <section className="plan-card pro-plan">
          <Tag tone="dark">
            {pro ? "YOUR MEMBERSHIP" : "PLANNED MEMBERSHIP"}
          </Tag>
          <div className="eyebrow">THE CONSIDERED COLLECTION</div>
          <h2>Atlas Pro</h2>
          <div className="plan-price">
            {money(caps.plans.pro.price_minor)} <span>/ month</span>
          </div>
          <p>Deeper research, a wider view, and room to grow.</p>
          {pro ? (
            <Button
              variant="light"
              disabled={
                busy ||
                session.entitlements.subscription.status === "non_renewing"
              }
              onClick={cancel}
              icon={null}
            >
              {session.entitlements.subscription.status === "non_renewing"
                ? "Renewal cancelled"
                : busy
                  ? "Cancelling…"
                  : "Cancel renewal"}
            </Button>
          ) : (
            <Button
              variant="light"
              disabled={!caps.billing.available || busy}
              onClick={checkout}
              icon={Gem}
            >
              {busy
                ? "Opening checkout…"
                : caps.billing.available
                  ? "Upgrade with Paystack"
                  : "Not charging yet"}
            </Button>
          )}
          <ul>
            {[
              `${caps.plans.pro.collection_limit} private collection records`,
              `Up to ${caps.plans.pro.monthly_scans} AI scans / month when connected`,
              "Documented comparable sale research, when sourced",
              "Era breakdowns & collection activity",
              "Evidence-supported aggregate estimates",
              "Detailed downloadable coin dossiers",
            ].map((f) => (
              <li key={f}>
                <Check size={16} />
                {f}
              </li>
            ))}
          </ul>
          <small>
            {pro
              ? `Paid access until ${date(session.entitlements.subscription.current_period_end)}.`
              : "Proposed pricing for market validation. Sales history, rarity datasets and live pricing are not currently connected."}
          </small>
        </section>
      </div>
      <div className="membership-faq">
        <h2>Good questions. Straight answers.</h2>
        {[
          [
            "Will a rare-looking R5 automatically be worth more?",
            "No. A commemorative design or a high listing price does not establish collector value. Issue, condition, authenticity and documented sales matter.",
          ],
          [
            "Can I keep my collection without Pro?",
            "Yes. Free accounts keep access to their records and CSV exports. If capacity decreases, existing records remain accessible; adding records is limited by the current plan.",
          ],
          [
            "Does AI certify my coin?",
            "No. A tentative photographic interpretation does not certify authenticity, grade, metal content, rarity or value.",
          ],
          [
            "What will I pay?",
            "No charges are enabled in this configuration. Once services and Paystack setup are verified, checkout will show the ZAR monthly amount and renewal terms.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <ChevronDown size={17} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export function SettingsPage({
  session,
  setSession,
  navigate,
  logout,
  notify,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState(false);
  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await api("/account", {
        method: "PATCH",
        body: {
          name: f.get("name"),
          ...(f.get("new_password")
            ? {
                new_password: f.get("new_password"),
                current_password: f.get("current_password"),
              }
            : {}),
        },
      });
      setSession(r.user);
      notify("Account updated.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/account", {
        method: "DELETE",
        body: { password: new FormData(e.currentTarget).get("password") },
      });
      setSession(null);
      setCsrf(null);
      notify("Account and private collection deleted.");
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!session) return <Gate navigate={navigate} />;
  return (
    <>
      <Heading
        eyebrow="ACCOUNT & PRIVACY"
        title="Your details. Your collection."
        description="Manage your account and the records you choose to keep."
      />
      <div className="settings-layout">
        <section className="panel padded">
          <h2>Account details</h2>
          <p className="muted-note">Signed in as {session.email}</p>
          <form onSubmit={save}>
            <Field
              label="Your name"
              name="name"
              defaultValue={session.name}
              maxLength={80}
              required
            />
            <div className="form-divider" />
            <h3>Change your password</h3>
            <Field
              label="Current password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
            />
            <Field
              label="New password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              help="At least 12 characters. Other sessions are revoked after a password change."
            />
            {error && !deleting && <Notice tone="error">{error}</Notice>}
            <Button disabled={busy} icon={Check}>
              {busy ? "Saving…" : "Save account details"}
            </Button>
          </form>
        </section>
        <aside>
          <section className="panel padded">
            <ShieldCheck size={25} />
            <h2>Private by default.</h2>
            <p>
              Photographs and records require your signed-in session. Images are
              not sent for analysis without your action and consent.
            </p>
            <a href="/app/billing" data-route className="text-link">
              Manage membership <ArrowUpRight size={15} />
            </a>
            <button className="text-link sign-out" onClick={logout}>
              <LogOut size={16} />
              Sign out
            </button>
          </section>
          <section className="panel padded delete-account">
            <h3>Delete account & data</h3>
            <p>
              Permanently delete your collection, photographs and account.
              Active renewal must be cancelled successfully first.
            </p>
            <button
              className="text-link danger"
              onClick={() => setDeleting(true)}
            >
              Delete my account <Trash2 size={15} />
            </button>
          </section>
        </aside>
      </div>
      {deleting && (
        <Modal
          title="Permanently delete your account?"
          onClose={() => !busy && setDeleting(false)}
        >
          <form onSubmit={remove}>
            <Notice tone="warning">
              Export your inventory first. Deletion is permanent. Backup
              retention is controlled by the operator.
            </Notice>
            <Field
              label="Confirm your password"
              name="password"
              type="password"
              maxLength={128}
              required
            />
            {error && <Notice tone="error">{error}</Notice>}
            <div className="modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setDeleting(false)}
                disabled={busy}
              >
                Keep my account
              </Button>
              <Button variant="danger-button" icon={Trash2} disabled={busy}>
                {busy ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Recovery({ mode, setSession, navigate, notify, caps }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const raw = new URLSearchParams(window.location.search).get("token");
  const verify = mode === "verify-email",
    reset = mode === "reset-password";
  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const path = verify
        ? raw
          ? "/auth/verify-email"
          : "/auth/request-verification"
        : reset
          ? "/auth/reset-password"
          : "/auth/request-reset";
      const body =
        verify && raw
          ? { token: raw }
          : reset
            ? { token: raw, password: f.get("password") }
            : { email: f.get("email") };
      const r = await api(path, { method: "POST", body });
      if (r.user) {
        setSession(r.user);
        setCsrf(r.csrf);
        window.history.replaceState({}, "", "/app");
        notify("Email verified. Welcome to your collection.");
        navigate("/app");
      } else if (reset) {
        setSession(null);
        setCsrf(null);
        notify(r.message);
        navigate("/login");
      } else setMessage(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <a href="/" data-route>
        <Brand />
      </a>
      <main id="main" className="auth-card">
        <div className="eyebrow">ACCOUNT SECURITY</div>
        <h1>
          {verify
            ? "Verify your email."
            : reset
              ? "A fresh start."
              : "Forgot your password?"}
        </h1>
        <p>
          {verify && raw
            ? "Confirm this address to finish setting up your account."
            : verify
              ? "Request a new one-use verification link."
              : reset
                ? "Choose a new passphrase of at least 12 characters."
                : "Request a secure, one-use recovery link."}
        </p>
        {!caps.auth.email_available && !raw && (
          <Notice>
            Email delivery is not connected yet. Recovery links cannot be sent
            until the operator configures a verified sender.
          </Notice>
        )}
        <form onSubmit={submit}>
          {!raw || (!verify && !reset) ? (
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          ) : reset ? (
            <Field
              label="New password"
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          ) : null}
          {error && <Notice tone="error">{error}</Notice>}
          {message && <Notice>{message}</Notice>}
          <Button disabled={busy || (!raw && !caps.auth.email_available)}>
            {busy
              ? "Please wait…"
              : verify && raw
                ? "Verify this address"
                : reset
                  ? "Reset password"
                  : "Request secure link"}
          </Button>
        </form>
        <a href="/login" data-route className="back-link">
          Back to sign in
        </a>
      </main>
    </div>
  );
}
