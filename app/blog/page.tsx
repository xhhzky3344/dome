import { getArticles } from "../../lib/articles";
import { Footer, SiteNav } from "../../components/SiteChrome";
import { BlogContent } from "../../components/BlogContent";

export const dynamic = "force-dynamic";
export default async function Blog() { const articles = await getArticles(); return <main className="blog"><SiteNav /><BlogContent articles={articles} /><Footer /></main>; }
