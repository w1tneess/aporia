import type { Metadata } from "next";
import SettingsView from "@/components/SettingsView";

export const metadata: Metadata = { title: "Settings", description: "Theme, text size and your data." };

export default function Page() {
  return <SettingsView />;
}
