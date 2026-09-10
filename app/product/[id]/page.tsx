import { notFound } from "next/navigation";
import { getProduct, getProducts } from "../../../lib/catalog";
import { Footer, SiteNav } from "../../../components/SiteChrome";
import { ProductDetail } from "../../../components/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getProduct((await params).id);
  if (!product || product.status !== "Published") notFound();
  const related = (await getProducts()).filter((item) => item.category === product.category && item.id !== product.id && item.status === "Published").slice(0, 3);
  return <><SiteNav /><ProductDetail product={product} related={related} /><Footer /></>;
}
