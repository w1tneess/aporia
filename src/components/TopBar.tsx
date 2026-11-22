import Link from "next/link";
import { Info, Moon, Settings, Sun } from "lucide-react";

export const NAV = [
  { href: "/", label: "Today" },
  { href: "/archive", label: "Archive" },
  { href: "/library", label: "Library" },
  { href: "/notebook", label: "Notebook" },
  { href: "/saved", label: "Saved" },
] as const;

interface Props {
  edition: number;
  syncLabel: string;
  pathname: string;
  scrolled: boolean;
  theme: "dark" | "light";
  counts: Partial<Record<string, number>>;
  onToggleTheme: () => void;
}

const ICON = { size: 18, strokeWidth: 1.5, "aria-hidden": true } as const;

export default function TopBar({ edition, syncLabel, pathname, scrolled, theme, counts, onToggleTheme }: Props) {
  return (
    <header className="topbar" data-scrolled={scrolled}>
      <div className="wrap topbar-inner">
        <Link href="/" className="brand">
          <svg className="brand-mark" width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 6.5a9.5 9.5 0 1 0 9.5 9.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="23.2" cy="8.8" r="1.9" fill="currentColor" />
          </svg>
          <span className="wordmark">Aporia</span>
          <span className="edition">No. {edition}</span>
        </Link>
        <nav className="nav" aria-label="Pages">
          {NAV.map((l) => {
            const count = counts[l.href];
            return (
              <Link key={l.href} href={l.href} className="nav-link" aria-current={pathname === l.href ? "page" : undefined}>
                {l.label}
                {count ? <span className="count">{count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="topbar-tools">
          <span className="sync">
            <span className="live-dot" aria-hidden="true" />
            {syncLabel}
          </span>
          <Link href="/guide" className="btn icon-btn tool-guide" aria-label="How it works" aria-current={pathname === "/guide" ? "page" : undefined}>
            <Info {...ICON} />
          </Link>
          <Link href="/settings" className="btn icon-btn" aria-label="Settings" aria-current={pathname === "/settings" ? "page" : undefined}>
            <Settings {...ICON} />
          </Link>
          <button type="button" className="btn icon-btn" onClick={onToggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
            {theme === "dark" ? <Sun {...ICON} /> : <Moon {...ICON} />}
          </button>
        </div>
      </div>
    </header>
  );
}
