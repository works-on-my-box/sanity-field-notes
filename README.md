# Field notes

Symptom → cause → rule notes from running an unattended browser-automation stack (Puppeteer, Chrome under Xvfb, systemd, IMAP) on a small VPS. Modeled as structured content in Sanity, served by a static Astro site, and exposed to agents through Sanity Context.

- `studio/` — Sanity Studio and schema (`note`, `area`, `tag`); `scripts/import.ts` imports notes from NDJSON.
- `web/` — Astro site (static build, reads the dataset at build time).

Project `krbdaikf`, dataset `production` (public).
