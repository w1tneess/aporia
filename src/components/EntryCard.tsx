"use client";

import { ArrowUpRight, Bookmark, Check, Copy } from "lucide-react";
import { dateParts } from "@/lib/data";
import { entryToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import type { Branch, Entry } from "@/types/dispatch";

interface Props {
  entry: Entry;
  onBranch?: (b: Branch) => void;
}

export default function EntryCard({ entry, onBranch }: Props) {
  const app = useApp();
  const saved = app.isEntrySaved(entry.id);
  const read = app.readSet.has(entry.id);
  const { day, year } = dateParts(entry.published_at);
  return (
    <article className="entry" data-read={read}>
      <time className="entry-date" dateTime={entry.published_at}>
        <span>{day}</span>
        <span>{year}</span>
      </time>
      <div>
        <h3 className="entry-title">
          <a href={entry.url} target="_blank" rel="noopener noreferrer" onClick={() => app.markRead([entry.id])}>
            {entry.title}
            <ArrowUpRight className="ext" size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h3>
        <p className="entry-source">
          {entry.source}, {entry.read_time_min} min read
        </p>
        <ul className="takeaways">
          {entry.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="entry-actions">
          {onBranch ? (
            <button type="button" className="branch-link" onClick={() => onBranch(entry.branch)}>
              {entry.branch}
            </button>
          ) : (
            <span className="branch-link static">{entry.branch}</span>
          )}
          <div>
            <button type="button" className="btn btn-text" aria-pressed={saved} onClick={() => app.toggleEntry(entry)}>
              <Bookmark size={15} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" className="btn btn-text" aria-pressed={read} onClick={() => app.toggleRead(entry.id)}>
              <Check size={15} strokeWidth={read ? 2.2 : 1.5} aria-hidden="true" />
              {read ? "Read" : "Mark read"}
            </button>
            <button type="button" className="btn btn-text" aria-label={`Copy quote: ${entry.title}`} onClick={() => app.copy(entryToMarkdown(entry), "Quote")}>
              <Copy size={15} strokeWidth={1.5} aria-hidden="true" />
              Copy quote
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
