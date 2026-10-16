import React from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "./ui";

export function AuthLayout({ mode, children }) {
  const recovery = !["register", "login"].includes(mode);
  return (
    <div className="enterprise-auth">
      <header className="enterprise-auth-nav">
        <a href="/" data-route aria-label="24CoinAtlas home">
          <Brand />
        </a>
        <a href="/app/catalogue" data-route>
          Browse the catalogue <ArrowUpRight size={15} />
        </a>
      </header>
      <div className="enterprise-auth-frame">
        <aside
          className="enterprise-auth-story"
          aria-label="About your collector workspace"
        >
          <div className="enterprise-kicker">
            24 / THE COLLECTOR’S WORKSPACE
          </div>
          <h2>
            {recovery ? (
              <>
                A secure way
                <br /> back to your
                <br /> <span>collection.</span>
              </>
            ) : (
              <>
                A collector’s eye.
                <br /> A record worth
                <br /> <span>keeping.</span>
              </>
            )}
          </h2>
          <p>
            {recovery
              ? "Your coin records, photographs and research belong together. Restore access to your private workspace."
              : "Bring the identity, provenance and photographs together. Build your collection on a clearer understanding."}
          </p>
          <div className="auth-record-plate" aria-hidden="true">
            <div>
              <span>ATLAS / RECORD STRUCTURE</span>
              <span>ZA</span>
            </div>
            <div className="auth-plate-art">
              <img
                src="/brand/24coinatlas-mark.png"
                width="112"
                height="112"
                alt=""
                className="auth-approved-mark"
              />
              <span>
                IDENTITY
                <br /> CONDITION
                <br /> PROVENANCE
              </span>
            </div>
            <div>
              <span>EVERY DETAIL HAS ITS PLACE</span>
              <span>01—03</span>
            </div>
          </div>
          <ul className="auth-assurances">
            <li>
              <LockKeyhole size={16} />
              <span>Private collection records</span>
            </li>
            <li>
              <BookOpen size={16} />
              <span>Research with visible source status</span>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>Clear limits. No invented valuations.</span>
            </li>
          </ul>
          <div className="auth-story-foot">SOUTH AFRICAN COIN INTELLIGENCE</div>
        </aside>
        <main id="main" className="auth-card enterprise-auth-form">
          {children}
        </main>
      </div>
      <footer className="enterprise-auth-footer">
        <a href="/" data-route>
          <ArrowLeft size={14} /> Back to 24CoinAtlas
        </a>
        <span>
          © {new Date().getFullYear()} 24CoinAtlas · Independent research
          platform
        </span>
      </footer>
    </div>
  );
}
