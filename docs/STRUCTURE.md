# STRUCTURE.md — Repository Directory & Module Map

```text
aporia/
├── .github/workflows/daily-dispatch.yml   # Daily cron + manual trigger pipeline
├── data/
│   ├── .http_cache.json                   # Conditional HTTP ETag / Last-Modified cache
│   ├── dispatch.json                      # Current daily edition payload
│   └── archive.json                       # Deduplicated archive (max 500 entries)
├── docs/                                  # PRD, TRD, STRUCTURE, DESIGN ("Madder")
├── public/
│   ├── corpus.json                        # Build-synced passages (Shuffle, Library, Notebook)
│   ├── feed.xml                           # Atom feed written by the harvester
│   └── favicon.svg
├── scripts/
│   ├── requirements.txt                   # feedparser, beautifulsoup4, requests
│   ├── sources.json                       # RSS endpoints & branch keyword weights
│   ├── corpus_seed.json                   # Primary passages & inquiry prompts
│   └── fetch_philosophy.py                # Concurrent, cached, idempotent harvester
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Fonts, metadata, anti-flash script, <AppShell>
│   │   ├── globals.css                    # Tokens and component styles
│   │   ├── page.tsx                       # Today
│   │   └── archive|library|notebook|saved|settings|guide/page.tsx   # Thin server pages (metadata + view)
│   ├── components/
│   │   ├── AppShell.tsx                   # Provider, top bar, footer, shortcuts, toast
│   │   ├── TopBar.tsx, MobileTabBar.tsx   # Page navigation (top >=760px, bottom <760px)
│   │   ├── TodayView.tsx, PrimaryPassageCard.tsx, Reflection.tsx
│   │   ├── ArchiveView.tsx, LibraryView.tsx, NotebookView.tsx, SavedView.tsx
│   │   ├── SettingsView.tsx, GuideView.tsx
│   │   ├── EntryCard.tsx, PassageRow.tsx  # Essay row and passage row
│   │   ├── FilterBar.tsx, Segmented.tsx   # Branch filter and generic text choices
│   │   └── ShortcutsDialog.tsx, Toast.tsx
│   ├── lib/
│   │   ├── data.ts                        # Build-time JSON imports, date and filter helpers
│   │   ├── store.tsx                      # App state (settings, saved, read, notes, visits, toast)
│   │   ├── storage.ts                     # Safe localStorage, validation, backup parse/build
│   │   └── markdown.ts                    # Every Markdown serializer plus clipboard/download helpers
│   └── types/dispatch.ts                  # Shared TypeScript interfaces
├── CLAUDE.md, README.md, next.config.ts, package.json
```

## Module boundaries
- **`scripts/` -> `data/` & `public/`:** exclusively owns network I/O, HTML sanitisation, deduplication and JSON/XML generation.
- **`src/app/` & `src/components/`:** static presentation layer consuming local JSON imports. Zero external runtime network calls (the only fetch is same-origin `corpus.json` for Shuffle).
- **`src/lib/store.tsx`:** the single owner of client state. Components never touch `localStorage` directly; `storage.ts` is the only module that does.
- **`src/lib/markdown.ts`:** single source of truth for Markdown serialisation (passages, essays, reflections, shelves, editions).
