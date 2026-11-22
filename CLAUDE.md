# CLAUDE.md — Aporia Autonomous Build Constitution

## Project Identity
- **Name:** Aporia (`aporia`)
- **Author:** Advaita Chandra (`@w1tneess`)
- **Tagline:** A self-updating philosophical dispatch and inquiry engine.
- **Architecture:** Git-as-a-Database static web application. Zero servers, zero paid API keys, zero runtime third-party CORS requests.

## Mandatory Reading Order
Read all four specification documents inside `docs/` before scaffolding or writing code:
1. `docs/PRD.md` — Product Requirements, User Flows, Acceptance Criteria, Open-Source Showcase Goals
2. `docs/TRD.md` — System Architecture, JSON Schemas, Concurrent Python Harvester, GitHub Actions CI/CD
3. `docs/STRUCTURE.md` — Exact Directory Layout, File Responsibilities, Strict Module Boundaries
4. `docs/DESIGN.md` — Madder design system: tokens, typography, layout geometry

## Non-Negotiable Engineering Constraints
- **Pure Static Export:** Configure Next.js 15 App Router with `output: 'export'` and `images: { unoptimized: true }`. All data is imported at build time from `data/dispatch.json` and `data/archive.json`, plus `public/corpus.json` for client-side passage shuffling.
- **Zero-Dependency Harvester Resilience:** `scripts/fetch_philosophy.py` must run cleanly with only `feedparser`, `beautifulsoup4`, and `requests`. It must execute RSS fetches concurrently (`ThreadPoolExecutor`), cache HTTP ETag/Last-Modified headers in `data/.http_cache.json` for sub-3-second incremental runs, and operate 100% offline-capable if feeds time out. Optional `GEMINI_API_KEY` enhancement must fail over silently to deterministic sentence scoring.
- **Design System Adherence:** Strictly implement `docs/DESIGN.md` ("Madder": `Libre Caslon Display`, `Libre Caslon Text`, `Hanken Grotesk`; `#150B0F` / `#FF6F61` default dark theme and `#FBF3F4` / `#B3122F` light theme; sticky `60px` `.topbar`; `1040px` `.wrap` with an `820px` reading stream; `6px` / `10px` radii; no cards, no all-caps labels, no monospace; mobile `<760px` bottom tab bar; seven static pages; no search field).
- **Verification Gate:** Before concluding:
  1. Run `python scripts/fetch_philosophy.py` to generate real initial datasets in `data/` and `public/corpus.json`.
  2. Run `npm run build` and verify zero TypeScript, ESLint, or static export warnings/errors.
  3. Generate a showcase-ready `README.md` with architecture diagram, live feature breakdown, and 2-minute fork setup.
