import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
  ScanLine,
  BookOpen,
  Layers,
  Gem,
  Settings,
  LogOut,
  LockKeyhole,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { api, setCsrf } from "./api";
import { Brand, Button, Loading, Notice, Empty } from "./ui";
import {
  Landing,
  Auth,
  Recovery,
  Dashboard,
  Research,
  Plans,
  SettingsPage,
} from "./pages";
import {
  Catalogue,
  CatalogueDetail,
  Collection,
  CollectionDetail,
  CoinForm,
  Identify,
} from "./workspace";
import "./style.css";
import "./landing.css";
import "./workspace-brand.css";
import "./brand.css";
import "./catalogue-reference.css";
function App() {
  const [location, setLocation] = useState(
      window.location.pathname + window.location.search,
    ),
    [session, setSession] = useState(null),
    [booting, setBooting] = useState(true),
    [bootError, setBootError] = useState(""),
    [caps, setCaps] = useState(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [coinForm, setCoinForm] = useState(null),
    [revision, setRevision] = useState(0);
  function navigate(path) {
    window.history.pushState({}, "", path);
    setLocation(path);
    setMobile(false);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const pop = () => {
      setLocation(window.location.pathname + window.location.search);
      setMobile(false);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    Promise.all([api("/auth/me"), api("/capabilities")])
      .then(([auth, caps]) => {
        setSession(auth.user);
        setCsrf(auth.csrf);
        setCaps(caps);
      })
      .catch((e) => setBootError(e.message))
      .finally(() => setBooting(false));
  }, []);
  useEffect(() => {
    const expired = () => {
      setSession(null);
      setCsrf(null);
      setCoinForm(null);
      setToast("Your session expired. Please sign in again.");
      navigate("/login");
    };
    window.addEventListener("atlas-session-expired", expired);
    return () => window.removeEventListener("atlas-session-expired", expired);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const route = location.split("?")[0];
    const accountTitles = {
      "/": "South African coin intelligence",
      "/login": "Sign in",
      "/register": "Create account",
      "/forgot-password": "Account recovery",
      "/reset-password": "Reset password",
      "/verify-email": "Verify email",
      "/app": "Overview",
    };
    document.title = `${accountTitles[route] || route.split("/")[2]?.replaceAll("-", " ") || "Workspace"} | 24CoinAtlas`;
  }, [location]);
  useEffect(() => {
    if (!mobile) return;
    const closeNavigation = (event) => {
      if (event.key === "Escape") {
        setMobile(false);
        document.querySelector(".mobile-menu")?.focus();
      }
    };
    window.addEventListener("keydown", closeNavigation);
    return () => window.removeEventListener("keydown", closeNavigation);
  }, [mobile]);
  const context = {
    navigate,
    session,
    setSession,
    caps,
    notify: setToast,
    revision,
    refresh: () => setRevision((r) => r + 1),
    openCoin: (initial = {}) => {
      if (!session)
        return navigate(
          caps?.auth?.verification_required && !caps?.auth?.email_available
            ? "/login"
            : "/register",
        );
      setCoinForm(initial);
    },
  };
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      setSession(null);
      setCsrf(null);
      navigate("/");
    } catch (e) {
      setToast(e.message);
    }
  }
  if (booting)
    return (
      <div className="boot">
        <Brand />
        <Loading />
      </div>
    );
  if (bootError)
    return (
      <div className="boot">
        <Brand />
        <Notice tone="error">
          The application server is unavailable. {bootError}
        </Notice>
        <Button onClick={() => window.location.reload()}>
          Retry connection
        </Button>
      </div>
    );
  const path = location.split("?")[0];
  function handleLink(event) {
    const a = event.target.closest("a[data-route]");
    if (
      a &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.button === 0
    ) {
      event.preventDefault();
      navigate(a.getAttribute("href"));
    }
  }
  let screen;
  if (path === "/") screen = <Landing {...context} />;
  else if (
    ["/forgot-password", "/reset-password", "/verify-email"].includes(path)
  )
    screen = <Recovery key={location} {...context} mode={path.slice(1)} />;
  else if (["/login", "/register"].includes(path))
    screen = <Auth key={path} {...context} mode={path.slice(1)} />;
  else {
    const catalogueId = path.startsWith("/app/catalogue/")
      ? decodeURIComponent(path.split("/")[3])
      : null;
    const collectionId = path.startsWith("/app/collection/")
      ? decodeURIComponent(path.split("/")[3])
      : null;
    const titles = {
      "/app": "Overview",
      "/app/identify": "Identification",
      "/app/catalogue": "South African catalogue",
      "/app/collection": "My collection",
      "/app/research": "Research & evidence",
      "/app/billing": "Membership",
      "/app/settings": "Account & settings",
    };
    let content;
    if (path === "/app") content = <Dashboard {...context} />;
    else if (path === "/app/identify") content = <Identify {...context} />;
    else if (path === "/app/catalogue") content = <Catalogue {...context} />;
    else if (catalogueId)
      content = <CatalogueDetail {...context} id={catalogueId} />;
    else if (path === "/app/collection") content = <Collection {...context} />;
    else if (collectionId)
      content = <CollectionDetail {...context} id={collectionId} />;
    else if (path === "/app/research") content = <Research {...context} />;
    else if (path === "/app/billing") content = <Plans {...context} />;
    else if (path === "/app/settings")
      content = <SettingsPage {...context} logout={logout} />;
    else
      content = (
        <Empty
          title="This page hasn’t been catalogued."
          action={
            <Button onClick={() => navigate("/app")}>Back to workspace</Button>
          }
        />
      );
    screen = (
      <div
        className={`workspace reference-workspace ${path === "/app/catalogue" ? "catalogue-workspace" : ""}`}
      >
        <aside
          id="workspace-navigation"
          className={`sidebar ${mobile ? "open" : ""}`}
        >
          <a href="/" data-route>
            <Brand inverse />
          </a>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={22} />
          </button>
          <div className="sidebar-section-label">COLLECTOR WORKSPACE</div>
          <nav aria-label="Workspace">
            {[
              ["/app", LayoutDashboard, "Overview"],
              ["/app/identify", ScanLine, "Identify a coin"],
              ["/app/catalogue", BookOpen, "SA catalogue"],
              ["/app/collection", Layers, "My collection"],
              ["/app/research", Gem, "Research & evidence"],
            ].map(([href, Icon, label]) => (
              <a
                data-route
                href={href}
                key={href}
                aria-current={
                  (href === "/app" ? path === href : path.startsWith(href))
                    ? "page"
                    : undefined
                }
                className={
                  (href === "/app" ? path === href : path.startsWith(href))
                    ? "active"
                    : ""
                }
              >
                <Icon size={18} />
                {label}
                {href === "/app/identify" && (
                  <span className="nav-new">SCAN</span>
                )}
              </a>
            ))}
          </nav>
          <div className="sidebar-note">
            <img
              src="/brand/24coinatlas-mark.png"
              width="32"
              height="32"
              alt=""
              className="sidebar-brand-mark"
            />
            <h4>Evidence before estimates.</h4>
            <p>Document the detail. Keep the context.</p>
            <a data-route href="/app/billing" className="pro-link">
              <Gem size={18} />
              <span>Explore Atlas Pro</span>
              <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="sidebar-bottom">
            <a data-route href="/app/settings">
              <Settings size={18} />
              Account & settings
            </a>
            {session ? (
              <button onClick={logout}>
                <LogOut size={18} />
                Sign out
              </button>
            ) : (
              <a data-route href="/login">
                <LockKeyhole size={18} />
                Sign in
              </a>
            )}
            <div className="sidebar-origin">
              <span className="sa-flag" /> BUILT FOR SOUTH AFRICAN COLLECTORS
            </div>
          </div>
        </aside>
        {mobile && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="workspace-main">
          <header className="workspace-top">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-button"
                aria-label="Open navigation"
                aria-expanded={mobile}
                aria-controls="workspace-navigation"
                onClick={() => setMobile(true)}
              >
                <Menu />
              </button>
              <span>Workspace</span>
              <ChevronRight size={13} />
              <strong>
                {catalogueId
                  ? "Coin research"
                  : collectionId
                    ? "Coin record"
                    : titles[path] || "Page"}
              </strong>
            </div>
            <div className="workspace-user">
              <span className="live-label">
                <i /> SOUTH AFRICA · ZAR
              </span>
              {session ? (
                <a
                  data-route
                  href="/app/settings"
                  className="avatar"
                  aria-label="Account settings"
                >
                  {session.name.slice(0, 1).toUpperCase()}
                </a>
              ) : (
                <a href="/login" data-route className="sign-in-link">
                  Sign in <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </header>
          <main id="main" className="page-content" key={path}>
            {content}
          </main>
        </div>
        <footer className="research-workspace-footer">
          <div className="research-footer-top">
            <a href="/" data-route>
              <Brand inverse />
            </a>
            <nav aria-label="Footer">
              <a href="/app/catalogue" data-route>
                The catalogue
              </a>
              <a href="/#workflow">How it works</a>
              <a href="/#standards">Our standards</a>
            </nav>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top ↑
            </button>
          </div>
          <div className="research-footer-bottom">
            <span>© {new Date().getFullYear()} 24CoinAtlas.</span>
            <span>Independent research platform. Not a grading service.</span>
            <span>Educational guidance. Not a professional appraisal.</span>
          </div>
        </footer>
      </div>
    );
  }
  return (
    <div onClick={handleLink}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {screen}
      {coinForm && (
        <CoinForm
          {...context}
          initial={coinForm}
          onClose={() => setCoinForm(null)}
          onSaved={() => {
            setCoinForm(null);
            setRevision((r) => r + 1);
            setToast("Coin saved to your private collection.");
            navigate("/app/collection");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
