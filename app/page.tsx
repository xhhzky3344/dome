import { getProducts } from "../lib/catalog";
import { getPublishedHeroSlides, getSiteSettings } from "../lib/settings";
import { Footer, SiteNav } from "../components/SiteChrome";
import { HomeContent } from "../components/HomeContent";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [catalog, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const products = catalog.filter((product) => product.status === "Published");
  const slides = getPublishedHeroSlides(settings);
  return <main className="lumenhaus-home"><SiteNav /><HomeContent products={products} slides={slides} /><Footer /></main>;
}
