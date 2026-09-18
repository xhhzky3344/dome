"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle, categoryZh, useLocale } from "./Locale";
import { Icon } from "./Icon";
import { useQuoteList } from "./quote-store";
import { productName } from "../lib/product-copy";
import type { CatalogProduct } from "../lib/catalog";
import type { SiteSettings } from "../lib/settings";

const navigation = [
  ["/products", "Products", "产品目录"], ["/products#catalogue-results", "Categories", "分类浏览"], ["/custom-lighting", "Custom lighting", "定制灯具"],
  ["/about", "About", "关于我们"], ["/contact", "Contact", "联系咨询"],
] as const;

function NavigationPending({ zh }: { zh: boolean }) {
  const { pending } = useLinkStatus();
  return <span role="status" data-navigation-pending={pending} className="navigation-pending">{pending ? (zh ? "正在加载…" : "Loading…") : ""}</span>;
}

export function SiteNav() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogProduct[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const { locale } = useLocale(); const zh = locale === "zh";
  const quote = useQuoteList();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!search || items !== null) return;
    const controller = new AbortController();
    setFailed(false);
    fetch("/api/products", { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => { if (!Array.isArray(data)) throw new Error(); setItems(data); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [search, items, retry]);
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (data) setSiteSettings(data as SiteSettings); }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!search) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [search]);
  const matches = useMemo(() => (items || []).filter(item => item.status === "Published" && `${item.name} ${item.nameZh || ""} ${item.model} ${item.category} ${categoryZh[item.category] || ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6), [items, query]);
  const close = () => { setMenu(false); setSearch(false); };
  // The admin currently exposes one editable website-name field, so use it for
  // both locales. The Chinese value remains a fallback for older records.
  const configuredName = siteSettings?.companyName?.trim();
  const brandName = configuredName && configuredName !== "Lumenhaus Lighting Studio" ? configuredName : (zh ? "Lumenhaus 灯饰工作室" : "LUMENHAUS");
  const showTagline = brandName === "LUMENHAUS" || brandName === "Lumenhaus";
  return <>
    <header className="site-nav">
      <Link className="brand" href="/"><i /> {brandName}{showTagline && <small>LIGHTING STUDIO</small>}</Link>
      <nav id="primary-nav" aria-label={zh ? "采购导航" : "Procurement navigation"} className={menu ? "open" : ""}>{navigation.map(([href, en, cn]) => <Link onClick={close} href={href} key={href}>{zh ? cn : en}<NavigationPending zh={zh} /></Link>)}</nav>
      <div className="nav-actions">
        <LanguageToggle />
        <button className="nav-search" aria-label={zh ? "搜索产品" : "Search products"} onClick={() => { setSearch(true); setMenu(false); }}><Icon name="search" /></button>
        <Link className="quote-button" href="/quote-list">{zh ? "查看报价" : "View quote"}<span className="quote-count">{quote.length}</span></Link>
        <button className="nav-menu" aria-label={zh ? (menu ? "关闭菜单" : "打开菜单") : (menu ? "Close menu" : "Open menu")} aria-expanded={menu} aria-controls="primary-nav" onClick={() => setMenu(!menu)}><Icon name={menu ? "close" : "menu"} /></button>
      </div>
    </header>
    {search && <dialog className="search-drawer" ref={dialog} onCancel={close} aria-label={zh ? "搜索产品" : "Search products"}>
      <button className="icon-button" aria-label={zh ? "关闭搜索" : "Close search"} onClick={close}><Icon name="close" /></button>
      <label htmlFor="site-search" className="eyebrow">{zh ? "搜索产品" : "SEARCH PRODUCTS"}</label>
      <input id="site-search" autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={zh ? "输入型号、名称或分类" : "Model, name or category"} />
      {failed ? <div role="alert"><p>{zh ? "产品加载失败，请重试。" : "Products couldn't be loaded. Please retry."}</p><button className="gold" onClick={() => setRetry(value => value + 1)}>{zh ? "重新加载" : "Retry"}</button></div> : items === null ? <p role="status">{zh ? "正在加载产品…" : "Loading products…"}</p> : query.trim() && <div className="search-results">{matches.length ? matches.map(item => <Link onClick={close} href={`/product/${item.id}`} key={item.id}><img loading="lazy" decoding="async" src={item.image} alt="" /><div><small>{zh ? categoryZh[item.category] || item.category : item.category} · {item.model}</small><b>{productName(item, locale)}</b></div><Icon name="arrow" /></Link>) : <p role="status">{zh ? "没有找到匹配产品。" : "No matching products."}</p>}</div>}
      <p className="search-hint">{zh ? "支持中英文名称和型号搜索。" : "Search by English or Chinese name, or model number."}</p>
    </dialog>}
  </>;
}
export function Footer() { const { locale } = useLocale(); const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null); useEffect(() => { fetch("/api/settings", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (data) setSiteSettings(data as SiteSettings); }).catch(() => undefined); }, []); const zh = locale === "zh"; const configuredName = siteSettings?.companyName?.trim(); const brandName = configuredName && configuredName !== "Lumenhaus Lighting Studio" ? configuredName : (zh ? "Lumenhaus 灯饰工作室" : "LUMENHAUS"); const showTagline = brandName === "LUMENHAUS" || brandName === "Lumenhaus"; const copyrightName = siteSettings?.companyName || "Lumenhaus"; const links = [["Facebook", siteSettings?.facebookUrl], ["WhatsApp", siteSettings?.whatsappUrl], ["Instagram", siteSettings?.instagramUrl], ["LinkedIn", siteSettings?.linkedinUrl]].filter((item): item is [string, string] => Boolean(item[1])); return <footer><div className="footer-main"><Link className="brand" href="/"><i /> {brandName}{showTagline && <small>LIGHTING STUDIO</small>}</Link><p>{zh ? "原创演示体验 · 与参考网站无关联。" : "Original demonstration experience · Not affiliated with any reference website."}</p></div><div className="footer-contact"><span>{zh ? "联系我们" : "Contact"}</span>{siteSettings?.email && <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>}{siteSettings?.phone && <a href={`tel:${siteSettings.phone}`}>{siteSettings.phone}</a>}</div>{links.length > 0 && <div className="footer-social"><span>{zh ? "海外交流平台" : "Connect"}</span>{links.map(([label, href]) => <a href={href} target="_blank" rel="noreferrer" key={label}>{label} ↗</a>)}</div>}<div className="footer-contact"><Link href="/information">FAQ · 配送与空间案例</Link><Link href="/orders">Demo order · 演示订单</Link><Link href="/admin">Admin · 管理后台</Link></div><span className="footer-copy">© 2026 {copyrightName}</span></footer>; }
