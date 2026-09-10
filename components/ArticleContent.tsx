"use client";

import Link from "next/link";
import { useLocale } from "./Locale";

type Article = { id: string; title: string; titleZh?: string; category: string; excerpt: string; published: string; author: string };
const categories: Record<string, string> = { "Lighting Buying Guides": "灯具采购指南", "Custom Lighting": "定制灯具", "Hotel & Project Lighting": "酒店与项目照明" };
export function ArticleContent({ article }: { article: Article }) {
  const { locale } = useLocale(); const chinese = locale === "zh"; const category = chinese ? categories[article.category] || article.category : article.category;
  const paragraphs = chinese ? ["成功的装饰灯具采购，不在于收集更多图片，而在于确认能把想法变成可重复生产产品的实用信息。在索取报价前，请明确数量、使用场景、尺寸、材料方向和目标市场。", "当项目拥有清晰的技术简报时，工厂与项目团队能更早识别可能的限制，例如安装条件、包装要求、电气配置以及买方对工艺的预期。", "早期问题能保护项目进度。好的开发沟通应当让未知因素变得可见，而不是让它们演变为最后时刻的修改。"] : ["Successful decorative lighting sourcing is less about collecting more images and more about confirming the practical information that turns an idea into a repeatable product. Define the quantity, intended setting, dimensions, preferred material direction and target market before asking for a quotation.", "When a project has a clear technical brief, factories and project teams can identify likely constraints earlier: installation conditions, packing requirements, electrical configuration and the level of finish expected by the buyer.", "Early questions protect the project schedule. A good development conversation should make unknowns visible rather than allowing them to become last-minute changes."];
  return <article><Link className="back" href="/blog">{chinese ? "← 返回资讯" : "← Back to journal"}</Link><span className="eyebrow">{category}</span><h1>{chinese ? article.titleZh || article.title : article.title}</h1><p className="article-meta">{article.published} · {article.author} · {chinese ? "约 5 分钟阅读" : "5 min read"}</p><div className="article-image"><b>{article.id.slice(0, 2).toUpperCase()}</b></div><p className="lead">{article.excerpt}</p><h2>{chinese ? "先明确会影响决策的信息。" : "Start with the information that affects the decision."}</h2><p>{paragraphs[0]}</p><p>{paragraphs[1]}</p><h2>{chinese ? "为澄清预留空间。" : "Build in room for clarification."}</h2><p>{paragraphs[2]}</p><Link className="gold" href="/contact">{chinese ? "讨论灯具需求 ↗" : "Discuss a lighting requirement ↗"}</Link></article>;
}
