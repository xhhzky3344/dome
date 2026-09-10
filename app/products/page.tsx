import Link from "next/link";
import { getProducts } from "../../lib/catalog";
import { Footer, SiteNav } from "../../components/SiteChrome";
import { ProductArchive } from "../../components/ProductArchive";
import { CatalogueHero } from "../../components/CatalogueHero";

export default async function ProductsPage() {
  const products = (await getProducts()).filter((item) => item.status === "Published");
  return <main className="catalog-page"><SiteNav/><CatalogueHero/><ProductArchive products={products}/><Footer/></main>;
}
