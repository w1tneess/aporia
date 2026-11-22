"use client";

import { useState } from "react";
import Link from "next/link";
import { shortDate } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { Passage } from "@/types/dispatch";

interface Props {
  passage: Passage;
  edition: number;
  /** Show a link to the notebook (hidden when already on the notebook page). */
  showLink?: boolean;
}

// Mount with a key that includes `app.ready` and the passage id so the draft reloads when either changes.
export default function Reflection({ passage, edition, showLink = true }: Props) {
  const app = useApp();
  const existing = app.notes.find((n) => n.passage.id === passage.id);
  const [text, setText] = useState(existing?.text ?? "");
  const dirty = text.trim() !== "" && text.trim() !== (existing?.text ?? "");

  return (
    <div className="reflection">
      <label htmlFor={`reflection-${passage.id}`} className="reflection-label">
        Your reflection
      </label>
      <textarea
        id={`reflection-${passage.id}`}
        className="textarea"
        rows={5}
        value={text}
        placeholder="Write what comes up. It stays in this browser; only you can read it."
        onChange={(e) => setText(e.target.value)}
      />
      <div className="reflection-actions">
        <button
          type="button"
          className="btn"
          disabled={!dirty}
          onClick={() => {
            app.saveNote(passage, edition, text.trim());
            app.notify(existing ? "Reflection updated" : "Reflection saved to your notebook");
          }}
        >
          {existing ? "Update reflection" : "Save reflection"}
        </button>
        {existing && <span className="hint">Last saved {shortDate(existing.updated_at)}</span>}
        {showLink && (
          <Link className="linklike" href="/notebook">
            Open notebook
          </Link>
        )}
      </div>
    </div>
  );
}
