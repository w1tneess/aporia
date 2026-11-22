import type { Metadata } from "next";
import ArchiveView from "@/components/ArchiveView";

export const metadata: Metadata = { title: "Archive", description: "Every piece Aporia has collected, grouped by month." };

export default function Page() {
  return <ArchiveView />;
}
