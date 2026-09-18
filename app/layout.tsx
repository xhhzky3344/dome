import type { Metadata } from "next";
import { getSiteSettings } from "../lib/settings";

import "./styles.css";
import "./commerce.css";
import "./overrides.css";
import "./ui-refinements.css";

// Database-backed content is read on each request after administrator edits.
export const dynamic = "force-dynamic";
type Settings = { seoTitle?: string; seoDescription?: string; companyName?: string };
async function settings(): Promise<Settings> { return getSiteSettings(); }

export async function generateMetadata(): Promise<Metadata> {
  const site = await settings();
  const title = site.companyName || site.seoTitle || "Lumenhaus | Decorative Lighting";
  const description = site.seoDescription || "Original B2B decorative lighting demonstration site";
  const shareImage = "/images/lumenhaus-lobby-hero.webp";
  return { metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3000"), title, description, openGraph: { title, description, type: "website", images: [{ url: shareImage, width: 1448, height: 1086, alt: "Lumenhaus decorative lighting" }] }, twitter: { card: "summary_large_image", title, description, images: [shareImage] } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
