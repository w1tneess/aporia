"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { archive, filterEntries, monthLabel, sources, type BranchFilter } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { Branch, Entry } from "@/types/dispatch";
import EntryCard from "./EntryCard";
import FilterBar from "./FilterBar";

const PAGE = 40;

// Remounted with a new key when filters change, which resets the page size.
function List({ entries, onBranch }: { entries: Entry[]; onBranch: (b: Branch) => void }) {
  const [limit, setLimit] = useState(PAGE);
  let lastMonth = "";
  return (
    <>
      {entries.slice(0, limit).map((e) => {
        const month = monthLabel(e.published_at);
        const head = month !== lastMonth;
        lastMonth = month;
        return (
          <Fragment key={e.id}>
            {head && <h2 className="group-head">{month}</h2>}
            <EntryCard entry={e} onBranch={onBranch} />
          </Fragment>
        );
      })}
      {entries.length > limit && (
        <div className="more">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, entries.length - limit)} more
          </button>
        </div>
      )}
    </>
  );
}

export default function ArchiveView() {
  const app = useApp();
  const [branch, setBranch] = useState<BranchFilter>("All");
  const [source, setSource] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);

  const entries = useMemo(() => {
    const f = filterEntries(archive, { branch, source, unreadOnly, read: app.readSet });
    return newestFirst ? f : [...f].reverse();
  }, [branch, source, unreadOnly, newestFirst, app.readSet]);

  const filtered = branch !== "All" || source !== "all" || unreadOnly;
  const readTotal = archive.filter((e) => app.readSet.has(e.id)).length;

  return (
    <div className="stream">
      <header className="page-head">
        <h1 className="page-title">Archive</h1>
        <p className="page-sub">
          {filtered ? `${entries.length} of ${archive.length} pieces match.` : `${archive.length} pieces collected so far, ${readTotal} of them read.`}
        </p>
      </header>

      <FilterBar branch={branch} onBranch={setBranch} />
      <div className="toolbar">
        <div className="row">
          <label className="field">
            <span className="sr-only">Source</span>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="switch">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            <span>Unread only</span>
          </label>
        </div>
        <button type="button" className="btn btn-text" onClick={() => setNewestFirst((n) => !n)}>
          <ArrowDownUp size={15} strokeWidth={1.5} aria-hidden="true" /> {newestFirst ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty bordered">
          <p>Nothing matches those filters.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setBranch("All");
              setSource("all");
              setUnreadOnly(false);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <List key={`${branch}|${source}|${unreadOnly}|${newestFirst}`} entries={entries} onBranch={setBranch} />
      )}
    </div>
  );
}
