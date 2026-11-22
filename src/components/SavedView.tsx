"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import type { BranchFilter } from "@/lib/data";
import { downloadMarkdown, savedToMarkdown } from "@/lib/markdown";
import { useApp } from "@/lib/store";
import EntryCard from "./EntryCard";
import FilterBar from "./FilterBar";
import PassageRow from "./PassageRow";
import Segmented from "./Segmented";

type Kind = "all" | "passage" | "entry";

export default function SavedView() {
  const app = useApp();
  const [kind, setKind] = useState<Kind>("all");
  const [branch, setBranch] = useState<BranchFilter>("All");

  const items = useMemo(
    () =>
      app.saved.filter(
        (i) => (kind === "all" || i.kind === kind) && (branch === "All" || (i.kind === "passage" ? i.passage.branch : i.entry.branch) === branch),
      ),
    [app.saved, kind, branch],
  );

  return (
    <div className="stream">
      <header className="page-head">
        <h1 className="page-title">Saved</h1>
        <p className="page-sub">Passages and essays you kept. Stored in this browser only; nothing is uploaded.</p>
      </header>

      {app.saved.length > 0 && (
        <>
          <Segmented
            label="Show"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "Everything" },
              { value: "passage", label: "Passages" },
              { value: "entry", label: "Essays" },
            ]}
          />
          <FilterBar branch={branch} onBranch={setBranch} />
          <div className="toolbar">
            <span className="hint">{items.length} shown</span>
            <button
              type="button"
              className="btn btn-text"
              onClick={() => {
                downloadMarkdown("aporia-saved.md", savedToMarkdown(items));
                app.notify("Saved shelf exported");
              }}
            >
              <Download size={15} strokeWidth={1.5} aria-hidden="true" /> Export .md
            </button>
          </div>
        </>
      )}

      {app.saved.length === 0 ? (
        <div className="empty bordered">
          <p>Nothing saved yet. Choose Save on any passage or essay and it will wait for you here.</p>
          <Link className="btn" href="/">Browse today&rsquo;s dispatch</Link>
        </div>
      ) : items.length === 0 ? (
        <div className="empty bordered">
          <p>Nothing saved matches that filter.</p>
          <button type="button" className="btn" onClick={() => (setKind("all"), setBranch("All"))}>Clear filters</button>
        </div>
      ) : (
        items.map((i) => (i.kind === "entry" ? <EntryCard key={i.key} entry={i.entry} /> : <PassageRow key={i.key} passage={i.passage} />))
      )}
    </div>
  );
}
