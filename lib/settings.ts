import { get } from "./db";


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
  facebookUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoTitleZh?: string;
  seoDescriptionZh?: string;
  heroSlides?: HeroSlide[];
};



export async function getSiteSettings(): Promise<SiteSettings> {
  return get("settings", "site") as SiteSettings;
}

export function getPublishedHeroSlides(settings: SiteSettings): HeroSlide[] {
  return (settings.heroSlides || []).filter((slide) => slide.published !== false).slice(0, 3);
}
