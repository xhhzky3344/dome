import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumenhaus Lighting Studio",
    short_name: "Lumenhaus",
    description: "Decorative lighting for wholesale and project buyers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1eee8",
    theme_color: "#171716",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
