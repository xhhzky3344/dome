import { requireAdmin, isAdmin } from "../../../lib/auth";
import { db, get, remove, transaction } from "../../../lib/db";
import {
  api,
  body,
  paginate,
  requireValue,
  sameOrigin,
  str,
} from "../../../lib/http";
import { products, saveProduct } from "../../../lib/products";
export function GET(request: Request) {
  return api(async () => {
    const admin = await isAdmin();
    const q = new URL(request.url).searchParams;
    let rows = products().filter((p) => admin || p.status === "Published");
    if (q.get("id")) {
      const p = rows.find((p) => p.id === q.get("id"));
      requireValue(p, "商品不存在", 404);
      return p;
    }
    if (q.get("q"))
      rows = rows.filter((p) =>
        `${p.name} ${p.nameZh} ${p.model}`
          .toLowerCase()
          .includes(q.get("q")!.toLowerCase()),
      );
    for (const key of ["category", "status"])
      if (q.get(key)) rows = rows.filter((p) => p[key] === q.get(key));
    if (q.get("space"))
      rows = rows.filter((p) =>
        ((p.spaces as string[]) || []).includes(q.get("space")!),
      );
    if (q.get("featured"))
      rows = rows.filter((p) => p.featured === (q.get("featured") === "true"));
    return paginate(rows, request);
  });
}
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    return saveProduct(await body(request), true);
  });
}
export function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    return saveProduct(await body(request), false);
  });
}
export function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    const input = await body(request);
    const id = str(input.id, "商品 ID");
    return transaction(() => {
      requireValue(get("products", id), "商品不存在", 404);
      db().prepare("UPDATE variants SET active=0 WHERE product_id=?").run(id);
      remove("products", id);
      return { ok: true };
    });
  });
}
