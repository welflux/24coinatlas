# Landing page design

The landing page uses a midnight-blue, warm-ivory and brass palette with typographic specimen plates, catalogue-record and private-inventory previews, clear research standards, and native expandable FAQs. Illustrations are explicitly labelled; they do not represent reference photographs or authentication evidence.

The primary action opens the public catalogue. Account creation is offered only when the capabilities endpoint confirms registration is available. AI and registration availability copy follows the same endpoint. Authentication, verification requirements and billing controls are unchanged.

## Typography

The preferred family is **Italian Plate No2 Expanded**. This is a commercial typeface. No licensed webfont files were supplied, so the repository does not distribute them or download an unauthorised copy. `src/landing.css` defines a local regular face and falls back to Helvetica Neue or Arial. Visitors without the installed typeface see the fallback.

To deliver the preferred face consistently, provide licensed WOFF2 files for regular, medium and semibold (or the licensed variable font), with permission for web embedding on the site's domain. Add the supplied files to `public/fonts/` and replace the local-only `@font-face` in `src/landing.css` with matching URL sources and actual weight ranges. Keep `font-display: swap`. Recheck wrapping and contrast at 320, 390, 768 and 1440 pixels after switching fonts; metrics differ from the system fallback.

Do not claim conversion improvements without measuring them. Useful funnel steps are catalogue entry, record detail, eligible registration and first saved coin. No analytics or tracking was added by this redesign.
