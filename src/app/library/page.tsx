import type { Metadata } from "next";
import LibraryView from "@/components/LibraryView";

export const metadata: Metadata = { title: "Library", description: "Browse every passage in the corpus by branch or thinker." };

export default function Page() {
  return <LibraryView />;
}
