# TRD.md — Technical Reference Document: Aporia

## 1. System Architecture
Aporia implements an **Idempotent Static-Site + Git-Backed ETL** pipeline:

```text
[Curated RSS Feeds + Verified Primary Corpus]
                     │
                     ▼  (Concurrent ThreadPoolExecutor + ETag Cache)
     [GitHub Actions: daily-dispatch.yml]
                     │
                     ▼  (HTML Sanitization + TF-IDF / Heuristic Scoring)
       [scripts/fetch_philosophy.py]
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
[data/dispatch.json] [data/archive.json] [public/corpus.json] [public/feed.xml]
                     │
                     ▼  (git commit & push on diff)
       [Vercel / Cloudflare Pages Static Build]
                     │
                     ▼  (Zero Runtime External Fetches)
        [Next.js 15 App Router Static Client]
```

## 2. Stack & Tooling
- **Frontend:** Next.js 15 (App Router, TypeScript `strict: true`, `output: "export"`)
- **Styling:** Tailwind CSS v4 + CSS Custom Properties (`docs/DESIGN.md`)
- **Typography:** `next/font/google` (`Libre_Caslon_Display`, `Libre_Caslon_Text`, `Hanken_Grotesk`)
- **Icons:** `lucide-react` (`1.5px` stroke width)
- **Harvester:** Python 3.12 (`feedparser`, `beautifulsoup4`, `requests`)
- **CI/CD:** GitHub Actions (`ubuntu-latest`)

## 3. Data Schemas

### 3.1 `data/dispatch.json`
```json
{
  "edition": 1,
  "updated_at_utc": "2026-11-23T00:00:08Z",
  "next_update_utc": "2026-11-24T00:00:00Z",
  "pipeline_stats": {
    "sources_checked": 5,
    "fetch_duration_ms": 1840,
    "total_archived": 48,
    "corpus_count": 40
  },
  "primary_passage": {
    "id": "wittgenstein-tlp-5.6",
    "quote": "The limits of my language mean the limits of my world.",
    "author": "Ludwig Wittgenstein",
    "work": "Tractatus Logico-Philosophicus",
    "reference": "5.6 (1921)",
    "branch": "Language",
    "inquiry_prompt": "Identify one belief you hold strongly today—how much of it survives if you strip away inherited metaphors?"
  },
  "entries": [
    {
      "id": "9f86d081884c",
      "title": "The Epistemology of Testimony",
      "source": "Stanford Encyclopedia of Philosophy",
      "source_slug": "sep",
      "url": "https://plato.stanford.edu/entries/testimony-episprob/",
      "published_at": "2026-11-22",
      "read_time_min": 14,
      "branch": "Epistemology",
      "tags": ["Epistemology", "Knowledge", "Trust"],
      "takeaways": [
        "Examines whether testimony is an autonomous source of justification or reducible to perception and inference.",
        "Contrasts reductionist skepticism against anti-reductionist default entitlement.",
        "Evaluates how networked information environments reshape epistemic trust."
      ]
    }
  ]
}
```

### 3.2 `data/archive.json` & `data/.http_cache.json`
- `data/archive.json`: Deduplicated array of `Entry` objects sorted reverse-chronologically by `archived_at`, capped at 500 items (`<250 KB`) for fast build-time imports.
- `data/.http_cache.json`: Stores per-feed `etag` and `last_modified` headers so unchanged feeds return `304 Not Modified` without downloading redundant XML payloads.

## 4. High-Efficiency Python Harvester (`scripts/fetch_philosophy.py`)
1. **Concurrent Fetching:** Uses `concurrent.futures.ThreadPoolExecutor(max_workers=5)` with a strict `8s` timeout per feed and custom `User-Agent: AporiaBot/1.0`.
2. **Conditional HTTP Caching:** Sends `If-None-Match` and `If-Modified-Since` headers from `data/.http_cache.json`; skips parsing on `304` responses.
3. **Deterministic Content Hashing:** Computes `sha256(normalized_url + title)[:12]` to guarantee idempotent deduplication against `data/archive.json`.
4. **Zero-API Heuristic Distillation:**
   - Strips HTML via `BeautifulSoup` and removes boilerplate ("Continue reading", "Subscribe", newsletter footers).
   - Scores candidate sentences by lexical density, philosophical term overlap, and optimal length (`65–210` characters) to produce 2–3 crisp, non-redundant takeaway bullets.
   - Computes reading time via `max(2, round(word_count / 220))` (with minimum `6 min` default for encyclopedia entries whose RSS feeds only expose abstracts).
5. **Optional LLM Upgrade:** If `GEMINI_API_KEY` is present in environment variables, calls Gemini Flash REST API via `requests` (zero extra SDKs) to refine the 3 bullets, falling back silently to heuristic bullets on any error.
6. **Deterministic Corpus Rotation:** Selects `corpus[(edition - 1) % len(corpus)]` for `primary_passage` and syncs `scripts/corpus_seed.json` -> `public/corpus.json`.

## 5. GitHub Actions Workflow (`.github/workflows/daily-dispatch.yml`)
```yaml
name: Daily Philosophy Dispatch

on:
  schedule:
    - cron: '0 0 * * *' # 00:00 UTC / 05:30 IST daily
  workflow_dispatch:

permissions:
  contents: write

jobs:
  harvest-and-publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: scripts/requirements.txt

      - name: Install dependencies
        run: pip install -r scripts/requirements.txt

      - name: Run philosophy harvester
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python scripts/fetch_philosophy.py

      - name: Commit updated dispatch
        run: |
          git config user.name "aporia-bot"
          git config user.email "aporia-bot@users.noreply.github.com"
          git add data/ public/corpus.json public/feed.xml
          git diff --staged --quiet || git commit -m "chore(dispatch): publish daily edition"
          git push
```
