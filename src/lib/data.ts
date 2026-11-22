import archiveJson from "../../data/archive.json";
import dispatchJson from "../../data/dispatch.json";
import corpusJson from "../../public/corpus.json";
import type { Branch, Dispatch, Entry, Passage } from "@/types/dispatch";

// All content is imported at build time: the app makes no runtime requests for it.
export const dispatch = dispatchJson as unknown as Dispatch;
export const corpus = corpusJson as unknown as Passage[];
export const archive = [...(archiveJson as unknown as Entry[])].sort(
  (a, b) => b.published_at.localeCompare(a.published_at) || (b.archived_at ?? "").localeCompare(a.archived_at ?? ""),
);

export const REPO_URL = "https://github.com/w1tneess/aporia";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const sources = [...new Map(archive.map((e) => [e.source_slug, e.source])).entries()]
  .map(([slug, name]) => ({ slug, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Manual formatting keeps server and client output identical (no locale differences).
export function dateParts(iso: string): { day: string; year: string } {
  const [y, m, d] = iso.split("-").map(Number);
  return MONTHS[m - 1] ? { day: `${d} ${MONTHS[m - 1]}`, year: String(y) } : { day: iso, year: "" };
}

export function shortDate(iso: string): string {
  const { day, year } = dateParts(iso.slice(0, 10));
  return `${day} ${year}`.trim();
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return MONTHS_LONG[m - 1] ? `${MONTHS_LONG[m - 1]} ${y}` : iso;
}

export type BranchFilter = Branch | "All";

interface Filters {
  branch: BranchFilter;
  source?: string;
  unreadOnly?: boolean;
  read?: Set<string>;
}

export function filterEntries(list: Entry[], f: Filters): Entry[] {
  return list.filter(
    (e) =>
      (f.branch === "All" || e.branch === f.branch) &&
      (!f.source || f.source === "all" || e.source_slug === f.source) &&
      !(f.unreadOnly && f.read?.has(e.id)),
  );
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToEl(el: Element | null | undefined): void {
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}
