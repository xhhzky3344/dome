import { promises as fs } from "node:fs";
import path from "node:path";

export type HeroSlide = {
  id: string;
  image: string;
  eyebrow: string;
  eyebrowZh: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  primaryLabel: string;
  primaryLabelZh: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryLabelZh: string;
  secondaryHref: string;
  published: boolean;
};

export type SiteSettings = {
  companyName?: string;
  companyNameZh?: string;
  email?: string;
  phone?: string;
  address?: string;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoTitleZh?: string;
  seoDescriptionZh?: string;
  heroSlides?: HeroSlide[];
};

const file = path.join(process.cwd(), "data", "site-settings.json");

export async function getSiteSettings(): Promise<SiteSettings> {
  return JSON.parse(await fs.readFile(file, "utf8")) as SiteSettings;
}

export function getPublishedHeroSlides(settings: SiteSettings): HeroSlide[] {
  return (settings.heroSlides || []).filter((slide) => slide.published !== false).slice(0, 3);
}
