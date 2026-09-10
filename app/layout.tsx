import type { Metadata } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";
import "./styles.css";
import "./overrides.css";

export const dynamic = "force-dynamic";
type Settings = { seoTitle?: string; seoDescription?: string; companyName?: string };
async function settings(): Promise<Settings> { return JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "site-settings.json"), "utf8")); }

export async function generateMetadata(): Promise<Metadata> {
  const site = await settings();
  const title = site.seoTitle || site.companyName || "Lumenhaus | Decorative Lighting";
  const description = site.seoDescription || "Original B2B decorative lighting demonstration site";
  const shareImage = "/images/lumenhaus-lobby-hero.png";
  return { title, description, openGraph: { title, description, type: "website", images: [{ url: shareImage, width: 1448, height: 1086, alt: "Lumenhaus decorative lighting" }] }, twitter: { card: "summary_large_image", title, description, images: [shareImage] } };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
