"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "./Locale";
import { SiteNav } from "./SiteChrome";
import { Icon } from "./Icon";
import { productName } from "../lib/product-copy";
import { readQuoteList, writeQuoteList, useQuoteList, type QuoteItem } from "./quote-store";

export function AddToQuote({ item }: { item: QuoteItem }) {
  const list = useQuoteList(); const { locale } = useLocale(); const zh = locale === "zh";
  const added = list.some(entry => entry.id === item.id);
  const [failed, setFailed] = useState(false);
  function add() {
    try { const current = readQuoteList(); if (!current.some(entry => entry.id === item.id)) writeQuoteList([...current, item]); setFailed(false); } catch { setFailed(true); }
  }
  return <div className="quote-add-group"><button className="quote-add" onClick={add} disabled={added}>{added && <Icon name="check" />}{added ? (zh ? "已加入报价单" : "Added to quote list") : (zh ? "加入报价单" : "Add to quote list")}</button>{failed && <p role="alert">{zh ? "无法保存报价单，请允许浏览器存储或直接咨询。" : "Couldn't save your list. Enable browser storage or contact us directly."}</p>}</div>;
}
export function QuoteList() {
  const list = useQuoteList(); const { locale } = useLocale(); const zh = locale === "zh";
  const [catalog, setCatalog] = useState<QuoteItem[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products", { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { if (Array.isArray(data)) setCatalog(data); }).catch(() => {});
    return () => controller.abort();
  }, []);
  function remove(id: string) { try { writeQuoteList(readQuoteList().filter(item => item.id !== id)); setFailed(false); } catch { setFailed(true); } }
  return <main className="quote-list-page"><SiteNav /><section>
    <span className="eyebrow">{zh ? "批发报价单" : "WHOLESALE QUOTE LIST"}</span>
    <h1>{zh ? "已选灯具型号" : "Your selected lighting"}</h1>
    <p>{zh ? "核对产品型号后，一次发送采购需求。" : "Review your models and send your requirements in one inquiry."}</p>
    {failed && <p role="alert">{zh ? "无法更新报价单，请检查浏览器存储权限。" : "Couldn't update your list. Check browser storage permissions."}</p>}
    {list.length ? <><div className="quote-items">{list.map(item => { const current = catalog.find(p => p.id === item.id) || item; return <article key={item.id}><img loading="lazy" decoding="async" src={current.image} alt={productName(current, locale)} /><div><small>{item.model}</small><h2><Link href={`/product/${item.id}`}>{productName(current, locale)}</Link></h2></div><button onClick={() => remove(item.id)} aria-label={zh ? `移除 ${productName(current, locale)}` : `Remove ${productName(current, locale)}`}>{zh ? "移除" : "Remove"}</button></article>; })}</div><Link className="gold" href={`/contact?models=${encodeURIComponent(list.map(item => item.model).join(", "))}#inquiry`}>{zh ? `为 ${list.length} 个型号获取报价` : `Request quote for ${list.length} models`}</Link><Link className="continue-browsing" href="/products">{zh ? "继续浏览产品" : "Continue browsing"}</Link></> : <div className="quote-empty"><h2>{zh ? "还没有选择产品" : "No products selected yet"}</h2><p>{zh ? "浏览目录，把感兴趣的型号加入报价单；也可以直接告诉我们您的需求。" : "Add models from the catalogue, or tell us directly what you need."}</p><div className="empty-actions"><Link className="gold" href="/products">{zh ? "浏览产品" : "Explore products"}</Link><Link className="outline" href="/contact#inquiry">{zh ? "直接咨询" : "Contact us"}</Link></div></div>}
  </section></main>;
}
