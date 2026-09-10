"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
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
  eyebrow: "DECORATIVE LIGHTING · B2B PROJECT SUPPLY",
  eyebrowZh: "装饰灯具 · B2B 项目供应",
  title: "Aster glass pendants\nfor generous,\narchitectural interiors.",
  titleZh: "Aster 系列吊灯，\n为高挑空间\n而造。",
  description: "A sculptural glass pendant collection for hospitality and residential interiors.",
  descriptionZh: "为酒店、餐饮、别墅及商业空间提供装饰照明。",
  primaryLabel: "Explore all products",
  primaryLabelZh: "浏览全部产品",
  primaryHref: "/products",
  secondaryLabel: "Start a project",
  secondaryLabelZh: "发起项目",
  secondaryHref: "/contact",
  published: true,
};

export function HomeContent({ products, slides }: { products: Product[]; slides: HeroSlide[] }) {
  const { locale } = useLocale();
  const chinese = locale === "zh";
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const heroSlides = slides.length ? slides : [fallbackSlide];
  const featured = products.filter((product) => product.featured);
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
  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    setSending(true);
    setNotice("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (response.ok) {
        form.reset();
        setNotice(chinese ? "询盘已发送。" : "Inquiry sent.");
      } else
        setNotice(
          chinese
            ? "发送失败，请稍后重试。"
            : "Unable to send inquiry. Please try again.",
        );
    } catch {
      setNotice(
        chinese
          ? "网络连接失败，请稍后重试。"
          : "Network error. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }
  const copy = chinese
    ? {
        eyebrow: "装饰灯具 · B2B 项目供应",
        hero: (
          <>
            Aster 系列吊灯，
            <br />
            为高挑空间
            <br />
            <i>而造。</i>
          </>
        ),
        lead: "以雕塑感玻璃、精密金属结构和可扩展的尺寸方案，为酒店、餐饮、别墅及商业空间提供装饰照明。",
        explore: "浏览全部产品",
        start: "发起项目",
        supply: "批发供货",
        supplyText: "为设计师、零售商与承包商提供清晰的产品资料。",
        bespoke: "定制开发",
        bespokeText: "根据项目调整尺寸、表面工艺与结构。",
        guidance: "项目协同",
        guidanceText: "从项目简报到包装发运，全程协同。",
        factory: "工厂服务",
        factoryText: "清晰沟通、稳定品控与适配出口运输的包装方案。",
        collection: "精选产品系列",
        pieces: "安静，却自有存在感。",
        catalog: "按分类浏览原创产品系列，或进入完整目录查看规格。",
        all: "全部",
        view: "查看产品",
        custom: "灯具定制服务",
        customTitle: (
          <>
            从一个灵感火花，到
            <br />
            <i>完整的光影氛围。</i>
          </>
        ),
        customText:
          "提供参考图、平面图或材质方向，我们会协助完善适合量产和安装的规格。",
        story: "我们的观点",
        storyTitle: "为余晖而造。",
        storyText:
          "我们相信，装饰光应该留下痕迹：更温暖的迎接、更柔和的夜晚，以及一个值得抬头凝望的细节。",
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
        eyebrow: "DECORATIVE LIGHTING · B2B PROJECT SUPPLY",
        hero: (
          <>
            Aster glass pendants
            <br />
            for generous,
            <br />
            <i>architectural interiors.</i>
          </>
        ),
        lead: "A sculptural glass pendant collection with precise metalwork and scalable configurations for hospitality, dining, villa and commercial interiors.",
        explore: "Explore all products",
        start: "Start a project",
        supply: "Wholesale supply",
        supplyText:
          "Clear product information for designers, retailers and contractors.",
        bespoke: "Bespoke development",
        bespokeText: "Finish, scale and structure adapted to your project.",
        guidance: "Project guidance",
        guidanceText: "From initial brief through packing and dispatch.",
        factory: "Factory service",
        factoryText:
          "Clear communication, dependable quality control and export-ready packing.",
        collection: "FEATURED COLLECTION",
        pieces: "Pieces with a quiet presence.",
        catalog:
          "Browse original product series by category, then open the complete catalogue for specifications.",
        all: "All",
        view: "View piece",
        custom: "BESPOKE LIGHTING SERVICE",
        customTitle: (
          <>
            From a spark of an idea to a<br />
            <i>finished atmosphere.</i>
          </>
        ),
        customText:
          "Share a reference, plan or material direction. We help shape a specification suitable for repeatable production and installation.",
        story: "OUR POINT OF VIEW",
        storyTitle: "Made for the afterglow.",
        storyText:
          "We believe decorative light should leave a trace: a warmer welcome, a softer evening, a detail worth looking up for.",
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
          <div>
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
                <img src={product.image} alt={name(product)} />
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
                <b>{product.price}</b>
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
      <section className="story">
        <div className="story-stat">
          <strong>1998</strong>
          <span>{chinese ? "创立" : "established"}</span>
          <strong>24</strong>
          <span>{chinese ? "工艺专家" : "craft specialists"}</span>
          <strong>420</strong>
          <span>{chinese ? "年度项目简报" : "annual project briefs"}</span>
        </div>
        <div>
          <span className="eyebrow">{copy.story}</span>
          <h2>{copy.storyTitle}</h2>
          <p>{copy.storyText}</p>
        </div>
      </section>
      <section className="inquiry">
        <span className="eyebrow">{copy.inquiry}</span>
        <h2>{copy.tell}</h2>
        <form onSubmit={sendInquiry}>
          <input required name="name" placeholder={copy.name} />
          <input required name="email" type="email" placeholder={copy.email} />
          <input name="company" placeholder={copy.company} />
          <textarea required name="message" placeholder={copy.message} />
          <button className="gold">{copy.send}</button>
        </form>
      </section>
      {notice && (
        <div className="toast">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
    </>
  );
}
