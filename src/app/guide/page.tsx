import type { Metadata } from "next";
import GuideView from "@/components/GuideView";

export const metadata: Metadata = { title: "How it works", description: "How the daily dispatch is made, and how to fork it." };

export default function Page() {
  return <GuideView />;
}
