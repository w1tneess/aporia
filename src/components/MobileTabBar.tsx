import Link from "next/link";
import { Archive, Bookmark, Library, Newspaper, NotebookPen } from "lucide-react";

const TABS = [
  { href: "/", label: "Today", Icon: Newspaper },
  { href: "/archive", label: "Archive", Icon: Archive },
  { href: "/library", label: "Library", Icon: Library },
  { href: "/notebook", label: "Notebook", Icon: NotebookPen },
  { href: "/saved", label: "Saved", Icon: Bookmark },
] as const;

export default function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="mobile-tabs" aria-label="Pages">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="mobile-tab" aria-current={pathname === href ? "page" : undefined}>
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
