export const BRANCHES = [
  "Epistemology",
  "Language",
  "Consciousness",
  "Ethics",
  "Existentialism",
  "Eastern Philosophy",
] as const;

export type Branch = (typeof BRANCHES)[number];

export interface Passage {
  id: string;
  quote: string;
  author: string;
  work: string;
  reference: string;
  branch: Branch;
  inquiry_prompt: string;
}

export interface Entry {
  id: string;
  title: string;
  source: string;
  source_slug: string;
  url: string;
  published_at: string;
  read_time_min: number;
  branch: Branch;
  tags: string[];
  takeaways: string[];
  archived_at?: string;
}

export interface PipelineStats {
  sources_checked: number;
  fetch_duration_ms: number;
  total_archived: number;
  corpus_count: number;
  new_entries?: number;
  sources_failed?: number;
}

export interface Dispatch {
  edition: number;
  updated_at_utc: string;
  next_update_utc: string;
  pipeline_stats: PipelineStats;
  primary_passage: Passage;
  entries: Entry[];
}

export type SavedItem =
  | { key: string; kind: "passage"; saved_at: string; passage: Passage }
  | { key: string; kind: "entry"; saved_at: string; entry: Entry };

export type ThemePref = "system" | "dark" | "light";
export type TextSize = "s" | "m" | "l";

export interface Settings {
  theme: ThemePref;
  size: TextSize;
  compact: boolean;
}

/** A reflection written in answer to a passage's question. One per passage. */
export interface Note {
  passage: Passage;
  edition: number;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface Backup {
  app: "aporia";
  version: 1;
  exported_at: string;
  settings: Settings;
  saved: SavedItem[];
  read: string[];
  notes: Note[];
  visits: string[];
}
