"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Copy, MessageCircle, NotebookPen } from "lucide-react";
import { passageToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import type { Passage } from "@/types/dispatch";

const ICON = { size: 15, strokeWidth: 1.5, "aria-hidden": true } as const;

interface Props {
  passage: Passage;
  today?: boolean;
  flash?: boolean;
}

export default function PassageRow({ passage, today = false, flash = false }: Props) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const saved = app.isPassageSaved(passage.id);
  const noted = app.notes.some((n) => n.passage.id === passage.id);
  return (
    <article id={`passage-${passage.id}`} className="entry passage-row" data-flash={flash}>
      <p className="entry-date">
        <span>{passage.branch}</span>
        {today && <span>Today&rsquo;s passage</span>}
      </p>
      <div>
        <blockquote className="entry-title">{passage.quote}</blockquote>
        <p className="hero-attrib">
          <strong>{passage.author}</strong>
          <span>
            {passage.work}, {passage.reference}
          </span>
        </p>
        {open && <p className="inquiry-text compact">{passage.inquiry_prompt}</p>}
        <div className="entry-actions">
          <button type="button" className="btn btn-text" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <MessageCircle {...ICON} /> {open ? "Hide question" : "Show question"}
          </button>
          <div>
            <Link className="btn btn-text" href={{ pathname: "/notebook", query: { passage: passage.id } }}>
              <NotebookPen {...ICON} /> {noted ? "Edit reflection" : "Reflect"}
            </Link>
            <button type="button" className="btn btn-text" aria-pressed={saved} onClick={() => app.togglePassage(passage)}>
              <Bookmark {...ICON} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" className="btn btn-text" onClick={() => app.copy(passageToMarkdown(passage), "Passage")}>
              <Copy {...ICON} /> Copy as Markdown
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
