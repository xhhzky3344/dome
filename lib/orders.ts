import { randomUUID } from "node:crypto";
import { db, get, put, transaction } from "./db";
import { digest, email, integer, requireValue, str } from "./http";
export function order(id: string) {
  const o = db().prepare("SELECT * FROM orders WHERE id=?").get(id);
  requireValue(o, "订单不存在", 404);
  const {
    token_hash: _token,
    idempotency: _key,
    request_hash: _hash,
    ...publicOrder
  } = o;
  return {
    ...publicOrder,
    address: JSON.parse(String(o.address)),
    items: db().prepare("SELECT * FROM order_items WHERE order_id=?").all(id),
    events: db()
      .prepare("SELECT * FROM order_events WHERE order_id=? ORDER BY id")
      .all(id),
  };
}
export function authorizeOrder(id: string, token: string) {
  const o = db().prepare("SELECT token_hash FROM orders WHERE id=?").get(id);
  requireValue(
    o && o.token_hash === digest(token),
    "订单不存在或查询凭证错误",
    404,
  );
}
export function createOrder(input: Record<string, unknown>) {
  return transaction(() => {
    const key = str(input.idempotencyKey, "提交标识", 128);
    requireValue(key.length >= 16, "提交标识至少 16 字符");
    const token = str(input.queryToken, "查询凭证", 128);
    requireValue(token.length >= 32, "查询凭证至少 32 字符");
    requireValue(
      input.address && typeof input.address === "object",
      "请填写收货地址",
    );
    const a = input.address as Record<string, unknown>;
    const address = {
      name: str(a.name, "收货人", 100),
      email: email(a.email),
      phone: str(a.phone, "电话", 50),
      region: str(a.region, "配送地区", 10).toUpperCase(),
      city: str(a.city, "城市", 100),
      street: str(a.street, "详细地址", 500),
      postalCode: str(a.postalCode, "邮编", 30),
    };
    requireValue(
      Array.isArray(input.items) &&
        input.items.length > 0 &&
        input.items.length <= 50,
      "商品数量不正确",
    );
    const merged = new Map<string, number>();
    for (const raw of input.items) {
      requireValue(raw && typeof raw === "object", "商品格式错误");
      const id = str(raw.variantId, "规格 ID");
      merged.set(
        id,
        integer(
          (merged.get(id) || 0) + integer(raw.quantity, "数量", 1, 99),
          "总数量",
          1,
          99,
        ),
      );
    }
    const items = Array.from(merged).sort(([a], [b]) => a.localeCompare(b));
    const fingerprint = digest(JSON.stringify({ address, items }));
    const previous = db()
      .prepare(
        "SELECT id,request_hash,token_hash FROM orders WHERE idempotency=?",
      )
      .get(key);
    if (previous) {
      requireValue(
        previous.request_hash === fingerprint &&
          previous.token_hash === digest(token),
        "提交标识已被其他订单使用",
        409,
      );
      return order(String(previous.id));
    }
    const rules = get("shipping", "rules")!;
    requireValue(
      (rules.regions as string[]).includes(address.region),
      "该地区暂不支持配送",
    );
    const lines = items.map(([vid, quantity]) => {
      const v = db()
        .prepare("SELECT * FROM variants WHERE id=? AND active=1")
        .get(vid);
      const p = v && get("products", String(v.product_id));
      requireValue(
        v && p?.status === "Published",
        "商品已下架或规格不可售",
        409,
      );
      requireValue(Number(v.stock) >= quantity, "库存不足", 409);
      return { v, p, quantity };
    });
    const subtotal = lines.reduce(
      (sum, l) => sum + Number(l.v.price) * l.quantity,
      0,
    );
    const shipping =
      subtotal >= Number(rules.freeThreshold) ? 0 : Number(rules.fee);
    integer(subtotal + shipping, "订单金额", 1, 5000000000);
    const id = randomUUID(),
      number = `DEMO-${Date.now()}-${randomUUID().slice(0, 8)}`,
      now = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO orders(id,number,token_hash,idempotency,request_hash,status,subtotal,shipping,total,address,method,created_at) VALUES(?,?,?,?,?,'pending',?,?,?,?,?,?)",
      )
      .run(
        id,
        number,
        digest(token),
        key,
        fingerprint,
        subtotal,
        shipping,
        subtotal + shipping,
        JSON.stringify(address),
        String(rules.method),
        now,
      );
    for (const { v, p, quantity } of lines)
      db()
        .prepare(
          "INSERT INTO order_items(order_id,variant_id,product_id,name,specification,price,quantity,image) VALUES(?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          String(v.id),
          p.id,
          String(p.name),
          `${v.color} / ${v.size} / ${v.temperature}`,
          Number(v.price),
          quantity,
          String(v.image),
        );
    event(id, "pending", "演示订单已创建，不收取真实款项");
    return order(id);
  });
}
function event(id: string, status: string, note: string) {
  db()
    .prepare(
      "INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)",
    )
    .run(id, status, note, new Date().toISOString());
}
export function transition(
  id: string,
  action: string,
  input: Record<string, unknown> = {},
) {
  return transaction(() => {
    const o = db().prepare("SELECT * FROM orders WHERE id=?").get(id);
    requireValue(o, "订单不存在", 404);
    const targets: Record<string, string> = {
      pay: "paid",
      fail: "payment_failed",
      ship: "shipped",
      cancel: "cancelled",
      refund: "refunded",
    };
    const target = targets[action];
    requireValue(target, "不支持的订单操作");
    if (o.status === target || (action === "pay" && o.status === "shipped"))
      return order(id);
    const allowed: Record<string, string[]> = {
      pay: ["pending", "payment_failed"],
      fail: ["pending"],
      ship: ["paid"],
      cancel: ["pending", "payment_failed", "paid"],
      refund: ["paid", "shipped"],
    };
    requireValue(
      allowed[action].includes(String(o.status)),
      "当前订单状态不允许此操作",
      409,
    );
    const items = db()
      .prepare("SELECT * FROM order_items WHERE order_id=?")
      .all(id);
    if (action === "pay") {
      for (const item of items) {
        const p = get("products", String(item.product_id));
        requireValue(p?.status === "Published", "商品已下架", 409);
        const updated = db()
          .prepare(
            "UPDATE variants SET stock=stock-? WHERE id=? AND active=1 AND stock>=?",
          )
          .run(
            Number(item.quantity),
            String(item.variant_id),
            Number(item.quantity),
          );
        requireValue(
          Number(updated.changes) === 1,
          "库存不足，模拟支付未完成",
          409,
        );
      }
      db().prepare("UPDATE orders SET stock_deducted=1 WHERE id=?").run(id);
    }
    if ((action === "cancel" || action === "refund") && o.stock_deducted) {
      for (const item of items)
        db()
          .prepare("UPDATE variants SET stock=stock+? WHERE id=?")
          .run(Number(item.quantity), String(item.variant_id));
      db().prepare("UPDATE orders SET stock_deducted=0 WHERE id=?").run(id);
    }
    if (action === "ship")
      db()
        .prepare("UPDATE orders SET carrier=?,tracking=? WHERE id=?")
        .run(
          str(input.carrier, "物流公司", 100),
          str(input.tracking, "物流单号", 100),
          id,
        );
    if (
      action === "pay" ||
      ((action === "cancel" || action === "refund") && o.stock_deducted)
    )
      for (const productId of new Set(items.map((x) => String(x.product_id)))) {
        const p = get("products", productId);
        if (p) put("products", { ...p, revision: Number(p.revision || 0) + 1 });
      }
    db().prepare("UPDATE orders SET status=? WHERE id=?").run(target, id);
    event(id, target, `模拟操作：${action}`);
    return order(id);
  });
}
