import { requireAdmin } from "../../../lib/auth";
import { get, put, type RecordData } from "../../../lib/db";
import {
  api,
  body,
  requireValue,
  safeUrl,
  sameOrigin,
  str,
} from "../../../lib/http";
export function GET() {
  return api(() => get("settings", "site"));
}
export function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    const data = await body(request);
    const allowed = [
      "companyName",
      "companyNameZh",
      "email",
      "phone",
      "address",
      "facebookUrl",
      "whatsappUrl",
      "instagramUrl",
      "linkedinUrl",
      "primaryLanguage",
      "secondaryLanguage",
      "seoTitle",
      "seoDescription",
      "seoTitleZh",
      "seoDescriptionZh",
      "brandIntroduction",
    ];
    const saved: RecordData = { ...get("settings", "site")!, id: "site" };
    for (const key of allowed)
      if (key in data) {
        saved[key] = str(data[key], key, 10000, true);
        if (key.endsWith("Url") && saved[key]) safeUrl(saved[key]);
      }
    if (data.heroSlides !== undefined) {
      requireValue(
        Array.isArray(data.heroSlides) && data.heroSlides.length === 3,
        "首页轮播需要三张幻灯片",
      );
      saved.heroSlides = data.heroSlides.map((raw) => {
        requireValue(raw && typeof raw === "object", "轮播格式错误");
        const slide: Record<string, unknown> = {};
        for (const key of [
          "id",
          "eyebrow",
          "eyebrowZh",
          "title",
          "titleZh",
          "description",
          "descriptionZh",
          "primaryLabel",
          "primaryLabelZh",
          "secondaryLabel",
          "secondaryLabelZh",
        ])
          slide[key] = str(raw[key], key, 3000, true);
        for (const key of ["image", "primaryHref", "secondaryHref"])
          slide[key] = safeUrl(raw[key]);
        slide.published = raw.published !== false;
        return slide;
      });
    }
    return put("settings", saved);
  });
}
