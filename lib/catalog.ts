import { promises as fs } from "node:fs";
import path from "node:path";

export type CatalogProduct = {
  id: string; name: string; nameZh?: string; model: string; category: string; price: string;
  description: string; descriptionZh?: string; image: string; featured: boolean; status: string;
};
const file = path.join(process.cwd(), "data", "catalog.json");
export async function getProducts() { return JSON.parse(await fs.readFile(file, "utf8")) as CatalogProduct[]; }
export async function getProduct(id: string) { return (await getProducts()).find((product) => product.id === id); }
