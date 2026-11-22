# Aporia

> A self-updating philosophical dispatch and inquiry engine.

Every morning at 05:30 IST, Aporia publishes one primary philosophical passage, one Socratic question to sit with, and a distilled digest of newly published philosophy essays. There is no server, no database, no tracking and no paid API. A GitHub Action commits plain JSON, and that commit rebuilds a fully static site.

Built by Advaita Chandra ([@w1tneess](https://github.com/w1tneess)).

## How it works

```text
[Curated RSS feeds + verified primary corpus]
                     │
                     ▼  concurrent fetch (ThreadPoolExecutor) + ETag / Last-Modified cache
     [GitHub Actions: daily-dispatch.yml, 00:00 UTC]
                     │
                     ▼  HTML sanitising + heuristic distillation
       [scripts/fetch_philosophy.py]
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
[data/dispatch.json] [data/archive.json] [public/corpus.json]
                     │
                     ▼  git commit & push, only on diff
       [Vercel / Cloudflare Pages static build]
                     │
                     ▼  zero runtime third-party requests
        [Next.js 15 static export, App Router]
```

The harvester is idempotent. Each item is keyed by `sha256(normalized_url + title)[:12]`, so reruns never duplicate entries. Re-running on the same UTC day keeps the same edition number.

## Features

| Page or feature | What it does |
| :-- | :-- |
| **Today** | The daily passage as the hero of the first screen, **Sit with a question** (expands the question and a reflection box), **Shuffle**, Save and Copy as Markdown. Below it, the 10 newest essays with read progress, a branch filter, Mark all read, Copy digest and Export .md. |
| **Archive** | Every collected piece, grouped by month. Filter by branch or source, show unread only, flip newest or oldest first. |
| **Library** | All corpus passages. Filter by branch or thinker, open a question, **Surprise me**, or reflect on any passage. |
| **Notebook** | One reflection per passage, written in answer to its question. Edit, copy, delete (with confirmation) and export everything as Markdown. |
| **Saved** | Passages and essays you kept, filterable by type and branch, with bulk `.md` export. |
| **Settings** | Theme (match device, dark or light), text size, compact lists, activity figures, JSON backup and restore, and delete-all. |
| **How it works** | The daily loop, last run figures, a guide to each page and the fork steps. |
| **Reading conveniences** | Opening an essay marks it read, a daily-visit streak, a countdown to the next edition, keyboard shortcuts (`g` then `t a l n s , h`, and `?` for the list), and an Atom feed at `/feed.xml`. |

There is deliberately no search field; narrowing is done with filters. Everything you create (saved items, reflections, read marks, settings) lives in your browser's `localStorage` and never leaves the device.

### Harvester details

- Needs only `feedparser`, `beautifulsoup4` and `requests`.
- Fetches feeds concurrently (5 workers, 8 s timeout, `User-Agent: AporiaBot/1.0`).
- Sends `If-None-Match` and `If-Modified-Since` from `data/.http_cache.json`. A `304` skips parsing, so incremental runs finish in about a second or two.
- Works offline. A feed that fails or times out is skipped and the previous archive is republished.
- Takeaways are picked by lexical density, philosophical-term overlap and sentence length (65–210 characters), with near-duplicates removed.
- Writes `public/feed.xml` (Atom) using the `SITE_URL` environment variable for the feed links.
- Optional: set `GEMINI_API_KEY` to have Gemini Flash rewrite the bullets. Any error falls back silently to the heuristic bullets.

## Fork it in 2 minutes

1. **Fork** this repo on GitHub.
2. **Enable the bot.** In *Settings → Actions → General → Workflow permissions*, choose *Read and write*. Optionally add a `GEMINI_API_KEY` repository secret and a `SITE_URL` repository variable (your deployed URL, used in the Atom feed).
3. **Deploy.** Import the fork into Vercel or Cloudflare Pages (build command `npm run build`, output directory `out`). Then open the *Actions* tab and run **Daily Philosophy Dispatch** once.

Update the `REPO_URL` constant in `src/lib/data.ts` so the in-app links point at your fork. Hosting under a sub-path such as GitHub Pages project sites? Set `NEXT_PUBLIC_BASE_PATH=/your-repo` at build time.

## Local development

```bash
pip install -r scripts/requirements.txt
python scripts/fetch_philosophy.py   # writes data/*.json and public/corpus.json

npm install
npm run dev      # http://localhost:3000
npm run build    # static export to ./out
npm run lint
```

## Project layout

See [`docs/STRUCTURE.md`](docs/STRUCTURE.md). The design system lives in [`docs/DESIGN.md`](docs/DESIGN.md), requirements in [`docs/PRD.md`](docs/PRD.md), and architecture in [`docs/TRD.md`](docs/TRD.md).

## Design

The "Madder" design system ([`docs/DESIGN.md`](docs/DESIGN.md)) pairs coral-red on wine-black (or deep crimson on pale rose paper) with Libre Caslon for reading and Hanken Grotesk for the interface. The daily passage is the hero of the first screen and its size steps down as quotes get longer. Essays are a ruled index with a date gutter, not cards. All text tokens meet WCAG AA.

## About the corpus

Passages are short excerpts with attribution. Public-domain translations (Elwes, Long, Legge, Müller, Jowett and others) are used wherever possible. Two entries are paraphrases of Nāgārjuna and one of Zhuangzi, labelled as such in their `reference`. The Krishnamurti ("observer is the observed") and Osho entries are marked *attributed; verify against source edition*. Check any quotation against a primary edition before relying on it.
