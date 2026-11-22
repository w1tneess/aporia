import type { Dispatch, Entry, Note, Passage, SavedItem } from "@/types/dispatch";

const hashtag = (s: string) => "#" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function passageToMarkdown(p: Passage): string {
  return [`> "${p.quote}"`, `> — ${p.author}, *${p.work}* (${p.reference})`, "", hashtag(p.branch) + " #aporia"].join("\n");
}

export function entryToMarkdown(e: Entry): string {
  const tags = [...new Set(e.tags.map(hashtag))].join(" ");
  return [
    `> **[${e.title}](${e.url})**`,
    ...e.takeaways.map((t) => `> - ${t}`),
    ">",
    `> — ${e.source} · ${e.published_at} · ${e.read_time_min} min read`,
    "",
    tags,
  ].join("\n");
}

export const savedToMarkdown = (items: SavedItem[]): string =>
  [
    "# Aporia — Saved shelf",
    `_Exported ${new Date().toISOString().slice(0, 10)} · ${items.length} item${items.length === 1 ? "" : "s"}_`,
    ...items.map((i) => (i.kind === "passage" ? passageToMarkdown(i.passage) : entryToMarkdown(i.entry))),
  ].join("\n\n---\n\n");

export function noteToMarkdown(n: Note): string {
  return [
    `### ${n.passage.author}, *${n.passage.work}* (${n.passage.reference})`,
    `> "${n.passage.quote}"`,
    `**Question:** ${n.passage.inquiry_prompt}`,
    n.text,
    `_Written ${n.created_at.slice(0, 10)}, edition ${n.edition}_`,
  ].join("\n\n");
}

export const notebookToMarkdown = (notes: Note[]): string =>
  [
    "# Aporia — Notebook",
    `_Exported ${new Date().toISOString().slice(0, 10)} · ${notes.length} reflection${notes.length === 1 ? "" : "s"}_`,
    ...notes.map(noteToMarkdown),
  ].join("\n\n---\n\n");

export const editionToMarkdown = (d: Dispatch): string =>
  [
    `# Aporia — Edition ${d.edition}`,
    `_Updated ${d.updated_at_utc}_`,
    `## Primary passage\n\n${passageToMarkdown(d.primary_passage)}\n\n**Sit with this:** ${d.primary_passage.inquiry_prompt}`,
    `## Dispatch\n\n${d.entries.map(entryToMarkdown).join("\n\n---\n\n")}`,
  ].join("\n\n");

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts / denied permission.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function downloadMarkdown(filename: string, text: string, type = "text/markdown;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
