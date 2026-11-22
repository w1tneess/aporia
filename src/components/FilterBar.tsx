import { BRANCHES } from "@/types/dispatch";
import type { BranchFilter } from "@/lib/data";

interface Props {
  branch: BranchFilter;
  onBranch: (b: BranchFilter) => void;
}

/** Branch picker used on Today, Archive, Library and Saved. */
export default function FilterBar({ branch, onBranch }: Props) {
  return (
    <div className="branches" role="group" aria-label="Filter by branch">
      {(["All", ...BRANCHES] as const).map((b) => (
        <button key={b} type="button" className="branch-filter" aria-pressed={branch === b} onClick={() => onBranch(b)}>
          {b}
        </button>
      ))}
    </div>
  );
}
