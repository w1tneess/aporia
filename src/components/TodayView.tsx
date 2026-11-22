"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCheck, Copy, Download } from "lucide-react";
import { dispatch, filterEntries, scrollToEl, type BranchFilter } from "@/lib/data";
import { downloadMarkdown, editionToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import type { Branch } from "@/types/dispatch";
import EntryCard from "./EntryCard";
import FilterBar from "./FilterBar";
import PrimaryPassageCard from "./PrimaryPassageCard";

export default function TodayView() {
  const app = useApp();
  const [branch, setBranch] = useState<BranchFilter>("All");
  const streamRef = useRef<HTMLDivElement>(null);

  const total = dispatch.entries.length;
  const readCount = dispatch.entries.filter((e) => app.readSet.has(e.id)).length;
  const latest = useMemo(() => filterEntries(dispatch.entries, { branch }), [branch]);
  const digest = editionToMarkdown(dispatch);

  // Clicking a branch name anywhere filters the list and brings it into view.
  const filterBy = (b: Branch) => {
    setBranch(b);
    requestAnimationFrame(() => scrollToEl(streamRef.current));
  };

  return (
    <>
      <PrimaryPassageCard passage={dispatch.primary_passage} edition={dispatch.edition} onBranch={filterBy} />

      <div className="stream" ref={streamRef}>
        <div className="stream-head">
          <h2>New in philosophy</h2>
          <span className="stream-stats">
            <span>
              {readCount} of {total} read
            </span>
            {app.streak > 1 && <span>{app.streak}-day streak</span>}
          </span>
        </div>
        <div className="progress" role="progressbar" aria-label="Entries read today" aria-valuemin={0} aria-valuemax={total} aria-valuenow={readCount}>
          <span style={{ width: `${total ? (readCount / total) * 100 : 0}%` }} />
        </div>

        <div className="toolbar">
          <FilterBar branch={branch} onBranch={setBranch} />
          <div className="row">
            <button type="button" className="btn btn-text" onClick={() => app.markRead(dispatch.entries.map((e) => e.id))} disabled={readCount === total}>
              <CheckCheck size={15} strokeWidth={1.5} aria-hidden="true" /> Mark all read
            </button>
            <button type="button" className="btn btn-text" onClick={() => app.copy(digest, "Digest")}>
              <Copy size={15} strokeWidth={1.5} aria-hidden="true" /> Copy digest
            </button>
            <button
              type="button"
              className="btn btn-text"
              onClick={() => {
                downloadMarkdown(`aporia-edition-${dispatch.edition}.md`, digest);
                app.notify("Edition exported");
              }}
            >
              <Download size={15} strokeWidth={1.5} aria-hidden="true" /> Export .md
            </button>
          </div>
        </div>

        {latest.length === 0 ? (
          <div className="empty bordered">
            <p>Today&rsquo;s dispatch has nothing in this branch. The archive holds more.</p>
            <Link className="btn" href="/archive">Browse the archive</Link>
          </div>
        ) : (
          latest.map((e) => <EntryCard key={e.id} entry={e} onBranch={filterBy} />)
        )}
      </div>
    </>
  );
}
