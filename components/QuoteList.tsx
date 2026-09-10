"use client";

import { useEffect, useState } from "react";
import { LanguageToggle, useLocale } from "./Locale";

type Item = { id: string; name: string; model: string; image: string };
const key = "lumenhaus_quote_list";
export function AddToQuote({ item }: { item: Item }) {
  const [added, setAdded] = useState(false); const { locale } = useLocale();
  useEffect(() => { const list = JSON.parse(localStorage.getItem(key) || "[]") as Item[]; setAdded(list.some((entry) => entry.id === item.id)); }, [item.id]);
  function add() { const list = JSON.parse(localStorage.getItem(key) || "[]") as Item[]; if (!list.some((entry) => entry.id === item.id)) { localStorage.setItem(key, JSON.stringify([...list, item])); window.dispatchEvent(new Event("quote-list-change")); } setAdded(true); }
  return <button className="quote-add" onClick={add}>{added ? (locale === "zh" ? "已加入报价单 ✓" : "Added to quote list ✓") : (locale === "zh" ? "加入报价单 +" : "Add to quote list +")}</button>;
}

export function QuoteList() {
  const [list, setList] = useState<Item[]>([]); const { locale } = useLocale(); const chinese = locale === "zh";
  useEffect(() => { const load = () => setList(JSON.parse(localStorage.getItem(key) || "[]")); load(); window.addEventListener("quote-list-change", load); return () => window.removeEventListener("quote-list-change", load); }, []);
  function remove(id: string) { const next = list.filter((item) => item.id !== id); localStorage.setItem(key, JSON.stringify(next)); setList(next); }
  return <main className="quote-list-page"><header className="site-nav"><a className="brand" href="/"><i /> LUMENHAUS<small>LIGHTING STUDIO</small></a><div className="nav-actions"><LanguageToggle /><a className="quote-button" href="/products">{chinese ? "继续浏览" : "Continue browsing"}</a></div></header><section><span className="eyebrow">{chinese ? "批发报价单" : "WHOLESALE QUOTE LIST"}</span><h1>{chinese ? <>已选<br /><i>灯具型号。</i></> : <>Your selected<br /><i>lighting models.</i></>}</h1><p>{chinese ? "核对您想讨论的产品，然后将型号清单发送给项目团队。" : "Review the products you want to discuss, then send the list to the project team."}</p>{list.length ? <><div className="quote-items">{list.map((item) => <article key={item.id}><img src={item.image} alt="" /><div><small>{item.model}</small><h2>{item.name}</h2></div><button onClick={() => remove(item.id)}>{chinese ? "移除" : "Remove"}</button></article>)}</div><a className="gold" href={`/contact?models=${encodeURIComponent(list.map((item) => item.model).join(", "))}`}>{chinese ? `为 ${list.length} 个型号获取报价 ↗` : `Request quote for ${list.length} model${list.length === 1 ? "" : "s"} ↗`}</a></> : <div className="quote-empty"><b>◇</b><h2>{chinese ? "报价单为空。" : "Your quote list is empty."}</h2><p>{chinese ? "浏览产品目录，并将想了解的产品加入报价单。" : "Browse the catalogue and add products you would like to discuss."}</p><a className="gold" href="/products">{chinese ? "浏览产品" : "Explore products"}</a></div>}</section></main>;
}
