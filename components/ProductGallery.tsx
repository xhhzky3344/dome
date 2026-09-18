"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./Locale";
import { Icon } from "./Icon";

export function ProductGallery({ image, images: additional = [], name, model }: { image: string; images?: string[]; name: string; model: string }) {
  const images = [...new Set([image, ...additional].filter(Boolean))];
  const [selected, setSelected] = useState(0); const [zoom, setZoom] = useState(false);
  const { locale } = useLocale(); const zh = locale === "zh";
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!zoom) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [zoom]);
  const source = images[selected] || images[0];
  return <div className="product-gallery">
    <button className="gallery-main" aria-label={zh ? `放大 ${name} 图片` : `Enlarge ${name} image`} onClick={() => setZoom(true)}><img src={source} alt={name} /><span>{zh ? "点击查看大图" : "View larger image"}</span></button>
    {images.length > 1 && <div className="gallery-thumbs">{images.map((src, index) => <button aria-label={zh ? `查看图片 ${index + 1}` : `View image ${index + 1}`} aria-pressed={selected === index} className={selected === index ? "selected" : ""} key={src} onClick={() => setSelected(index)}><img loading="lazy" src={src} alt="" /><b>{String(index + 1).padStart(2, "0")}</b></button>)}</div>}
    <p className="gallery-help">{zh ? "需要细节图、尺寸图或更多场景资料？" : "Need detail photos, dimensions or more project images?"} <Link href={`/contact?model=${encodeURIComponent(model)}#inquiry`}>{zh ? "索取产品资料" : "Request product information"}</Link></p>
    {zoom && <dialog className="gallery-lightbox" ref={dialog} aria-label={name} onCancel={() => setZoom(false)} onClick={e => { if (e.target === e.currentTarget) setZoom(false); }}><button autoFocus className="icon-button" aria-label={zh ? "关闭图片" : "Close image"} onClick={() => setZoom(false)}><Icon name="close" /></button><img src={source} alt={name} /><p>{zh ? "按 Esc 或点击背景关闭" : "Press Esc or click the background to close"}</p></dialog>}
  </div>;
}

