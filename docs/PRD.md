# PRD.md — Product Requirements Document: Aporia

## 1. Problem Statement
Discovering rigorous philosophical writing—primary texts, encyclopedia entries, and long-form essays—requires manually checking scattered academic portals, RSS feeds, or noisy social feeds optimized for engagement rather than contemplation. Meanwhile, traditional self-hosted readers require backend databases, cron servers, or recurring hosting fees.

## 2. Product Vision
**Aporia** is an autonomous, zero-maintenance philosophical dispatch and digital commonplace reader:
- **Personal Daily Utility:** Delivers one curated primary philosophical passage, one Socratic inquiry prompt, and a distilled digest of newly published philosophical essays every morning at `05:30 IST`, complete with one-click Markdown export for personal notes and digital gardens.
- **Open-Source GitHub Showcase (`@w1tneess/aporia`):** Demonstrates a clean, forkable **Git-as-a-Database** architecture where GitHub Actions acts as an autonomous editorial pipeline, committing structured JSON snapshots that automatically rebuild a calm, premium static web app.

## 3. Target Users
1. **Primary User (Creator):** Readers and writers of philosophy, contemplative inquiry, and essays seeking a finite, high-signal daily reading ritual.
2. **Secondary Audience (GitHub Watchers & Forkers):** Developers, indie builders, and digital-garden maintainers looking for a zero-cost, self-updating static template.

## 4. Core Functional Requirements

### F1: Autonomous Daily Dispatch Pipeline
- **Scheduled & Manual Execution:** Runs via GitHub Actions cron daily at `00:00 UTC` (`05:30 IST`) and supports on-demand `workflow_dispatch` triggers.
- **Curated Multi-Source Ingestion:** Fetches high-signal feeds (*Stanford Encyclopedia of Philosophy*, *Aeon*, *Psyche*, *Daily Nous*, *Internet Encyclopedia of Philosophy*) alongside a verified local corpus of 40+ primary passages (*Ludwig Wittgenstein, J. Krishnamurti, Osho, Nagarjuna, Baruch Spinoza, Albert Camus, Simone Weil, Marcus Aurelius*).
- **Efficiency & Deduplication:** Uses HTTP conditional requests (`ETag` / `If-Modified-Since`) and deterministic SHA-256 content hashes in `data/archive.json` so runs complete in <5 seconds with zero duplicate entries.

### F2: Daily Primary Passage & Contemplative Inquiry
- Displays one primary philosophical proposition in large Libre Caslon Display type as the hero of the first screen.
- Includes full attribution (Author, Work, Section/Aphorism number) and an interactive **"Sit With Question"** toggle revealing a Socratic counter-question.
- Includes a **"Shuffle Corpus"** control to cycle through verified primary passages client-side without losing today's pinned edition.

### F3: Distilled Essay Stream & Branch Filtering
- Displays the latest 8–10 newly harvested essays/entries with:
  - Dated metadata (date and year in a gutter, source name and read time under the title).
  - Maximum 3 concise, scannable takeaway bullets (zero bloated paragraphs).
  - Philosophical branch classification (`Epistemology`, `Language`, `Consciousness`, `Ethics`, `Existentialism`, `Eastern Philosophy`).
- Instant client-side filtering by branch. There is deliberately no search field.

### F4: One-Click Markdown Export & Commonplace Clipping
- Every passage and essay card includes a **Copy Markdown** action (`> "Quote" — Author, Work` + source URL and tags) with subtle toast confirmation.
- Top-bar **Export .md** downloads the entire daily edition as a clean, formatted Markdown digest (`aporia-edition-N.md`).

### F5: Searchable Archive & Browser Saved Shelf
- **Archive Tab:** Searchable historical log of up to 500 past dispatches stored in `data/archive.json`.
- **Saved Tab:** Client-side `localStorage` shelf for bookmarking favorite passages and essays with one-click bulk Markdown export.

### F6: GitHub Fork & Architecture Guide
- Accessible via **"How It Works"** in the top bar: explains the autonomous Git-as-a-Database loop and provides a 3-step fork guide for GitHub visitors.

### F7: Pages for every task
- **Library:** every corpus passage, filterable by branch and thinker, with "Surprise me".
- **Notebook:** write one reflection per passage in answer to its Socratic question; edit, copy, delete and export them. Stored locally.
- **Archive filters:** branch, source, unread only, newest or oldest first, grouped by month.
- **Settings:** theme (device, dark, light), text size, compact lists, activity figures, backup and restore as JSON, delete all data.
- **How it works:** a full page replacing the old dialog, including the fork guide.

### F8: Reading conveniences
- Opening an essay marks it read; entries can also be marked manually or all at once. Today shows read progress and a daily-visit streak.
- Keyboard shortcuts (`g` then `t a l n s , h`, `?`) and a skip link.
- Copy the whole day's digest as Markdown, a countdown to the next edition, and an Atom feed (`public/feed.xml`) written by the harvester.

## 5. Non-Goals & Guardrails
- No backend servers, external databases, user logins, or tracking analytics.
- No infinite scroll, recommendation algorithms, or mandatory paid API keys.
- No search field. Narrowing is done with filters.

## 6. Acceptance Criteria
- `python scripts/fetch_philosophy.py` executes cleanly in <10 seconds and produces valid `data/dispatch.json`, `data/archive.json`, and `public/corpus.json`.
- `npm run build` compiles to static HTML/CSS/JS with zero errors.
- Lighthouse audit achieves >=98 across Performance, Accessibility, Best Practices, and SEO.
