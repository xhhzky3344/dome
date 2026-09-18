import { requireAdmin, isAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import {
  api,
  body,
  paginate,
  rateLimit,
  sameOrigin,
  str,
} from "../../../lib/http";
import {
  order,
  authorizeOrder,
  createOrder,
  transition,
} from "../../../lib/orders";
export const runtime = "nodejs";
export function GET(request: Request) {
  return api(async () => {
    const q = new URL(request.url).searchParams;
    const id = q.get("id");
    if (id) {
      if (!(await isAdmin())) {
        rateLimit(request, "lookup", 60);
        authorizeOrder(id, request.headers.get("x-order-token") || "");
      }
      return order(id);
    }
    await requireAdmin();
    let rows = db()
      .prepare(
        "SELECT id,number,status,total,demo,created_at FROM orders ORDER BY created_at DESC",
      )
      .all();
    if (q.get("status"))
      rows = rows.filter((x) => x.status === q.get("status"));
    if (q.get("q"))
      rows = rows.filter((x) =>
        String(x.number).toLowerCase().includes(q.get("q")!.toLowerCase()),
      );
    return paginate(rows, request);
  });
}
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    rateLimit(request, "orders", 20);
    return createOrder(await body(request));
  });
}
export function PATCH(request: Request) {
  return api(async () => {
    sameOrigin(request);
    rateLimit(request, "order-actions", 60);
    const input = await body(request);
    const id = str(input.id, "订单 ID");
    const action = str(input.action, "操作");
    if (["ship", "refund"].includes(action)) await requireAdmin();
    else if (!(await isAdmin()))
      authorizeOrder(id, request.headers.get("x-order-token") || "");
    return transition(id, action, input);
  });
}
