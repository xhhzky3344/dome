"use client";
import { money, orderLabels, type Order } from "../lib/commerce-types";
export function OrderDetails({ order }: { order: Order }) {
  return (
    <section className="commerce-card">
      <h2>{order.number}</h2>
      <p className="demo-banner">演示订单 · 不收取真实款项 · 不进行真实配送</p>
      <p>
        <strong>{orderLabels[order.status]}</strong> ·{" "}
        {new Date(order.created_at).toLocaleString()}
      </p>
      <div className="commerce-lines">
        {order.items.map((item) => (
          <div key={item.id}>
            <span>
              {item.name}
              <small>
                {item.specification} × {item.quantity}
              </small>
            </span>
            <b>{money(item.price * item.quantity)}</b>
          </div>
        ))}
      </div>
      <p>
        商品 {money(order.subtotal)} + 配送 {money(order.shipping)} ={" "}
        <strong>{money(order.total)}</strong>
      </p>
      <p>
        {order.address.name} · {order.address.email} · {order.address.phone}
        <br />
        {order.address.region} {order.address.city} {order.address.street}{" "}
        {order.address.postalCode}
      </p>
      <p>配送方式：{order.method}</p>
      {order.tracking && (
        <p>
          模拟物流：{order.carrier} / {order.tracking}
        </p>
      )}
      <h3>状态记录</h3>
      <ol>
        {order.events.map((event) => (
          <li key={event.id}>
            {orderLabels[event.status]} — {event.note}{" "}
            <small>{new Date(event.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
