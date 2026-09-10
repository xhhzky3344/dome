"use client";
import { useEffect, useState } from "react";

export function ProductGallery({ image, name }: { image: string; name: string }) {
  const [selected, setSelected] = useState(0); const [zoom, setZoom] = useState(false);
  const images = [image, "/images/lumenhaus-lobby-hero.png", image];
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setZoom(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  return <div className="product-gallery"><button className="gallery-main" aria-label={`Enlarge ${name} image`} onClick={() => setZoom(true)}><img src={images[selected]} alt={`${name} image ${selected + 1}`}/><span>Click to enlarge ↗</span></button><div className="gallery-thumbs">{images.map((source, index) => <button aria-label={`View image ${index + 1}`} className={selected === index ? "selected" : ""} key={`${source}-${index}`} onClick={() => setSelected(index)}><img src={source} alt=""/><b>{String(index + 1).padStart(2, "0")}</b></button>)}</div>{zoom && <div className="gallery-lightbox" onClick={() => setZoom(false)} role="dialog" aria-modal="true"><button aria-label="Close image preview" onClick={() => setZoom(false)}>×</button><img src={images[selected]} alt={name}/><p>Press Esc or click outside to close</p></div>}</div>;
}
