#!/usr/bin/env python3
"""Aporia harvester: concurrent, cached, idempotent.

Reads curated RSS feeds + the local primary corpus and writes:
  data/dispatch.json, data/archive.json, data/.http_cache.json, public/corpus.json

Third-party deps: feedparser, beautifulsoup4, requests. Works offline: a feed that
times out is skipped and the previous archive is simply re-published.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit
from xml.sax.saxutils import escape

import feedparser
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
DATA = ROOT / "data"
PUBLIC = ROOT / "public"

TIMEOUT_S = 8
MAX_WORKERS = 5
USER_AGENT = "AporiaBot/1.0"
ARCHIVE_CAP = 500
DISPATCH_ENTRIES = 10
PER_FEED_CAP = 12
BOILERPLATE = re.compile(
    r"(continue reading|read more|subscribe|sign up|newsletter|the post .{0,120} appeared first on|"
    r"all rights reserved|follow us|click here|share this|support aeon|donate|changes to:|editor's note)",
    re.I,
)
NOISE = re.compile(
    r"\[[^\]]{0,400}\]"  # SEP revision notices, editor's notes
    r"|first published [^;]{0,40}\d{4}; substantive revision \w{3} \w{3} \d{1,2}, \d{4}"
    r"|\s*[-–—]\s*by [^.]{0,80}?(read on \w+)?\s*$"  # Aeon/Psyche teaser tails
    r"|read on (aeon|psyche)",
    re.I,
)
SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z“\"'(])")
WORD = re.compile(r"[A-Za-zÀ-ɏ'-]+")
STOP = set(
    "the a an and or but of to in on for with as at by from is are was were be been it its this that these "
    "those which who whom whose not no we you they he she his her their our can may might will would should "
    "also than then there here more most such into about over under between".split()
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def write_json(path: Path, obj: Any, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = (
        json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
        if compact
        else json.dumps(obj, ensure_ascii=False, indent=2)
    )
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text + "\n", encoding="utf-8")
    tmp.replace(path)


# ---------- corpus ----------
def load_corpus() -> list[dict[str, Any]]:
    corpus = read_json(SCRIPTS / "corpus_seed.json", [])
    ids = [p["id"] for p in corpus]
    if len(ids) != len(set(ids)):
        raise SystemExit("corpus_seed.json contains duplicate ids")
    required = {"id", "quote", "author", "work", "reference", "branch", "inquiry_prompt"}
    for p in corpus:
        missing = required - p.keys()
        if missing:
            raise SystemExit(f"corpus passage {p.get('id')} missing {sorted(missing)}")
    if not corpus:
        raise SystemExit("corpus_seed.json is empty")
    return corpus


# ---------- text distillation ----------
def clean_html(raw: str) -> str:
    soup = BeautifulSoup(raw or "", "html.parser")
    for tag in soup(["script", "style", "figure", "iframe"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(" ")).strip()


def sentences(text: str) -> list[str]:
    return [s.strip() for s in SENT_SPLIT.split(text) if s.strip() and not BOILERPLATE.search(s)]


def tokens(s: str) -> list[str]:
    return [w.lower() for w in WORD.findall(s)]


def sentence_score(s: str, terms: set[str]) -> float:
    toks = tokens(s)
    if not toks:
        return 0.0
    content = [t for t in toks if t not in STOP]
    density = len(set(content)) / len(toks)
    overlap = sum(1 for t in content if t in terms)
    length_fit = 1.0 - min(abs(len(s) - 137), 80) / 80  # peak in the 65-210 window
    return density * 2 + overlap * 0.6 + length_fit


def takeaways(text: str, terms: set[str], limit: int = 3) -> list[str]:
    sents = sentences(text)
    for lo, hi in ((65, 210), (40, 260)):
        cands = [s for s in sents if lo <= len(s) <= hi and not s.endswith(("...", "…"))]
        if cands:
            break
    else:
        cands = [s[:210].rsplit(" ", 1)[0] + "…" for s in sents if len(s) > 30]
    ranked = sorted(cands, key=lambda s: sentence_score(s, terms), reverse=True)
    chosen: list[str] = []
    for s in ranked:
        st = set(tokens(s))
        if all(len(st & set(tokens(c))) / max(1, len(st | set(tokens(c)))) < 0.5 for c in chosen):
            chosen.append(s)
        if len(chosen) == limit:
            break
    order = {s: i for i, s in enumerate(sents)}
    chosen.sort(key=lambda c: order.get(c, len(order)))
    return chosen


def classify(text: str, branches: dict[str, dict[str, int]], default: str) -> tuple[str, list[str]]:
    low = text.lower()
    scores: dict[str, int] = {}
    hits: list[tuple[int, str]] = []
    for branch, kws in branches.items():
        for kw, weight in kws.items():
            n = len(re.findall(r"\b" + re.escape(kw), low))
            if n:
                scores[branch] = scores.get(branch, 0) + weight * min(n, 3)
                hits.append((weight * min(n, 3), kw))
    branch = max(scores, key=scores.get) if scores else default
    top = [kw.title() for _, kw in sorted(hits, reverse=True)[:3]]
    return branch, top


def read_time(text: str, kind: str) -> int:
    base = max(2, round(len(text.split()) / 220))
    return max(6, base) if kind == "encyclopedia" else base


def normalize_url(url: str) -> str:
    p = urlsplit(url.strip())
    return f"{p.netloc.lower().removeprefix('www.')}{p.path.rstrip('/')}"


def entry_id(url: str, title: str) -> str:
    return hashlib.sha256((normalize_url(url) + title.strip()).encode("utf-8")).hexdigest()[:12]


# ---------- optional Gemini refinement ----------
def gemini_refine(title: str, text: str, bullets: list[str]) -> list[str]:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return bullets
    try:
        model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        prompt = (
            "Rewrite as exactly 3 crisp, non-redundant takeaway bullets (each under 200 characters, "
            "no markdown) for this philosophy piece. Return a JSON array of 3 strings only.\n\n"
            f"Title: {title}\nText: {text[:3000]}"
        )
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            },
            timeout=TIMEOUT_S,
        )
        r.raise_for_status()
        out = json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])
        out = [str(b).strip() for b in out if str(b).strip()][:3]
        return out if len(out) >= 2 else bullets
    except Exception:  # noqa: BLE001 - enhancement must never break the run
        return bullets


# ---------- fetching ----------
def fetch_feed(src: dict[str, Any], cache: dict[str, Any], use_cache: bool) -> dict[str, Any]:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml, */*"}
    meta = cache.get(src["feed"], {}) if use_cache else {}
    if meta.get("etag"):
        headers["If-None-Match"] = meta["etag"]
    if meta.get("last_modified"):
        headers["If-Modified-Since"] = meta["last_modified"]
    try:
        r = requests.get(src["feed"], headers=headers, timeout=TIMEOUT_S)
        if r.status_code == 304:
            return {"src": src, "status": "not_modified", "entries": []}
        r.raise_for_status()
        parsed = feedparser.parse(r.content)
        new_meta = {k: r.headers.get(h) for k, h in (("etag", "ETag"), ("last_modified", "Last-Modified")) if r.headers.get(h)}
        return {"src": src, "status": "ok", "entries": parsed.entries[:PER_FEED_CAP], "meta": new_meta}
    except Exception as exc:  # noqa: BLE001 - offline / timeout / bad XML => skip feed
        return {"src": src, "status": "error", "error": type(exc).__name__, "entries": []}


def build_entry(raw: Any, src: dict[str, Any], branches: dict[str, Any], terms: set[str], today: str) -> dict[str, Any] | None:
    title = clean_html(raw.get("title", ""))
    url = (raw.get("link") or "").strip()
    if not title or not url.startswith("http"):
        return None
    body = raw.get("content", [{}])[0].get("value") if raw.get("content") else None
    if src.get("skip_title") and re.search(src["skip_title"], title, re.I):
        return None
    text = NOISE.sub(" ", clean_html(body or raw.get("summary", "") or raw.get("description", "")))
    text = re.sub(r"\s+", " ", text).strip()
    published = raw.get("published_parsed") or raw.get("updated_parsed")
    published_at = time.strftime("%Y-%m-%d", published) if published else today
    branch, kws = classify(f"{title}. {text}", branches, src["default_branch"])
    bullets = takeaways(text, terms)
    bullets = gemini_refine(title, text, bullets) if bullets else bullets
    if not bullets:
        bullets = [f"New {src['name']} piece; open the source for the full argument on {branch.lower()}."]
    return {
        "id": entry_id(url, title),
        "title": title,
        "source": src["name"],
        "source_slug": src["slug"],
        "url": url,
        "published_at": published_at,
        "read_time_min": read_time(text, src["kind"]),
        "branch": branch,
        "tags": [branch] + [k for k in kws if k != branch][:2],
        "takeaways": bullets[:3],
    }


def write_feed(dispatch: dict[str, Any], site: str) -> None:
    """Atom feed so readers can follow Aporia without opening the site."""
    esc = lambda s: escape(str(s), {'"': "&quot;"})  # noqa: E731
    p = dispatch["primary_passage"]
    updated = dispatch["updated_at_utc"]
    items = [
        f"""  <entry>
    <id>urn:aporia:edition:{dispatch['edition']}</id>
    <title>{esc(f"Edition {dispatch['edition']}: {p['author']}")}</title>
    <link href="{esc(site)}/"/>
    <updated>{updated}</updated>
    <summary type="text">{esc(f"“{p['quote']}” — {p['author']}, {p['work']} ({p['reference']}). Question: {p['inquiry_prompt']}")}</summary>
  </entry>"""
    ]
    for e in dispatch["entries"]:
        items.append(
            f"""  <entry>
    <id>urn:aporia:entry:{e['id']}</id>
    <title>{esc(e['title'])}</title>
    <link href="{esc(e['url'])}"/>
    <updated>{e['published_at']}T00:00:00Z</updated>
    <category term="{esc(e['branch'])}"/>
    <summary type="text">{esc(' '.join(e['takeaways']))}</summary>
  </entry>"""
        )
    xml = f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>{esc(site)}/</id>
  <title>Aporia</title>
  <subtitle>A self-updating philosophical dispatch.</subtitle>
  <link rel="alternate" href="{esc(site)}/"/>
  <link rel="self" href="{esc(site)}/feed.xml"/>
  <updated>{updated}</updated>
  <author><name>Aporia</name></author>
{chr(10).join(items)}
</feed>
"""
    (PUBLIC / "feed.xml").write_text(xml, encoding="utf-8")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    t0 = time.perf_counter()
    now = now_utc()
    today = now.strftime("%Y-%m-%d")

    cfg = read_json(SCRIPTS / "sources.json", {"sources": [], "branches": {}})
    sources, branches = cfg["sources"], cfg["branches"]
    terms = {kw for kws in branches.values() for kw in kws}
    corpus = load_corpus()
    archive: list[dict[str, Any]] = read_json(DATA / "archive.json", [])
    prev = read_json(DATA / "dispatch.json", {})
    cache = read_json(DATA / ".http_cache.json", {})
    seen = {e["id"] for e in archive}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        results = list(pool.map(lambda s: fetch_feed(s, cache, use_cache=bool(archive)), sources))

    new_entries: list[dict[str, Any]] = []
    for res in results:
        if res["status"] == "ok":
            cache[res["src"]["feed"]] = res["meta"]
            for raw in res["entries"]:
                e = build_entry(raw, res["src"], branches, terms, today)
                if e and e["id"] not in seen:
                    seen.add(e["id"])
                    e["archived_at"] = iso(now)
                    new_entries.append(e)
        print(f"  {res['src']['slug']:<9} {res['status']}" + (f" ({res['error']})" if res["status"] == "error" else ""))

    archive = sorted(new_entries + archive, key=lambda e: e["archived_at"], reverse=True)[:ARCHIVE_CAP]
    stable = sorted(archive, key=lambda e: (e["published_at"], e["archived_at"]), reverse=True)

    same_day = str(prev.get("updated_at_utc", ""))[:10] == today
    edition = int(prev.get("edition", 0)) if same_day and prev.get("edition") else int(prev.get("edition", 0)) + 1
    stats = {
        "sources_checked": len(sources),
        "fetch_duration_ms": round((time.perf_counter() - t0) * 1000),
        "total_archived": len(archive),
        "corpus_count": len(corpus),
        "new_entries": len(new_entries),
        "sources_failed": sum(1 for r in results if r["status"] == "error"),
    }
    dispatch = {
        "edition": edition,
        "updated_at_utc": iso(now),
        "next_update_utc": iso(now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)),
        "pipeline_stats": stats,
        "primary_passage": corpus[(edition - 1) % len(corpus)],
        "entries": [{k: v for k, v in e.items() if k != "archived_at"} for e in stable[:DISPATCH_ENTRIES]],
    }

    write_json(DATA / "archive.json", archive, compact=True)
    write_json(DATA / "dispatch.json", dispatch)
    write_json(DATA / ".http_cache.json", cache)
    write_json(PUBLIC / "corpus.json", corpus)
    write_feed(dispatch, (os.environ.get("SITE_URL") or "https://github.com/w1tneess/aporia").rstrip("/"))
    print(
        f"edition {edition}: +{len(new_entries)} new, {len(archive)} archived, "
        f"{stats['sources_failed']} feed(s) failed, {stats['fetch_duration_ms']} ms"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
