type ProductCopy = { name: string; nameZh?: string; description?: string; descriptionZh?: string };
export function productName(product: ProductCopy, locale: string) { return locale === "zh" ? product.nameZh || product.name : product.name; }
export function productDescription(product: ProductCopy, locale: string) { return locale === "zh" ? product.descriptionZh || product.description || "" : product.description || ""; }
export function productPrice(price: string, locale: string) { return locale === "zh" ? price.replace(/^From\s+(.+)$/i, "$1 起") : price; }
