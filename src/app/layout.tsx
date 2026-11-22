import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Libre_Caslon_Display, Libre_Caslon_Text } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const display = Libre_Caslon_Display({ subsets: ["latin"], weight: "400", variable: "--font-caslon-display", display: "swap" });
const serif = Libre_Caslon_Text({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-caslon-text", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-hanken", display: "swap" });

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "Aporia — a philosophical dispatch", template: "%s — Aporia" },
  description:
    "A self-updating philosophical dispatch: one primary passage, one Socratic question and a distilled digest of new philosophy essays every morning.",
  icons: { icon: `${base}/favicon.svg` },
  alternates: { types: { "application/atom+xml": `${base}/feed.xml` } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#150B0F" },
    { media: "(prefers-color-scheme: light)", color: "#FBF3F4" },
  ],
};

// Runs before first paint so saved preferences never flash.
const antiFlash = `try{var s=JSON.parse(localStorage.getItem("aporia:settings:v1")||"{}"),d=document.documentElement,l=s.theme==="light"||(s.theme==="system"&&matchMedia("(prefers-color-scheme: light)").matches);d.dataset.theme=l?"light":"dark";d.dataset.size=s.size||"m";d.dataset.compact=s.compact?"true":"false"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-size="m" data-compact="false" className={`${display.variable} ${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlash }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
