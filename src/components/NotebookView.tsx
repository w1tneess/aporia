"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { corpus, dispatch, scrollToEl, shortDate } from "@/lib/data";
import { downloadMarkdown, noteToMarkdown, notebookToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import type { Note } from "@/types/dispatch";
import Reflection from "./Reflection";

const ICON = { size: 15, strokeWidth: 1.5, "aria-hidden": true } as const;

function NoteItem({ note, onEdit }: { note: Note; onEdit: (id: string) => void }) {
  const app = useApp();
  const [confirm, setConfirm] = useState(false);
  const p = note.passage;
  return (
    <article className="entry note">
      <p className="entry-date">
        <span>{shortDate(note.updated_at).replace(/ \d{4}$/, "")}</span>
        <span>{note.updated_at.slice(0, 4)}</span>
      </p>
      <div>
        <p className="note-quote">&ldquo;{p.quote}&rdquo;</p>
        <p className="entry-source">
          {p.author}, {p.work}
        </p>
        <p className="note-text">{note.text}</p>
        <div className="entry-actions">
          <span className="hint">Edition {note.edition}</span>
          <div>
            <button type="button" className="btn btn-text" onClick={() => onEdit(p.id)}>
              <Pencil {...ICON} /> Edit
            </button>
            <button type="button" className="btn btn-text" onClick={() => app.copy(noteToMarkdown(note), "Reflection")}>
              <Copy {...ICON} /> Copy as Markdown
            </button>
            {confirm ? (
              <>
                <button type="button" className="btn btn-text danger" onClick={() => (app.deleteNote(p.id), app.notify("Reflection deleted"))}>
                  Delete for good
                </button>
                <button type="button" className="btn btn-text" onClick={() => setConfirm(false)}>
                  Keep
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-text" onClick={() => setConfirm(true)}>
                <Trash2 {...ICON} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function NotebookView() {
  const app = useApp();
  const [selectedId, setSelectedId] = useState(dispatch.primary_passage.id);
  const composerRef = useRef<HTMLElement>(null);
  const selected = corpus.find((p) => p.id === selectedId) ?? dispatch.primary_passage;

  // Library "Reflect" links arrive as /notebook/?passage=<id>.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("passage");
    if (id && corpus.some((p) => p.id === id)) setSelectedId(id);
  }, []);

  const edit = (id: string) => {
    setSelectedId(id);
    scrollToEl(composerRef.current);
  };

  return (
    <div className="stream">
      <header className="page-head">
        <h1 className="page-title">Notebook</h1>
        <p className="page-sub">Your reflections on each passage&rsquo;s question. They stay in this browser.</p>
      </header>

      <section ref={composerRef} className="composer" aria-label="Write a reflection">
        <label className="field wide">
          <span className="sr-only">Passage to reflect on</span>
          <select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
            {corpus.map((p) => (
              <option key={p.id} value={p.id}>
                {p.author}: {p.quote.length > 56 ? `${p.quote.slice(0, 56)}…` : p.quote}
              </option>
            ))}
          </select>
        </label>
        <blockquote className="composer-quote">{selected.quote}</blockquote>
        <p className="inquiry-text compact">{selected.inquiry_prompt}</p>
        <Reflection key={`${selected.id}:${app.ready}`} passage={selected} edition={dispatch.edition} showLink={false} />
      </section>

      <div className="stream-head" style={{ marginTop: 48 }}>
        <h2>Your reflections</h2>
        <button
          type="button"
          className="btn btn-text"
          disabled={app.notes.length === 0}
          onClick={() => {
            downloadMarkdown("aporia-notebook.md", notebookToMarkdown(app.notes));
            app.notify("Notebook exported");
          }}
        >
          <Download {...ICON} /> Export .md
        </button>
      </div>
      {app.notes.length === 0 ? (
        <div className="empty bordered">
          <p>No reflections yet. Pick a passage above, read its question, and write the first one.</p>
        </div>
      ) : (
        app.notes.map((n) => <NoteItem key={n.passage.id} note={n} onEdit={edit} />)
      )}
    </div>
  );
}
