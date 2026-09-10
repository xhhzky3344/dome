"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LanguageToggle, categoryZh, useLocale } from "./Locale";

type Item = { id: string; name: string; model: string; category: string; image: string; status: string };
const navigation = [
  ["/products", "All Products", "全部产品"], ["/custom-lighting", "Custom Lighting", "定制灯具"], ["/about", "About", "关于我们"], ["/blog", "Journal", "行业资讯"], ["/contact", "Contact", "联系我们"],
] as const;

export function SiteNav() {
  const [menu, setMenu] = useState(false); const [search, setSearch] = useState(false); const [query, setQuery] = useState(""); const [items, setItems] = useState<Item[]>([]);
  const { locale } = useLocale();
  useEffect(() => { if (search && items.length === 0) void fetch("/api/products").then((response) => response.json()).then(setItems); }, [search, items.length]);
  const matches = useMemo(() => items.filter((item) => item.status === "Published" && `${item.name} ${item.model} ${item.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [items, query]);
  const close = () => { setMenu(false); setSearch(false); };
  const copy = locale === "zh" ? { search: "搜索产品", query: "搜索型号、分类或产品名称", hint: "可输入型号、分类或产品名称。", noResults: "没有匹配的已发布产品。", quote: "获取报价" } : { search: "SEARCH DECORATIVE LIGHTING", query: "Search model, category or product name", hint: "Try a model number, a category, or a product name.", noResults: "No published product matches", quote: "Request quote" };
  return <><header className="site-nav"><Link className="brand" href="/"><i /> LUMENHAUS<small>LIGHTING STUDIO</small></Link><nav className={menu ? "open" : ""}>{navigation.map(([href, english, chinese]) => <Link onClick={close} href={href} key={href}>{locale === "zh" ? chinese : english}</Link>)}</nav><div className="nav-actions"><LanguageToggle /><button className="nav-search" aria-label="Search products" onClick={() => { setSearch(true); setMenu(false); }}>⌕</button><Link className="quote-button" href="/quote-list">{copy.quote}</Link><button className="nav-menu" aria-label="Toggle menu" onClick={() => setMenu(!menu)}>{menu ? "×" : "☰"}</button></div></header>{search && <div className="search-drawer"><button aria-label="Close search" onClick={close}>×</button><span className="eyebrow">{copy.search}</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.query} />{query && <div className="search-results">{matches.length ? matches.map((item) => <Link onClick={close} href={`/product/${item.id}`} key={item.id}><img src={item.image} alt="" /><div><small>{locale === "zh" ? categoryZh[item.category] || item.category : item.category} · {item.model}</small><b>{item.name}</b></div><span>↗</span></Link>) : <p>{copy.noResults} “{query}”.</p>}</div>}<p className="search-hint">{copy.hint}</p></div>}</>;
}

export function Footer() { const { locale } = useLocale(); return <footer><Link className="brand" href="/"><i /> LUMENHAUS<small>LIGHTING STUDIO</small></Link><p>{locale === "zh" ? "原创演示体验 · 与参考网站无关联。" : "Original demonstration experience · Not affiliated with any reference website."}</p><span>© 2026 Lumenhaus</span></footer>; }
