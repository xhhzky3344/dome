import { getProducts } from "../lib/catalog";
import { getPublishedHeroSlides, getSiteSettings } from "../lib/settings";
import { Footer, SiteNav } from "../components/SiteChrome";
import { HomeContent } from "../components/HomeContent";

export const revalidate = 30;
export default async function Home() {
  const [catalog, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const products = catalog.filter((product) => product.status === "Published");
  const featuredProducts = products.filter((product) => product.featured);
  const homepageProducts = (featuredProducts.length >= 6 ? featuredProducts : products).slice(0, 8);
  const slides = getPublishedHeroSlides(settings);
  return <main className="lumenhaus-home"><SiteNav /><HomeContent products={homepageProducts} slides={slides} /><Footer /></main>;
}
