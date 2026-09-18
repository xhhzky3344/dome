"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryZh, useLocale } from "./Locale";
import { Icon } from "./Icon";
import { productName, productDescription } from "../lib/product-copy";
import type { CatalogProduct } from "../lib/catalog";

const pageSize = 6;
export function ProductArchive({ products }: { products: CatalogProduct[] }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const categories = ["All", ...new Set(products.map(item => item.category))];
  const categoryCount = (item: string) => item === "All" ? products.length : products.filter(product => product.category === item).length;
  const matches = useMemo(() => products.filter(item => (category === "All" || item.category === category) && `${item.name} ${item.nameZh || ""} ${item.model} ${item.category} ${categoryZh[item.category] || ""} ${item.description} ${item.descriptionZh || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [products, category, query]);
  const total = Math.ceil(matches.length / pageSize);
  const current = Math.min(page, Math.max(total, 1));
  const visible = matches.slice((current - 1) * pageSize, current * pageSize);
  const reset = () => { setCategory("All"); setQuery(""); setPage(1); };
  function navigate(next: number) {
    setPage(next);
    document.getElementById("catalogue-results")?.scrollIntoView({ block: "start" });
  }
  return <>
    <section className="archive-toolbar interactive" aria-label={zh ? "筛选产品目录" : "Filter product catalogue"}>
      <label className="mobile-category">{zh ? "按分类浏览" : "Browse by category"}
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          {categories.map(item => <option key={item} value={item}>{zh ? (item === "All" ? "全部产品" : categoryZh[item] || item) : (item === "All" ? "All products" : item)} ({categoryCount(item)})</option>)}
        </select>
      </label>
      <div className="archive-tabs" role="group" aria-label={zh ? "产品分类" : "Product categories"}>{categories.map(item => <button key={item} aria-pressed={category === item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setPage(1); }}>{zh ? (item === "All" ? "全部" : categoryZh[item] || item) : (item === "All" ? "All" : item)}<small>{categoryCount(item)}</small></button>)}</div>
      <label className="archive-search"><Icon name="search" /><input aria-label={zh ? "搜索型号、产品名称或分类" : "Search model, product name or category"} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder={zh ? "搜索型号、名称或分类" : "Search model, name or category"} /></label>
    </section>
    <section className="archive-live" id="catalogue-results">
      <div><span className="eyebrow">{zh ? "项目采购目录" : "PROJECT SOURCING CATALOGUE"}</span><h2>{category === "All" ? (zh ? "全部产品" : "All products") : (zh ? categoryZh[category] || category : category)}</h2></div>
      <p role="status" aria-live="polite">{zh ? `${matches.length} 件产品 · 显示 ${matches.length ? (current - 1) * pageSize + 1 : 0}–${Math.min(current * pageSize, matches.length)} 件` : `${matches.length} products · Showing ${matches.length ? (current - 1) * pageSize + 1 : 0}–${Math.min(current * pageSize, matches.length)}`}</p>
    </section>
    <section className="archive-results">
      <div className="archive-grid">{visible.map(item => <Link className="archive-card" href={`/product/${item.id}`} key={item.id} aria-label={`${productName(item, locale)} · ${item.model}`}><div><img loading="lazy" src={item.image} alt={productName(item, locale)} /><span>{zh ? "查看产品" : "View product"}</span></div><small>{zh ? categoryZh[item.category] || item.category : item.category} · {item.model}</small><h3>{productName(item, locale)}</h3><p>{productDescription(item, locale)}</p></Link>)}</div>
      {!matches.length && <div className="no-results"><h2>{zh ? "没有找到匹配产品" : "No matching products"}</h2><p>{zh ? "换一个关键词，或清除筛选后继续浏览。" : "Try another keyword or clear your filters."}</p><button className="gold" onClick={reset}>{zh ? "清除筛选" : "Clear filters"}</button></div>}
      {total > 1 && <nav className="catalog-pagination" aria-label={zh ? "产品分页" : "Product pages"}>
        <button disabled={current === 1} onClick={() => navigate(current - 1)}>{zh ? "上一页" : "Previous"}</button>
        <span aria-live="polite">{zh ? `第 ${current} / ${total} 页` : `Page ${current} of ${total}`}</span>
        <button disabled={current === total} onClick={() => navigate(current + 1)}>{zh ? "下一页" : "Next"}</button>
      </nav>}
    </section>
  </>;
}
