"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["g", "t"], label: "Go to Today" },
  { keys: ["g", "a"], label: "Go to Archive" },
  { keys: ["g", "l"], label: "Go to Library" },
  { keys: ["g", "n"], label: "Go to Notebook" },
  { keys: ["g", "s"], label: "Go to Saved" },
  { keys: ["g", ","], label: "Go to Settings" },
  { keys: ["g", "h"], label: "Go to How it works" },
  { keys: ["?"], label: "Show or hide this list" },
  { keys: ["Esc"], label: "Close a dialog" },
];

export function ShortcutList() {
  return (
    <dl className="shortcuts">
      {SHORTCUTS.map((s) => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>
            {s.keys.map((k, i) => (
              <span key={k}>
                {i > 0 && <span className="then"> then </span>}
                <kbd className="kbd">{k}</kbd>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  // Native <dialog> gives us focus trapping, Escape-to-close and focus restoration.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="shortcuts-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="modal-head">
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <button type="button" className="btn icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="modal-body">
        <ShortcutList />
      </div>
    </dialog>
  );
}
