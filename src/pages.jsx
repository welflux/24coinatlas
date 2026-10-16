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
import { AuthLayout } from "./auth-layout";
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
export function Landing({ session, caps }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.querySelector(".atlas-menu")?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const registrationReady =
    caps?.auth &&
    (!caps.auth.verification_required || caps.auth.email_available);
  const accountPath = session
    ? "/app"
    : registrationReady
      ? "/register"
      : "/app/catalogue";
  const accountLabel = session
    ? "Open workspace"
    : registrationReady
      ? "Start your collection"
      : "Explore the catalogue";
  return (
    <div className="atlas-home">
      <div className="atlas-announcement">
        <span>BUILT FOR SOUTH AFRICAN COIN COLLECTORS</span>
        <a href="#standards">
          Our approach <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="atlas-nav atlas-wrap">
        <a href="/" data-route aria-label="24CoinAtlas home">
          <Brand />
        </a>
        <nav
          className={menuOpen ? "atlas-nav-links is-open" : "atlas-nav-links"}
          aria-label="Main navigation"
          id="atlas-main-navigation"
        >
          <a href="/app/catalogue" data-route>
            The catalogue
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#standards" onClick={() => setMenuOpen(false)}>
            Our standards
          </a>
        </nav>
        <div className="atlas-nav-actions">
          <a
            href={session ? "/app" : "/login"}
            data-route
            className="atlas-signin"
          >
            {session ? "My workspace" : "Sign in"}
          </a>
          <a
            href={accountPath}
            data-route
            className="atlas-button atlas-button-small"
          >
            {session ? "Workspace" : "Explore"} <ArrowUpRight size={16} />
          </a>
          <button
            className="atlas-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="atlas-main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /> <span />
          </button>
        </div>
      </header>
      <main id="main">
        <section className="atlas-hero">
          <div className="atlas-wrap atlas-hero-grid">
            <div className="atlas-hero-copy">
              <div className="atlas-kicker">
                <span /> SOUTH AFRICAN COIN INTELLIGENCE
              </div>
              <h1>
                A collector’s eye.
                <br />
                <span>A clearer picture.</span>
              </h1>
              <p>
                From your first Mandela R5 to a carefully kept Krugerrand.
                Research the details, understand the evidence, and give every
                coin a proper record.
              </p>
              <div className="atlas-hero-actions">
                <a href="/app/catalogue" data-route className="atlas-button">
                  Explore the catalogue <ArrowUpRight size={19} />
                </a>
                <a href="#workflow" className="atlas-link">
                  See how it works <ArrowRight size={16} />
                </a>
              </div>
              <div className="atlas-hero-note">
                <BookOpen size={15} /> Open catalogue. No account needed.
              </div>
            </div>
            <div
              className="atlas-specimen"
              aria-label="Illustrative catalogue record preview"
            >
              <div className="atlas-specimen-top">
                <span>24 / ATLAS COLLECTION</span>
                <span>
                  RECORD PREVIEW <i />
                </span>
              </div>
              <div className="atlas-specimen-art">
                <div className="atlas-specimen-axis" />
                <span className="atlas-plate-corner">
                  ZA
                  <br />
                  2008
                </span>
                <svg
                  viewBox="0 0 320 320"
                  aria-hidden="true"
                  className="atlas-medallion"
                >
                  <defs>
                    <radialGradient id="atlas-metal">
                      <stop stopColor="#f5e8c6" />
                      <stop offset=".7" stopColor="#c7a76b" />
                      <stop offset="1" stopColor="#97713c" />
                    </radialGradient>
                  </defs>
                  <circle cx="160" cy="160" r="146" fill="url(#atlas-metal)" />
                  {[138, 131, 118].map((r) => (
                    <circle
                      key={r}
                      cx="160"
                      cy="160"
                      r={r}
                      fill="none"
                      stroke="#72582e"
                      strokeWidth={r === 131 ? "1" : ".6"}
                    />
                  ))}
                  <circle
                    cx="160"
                    cy="160"
                    r="125"
                    fill="none"
                    stroke="#72582e"
                    strokeWidth="3"
                    strokeDasharray="1 5"
                  />
                  <path
                    d="M160 55v210M55 160h210M86 86l148 148M86 234 234 86"
                    stroke="#72582e"
                    opacity=".18"
                  />
                  <text
                    x="160"
                    y="113"
                    textAnchor="middle"
                    fontSize="12"
                    letterSpacing="5"
                    fill="#5c4628"
                  >
                    SOUTH AFRICA
                  </text>
                  <text
                    x="160"
                    y="195"
                    textAnchor="middle"
                    fontSize="87"
                    fontFamily="Arial, sans-serif"
                    fontWeight="600"
                    letterSpacing="-6"
                    fill="#5c4628"
                  >
                    R5
                  </text>
                  <path d="M129 215h62" stroke="#72582e" />
                  <text
                    x="160"
                    y="238"
                    textAnchor="middle"
                    fontSize="14"
                    letterSpacing="5"
                    fill="#5c4628"
                  >
                    2008
                  </text>
                </svg>
                <span className="atlas-plate-scale">
                  ILLUSTRATIVE PLATE
                  <br />
                  NOT A COIN PHOTOGRAPH
                </span>
                <div className="atlas-observation">
                  <ScanLine size={17} />
                  <span>
                    Start with the detail.
                    <br />
                    <strong>Follow the evidence.</strong>
                  </span>
                </div>
              </div>
              <div className="atlas-specimen-info">
                <div>
                  <span className="atlas-micro">
                    MODERN RAND / COMMEMORATIVE
                  </span>
                  <h2>Mandela R5</h2>
                  <p>South Africa · 2008</p>
                </div>
                <span className="atlas-status">Reference review pending</span>
              </div>
              <a
                href="/app/catalogue/sa-mandela-2008"
                data-route
                className="atlas-record-link"
              >
                Explore this catalogue record <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="atlas-wrap atlas-hero-bottom">
            <span>LOOK CLOSER. COLLECT WITH CONTEXT.</span>
            <a href="#collection">
              Discover the collection <span>↓</span>
            </a>
          </div>
        </section>

        <section
          className="atlas-principles atlas-wrap"
          aria-label="Product principles"
        >
          {[
            [
              BookOpen,
              "Research before assumptions",
              "Source links and visible review status.",
            ],
            [
              LockKeyhole,
              "Your collection stays yours",
              "Private records and photographs.",
            ],
            [
              ShieldCheck,
              "Evidence before estimates",
              "No invented prices or rarity claims.",
            ],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon size={22} strokeWidth={1.5} />
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="collection" className="atlas-collection atlas-wrap">
          <div className="atlas-section-head">
            <div>
              <div className="atlas-kicker">
                01 / THE SOUTH AFRICAN COLLECTION
              </div>
              <h2>
                A country’s history.
                <br />
                Held in your hand.
              </h2>
            </div>
            <div>
              <p>
                Explore the coinage that connects us. Begin with introductory
                records across South Africa’s collecting eras.
              </p>
              <a href="/app/catalogue" data-route className="atlas-link">
                Browse all records <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="atlas-era-grid">
            {[
              [
                "01",
                "1892—1902",
                "ZAR & historical",
                "The pond and the republic’s coinage.",
                "1",
                "POND",
                "ZAR & historical",
              ],
              [
                "02",
                "1923—1960",
                "Union & pre-decimal",
                "Shillings, pennies and a different currency.",
                "1",
                "SHILLING",
                "Union & pre-decimal",
              ],
              [
                "03",
                "1961—TODAY",
                "Rand & commemoratives",
                "A decimal currency. An evolving identity.",
                "5",
                "RAND",
                "Modern rand",
              ],
            ].map(([n, years, title, description, value, unit, era]) => (
              <a
                href={`/app/catalogue?era=${encodeURIComponent(era)}`}
                data-route
                className="atlas-era"
                key={n}
              >
                <div className="atlas-era-top">
                  <span>{years}</span>
                  <ArrowUpRight size={19} />
                </div>
                <div className="atlas-era-mark" aria-hidden="true">
                  <span>{value}</span>
                  <small>{unit}</small>
                  <i />
                </div>
                <div className="atlas-era-caption">
                  <span>{n} / EXPLORE THE ERA</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="atlas-collection-note">
            An introductory catalogue, not a complete date or variety reference.
            Records awaiting review are labelled.
          </p>
        </section>

        <section id="workflow" className="atlas-workflow">
          <div className="atlas-wrap">
            <div className="atlas-section-head">
              <div>
                <div className="atlas-kicker">
                  02 / A MORE CONSIDERED WAY TO COLLECT
                </div>
                <h2>
                  Less guesswork.
                  <br />
                  More understanding.
                </h2>
              </div>
              <p>
                A useful collection starts with a good record. Bring the
                photograph, the history and the questions together.
              </p>
            </div>
            <div className="atlas-workflow-grid">
              <div className="atlas-ledger">
                <div className="atlas-ledger-head">
                  <Layers size={18} />
                  <span>YOUR COLLECTION</span>
                  <span>EXAMPLE RECORD</span>
                </div>
                <div className="atlas-ledger-title">
                  <span>01</span>
                  <div>
                    <h3>Every detail, in its place.</h3>
                    <p>A private record for the coin and its story.</p>
                  </div>
                </div>
                <dl>
                  {[
                    ["Identity", "Denomination, year & mint"],
                    ["Condition", "Your observations & photographs"],
                    ["Provenance", "Where it came from"],
                    ["Acquisition", "Date, quantity & purchase cost"],
                  ].map(([term, definition]) => (
                    <div key={term}>
                      <dt>{term}</dt>
                      <dd>{definition}</dd>
                    </div>
                  ))}
                </dl>
                <div className="atlas-ledger-foot">
                  <LockKeyhole size={14} /> Collection tools require an account.
                </div>
              </div>
              <div className="atlas-steps">
                {[
                  [
                    "01",
                    "Find your starting point",
                    "Browse the catalogue by era and explore a coin’s historical context, specifications and linked sources.",
                  ],
                  [
                    "02",
                    "Document what you see",
                    "Keep photographs of both sides, condition notes and provenance together in your private collection.",
                  ],
                  [
                    "03",
                    "Build on the evidence",
                    "Separate an asking price from a completed sale. Treat an AI suggestion as a research lead, never a certificate.",
                  ],
                ].map(([n, title, text]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="standards" className="atlas-standards atlas-wrap">
          <div>
            <div className="atlas-kicker">
              03 / THE STANDARD WE HOLD OURSELVES TO
            </div>
            <h2>
              Trust is in
              <br />
              the details.
            </h2>
            <p>
              Collecting deserves clarity. Here is what you can expect from
              24CoinAtlas today.
            </p>
            <a href="/app/research" data-route className="atlas-link">
              Explore our research approach <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="atlas-standard-list">
            {[
              [
                "Clear about sources",
                "Catalogue entries show their review status. Introductory records are still awaiting independent source verification.",
              ],
              [
                "Honest about value",
                "No verified sales dataset is connected yet. Unsupported valuations stay unavailable rather than becoming invented estimates.",
              ],
              [
                "Transparent about AI",
                caps?.ai?.available
                  ? "Optional photo analysis offers tentative observations, with consent. It does not authenticate, grade or guarantee a coin’s value."
                  : "AI photo analysis is not connected yet. Catalogue research remains open; AI will never replace professional authentication.",
              ],
              [
                "Open about access",
                registrationReady
                  ? "Create a free account for private collection tools. Paid checkout remains disabled while commercial services are being prepared."
                  : "The catalogue is open to browse. New account registration is temporarily unavailable while verification-email delivery is being prepared.",
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <Check size={17} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="atlas-faq atlas-wrap">
          <div className="atlas-kicker">A FEW THINGS WORTH KNOWING</div>
          <h2>Before you begin.</h2>
          {[
            [
              "Can 24CoinAtlas tell me what my coin is worth?",
              "A reliable valuation needs the correct identity, condition and comparable completed sales. We do not currently have a verified sales dataset, so market estimates are unavailable. An asking price alone is not evidence of value.",
            ],
            [
              "Is this an authentication or grading service?",
              "No. Catalogue research and optional AI observations support your own investigation. For authenticity, professional grading or a significant sale, consult a qualified numismatist or recognised grading service.",
            ],
            [
              "Can I explore without creating an account?",
              "Yes. The introductory catalogue and research pages are public. An account is needed for private collection records and photographs. Registration is available once verification-email delivery is configured.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={19} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <section className="atlas-close">
          <div className="atlas-wrap">
            <div className="atlas-kicker">YOUR NEXT CHAPTER IN COLLECTING</div>
            <h2>
              Start with a coin.
              <br />
              Discover its context.
            </h2>
            <a href={accountPath} data-route className="atlas-button">
              {accountLabel} <ArrowUpRight size={19} />
            </a>
            <p>
              {session
                ? "Your private collection, all in one place."
                : registrationReady
                  ? "Free collection tools. No payment details required."
                  : "Browse the public catalogue. No account needed."}
            </p>
          </div>
        </section>
      </main>
      <footer className="atlas-footer atlas-wrap">
        <div>
          <a href="/" data-route aria-label="24CoinAtlas home">
            <Brand />
          </a>
          <p>A clearer view of South African coinage.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/app/catalogue" data-route>
            Catalogue
          </a>
          <a href="#standards">Our standards</a>
          <a href={session ? "/app/settings" : "/login"} data-route>
            {session ? "Account settings" : "Sign in"}
          </a>
        </nav>
        <div className="atlas-footer-bottom">
          <span>© {new Date().getFullYear()} 24CoinAtlas</span>
          <span>Independent research platform · Not a grading service</span>
          <a href="#main">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}

export function Auth({ mode, navigate, setSession, notify, session, caps }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    register = mode === "register";
  const registrationReady =
    !caps?.auth?.verification_required || caps?.auth?.email_available;
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
    <AuthLayout mode={mode}>
      <div className="auth-form-topline">
        <LockKeyhole size={15} />
        <span>{register ? "CREATE YOUR WORKSPACE" : "ACCOUNT ACCESS"}</span>
        <span>24 / ATLAS</span>
      </div>
      <div className="eyebrow">
        {register ? "YOUR COLLECTION STARTS HERE" : "YOUR PRIVATE WORKSPACE"}
      </div>
      <h1>{register ? "Create your account." : "Welcome back."}</h1>
      <p>
        {register
          ? "Create a free account. No payment details required."
          : "Sign in to your private collection and research."}
      </p>
      {register && !registrationReady && !session && (
        <Notice>
          New accounts are temporarily unavailable while verification-email
          delivery is being prepared. You can still{" "}
          <a href="/app/catalogue" data-route>
            explore the public catalogue
          </a>
          .
        </Notice>
      )}
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
                aria-pressed={show}
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
          <Button
            type="submit"
            disabled={busy || (register && !registrationReady)}
          >
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
          Your inventory and photographs are private. Photo analysis is optional
          and requires your consent.
        </span>
      </div>
    </AuthLayout>
  );
}

export function Dashboard({ session, navigate, caps, openCoin, revision }) {
  const collection = useResource(session ? "/collection" : null, revision);
  const catalogue = useResource("/catalogue");
  const summary = collection.data?.summary;
  const readyToRegister =
    !caps.auth.verification_required || caps.auth.email_available;
  return (
    <div className="atlas-dashboard">
      <Heading
        eyebrow="COLLECTOR WORKSPACE / OVERVIEW"
        title={
          session
            ? `Welcome back, ${session.name.split(" ")[0]}.`
            : "Your collection. In focus."
        }
        description="A clear view of your records, research and next steps."
      >
        <Button variant="secondary" icon={Plus} onClick={() => openCoin()}>
          Add a coin
        </Button>
        <Button icon={ScanLine} onClick={() => navigate("/app/identify")}>
          Identify a coin
        </Button>
      </Heading>
      <div className="desk-context">
        <span>
          <LockKeyhole size={13} />
          {session ? "PRIVATE COLLECTOR WORKSPACE" : "PUBLIC WORKSPACE PREVIEW"}
        </span>
        <span>
          SOUTH AFRICA <i /> ZAR
        </span>
      </div>
      <section className="desk-workbench">
        <div>
          <span className="enterprise-kicker">
            THE IDENTIFICATION WORKBENCH
          </span>
          <h2>
            Every detail is
            <br />a starting point.
          </h2>
          <p>
            Capture both sides. Record what you know. Keep observations separate
            from assumptions.
          </p>
          <a href="/app/identify" data-route className="desk-primary-link">
            Open the workbench <ArrowUpRight size={18} />
          </a>
        </div>
        <div
          className="desk-capture-preview"
          aria-label="Photograph workflow preview"
        >
          <div className="desk-capture-top">
            <ScanLine size={15} />
            <span>PHOTOGRAPH → OBSERVE → RECORD</span>
          </div>
          <div className="desk-specimen-pair">
            {["OBVERSE", "REVERSE"].map((side, i) => (
              <div key={side}>
                <span>
                  0{i + 1} / {side}
                </span>
                <div className="desk-specimen-outline">
                  <span>{i === 0 ? "O" : "R"}</span>
                </div>
                <small>YOUR PHOTOGRAPH</small>
              </div>
            ))}
          </div>
          <div className="desk-capture-bottom">
            <span
              className={`desk-indicator ${caps.ai.available ? "ready" : ""}`}
            />
            {caps.ai.available
              ? "AI observations available with consent"
              : "Manual records available · AI not connected"}
          </div>
        </div>
      </section>
      <section className="desk-metrics" aria-label="Collection overview">
        {[
          [
            Layers,
            "COINS RECORDED",
            session && summary ? summary.coins : "—",
            session && summary
              ? `${summary.records} collection records`
              : "Private collection account required",
          ],
          [
            Coins,
            "ACQUISITION COST",
            session && summary ? money(summary.acquisition_minor) : "—",
            summary?.costs_missing
              ? `${summary.costs_missing} records without a cost`
              : "Your recorded costs, not market value",
          ],
          [
            ScanLine,
            "MONTHLY SCANS USED",
            session
              ? `${session.entitlements.scans_used} / ${session.entitlements.scan_limit}`
              : "—",
            caps.ai.available
              ? "Resets each calendar month (UTC)"
              : "AI connection pending · No scan used",
          ],
          [
            BookOpen,
            "CATALOGUE RECORDS",
            catalogue.data ? catalogue.data.items.length : "—",
            `${caps.catalogue.verified} independently verified`,
          ],
        ].map(([Icon, label, value, note]) => (
          <div className="desk-metric" key={label}>
            <span>
              <Icon size={16} />
              {label}
            </span>
            <strong>{value}</strong>
            <p>{note}</p>
          </div>
        ))}
      </section>
      {collection.error && <Notice tone="error">{collection.error}</Notice>}
      <div className="desk-content-grid">
        <section className="panel desk-inventory">
          <div className="panel-heading">
            <div>
              <span className="enterprise-kicker">COLLECTION REGISTER</span>
              <h2>Recent coin records</h2>
            </div>
            <a href="/app/collection" data-route className="text-link">
              View all <ArrowUpRight size={15} />
            </a>
          </div>
          {session && collection.loading ? (
            <Loading />
          ) : session && collection.error ? (
            <div className="desk-empty">
              <h3>Your records couldn’t be loaded.</h3>
              <p>
                Try again to see your current collection. No records have been
                changed.
              </p>
              <Button
                variant="secondary"
                icon={ArrowRight}
                onClick={collection.reload}
              >
                Retry loading
              </Button>
            </div>
          ) : collection.data?.items.length ? (
            <div className="desk-records">
              {collection.data.items.slice(0, 4).map((c) => (
                <a href={`/app/collection/${c.id}`} data-route key={c.id}>
                  <span className="desk-record-photo">
                    {c.photos[0] ? (
                      <img src={`/api/photos/${c.photos[0].id}`} alt="" />
                    ) : (
                      <Coins size={22} />
                    )}
                  </span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>
                      {c.year || "Year not recorded"} · {c.condition}
                    </small>
                  </span>
                  <span className="desk-record-quantity">×{c.quantity}</span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
          ) : (
            <div className="desk-empty">
              <div className="desk-empty-symbol">
                <Layers size={28} strokeWidth={1.3} />
              </div>
              <span className="enterprise-kicker">
                {session ? "YOUR REGISTER IS READY" : "PRIVATE BY DESIGN"}
              </span>
              <h3>
                {session
                  ? "Start with your first coin."
                  : "A dedicated place for your collection."}
              </h3>
              <p>
                Keep photographs, condition notes, purchase costs and provenance
                in one private record.
              </p>
              {session ? (
                <Button
                  icon={Plus}
                  variant="secondary"
                  onClick={() => openCoin()}
                >
                  Add your first coin
                </Button>
              ) : (
                <a
                  href={readyToRegister ? "/register" : "/app/catalogue"}
                  data-route
                  className="button secondary"
                >
                  {readyToRegister
                    ? "Create your workspace"
                    : "Explore the public catalogue"}
                  <ArrowUpRight size={16} />
                </a>
              )}
              {!session && !readyToRegister && (
                <small>
                  New account registration is temporarily unavailable.
                </small>
              )}
            </div>
          )}
        </section>
        <aside className="desk-status-panel panel">
          <div className="panel-heading">
            <div>
              <span className="enterprise-kicker">RESEARCH READINESS</span>
              <h2>Clear about what’s connected.</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <dl>
            {[
              [
                "AI photo observations",
                caps.ai.available ? "Available" : "Not connected",
                caps.ai.available
                  ? "Consent required before analysis."
                  : "Photographs can still be recorded manually.",
              ],
              [
                "Catalogue review",
                `${caps.catalogue.verified} verified`,
                "Reference review status is shown per record.",
              ],
              [
                "Comparable sales",
                `${caps.market_evidence_count} records`,
                caps.market_evidence_count
                  ? "Estimates require matching reviewed evidence."
                  : "Market estimates remain unavailable.",
              ],
              [
                "Paid membership",
                caps.billing.available ? "Available" : "Checkout disabled",
                "Your collection costs are not a valuation.",
              ],
            ].map(([label, state, description]) => (
              <div key={label}>
                <dt>
                  {label}
                  <span>{state}</span>
                </dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <a href="/app/research" data-route className="desk-status-foot">
            Research standards <ArrowUpRight size={15} />
          </a>
        </aside>
      </div>
      <section className="desk-resources">
        <div className="desk-section-title">
          <div>
            <span className="enterprise-kicker">CONTINUE YOUR RESEARCH</span>
            <h2>A little context goes a long way.</h2>
          </div>
          <a href="/app/catalogue" data-route className="text-link">
            Browse catalogue <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="desk-resource-grid">
          {catalogue.loading ? (
            <Loading />
          ) : catalogue.error ? (
            <Notice tone="error">{catalogue.error}</Notice>
          ) : (
            catalogue.data?.items.slice(0, 3).map((c, i) => (
              <a href={`/app/catalogue/${c.id}`} data-route key={c.id}>
                <div>
                  <span>
                    0{i + 1} / {c.era.toUpperCase()}
                  </span>
                  <ArrowUpRight size={17} />
                </div>
                <h3>{c.name}</h3>
                <p>
                  {c.start_year}
                  {c.end_year && c.end_year !== c.start_year
                    ? `–${c.end_year}`
                    : !c.end_year
                      ? " onward"
                      : ""}{" "}
                  · {c.denomination}
                </p>
                <small>
                  {c.verification === "verified"
                    ? "Source verification complete"
                    : "Source verification pending"}
                </small>
              </a>
            ))
          )}
        </div>
      </section>
      <div className="desk-care-note">
        <ShieldCheck size={20} />
        <div>
          <strong>Preserve the surface. Preserve the evidence.</strong>
          <p>
            Photograph a coin as found. Cleaning can permanently alter the
            surface; seek professional advice before treatment.
          </p>
        </div>
        <a href="/app/research" data-route aria-label="Read coin care research">
          <ArrowUpRight size={18} />
        </a>
      </div>
    </div>
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
    [message, setMessage] = useState(""),
    [show, setShow] = useState(false);
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
    <AuthLayout mode={mode}>
      <div className="auth-form-topline">
        <ShieldCheck size={15} />
        <span>ACCOUNT RECOVERY</span>
        <span>24 / ATLAS</span>
      </div>
      <div className="eyebrow">ACCOUNT SECURITY</div>
      <h1>
        {verify
          ? "Verify your email."
          : reset
            ? "Reset your password."
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
      {reset && !raw ? (
        <Notice>
          Open the password-reset link from your email. If you need a new link,{" "}
          <a href="/forgot-password" data-route>
            request password recovery
          </a>
          .
        </Notice>
      ) : (
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
            <label className="field" htmlFor="recovery-password">
              <span>New password</span>
              <div className="password-input">
                <input
                  id="recovery-password"
                  aria-label="New password"
                  aria-describedby="recovery-password-help"
                  name="password"
                  type={show ? "text" : "password"}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small id="recovery-password-help">
                Use at least 12 characters. A unique passphrase works well.
              </small>
            </label>
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
      )}
      <a href="/login" data-route className="back-link">
        Back to sign in
      </a>
      <div className="auth-privacy">
        <LockKeyhole size={14} />
        <span>
          Recovery and verification links are one-use and expire automatically.
          Never share your password or recovery link.
        </span>
      </div>
    </AuthLayout>
  );
}
