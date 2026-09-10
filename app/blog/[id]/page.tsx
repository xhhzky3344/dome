import { notFound } from "next/navigation";
import { getArticle } from "../../../lib/articles";
import { Footer, SiteNav } from "../../../components/SiteChrome";
import { ArticleContent } from "../../../components/ArticleContent";

export const dynamic = "force-dynamic";
export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) { const article = await getArticle((await params).id); if (!article) notFound(); return <main className="article-page"><SiteNav /><ArticleContent article={article} /><Footer /></main>; }
