export type Variant = {
  id?: string;
  color: string;
  size: string;
  temperature: string;
  price: number;
  stock: number;
  image: string;
};
export type Product = {
  id: string;
  name: string;
  nameZh?: string;
  model: string;
  category: string;
  price: string;
  description: string;
  descriptionZh?: string;
  image: string;
  images: string[];
  featured: boolean;
  status: string;
  material: string;
  installation: string;
  spaces: string[];
  sortOrder: number;
  revision?: number;
  variants: Variant[];
};
export type Order = {
  id: string;
  number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  method: string;
  demo: number;
  carrier: string;
  tracking: string;
  created_at: string;
  address: Record<string, string>;
  items: {
    id: number;
    name: string;
    specification: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  events: { id: number; status: string; note: string; created_at: string }[];
};
export const orderLabels: Record<string, string> = {
  pending: "待模拟支付",
  payment_failed: "模拟支付失败",
  paid: "待模拟发货",
  shipped: "已模拟发货",
  cancelled: "已取消",
  refunded: "已模拟退款",
};
export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
