import type { Metadata } from "next";
import NotebookView from "@/components/NotebookView";

export const metadata: Metadata = { title: "Notebook", description: "Write reflections on each passage's question." };

export default function Page() {
  return <NotebookView />;
}
