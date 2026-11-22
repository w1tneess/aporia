import type { Metadata } from "next";
import SavedView from "@/components/SavedView";

export const metadata: Metadata = { title: "Saved", description: "Passages and essays you kept." };

export default function Page() {
  return <SavedView />;
}
