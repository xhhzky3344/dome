"use client";

import { useLocale } from "./Locale";

export function CatalogueHero() {
  const { locale } = useLocale();
  return <section className="archive-hero">{locale === "zh" ? <><span className="eyebrow">完整产品目录</span><h1>有存在感的<br /><i>项目装饰照明。</i></h1><p>搜索所有已发布系列，按分类浏览，并查看为 B2B 采购准备的产品规格。</p></> : <><span className="eyebrow">COMPLETE PRODUCT DIRECTORY</span><h1>Decorative lighting<br /><i>for projects with presence.</i></h1><p>Search every published series, browse by category, and open model specifications built for B2B buyers.</p></>}</section>;
}
