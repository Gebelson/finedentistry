import Link from "next/link";
import { pages } from "@/lib/content";
import { getJournal } from "@/lib/cms-content";
export const journalPosts = pages
  .filter((p) => p.slug.startsWith("blog/"))
  .toReversed();
export const journalPageCount = Math.ceil(journalPosts.length / 12);
export async function Journal({ page = 1 }: { page?: number }) {
  const posts = await getJournal();
  const pageCount = Math.max(1, Math.ceil(posts.length / 12));
  return (
    <>
      <div className="journal-grid">
        {posts.slice((page - 1) * 12, page * 12).map((p) => (
          <article key={p.slug}>
            <span className="muted">Fine Dentistry Journal</span>
            <h2>
              <Link href={"/" + p.slug}>{p.title}</Link>
            </h2>
            {p.authorLabel && (
              <span className="journal-byline">{p.authorLabel}</span>
            )}
            <p>{p.excerpt.slice(0, 180)}…</p>
            <Link className="text-link" href={"/" + p.slug}>
              Read article ↗
            </Link>
          </article>
        ))}
      </div>
      <nav className="pagination" aria-label="Journal pages">
        {page > 1 && (
          <Link
            className="button"
            href={page === 2 ? "/blog" : `/blog/page/${page - 1}`}
          >
            ← Previous
          </Link>
        )}
        <span>
          Page {page} of {pageCount}
        </span>
        {page < pageCount && (
          <Link className="button" href={`/blog/page/${page + 1}`}>
            Next →
          </Link>
        )}
      </nav>
    </>
  );
}
