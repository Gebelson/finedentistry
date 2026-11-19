import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  cmsPayload,
  asBlogArticle,
  type HomeContent as HomeData,
} from "@/lib/cms-content";
import { HomeContent } from "@/components/home-page";
import { ArticleContent, ArticleMeta } from "@/components/article-content";
import { PreviewRefresh } from "@/components/admin/preview-refresh";

export const metadata = {
  title: "Private content preview",
  robots: { index: false, follow: false },
};
export default async function WorkspacePreview({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; slug?: string }>;
}) {
  const payload = await cmsPayload();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user || !["admin", "editor"].includes(user.role))
    redirect("/admin/login");
  const { kind, slug } = await searchParams;
  let content;
  if (kind === "home") {
    const doc = await payload.findGlobal({
      slug: "home-page",
      draft: true,
      depth: 1,
      overrideAccess: false,
      user,
    });
    content = <HomeContent content={doc as unknown as HomeData} />;
  } else if (kind === "post" && slug) {
    const result = await payload.find({
      collection: "posts",
      where: { slug: { equals: slug } },
      draft: true,
      depth: 0,
      overrideAccess: false,
      user,
      limit: 1,
    });
    if (!result.docs[0]) notFound();
    const article = asBlogArticle(result.docs[0]);
    content = (
      <main id="main" className="wrap section">
        <div className="page-heading">
          <h1>{article.title}</h1>
        </div>
        <ArticleMeta article={article} />
        <article className="prose">
          <ArticleContent article={article} />
        </article>
      </main>
    );
  } else notFound();
  return (
    <>
      <div className="workspace-preview-note">
        Private draft preview · <Link href="/admin">Return to workspace</Link>
      </div>
      <PreviewRefresh />
      {content}
    </>
  );
}
