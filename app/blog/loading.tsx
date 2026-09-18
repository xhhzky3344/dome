"use client";

import { Footer, SiteNav } from "../../components/SiteChrome";
import { useLocale } from "../../components/Locale";

export default function Loading() {
  const { locale } = useLocale();
  return <main className="blog" data-route-loading="true">
    <SiteNav />
    <section className="archive-hero" aria-busy="true">
      <span className="eyebrow">LUMENHAUS JOURNAL</span>
      <p role="status">{locale === "zh" ? "正在加载资讯…" : "Loading journal…"}</p>
    </section>
    <Footer />
  </main>;
}
