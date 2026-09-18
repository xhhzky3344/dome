import { Footer, SiteNav } from "../../components/SiteChrome";
import { get } from "../../lib/db";
import { AboutContent } from "../../components/AboutContent";

export default function About() { const brand=get("content","brand"); return <main className="about-page"><SiteNav /><AboutContent brand={brand?.published !== false && brand ? {title:String(brand.title),content:String(brand.content)} : undefined} /><Footer /></main>; }
