"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { InquiryForm } from "./InquiryForm";
import { productPrice } from "../lib/product-copy";
import type { HeroSlide } from "../lib/settings";
import { categoryZh, useLocale } from "./Locale";

type Product = {
  id: string;
  name: string;
  nameZh?: string;
  model: string;
  category: string;
  price: string;
  description: string;
  descriptionZh?: string;
  image: string;
  featured: boolean;
};

const fallbackSlide: HeroSlide = {
  id: "fallback",
  image: "/images/lumenhaus-panorama-hero-v2.webp",
  eyebrow: "DECORATIVE LIGHTING · WHOLESALE & PROJECTS",
  eyebrowZh: "装饰灯具 · 批发与工程项目",
  title: "A considered range\nfor spaces that\nneed character.",
  titleZh: "一套有分寸的灯具，\n为真正的空间项目\n而设计。",
  description: "Decorative lighting with clear specifications, repeatable finishes and project-ready support.",
  descriptionZh: "清晰规格、稳定工艺与项目支持，让装饰灯具更容易被选型、采购与落地。",
  primaryLabel: "Browse product series",
  primaryLabelZh: "浏览产品系列",
  primaryHref: "/products",
  secondaryLabel: "Request a quote",
  secondaryLabelZh: "获取项目报价",
  secondaryHref: "/contact",
  published: true,
};

export function HomeContent({ products, slides }: { products: Product[]; slides: HeroSlide[] }) {
  const { locale } = useLocale();
  const chinese = locale === "zh";
  const [filter, setFilter] = useState("All");
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const heroSlides = slides.length ? slides : [fallbackSlide];
  const featured = products.slice(0, 8);
  const categories = [
    "All",
    ...Array.from(new Set(featured.map((product) => product.category))),
  ];
  const visible = useMemo(
    () =>
      featured.filter(
        (product) => filter === "All" || product.category === filter,
      ),
    [featured, filter],
  );
  const name = (product: Product) =>
    chinese ? product.nameZh || product.name : product.name;
  const currentSlide = heroSlides[slideIndex] || heroSlides[0];
  const selectSlide = (index: number) => setSlideIndex((index + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    if (slideIndex >= heroSlides.length) setSlideIndex(0);
  }, [heroSlides.length, slideIndex]);

  useEffect(() => {
    if (paused || heroSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, paused]);

  const copy = chinese
    ? {
        eyebrow: "装饰灯具 · 批发与工程项目",
        hero: (
          <>
            一套有分寸的灯具，
            <br />
            为真正的空间项目
            <br />
            <i>而设计。</i>
          </>
        ),
        lead: "清晰规格、稳定工艺与项目支持，让装饰灯具更容易被选型、采购与落地。",
        explore: "浏览产品系列",
        start: "获取项目报价",
        supply: "批发供货",
        supplyText: "面向设计师、零售商与承包商，提供清晰的型号与价格信息。",
        bespoke: "尺寸与表面",
        bespokeText: "根据空间和数量调整尺寸、材质与表面处理。",
        guidance: "项目配合",
        guidanceText: "从选型、打样到包装发运，保持沟通清晰。",
        factory: "稳定交付",
        factoryText: "以可重复的工艺和出口包装支持持续采购。",
        collection: "产品系列 · 06 个精选型号",
        pieces: "先从适合项目的系列开始。",
        catalog: "按灯具类型筛选，快速查看型号、价格与产品详情。",
        all: "全部",
        view: "查看产品",
        custom: "项目定制服务",
        customTitle: (
          <>
            从一个项目需求，到
            <br />
            <i>可执行的灯具规格。</i>
          </>
        ),
        customText:
          "提供参考图、平面图或材质方向，我们协助把想法整理成适合打样、量产与安装的规格。",
        inquiry: "项目询盘",
        tell: (
          <>
            告诉我们，你想
            <br />
            <i>点亮什么。</i>
          </>
        ),
        name: "姓名",
        email: "工作邮箱",
        company: "公司 / 项目",
        message: "型号、数量或项目需求",
        send: "发送询盘 ↗",
      }
    : {
        eyebrow: "DECORATIVE LIGHTING · WHOLESALE & PROJECTS",
        hero: (
          <>
            A considered range
            <br />
            for spaces that
            <br />
            <i>need character.</i>
          </>
        ),
        lead: "Decorative lighting with clear specifications, repeatable finishes and project-ready support.",
        explore: "Browse product series",
        start: "Request a quote",
        supply: "Wholesale supply",
        supplyText:
          "Clear model and price information for designers, retailers and contractors.",
        bespoke: "Scale & finish",
        bespokeText: "Dimensions, materials and finishes adapted to your project.",
        guidance: "Project support",
        guidanceText: "From selection and sampling through packing and dispatch.",
        factory: "Reliable delivery",
        factoryText:
          "Repeatable workmanship and export-ready packing for ongoing supply.",
        collection: "PRODUCT SERIES · 06 FEATURED MODELS",
        pieces: "Start with a focused range for real interiors.",
        catalog:
          "Filter by lighting type to compare models, starting prices and product details.",
        all: "All",
        view: "View piece",
        custom: "PROJECT CUSTOMIZATION",
        customTitle: (
          <>
            From a project brief to a<br />
            <i>production-ready specification.</i>
          </>
        ),
        customText:
          "Share a reference, plan or material direction. We help shape a specification suitable for sampling, repeatable production and installation.",
        inquiry: "PROJECT INQUIRY",
        tell: (
          <>
            Tell us what you’re
            <br />
            <i>bringing to light.</i>
          </>
        ),
        name: "Your name",
        email: "Work email",
        company: "Company / project",
        message: "Models, quantities or project requirements",
        send: "Send inquiry ↗",
      };
  return (
    <>
      <section className="hero" id="top" aria-roledescription="carousel" aria-label={chinese ? "首页产品精选" : "Homepage highlights"} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="hero-art" style={{ "--hero-image": `url("${currentSlide.image}")` } as CSSProperties} aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow">{chinese ? currentSlide.eyebrowZh : currentSlide.eyebrow}</span>
          <h1 className="hero-title">{chinese ? currentSlide.titleZh : currentSlide.title}</h1>
          <p>{chinese ? currentSlide.descriptionZh : currentSlide.description}</p>
          <div className="hero-actions">
            <Link className="gold" href={currentSlide.primaryHref}>
              {chinese ? currentSlide.primaryLabelZh : currentSlide.primaryLabel}
            </Link>
            <Link className="text-link" href={currentSlide.secondaryHref}>
              {chinese ? currentSlide.secondaryLabelZh : currentSlide.secondaryLabel} <b>↗</b>
            </Link>
          </div>
        </div>
        <div className="hero-carousel-controls" aria-label={chinese ? "轮播图控制" : "Carousel controls"}>
          <button type="button" className="hero-arrow" onClick={() => selectSlide(slideIndex - 1)} aria-label={chinese ? "上一张" : "Previous slide"}>←</button>
          <div className="hero-dots" role="tablist" aria-label={chinese ? "选择首屏" : "Select slide"}>
            {heroSlides.map((slide, index) => <button type="button" role="tab" key={slide.id} aria-selected={index === slideIndex} aria-label={chinese ? `第 ${index + 1} 张，共 ${heroSlides.length} 张` : `Slide ${index + 1} of ${heroSlides.length}`} className={index === slideIndex ? "active" : ""} onClick={() => selectSlide(index)}>{String(index + 1).padStart(2, "0")}</button>)}
          </div>
          <span className="hero-count" aria-live="polite">{String(slideIndex + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}</span>
          <button type="button" className="hero-pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? (chinese ? "继续自动轮播" : "Resume autoplay") : (chinese ? "暂停自动轮播" : "Pause autoplay")}>{paused ? "▶" : "Ⅱ"}</button>
          <button type="button" className="hero-arrow" onClick={() => selectSlide(slideIndex + 1)} aria-label={chinese ? "下一张" : "Next slide"}>→</button>
        </div>
      </section>
      <section className="benefits">
        {[
          ["01", copy.supply, copy.supplyText],
          ["02", copy.bespoke, copy.bespokeText],
          ["03", copy.guidance, copy.guidanceText],
          ["04", copy.factory, copy.factoryText],
        ].map(([number, title, text]) => (
          <article key={number}>
            <b>{number}</b>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="catalogue">
        <div className="section-heading">
          <span className="eyebrow">{copy.collection}</span>
          <h2>{copy.pieces}</h2>
          <p>{copy.catalog}</p>
        </div>
        <div className="filters">
          <div className="chips">
            {categories.map((category) => (
              <button
                onClick={() => setFilter(category)}
                className={filter === category ? "active" : ""}
                key={category}
              >
                {category === "All"
                  ? copy.all
                  : chinese
                    ? categoryZh[category] || category
                    : category}
              </button>
            ))}
          </div>
          <Link className="text-link" href="/products">
            {chinese ? "完整目录" : "Complete catalogue"} <b>↗</b>
          </Link>
        </div>
        <div className="grid">
          {visible.map((product) => (
            <Link
              className="product"
              href={`/product/${product.id}`}
              key={product.id}
            >
              <div className="photo">
                <img loading="lazy" decoding="async" src={product.image} alt={name(product)} />
                <span>{copy.view} ↗</span>
              </div>
              <p>
                {chinese
                  ? categoryZh[product.category] || product.category
                  : product.category}
              </p>
              <h3>{name(product)}</h3>
              <small>
                {product.model}
                <b>{productPrice(product.price, locale)}</b>
              </small>
            </Link>
          ))}
        </div>
      </section>
      <section className="custom">
        <div>
          <span className="eyebrow">{copy.custom}</span>
          <h2>{copy.customTitle}</h2>
        </div>
        <div>
          <p>{copy.customText}</p>
          <Link className="text-link" href="/custom-lighting">
            {chinese ? "了解定制开发" : "Explore custom development"} <b>↗</b>
          </Link>
        </div>
      </section>
      <section className="inquiry">
        <span className="eyebrow">{copy.inquiry}</span>
        <h2>{copy.tell}</h2>
        <InquiryForm />
      </section>
    </>
  );
}
