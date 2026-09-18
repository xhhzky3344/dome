"use client";
import { useEffect, useState } from "react";
export type QuoteItem = { id: string; name: string; nameZh?: string; model: string; image: string };
const key = "lumenhaus_quote_list";
export function readQuoteList(): QuoteItem[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is QuoteItem => !!item && typeof item.id === "string" && typeof item.name === "string" && typeof item.model === "string" && typeof item.image === "string");
  } catch { return []; }
}
export function writeQuoteList(items: QuoteItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("quote-list-change"));
}
export function useQuoteList() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readQuoteList());
    sync();
    window.addEventListener("quote-list-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("quote-list-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  return items;
}
