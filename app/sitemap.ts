import type { MetadataRoute } from "next";
import { getProducts } from "../lib/catalog";
import { getArticles } from "../lib/articles";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles] = await Promise.all([getProducts(), getArticles()]);
  const fixed = ["", "/products", "/custom-lighting", "/about", "/contact", "/blog"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.8 }));
  return [...fixed, ...products.filter((item) => item.status === "Published").map((item) => ({ url: `${base}/product/${item.id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 })), ...articles.filter((article) => article.status === "Published").map((article) => ({ url: `${base}/blog/${article.id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }))];
}
