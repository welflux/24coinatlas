# Product design

The landing page uses a midnight-blue, warm-ivory and brass palette with typographic specimen plates, catalogue-record and private-inventory previews, clear research standards, and native expandable FAQs. Illustrations are explicitly labelled; they do not represent reference photographs or authentication evidence.

The primary action opens the public catalogue. Account creation is offered only when the capabilities endpoint confirms registration is available. AI and registration availability copy follows the same endpoint. Authentication, verification requirements and billing controls are unchanged.

## Typography

The preferred family is **Italian Plate No2 Expanded**. This is a commercial typeface. No licensed webfont files were supplied, so the repository does not distribute them or download an unauthorised copy. `src/landing.css` defines a local regular face and falls back to Helvetica Neue or Arial. Visitors without the installed typeface see the fallback.

To deliver the preferred face consistently, provide licensed WOFF2 files for regular, medium and semibold (or the licensed variable font), with permission for web embedding on the site's domain. Add the supplied files to `public/fonts/` and replace the local-only `@font-face` in `src/landing.css` with matching URL sources and actual weight ranges. Keep `font-display: swap`. Recheck wrapping and contrast at 320, 390, 768 and 1440 pixels after switching fonts; metrics differ from the system fallback.

Do not claim conversion improvements without measuring them. Useful funnel steps are catalogue entry, record detail, eligible registration and first saved coin. No analytics or tracking was added by this redesign.

## Collector workspace and account access

The application shell shares the midnight, ivory and brass palette and preferred type stack. Navigation shows the current page, keyboard focus, and explicit mobile open/close state. The overview prioritises real collection metrics, recent coin records and research-service availability. Recorded acquisition cost is labelled separately from market value; loading and guest states do not invent collection figures.

The identification workbench separates capture, provider analysis and human review. Public visitors can inspect the workflow, but photograph controls require a session. Provider-unavailable and permission states are visible before attempting analysis. Existing photo ownership, consent, upload validation, quotas and assessment endpoints are preserved.

Registration, sign-in, recovery, reset and verification share `AuthLayout`, a two-panel card with a brand/research panel and a focused form. On narrow screens the decorative plate and assurance list collapse away. This is a normal navigable page, not an ARIA modal dialog; it does not trap users in a fake modal. Password managers, autocomplete, reveal controls, validation and verification requirements remain supported. Registration is disabled with a catalogue link when the capabilities endpoint says verification delivery is unavailable. No authentication bypass, sample login or billing activation is included.

## Approved logo

The approved gold globe and gold/navy `24coinatlas` wordmark replaces the earlier star symbol. Canonical transparent PNG assets live in `public/brand/`; `Brand` in `src/ui.jsx` renders the wordmark across public pages, workspace navigation, loading/error screens and all account-access pages. `src/brand.css` controls responsive sizing. The dark sidebar places the original coloured wordmark on an ivory panel for legibility. The globe is used for the favicon, touch icon, sidebar note and account illustration.

Verification/recovery email templates use the hosted logo with a text alternative. Downloaded HTML dossiers and collection reports embed the logo, so it remains visible offline. These are PNG assets, not editable vector artwork or font files. The source ZIP includes both images.
