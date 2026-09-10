"use client";

import { useEffect, useState } from "react";

export type Locale = "en" | "zh";
const storageKey = "lumenhaus_locale";
const changeEvent = "lumenhaus-locale-change";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const sync = () => setLocale(localStorage.getItem(storageKey) === "zh" ? "zh" : "en");
    sync(); window.addEventListener(changeEvent, sync); return () => window.removeEventListener(changeEvent, sync);
  }, []);
  const toggleLocale = () => {
    const next: Locale = locale === "en" ? "zh" : "en";
    localStorage.setItem(storageKey, next); setLocale(next); window.dispatchEvent(new Event(changeEvent));
  };
  return { locale, toggleLocale };
}

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();
  return <button className="language-toggle" onClick={toggleLocale} aria-label="Switch site language">{locale === "en" ? "中文" : "EN"}</button>;
}

export const categoryZh: Record<string, string> = { "Chandeliers": "吊灯", "Pendant Lights": "吊灯", "Wall Lamps": "壁灯", "Table Lamps": "台灯", "Floor Lamps": "落地灯", "Ceiling Lights": "吸顶灯", "All": "全部产品" };
