"use client";

import Link from "next/link";
import { useLocale } from "./Locale";

type Article = { id: string; title: string; titleZh?: string; category: string; excerpt: string; published: string; author: string };
const categories: Record<string, string> = { "Lighting Buying Guides": "灯具采购指南", "Custom Lighting": "定制灯具", "Hotel & Project Lighting": "酒店与项目照明" };

export function BlogContent({ articles }: { articles: Article[] }) {
  const { locale } = useLocale(); const chinese = locale === "zh"; const cats = [...new Set(articles.map((article) => article.category))];
  return <><section className="archive-hero"><span className="eyebrow">{chinese ? "LUMENHAUS 行业资讯" : "LUMENHAUS JOURNAL"}</span><h1>{chinese ? <>让采购决策<br /><i>更清晰的灯光知识。</i></> : <>Lighting knowledge<br />for <i>better decisions.</i></>}</h1><p>{chinese ? "为采购装饰灯具的经销商、设计师、承包商和项目买家提供实用参考。" : "Practical guides for distributors, designers, contractors and project buyers sourcing decorative lighting."}</p></section><section className="blog-cats">{cats.map((category, index) => <a href={`#${category.replaceAll(" ", "-")}`} key={category}><b>{String(index + 1).padStart(2, "0")}</b>{chinese ? categories[category] || category : category}<span>{articles.filter((article) => article.category === category).length} {chinese ? "篇文章" : "article"}</span></a>)}</section><section className="article-grid">{articles.map((article) => <Link href={`/blog/${article.id}`} key={article.id}><div><span>{chinese ? categories[article.category] || article.category : article.category}</span><b>{article.id.slice(0, 2).toUpperCase()}</b></div><small>{article.published} · {article.author}</small><h2>{chinese ? article.titleZh || article.title : article.title}</h2><p>{article.excerpt}</p><em>{chinese ? "阅读文章 ↗" : "Read article ↗"}</em></Link>)}</section></>;
}
