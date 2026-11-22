"use client";

import { useMemo, useState } from "react";
import { Dices } from "lucide-react";
import { corpus, dispatch, scrollToEl, type BranchFilter } from "@/lib/data";
import FilterBar from "./FilterBar";
import PassageRow from "./PassageRow";

const authors = [...new Set(corpus.map((p) => p.author))].sort((a, b) => a.localeCompare(b));

export default function LibraryView() {
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [author, setAuthor] = useState("all");
  const [flashId, setFlashId] = useState<string | null>(null);

  const list = useMemo(
    () => corpus.filter((p) => (branch === "All" || p.branch === branch) && (author === "all" || p.author === author)),
    [branch, author],
  );

  function surprise() {
    if (list.length === 0) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    setFlashId(pick.id);
    scrollToEl(document.getElementById(`passage-${pick.id}`));
    setTimeout(() => setFlashId(null), 1800);
  }

  return (
    <div className="stream">
      <header className="page-head">
        <h1 className="page-title">Library</h1>
        <p className="page-sub">
          {corpus.length} passages from {authors.length} thinkers. Open a question, reflect on it, or save it for later.
        </p>
      </header>

      <FilterBar branch={branch} onBranch={setBranch} />
      <div className="toolbar">
        <label className="field">
          <span className="sr-only">Thinker</span>
          <select value={author} onChange={(e) => setAuthor(e.target.value)}>
            <option value="all">All thinkers</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-text" onClick={surprise} disabled={list.length === 0}>
          <Dices size={15} strokeWidth={1.5} aria-hidden="true" /> Surprise me
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty bordered">
          <p>No passages match that thinker and branch together.</p>
          <button type="button" className="btn" onClick={() => (setBranch("All"), setAuthor("all"))}>
            Clear filters
          </button>
        </div>
      ) : (
        list.map((p) => <PassageRow key={p.id} passage={p} today={p.id === dispatch.primary_passage.id} flash={flashId === p.id} />)
      )}
    </div>
  );
}
