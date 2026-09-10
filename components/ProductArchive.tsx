"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryZh, useLocale } from "./Locale";

type Product = { id: string; name: string; model: string; category: string; price: string; description: string; image: string; status: string };
export function ProductArchive({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("All"); const [query, setQuery] = useState(""); const { locale } = useLocale();
  const categories = ["All", ...Array.from(new Set(products.map((item) => item.category)))];
  const visible = useMemo(() => products.filter((product) => (category === "All" || product.category === category) && `${product.name} ${product.model}`.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const chinese = locale === "zh";
  const title = category === "All" ? (chinese ? "全部已发布产品" : "Every published piece.") : (chinese ? categoryZh[category] || category : category);
  return <><section className="archive-toolbar interactive"><div className="archive-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{chinese ? categoryZh[item] || item : item}<small>{item === "All" ? products.length : products.filter((product) => product.category === item).length}</small></button>)}</div><label className="archive-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={chinese ? "搜索型号或产品名称" : "Search model or product name"} /></label></section><section className="archive-live"><div><span className="eyebrow">{chinese ? "实时产品目录" : "LIVE PRODUCT DIRECTORY"}</span><h2>{title}</h2></div><p>{chinese ? `${visible.length} 件产品可查看` : `${visible.length} product${visible.length === 1 ? "" : "s"} available`}</p></section><section className="archive-results"><div className="archive-grid">{visible.map((item) => <Link className="archive-card" href={`/product/${item.id}`} key={item.id}><div><img src={item.image} alt={item.name} /><span>{chinese ? "查看产品参数 ↗" : "Open specifications ↗"}</span></div><small>{chinese ? categoryZh[item.category] || item.category : item.category} · {item.model}</small><h3>{item.name}</h3><p>{item.description}</p></Link>)}</div>{visible.length === 0 && <div className="no-results"><b>⌕</b><h2>{chinese ? "未找到匹配产品。" : "No products match this search."}</h2><p>{chinese ? "请尝试其他型号，或移除分类筛选。" : "Try a different model number or remove the category filter."}</p><button onClick={() => { setCategory("All"); setQuery(""); }}>{chinese ? "清除搜索" : "Clear search"}</button></div>}</section></>;
}
