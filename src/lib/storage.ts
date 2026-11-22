import type { Backup, Note, SavedItem, Settings, TextSize, ThemePref } from "@/types/dispatch";

export const DEFAULT_SETTINGS: Settings = { theme: "dark", size: "m", compact: false };

const K = {
  settings: "aporia:settings:v1",
  saved: "aporia:saved:v1",
  read: "aporia:read:v1",
  notes: "aporia:notes:v1",
  visits: "aporia:visits:v1",
} as const;

// localStorage can throw (private mode, blocked site data); every access is guarded.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* non-fatal: data is session-only if storage is unavailable */
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {};
  return {
    theme: (["system", "dark", "light"] as const).includes(s.theme as ThemePref) ? (s.theme as ThemePref) : DEFAULT_SETTINGS.theme,
    size: (["s", "m", "l"] as const).includes(s.size as TextSize) ? (s.size as TextSize) : DEFAULT_SETTINGS.size,
    compact: s.compact === true,
  };
}

const normalizeSaved = (v: unknown): SavedItem[] =>
  (Array.isArray(v) ? v : []).filter(
    (i): i is SavedItem => isObj(i) && typeof i.key === "string" && (isObj(i.passage) || isObj(i.entry)),
  );

const normalizeNotes = (v: unknown): Note[] =>
  (Array.isArray(v) ? v : []).filter(
    (n): n is Note => isObj(n) && isObj(n.passage) && typeof n.passage.id === "string" && typeof n.text === "string",
  );

const normalizeStrings = (v: unknown, test: (s: string) => boolean = () => true): string[] =>
  (Array.isArray(v) ? v : []).filter((s): s is string => typeof s === "string" && test(s));

export const loadSettings = (): Settings => normalizeSettings(read(K.settings, {}));
export const loadSaved = (): SavedItem[] => normalizeSaved(read(K.saved, []));
export const loadRead = (): string[] => normalizeStrings(read(K.read, []));
export const loadNotes = (): Note[] => normalizeNotes(read(K.notes, []));
export const loadVisits = (): string[] => normalizeStrings(read(K.visits, []), (s) => DAY.test(s));

export const persist = {
  settings: (v: Settings) => write(K.settings, v),
  saved: (v: SavedItem[]) => write(K.saved, v),
  read: (v: string[]) => write(K.read, v),
  notes: (v: Note[]) => write(K.notes, v),
  visits: (v: string[]) => write(K.visits, v),
};

export function wipe(): void {
  try {
    Object.values(K).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}

export function resolveTheme(pref: ThemePref): "dark" | "light" {
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  return pref;
}

export function applyToDocument(s: Settings, theme: "dark" | "light"): void {
  const d = document.documentElement.dataset;
  d.theme = theme;
  d.size = s.size;
  d.compact = String(s.compact);
}

export function buildBackup(parts: Omit<Backup, "app" | "version" | "exported_at">): Backup {
  return { app: "aporia", version: 1, exported_at: new Date().toISOString(), ...parts };
}

/** Returns a sanitised backup, or null when the text is not an Aporia backup. */
export function parseBackup(text: string): Backup | null {
  try {
    const b: unknown = JSON.parse(text);
    if (!isObj(b) || b.app !== "aporia" || b.version !== 1) return null;
    return {
      app: "aporia",
      version: 1,
      exported_at: typeof b.exported_at === "string" ? b.exported_at : new Date().toISOString(),
      settings: normalizeSettings(b.settings),
      saved: normalizeSaved(b.saved),
      read: normalizeStrings(b.read),
      notes: normalizeNotes(b.notes),
      visits: normalizeStrings(b.visits, (s) => DAY.test(s)),
    };
  } catch {
    return null;
  }
}
