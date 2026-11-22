import Link from "next/link";
import { BASE_PATH, REPO_URL, dispatch } from "@/lib/data";

export default function GuideView() {
  const s = dispatch.pipeline_stats;
  return (
    <div className="stream prose">
      <header className="page-head">
        <h1 className="page-title">How it works</h1>
        <p className="page-sub">
          Aporia keeps its data in Git. A scheduled GitHub Action reads philosophy feeds, commits plain JSON, and that commit
          rebuilds a fully static site. There is no server, database, tracking or paid API.
        </p>
      </header>

      <section className="block">
        <h2>Each morning at 05:30 IST</h2>
        <ol>
          <li>GitHub Actions fetches five feeds in parallel and skips any that haven&rsquo;t changed.</li>
          <li>The harvester strips the HTML, scores sentences and writes up to three takeaways per piece.</li>
          <li>New pieces join the archive, today&rsquo;s passage is chosen from the corpus, and the Atom feed is rewritten.</li>
          <li>The changed files are committed and the static site rebuilds with no runtime requests.</li>
        </ol>
      </section>

      <section className="block">
        <h2>Last run</h2>
        <dl className="figures">
          <div><dt>Edition</dt><dd>{dispatch.edition}</dd></div>
          <div><dt>Sources checked</dt><dd>{s.sources_checked}</dd></div>
          <div><dt>Pieces archived</dt><dd>{s.total_archived}</dd></div>
          <div><dt>Corpus passages</dt><dd>{s.corpus_count}</dd></div>
        </dl>
      </section>

      <section className="block">
        <h2>Using Aporia</h2>
        <ul>
          <li><strong>Today</strong> shows one passage, its question, and the newest essays. Choose Sit with a question to write a reflection.</li>
          <li><strong>Archive</strong> lists every collected piece by month. Filter by branch or source, or show only what you haven&rsquo;t read.</li>
          <li><strong>Library</strong> holds all {dispatch.pipeline_stats.corpus_count} passages. Browse by branch or thinker, or choose Surprise me.</li>
          <li><strong>Notebook</strong> collects your reflections. Export them as Markdown for your own notes.</li>
          <li><strong>Saved</strong> keeps passages and essays for later. Opening an essay marks it read; you can also mark it yourself.</li>
          <li><Link href="/settings">Settings</Link> has theme, text size, a compact list, and a backup you can restore on another device.</li>
        </ul>
      </section>

      <section className="block">
        <h2>Questions</h2>
        <h3>Where is my data kept?</h3>
        <p>
          In this browser&rsquo;s local storage, and nowhere else. Download a backup from <Link href="/settings">Settings</Link> before
          clearing site data or switching devices.
        </p>
        <h3>How do I follow Aporia in a feed reader?</h3>
        <p>
          Subscribe to the <a href={`${BASE_PATH}/feed.xml`}>Atom feed</a>. It carries the daily passage and the newest essays.
        </p>
        <h3>Where do the passages come from?</h3>
        <p>
          A curated corpus in <code>scripts/corpus_seed.json</code>, using public-domain translations where possible. Entries marked
          as paraphrase or attributed should be checked against a primary edition.
        </p>
      </section>

      <section className="block">
        <h2>Fork it in three steps</h2>
        <ol>
          <li>
            Fork <a href={REPO_URL} target="_blank" rel="noopener noreferrer">w1tneess/aporia<span className="sr-only"> (opens in a new tab)</span></a> on GitHub.
          </li>
          <li>
            In Settings, Actions, General, allow read and write permissions. Optionally add a <code>GEMINI_API_KEY</code> secret for
            sharper takeaways, and a <code>SITE_URL</code> variable so the feed points at your site.
          </li>
          <li>
            Import the repo into Vercel or Cloudflare Pages (build <code>npm run build</code>, output <code>out</code>), then run the
            workflow once from the Actions tab.
          </li>
        </ol>
      </section>
    </div>
  );
}
