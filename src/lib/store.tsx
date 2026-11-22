"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { copyText } from "@/lib/markdown";
import {
  DEFAULT_SETTINGS, applyToDocument, loadNotes, loadRead, loadSaved, loadSettings, loadVisits, persist, resolveTheme, wipe,
} from "@/lib/storage";
import type { Backup, Entry, Note, Passage, SavedItem, Settings } from "@/types/dispatch";

const pad = (n: number) => String(n).padStart(2, "0");
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Consecutive days ending today on which the reader opened Aporia. */
export function computeStreak(visits: string[], today: string): number {
  const days = new Set(visits);
  const d = new Date(`${today}T00:00:00`);
  let n = 0;
  while (days.has(localDay(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

interface Api {
  ready: boolean;
  settings: Settings;
  theme: "dark" | "light";
  saved: SavedItem[];
  readSet: Set<string>;
  notes: Note[];
  visits: string[];
  streak: number;
  toast: string | null;
  notify: (message: string) => void;
  copy: (text: string, what: string) => Promise<void>;
  setSettings: (patch: Partial<Settings>) => void;
  isEntrySaved: (id: string) => boolean;
  isPassageSaved: (id: string) => boolean;
  toggleEntry: (e: Entry) => void;
  togglePassage: (p: Passage) => void;
  toggleRead: (id: string) => void;
  markRead: (ids: string[]) => void;
  saveNote: (passage: Passage, edition: number, text: string) => void;
  deleteNote: (passageId: string) => void;
  importBackup: (b: Backup) => void;
  clearAll: () => void;
}

const Ctx = createContext<Api | null>(null);

export function useApp(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [visits, setVisits] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Client-only state is loaded after mount so the static HTML and first render agree.
  useEffect(() => {
    const today = localDay();
    const seen = loadVisits();
    setSettingsState(loadSettings());
    setSaved(loadSaved());
    setRead(loadRead());
    setNotes(loadNotes());
    setVisits(seen.includes(today) ? seen : [...seen, today].slice(-400));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) persist.settings(settings); }, [ready, settings]);
  useEffect(() => { if (ready) persist.saved(saved); }, [ready, saved]);
  useEffect(() => { if (ready) persist.read(read); }, [ready, read]);
  useEffect(() => { if (ready) persist.notes(notes); }, [ready, notes]);
  useEffect(() => { if (ready) persist.visits(visits); }, [ready, visits]);

  useEffect(() => {
    if (!ready) return;
    const apply = () => {
      const t = resolveTheme(settings.theme);
      setTheme(t);
      applyToDocument(settings, t);
    };
    apply();
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [ready, settings]);

  useEffect(() => {
    if (toast === null) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((m: string) => setToast(m), []);
  const copy = useCallback(async (text: string, what: string) => {
    setToast((await copyText(text)) ? `${what} copied as Markdown` : "Couldn't copy. Allow clipboard access and try again.");
  }, []);
  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), []);

  const savedKeys = useMemo(() => new Set(saved.map((s) => s.key)), [saved]);
  const readSet = useMemo(() => new Set(read), [read]);

  const toggleSaved = useCallback((item: SavedItem) => {
    setSaved((cur) => (cur.some((s) => s.key === item.key) ? cur.filter((s) => s.key !== item.key) : [item, ...cur]));
  }, []);
  const toggleEntry = useCallback(
    (entry: Entry) => toggleSaved({ key: `entry:${entry.id}`, kind: "entry", saved_at: new Date().toISOString(), entry }),
    [toggleSaved],
  );
  const togglePassage = useCallback(
    (passage: Passage) => toggleSaved({ key: `passage:${passage.id}`, kind: "passage", saved_at: new Date().toISOString(), passage }),
    [toggleSaved],
  );

  const toggleRead = useCallback((id: string) => setRead((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])), []);
  const markRead = useCallback(
    (ids: string[]) => setRead((cur) => (ids.every((i) => cur.includes(i)) ? cur : [...new Set([...cur, ...ids])].slice(-2000))),
    [],
  );

  const saveNote = useCallback((passage: Passage, edition: number, text: string) => {
    const now = new Date().toISOString();
    setNotes((cur) => {
      const prev = cur.find((n) => n.passage.id === passage.id);
      const note: Note = prev ? { ...prev, passage, text, updated_at: now } : { passage, edition, text, created_at: now, updated_at: now };
      return [note, ...cur.filter((n) => n.passage.id !== passage.id)];
    });
  }, []);
  const deleteNote = useCallback((id: string) => setNotes((cur) => cur.filter((n) => n.passage.id !== id)), []);

  const importBackup = useCallback((b: Backup) => {
    setSettingsState(b.settings);
    setSaved(b.saved);
    setRead(b.read);
    setNotes(b.notes);
    setVisits([...new Set([...b.visits, localDay()])]);
  }, []);
  const clearAll = useCallback(() => {
    wipe();
    setSettingsState(DEFAULT_SETTINGS);
    setSaved([]);
    setRead([]);
    setNotes([]);
    setVisits([localDay()]);
  }, []);

  const value = useMemo<Api>(
    () => ({
      ready, settings, theme, saved, readSet, notes, visits,
      streak: ready ? computeStreak(visits, localDay()) : 0,
      toast, notify, copy, setSettings,
      isEntrySaved: (id) => savedKeys.has(`entry:${id}`),
      isPassageSaved: (id) => savedKeys.has(`passage:${id}`),
      toggleEntry, togglePassage, toggleRead, markRead, saveNote, deleteNote, importBackup, clearAll,
    }),
    [ready, settings, theme, saved, readSet, notes, visits, toast, notify, copy, setSettings, savedKeys, toggleEntry, togglePassage, toggleRead, markRead, saveNote, deleteNote, importBackup, clearAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
