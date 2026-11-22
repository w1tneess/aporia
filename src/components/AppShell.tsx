"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BASE_PATH, REPO_URL, archive, dispatch } from "@/lib/data";
import { AppProvider, useApp } from "@/lib/store";
import MobileTabBar from "./MobileTabBar";
import ShortcutsDialog from "./ShortcutsDialog";
import Toast from "./Toast";
import TopBar from "./TopBar";

const GO: Record<string, string> = { t: "/", a: "/archive", l: "/library", n: "/notebook", s: "/saved", ",": "/settings", h: "/guide" };

function syncLabel(iso: string, now: number | null): string {
  if (now === null) return `Synced ${iso.slice(0, 10)}`;
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (mins < 2) return "Synced just now";
  if (mins < 60) return `Synced ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return hours < 48 ? `Synced ${hours} h ago` : `Synced ${Math.floor(hours / 24)} days ago`;
}

function countdown(nextIso: string, now: number | null): string {
  if (now === null) return `Next edition ${nextIso.slice(0, 10)}, 05:30 IST`;
  const mins = Math.ceil((Date.parse(nextIso) - now) / 60000);
  if (mins <= 0) return "A new edition is due now. Reload to check.";
  return `Next edition in ${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function Shell({ children }: { children: ReactNode }) {
  const app = useApp();
  const router = useRouter();
  const pathname = (usePathname() || "/").replace(/(.)\/$/, "$1");
  const [scrolled, setScrolled] = useState(false);
  const [help, setHelp] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const gPressed = useRef(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Two-key "g then letter" navigation, like Gmail. Never fires while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable) return;
      if (e.key === "?") return setHelp((h) => !h);
      if (help) return;
      if (Date.now() - gPressed.current < 1000 && GO[e.key]) {
        gPressed.current = 0;
        router.push(GO[e.key]);
      } else if (e.key === "g") {
        gPressed.current = Date.now();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [help, router]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopBar
        edition={dispatch.edition}
        syncLabel={syncLabel(dispatch.updated_at_utc, now)}
        pathname={pathname}
        scrolled={scrolled}
        theme={app.theme}
        counts={{ "/archive": archive.length, "/notebook": app.notes.length, "/saved": app.saved.length }}
        onToggleTheme={() => app.setSettings({ theme: app.theme === "dark" ? "light" : "dark" })}
      />
      <main id="main" className="wrap">
        {children}
        <footer className="footer">
          <span>{countdown(dispatch.next_update_utc, now)}. Rebuilt each morning from plain JSON.</span>
          <span className="footer-links">
            <Link href="/guide">How it works</Link>
            <a href={`${BASE_PATH}/feed.xml`}>Atom feed</a>
            <button type="button" className="linklike" onClick={() => setHelp(true)}>Shortcuts</button>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source<span className="sr-only"> (opens in a new tab)</span></a>
          </span>
        </footer>
      </main>
      <MobileTabBar pathname={pathname} />
      <ShortcutsDialog open={help} onClose={() => setHelp(false)} />
      <Toast message={app.toast} />
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}
