"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { request } from "./commerce-client";
import { money, type Product, type Order } from "../lib/commerce-types";
type Line = { variantId: string; quantity: number };
function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export function DemoShop() {
  const [products, setProducts] = useState<Product[]>([]),
    [lines, setLines] = useState<Line[]>([]),
    [selected, setSelected] = useState<Record<string, string>>({}),
    [rules, setRules] = useState<{
      regions: string[];
      fee: number;
      freeThreshold: number;
      method: string;
    } | null>(null);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [space, setSpace] = useState(""),
    [spaces, setSpaces] = useState<{ id: string; name: string }[]>([]);
  const [address, setAddress] = useState({
    name: "",
    email: "",
    phone: "",
    region: "CN",
    city: "",
    street: "",
    postalCode: "",
  });
  const locked = useRef(false);
  useEffect(() => {
    Promise.all([
      request<Product[]>("/api/products"),
      request<NonNullable<typeof rules>>("/api/shipping"),
      request<typeof spaces>("/api/spaces"),
    ])
      .then(([p, r, s]) => {
        setProducts(p);
        setRules(r);
        setSpaces(s);
        const id = new URLSearchParams(location.search).get("product");
        if (id) setQuery(p.find((x) => x.id === id)?.model || "");
      })
      .catch((e) => setMessage(e.message));
    try {
      setLines(JSON.parse(localStorage.getItem("demo-cart") || "[]"));
    } catch {}
  }, []);
  function cart(next: Line[]) {
    setLines(next);
    localStorage.setItem("demo-cart", JSON.stringify(next));
    setMessage("");
  }
  const available = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, product: p })),
  );
  const subtotal = lines.reduce(
    (n, l) =>
      n +
      (available.find((v) => v.id === l.variantId)?.price || 0) * l.quantity,
    0,
  );
  const shipping = rules && subtotal < rules.freeThreshold ? rules.fee : 0;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (!lines.length) throw new Error("请先选择商品 / Add a product first");
      const data = { items: lines, address };
      const fingerprint = JSON.stringify(data);
      let attempt;
      try {
        attempt = JSON.parse(
          sessionStorage.getItem("demo-order-attempt") || "null",
        );
      } catch {}
      if (!attempt || attempt.fingerprint !== fingerprint) {
        attempt = {
          fingerprint,
          idempotencyKey: randomToken(),
          queryToken: randomToken(),
        };
        sessionStorage.setItem("demo-order-attempt", JSON.stringify(attempt));
      }
      const order = await request<Order>("/api/orders", "POST", {
        ...data,
        idempotencyKey: attempt.idempotencyKey,
        queryToken: attempt.queryToken,
      });
      localStorage.setItem(`demo-order-${order.id}`, attempt.queryToken);
      localStorage.setItem("demo-last-order", order.id);
      localStorage.removeItem("demo-cart");
      sessionStorage.removeItem("demo-order-attempt");
      location.href = `/orders?id=${order.id}`;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "提交失败");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="commerce">
      <a href="/">← 返回网站 / Home</a>
      <h1>演示选购 / Demo shop</h1>
      <p className="demo-banner">
        仅供演示，无真实支付、配送或税费计算。请使用虚构收货信息。All
        transactions are simulated.
      </p>
      <div className="commerce-actions">
        <a href="/orders">查询演示订单 / My demo order</a>
        <a href="/information">配送、常见问题与空间案例</a>
      </div>
      {message && (
        <p role="alert" className="commerce-message error">
          {message}
        </p>
      )}
      <div className="commerce-grid">
        <label>
          搜索名称或型号
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="commerce-grid">
          <label>
            商品分类
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">全部</option>
              {[...new Set(products.map((p) => p.category))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            空间
            <select value={space} onChange={(e) => setSpace(e.target.value)}>
              <option value="">全部</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="commerce-grid">
        {products
          .filter(
            (p) =>
              (!category || p.category === category) &&
              (!space || p.spaces?.includes(space)) &&
              `${p.name} ${p.nameZh} ${p.model}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((p) => {
            const v =
              p.variants.find((v) => v.id === selected[p.id]) || p.variants[0];
            return (
              <article className="commerce-card" key={p.id}>
                <img
                  className="commerce-image"
                  src={v?.image || p.image}
                  alt={p.name}
                />
                <h2>{p.name}</h2>
                <p>{p.nameZh}</p>
                <label>
                  规格 / Variant
                  <select
                    value={v?.id || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, [p.id]: e.target.value })
                    }
                  >
                    {p.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.color} / {v.size} / {v.temperature} —{" "}
                        {money(v.price)} — 库存 {v.stock}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="commerce-actions">
                  <button
                    disabled={!v || v.stock < 1}
                    onClick={() => {
                      if (!v?.id) return;
                      const old = lines.find((l) => l.variantId === v.id);
                      cart(
                        old
                          ? lines.map((l) =>
                              l.variantId === v.id
                                ? {
                                    ...l,
                                    quantity: Math.min(l.quantity + 1, 99),
                                  }
                                : l,
                            )
                          : [...lines, { variantId: v.id, quantity: 1 }],
                      );
                    }}
                  >
                    加入演示购物车
                  </button>
                  <a href={`/product/${p.id}`}>详情</a>
                </div>
              </article>
            );
          })}
      </div>
      <form className="commerce-card commerce-fields" onSubmit={submit}>
        <h2>结算 / Checkout</h2>
        {lines.length === 0 && <p>购物车为空 / Your cart is empty</p>}
        {lines.map((l) => {
          const v = available.find((v) => v.id === l.variantId);
          return (
            <div className="commerce-grid" key={l.variantId}>
              <p>
                {v?.product.name || "不可售商品，请移除"}
                <small>
                  {v?.color} / {v?.size} / {v?.temperature}
                </small>
              </p>
              <div className="commerce-actions">
                <label>
                  数量
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={l.quantity}
                    onChange={(e) =>
                      cart(
                        lines.map((x) =>
                          x.variantId === l.variantId
                            ? { ...x, quantity: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    cart(lines.filter((x) => x.variantId !== l.variantId))
                  }
                >
                  移除
                </button>
              </div>
            </div>
          );
        })}
        <div className="commerce-grid">
          {Object.entries({
            name: "收货人 / Name",
            email: "邮箱 / Email",
            phone: "电话 / Phone",
            city: "城市 / City",
            street: "地址 / Street",
            postalCode: "邮编 / Postal code",
          }).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                maxLength={key === "street" ? 500 : 100}
                type={key === "email" ? "email" : "text"}
                value={address[key as keyof typeof address]}
                onChange={(e) =>
                  setAddress({ ...address, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <label>
            配送地区 / Region
            <select
              value={address.region}
              onChange={(e) =>
                setAddress({ ...address, region: e.target.value })
              }
            >
              {(rules?.regions || ["CN"]).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <p>
          {rules?.method} · 满 {money(rules?.freeThreshold || 0)} 免邮。
          <br />
          商品 {money(subtotal)} + 配送 {money(shipping)} = 预计{" "}
          {money(subtotal + shipping)}。最终金额由服务器计算。
        </p>
        <button className="primary" disabled={busy || !lines.length}>
          {busy ? "提交中…" : "创建演示订单 / Place demo order"}
        </button>
      </form>
    </main>
  );
}
