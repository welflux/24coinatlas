import React, { useState, useEffect, useRef, useId } from "react";
import {
  ArrowUpRight,
  Info,
  AlertCircle,
  LoaderCircle,
  Layers,
  LockKeyhole,
  X,
} from "lucide-react";
import { api } from "./api";
export const money = (v) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
    (v || 0) / 100,
  );
export const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Africa/Johannesburg",
      })
    : "Not recorded";
export const conditions = [
  "Not assessed",
  "Poor",
  "Fair",
  "Good",
  "Very Good",
  "Fine",
  "Very Fine",
  "Extremely Fine",
  "About Uncirculated",
  "Uncirculated",
  "Proof",
];
export const eras = [
  "Modern rand",
  "Discontinued decimal",
  "Union & pre-decimal",
  "ZAR & historical",
  "Bullion & gold",
];
export function useResource(path, dependency = 0) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setData(null);
    if (!path) {
      setLoading(false);
      return;
    }
    api(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, dependency, revision]);
  return { data, error, loading, reload: () => setRevision((r) => r + 1) };
}
export function Brand({ light = false }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol">✧</span>
      <span>
        24Coin<span className="brand-atlas">Atlas</span>
        <small>SOUTH AFRICAN COIN INTELLIGENCE</small>
      </span>
    </span>
  );
}
export function Button({
  children,
  icon: Icon = ArrowUpRight,
  variant = "",
  className = "",
  ...props
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
      {Icon && <Icon size={17} strokeWidth={1.7} aria-hidden="true" />}
    </button>
  );
}
export function Notice({ children, tone = "info" }) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <Icon size={18} />
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={22} className="spin" /> Loading your workspace…
    </div>
  );
}
export function Empty({ icon: Icon = Layers, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Tag({ children, tone = "" }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function Field({ label, help, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />} {help && <small>{help}</small>}
    </label>
  );
}
export function Heading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-heading-actions">{children}</div>}
    </div>
  );
}
export function Gate({
  navigate,
  title = "A private place for your collection.",
}) {
  return (
    <Empty
      icon={LockKeyhole}
      title={title}
      action={
        <Button onClick={() => navigate("/register")}>
          Create a free account
        </Button>
      }
    >
      Sign in to save photographs, coin records and your research. Your
      collection is private by default.
      <a href="/login" data-route className="gate-signin">
        Already have an account? Sign in
      </a>
    </Empty>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(),
    previous = useRef(document.activeElement),
    callback = useRef(onClose),
    id = useId();
  callback.current = onClose;
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.querySelector("button,input,select,textarea")?.focus();
    const handler = (e) => {
      if (e.key === "Escape") callback.current();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
          ),
        ].filter((n) => n.offsetParent !== null);
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      previous.current?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={ref}
      >
        <header>
          <div>
            <div className="eyebrow">YOUR PRIVATE COLLECTION</div>
            <h2 id={id}>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function CoinArt({ kind = "mandela" }) {
  const id = useId().replaceAll(":", ""),
    gold = ["krugerrand", "pond"].includes(kind);
  return (
    <svg
      width="240"
      height="240"
      className="coin-art"
      viewBox="0 0 240 240"
      role="img"
      aria-label={`${kind} coin illustration, not an identification reference`}
    >
      <defs>
        <radialGradient id={id}>
          <stop stopColor={gold ? "#ead398" : "#eee9d5"} />
          <stop offset=".72" stopColor={gold ? "#b99250" : "#b9b5a2"} />
          <stop offset="1" stopColor={gold ? "#806033" : "#888b7d"} />
        </radialGradient>
        <path id={`${id}-text`} d="M36 120a84 84 0 1 1 168 0" />
      </defs>
      <circle cx="120" cy="120" r="104" fill={`url(#${id})`} />
      <circle
        cx="120"
        cy="120"
        r="98"
        fill="none"
        stroke={gold ? "#f0d9a2" : "#eeebd9"}
        strokeWidth="2"
      />
      <circle
        cx="120"
        cy="120"
        r="91"
        fill="none"
        stroke={gold ? "#85653a" : "#8f9383"}
        strokeWidth="1"
        strokeDasharray="1 4"
      />
      <text
        fill={gold ? "#72532c" : "#717867"}
        fontSize="12"
        fontFamily="Georgia"
        letterSpacing="3"
      >
        <textPath href={`#${id}-text`} startOffset="50%" textAnchor="middle">
          SOUTH AFRICA · SUID-AFRIKA
        </textPath>
      </text>
      {["springbok", "krugerrand"].includes(kind) ? (
        <g
          stroke={gold ? "#806139" : "#777f6b"}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M68 139q30-23 64-15l22-30 11 2-13 39-18 14-13 23m-6-27-22 26m-8-29-24 21m67-33 29 19 14 29M150 96l-5-21m16 22 10-20M59 175q58 8 121-2" />
        </g>
      ) : kind === "shilling" ? (
        <g fill="none" stroke="#777d6c" strokeWidth="2">
          <path d="M84 155h76l-14-65-16 23-21-27-14 34-18-8ZM84 161h78m-65-61v56m18-45v45m17-40v40m14-43v43" />
        </g>
      ) : (
        <g
          fill={gold ? "#9c753e" : "#959988"}
          stroke={gold ? "#77552e" : "#7c8372"}
          strokeWidth="1.5"
        >
          <path d="M94 170q-17-5-15-19l13-16 5-14-9-13 10-8q-7-31 13-38 29-8 37 20l-2 33-11 17 10 12 19 10 7 16Z" />
          <path
            d="M100 98q17 10 39-1m-36 21 25 5m-23-36 9-2m9 0 9 2"
            fill="none"
          />
        </g>
      )}
      <text
        x="120"
        y="198"
        textAnchor="middle"
        fontSize="19"
        fill={gold ? "#77552e" : "#777d6c"}
        fontFamily="Georgia"
      >
        {kind === "krugerrand"
          ? "KRUGERRAND"
          : kind === "pond"
            ? "1 POND"
            : kind === "shilling"
              ? "1 SHILLING"
              : kind === "springbok"
                ? "1 RAND"
                : "5 RAND"}
      </text>
    </svg>
  );
}
