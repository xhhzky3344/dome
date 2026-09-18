import { requireAdmin } from "../../../lib/auth";
import { db, list } from "../../../lib/db";
import { api } from "../../../lib/http";
export function GET() {
  return api(async () => {
    await requireAdmin();
    const products = list("products"),
      inquiries = list("inquiries");
    const orders = db()
      .prepare(
        "SELECT COUNT(*) count,COALESCE(SUM(total),0) amount,SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) awaiting FROM orders",
      )
      .get();
    return {
      demo: true,
      products: products.length,
      published: products.filter((p) => p.status === "Published").length,
      orders: orders?.count || 0,
      amount: orders?.amount || 0,
      awaiting: orders?.awaiting || 0,
      pendingInquiries: inquiries.filter((x) => x.status === "New").length,
      recentOrders: db()
        .prepare(
          "SELECT id,number,status,total,created_at FROM orders ORDER BY created_at DESC LIMIT 5",
        )
        .all(),
      recentInquiries: inquiries.slice(0, 5),
    };
  });
}
