import { products } from "./products";


export type CatalogProduct = {
  id: string; name: string; nameZh?: string; model: string; category: string; price: string;
  description: string; descriptionZh?: string; image: string; images?: string[]; featured: boolean; status: string;
};
export async function getProducts() { return products() as unknown as CatalogProduct[]; }
export async function getProduct(id: string) { return (await getProducts()).find(p => p.id === id); }
