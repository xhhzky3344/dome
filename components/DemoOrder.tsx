"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { request } from "./commerce-client";
import { OrderDetails } from "./OrderDetails";
import type { Order } from "../lib/commerce-types";
export function DemoOrder() {
  const [id, setId] = useState(""),
    [token, setToken] = useState(""),
    [order, setOrder] = useState<Order | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function load(orderId = id, credential = token) {
    try {
      const result = await request<Order>(
        `/api/orders?id=${encodeURIComponent(orderId)}`,
        "GET",
        undefined,
        credential,
      );
      setOrder(result);
      setMessage("");
    } catch (e) {
      setOrder(null);
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    const orderId =
      new URLSearchParams(location.search).get("id") ||
      localStorage.getItem("demo-last-order") ||
      "";
    const credential = localStorage.getItem(`demo-order-${orderId}`) || "";
    setId(orderId);
    setToken(credential);
    if (orderId && credential) void load(orderId, credential);
  }, []);
  async function action(action: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      setOrder(
        await request<Order>(
          "/api/orders",
          "PATCH",
          { id: order!.id, action },
          token,
        ),
      );
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void load();
  }
  return (
    <main className="commerce">
      <a href="/shop">← 继续选购 / Shop</a>
      <h1>演示订单 / Demo order</h1>
      <p className="demo-banner">
        无真实扣款。查询凭证保存在本浏览器，可复制后在另一台设备查询，请勿公开分享。
      </p>
      <form onSubmit={submit} className="commerce-card commerce-fields">
        <label>
          订单 ID
          <input required value={id} onChange={(e) => setId(e.target.value)} />
        </label>
        <label>
          查询凭证 / Query token
          <input
            required
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <div className="commerce-actions">
          <button>查询 / Refresh</button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `订单 ID: ${id}\n查询凭证: ${token}`,
                );
                setMessage("查询信息已复制");
              } catch {
                setMessage("浏览器不支持复制，请手动保存订单 ID 与凭证");
              }
            }}
          >
            复制查询信息
          </button>
        </div>
      </form>
      {message && (
        <p role="status" className="commerce-message">
          {message}
        </p>
      )}
      {order && (
        <>
          <OrderDetails order={order} />
          <div className="commerce-actions">
            {["pending", "payment_failed"].includes(order.status) && (
              <>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void action("pay")}
                >
                  模拟支付成功
                </button>
                {order.status === "pending" && (
                  <button disabled={busy} onClick={() => void action("fail")}>
                    模拟支付失败
                  </button>
                )}
              </>
            )}
            {["pending", "payment_failed", "paid"].includes(order.status) && (
              <button disabled={busy} onClick={() => void action("cancel")}>
                取消演示订单
              </button>
            )}
            <button disabled={busy} onClick={() => void load()}>
              刷新物流状态
            </button>
          </div>
        </>
      )}
    </main>
  );
}
