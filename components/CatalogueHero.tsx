"use client";

import { useLocale } from "./Locale";

export function CatalogueHero() {
  const { locale } = useLocale();
  return <section className="archive-hero">{locale === "zh" ? <><span className="eyebrow">完整产品目录</span><h1>有存在感的<br /><i>项目装饰照明。</i></h1><p>搜索产品系列，按分类浏览，查看适合项目采购的灯具。</p></> : <><span className="eyebrow">COMPLETE PRODUCT DIRECTORY</span><h1>Decorative lighting{" "}<br /><i>for projects with presence.</i></h1><p>Browse by category or search a model to find lighting for your project.</p></>}</section>;
}
