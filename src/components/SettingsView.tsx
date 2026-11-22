"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { BASE_PATH } from "@/lib/data";
import { downloadMarkdown } from "@/lib/markdown";
import { buildBackup, parseBackup } from "@/lib/storage";
import { useApp } from "@/lib/store";
import type { TextSize, ThemePref } from "@/types/dispatch";
import Segmented from "./Segmented";
import { ShortcutList } from "./ShortcutsDialog";

export default function SettingsView() {
  const app = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  function exportBackup() {
    const b = buildBackup({ settings: app.settings, saved: app.saved, read: [...app.readSet], notes: app.notes, visits: app.visits });
    downloadMarkdown(`aporia-backup-${b.exported_at.slice(0, 10)}.json`, JSON.stringify(b, null, 2), "application/json");
    app.notify("Backup downloaded");
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    const b = parseBackup(await file.text());
    if (!b) return app.notify("That file isn't an Aporia backup.");
    app.importBackup(b);
    app.notify(`Backup restored: ${b.saved.length} saved, ${b.notes.length} reflection${b.notes.length === 1 ? "" : "s"}`);
  }

  const stats = [
    { label: "Days visited", value: app.visits.length },
    { label: "Current streak", value: app.streak },
    { label: "Essays read", value: app.readSet.size },
    { label: "Saved", value: app.saved.length },
    { label: "Reflections", value: app.notes.length },
  ];

  return (
    <div className="stream">
      <header className="page-head">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Everything here is stored in this browser. Aporia has no accounts.</p>
      </header>

      <section className="block">
        <h2>Appearance</h2>
        <div className="setting">
          <span id="set-theme">Theme</span>
          <Segmented<ThemePref>
            label="Theme"
            value={app.settings.theme}
            onChange={(theme) => app.setSettings({ theme })}
            options={[
              { value: "system", label: "Match my device" },
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </div>
        <div className="setting">
          <span id="set-size">Text size</span>
          <Segmented<TextSize>
            label="Text size"
            value={app.settings.size}
            onChange={(size) => app.setSettings({ size })}
            options={[
              { value: "s", label: "Small" },
              { value: "m", label: "Default" },
              { value: "l", label: "Large" },
            ]}
          />
        </div>
        <div className="setting">
          <label className="switch">
            <input type="checkbox" checked={app.settings.compact} onChange={(e) => app.setSettings({ compact: e.target.checked })} />
            <span>Compact lists: hide excerpts and show only titles</span>
          </label>
        </div>
      </section>

      <section className="block">
        <h2>Your activity</h2>
        <dl className="figures five">
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="block">
        <h2>Your data</h2>
        <p className="block-note">
          Saved items, reflections and read marks live only in this browser. Download a backup to move them to another device or
          keep a copy.
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={exportBackup}>
            <Download size={16} strokeWidth={1.5} aria-hidden="true" /> Download backup
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} strokeWidth={1.5} aria-hidden="true" /> Restore from backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void importBackup(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          {confirmWipe ? (
            <>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  app.clearAll();
                  setConfirmWipe(false);
                  app.notify("All local data deleted");
                }}
              >
                Delete everything for good
              </button>
              <button type="button" className="btn btn-text" onClick={() => setConfirmWipe(false)}>
                Keep my data
              </button>
              <span className="hint">This removes saved items, reflections, read marks and settings, and can&rsquo;t be undone.</span>
            </>
          ) : (
            <button type="button" className="btn btn-text danger" onClick={() => setConfirmWipe(true)}>
              Delete all my data
            </button>
          )}
        </div>
      </section>

      <section className="block">
        <h2>Subscribe</h2>
        <p className="block-note">
          Read Aporia in any feed reader. Add the <a href={`${BASE_PATH}/feed.xml`}>Atom feed</a> and each morning&rsquo;s passage and
          essays arrive there.
        </p>
      </section>

      <section className="block">
        <h2>Keyboard shortcuts</h2>
        <ShortcutList />
      </section>
    </div>
  );
}
