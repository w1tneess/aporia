"use client";

import { useRef, useState } from "react";
import { Bookmark, Copy, MessageCircle, RotateCcw, Shuffle } from "lucide-react";
import { BASE_PATH } from "@/lib/data";
import { passageToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import type { Branch, Passage } from "@/types/dispatch";
import Reflection from "./Reflection";

const CORPUS_URL = `${BASE_PATH}/corpus.json`;
const ICON = { size: 16, strokeWidth: 1.5, "aria-hidden": true } as const;

// Long passages step down in size so no quote ever shouts.
const sizeFor = (quote: string) => (quote.length <= 75 ? "l" : quote.length <= 135 ? "m" : "s");

interface Props {
  passage: Passage;
  edition: number;
  onBranch: (b: Branch) => void;
}

export default function PrimaryPassageCard({ passage, edition, onBranch }: Props) {
  const app = useApp();
  // `passage` is today's pinned edition; shuffling only swaps what is displayed.
  const [shuffled, setShuffled] = useState<Passage | null>(null);
  const [open, setOpen] = useState(false);
  const corpus = useRef<Passage[] | null>(null);
  const shown = shuffled ?? passage;
  const saved = app.isPassageSaved(shown.id);

  async function shuffle() {
    try {
      if (!corpus.current) {
        const res = await fetch(CORPUS_URL);
        if (!res.ok) throw new Error(String(res.status));
        corpus.current = (await res.json()) as Passage[];
      }
      const pool = corpus.current.filter((p) => p.id !== shown.id);
      setShuffled(pool[Math.floor(Math.random() * pool.length)]);
      setOpen(false);
    } catch {
      app.notify("Couldn't load the corpus. Check your connection and try again.");
    }
  }

  return (
    <section className="hero" aria-label="Passage">
      <svg className="hero-ring" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 3.2a12.8 12.8 0 1 0 12.8 12.8" stroke="currentColor" strokeWidth="0.06" strokeLinecap="round" />
        <circle cx="25.1" cy="6.9" r="0.45" fill="currentColor" />
      </svg>

      <div className="hero-body">
        <p className="hero-kicker">
          <span>{shuffled ? "From the corpus" : "Today’s passage"}</span>
          <span className="rule" aria-hidden="true" />
          <button type="button" className="branch-link" onClick={() => onBranch(shown.branch)}>
            {shown.branch}
          </button>
        </p>

        <blockquote key={shown.id} className="hero-quote" data-size={sizeFor(shown.quote)} data-shuffled={shuffled !== null}>
          {shown.quote}
        </blockquote>

        <p className="hero-attrib">
          <strong>{shown.author}</strong>
          <span>
            {shown.work}, {shown.reference}
          </span>
        </p>

        <div id="inquiry-panel" className="inquiry" data-open={open} aria-hidden={!open} inert={!open}>
          <div>
            <p className="inquiry-text">{shown.inquiry_prompt}</p>
            <Reflection key={`${shown.id}:${app.ready}`} passage={shown} edition={edition} />
          </div>
        </div>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary" aria-expanded={open} aria-controls="inquiry-panel" onClick={() => setOpen((o) => !o)}>
            <MessageCircle {...ICON} /> {open ? "Hide the question" : "Sit with a question"}
          </button>
          <button type="button" className="btn" onClick={shuffle}>
            <Shuffle {...ICON} /> Shuffle
          </button>
          {shuffled && (
            <button type="button" className="btn btn-text" onClick={() => (setShuffled(null), setOpen(false))}>
              <RotateCcw {...ICON} /> Back to today
            </button>
          )}
          <button type="button" className="btn btn-text" aria-pressed={saved} onClick={() => app.togglePassage(shown)}>
            <Bookmark {...ICON} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>
          <button type="button" className="btn btn-text" onClick={() => app.copy(passageToMarkdown(shown), "Passage")}>
            <Copy {...ICON} /> Copy as Markdown
          </button>
        </div>
      </div>
    </section>
  );
}
