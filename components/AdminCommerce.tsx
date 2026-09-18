"use client";
import { useEffect, useState, type FormEvent } from "react";
import { request } from "./commerce-client";
import { money, orderLabels, type Order } from "../lib/commerce-types";
import { OrderDetails } from "./OrderDetails";
type Row = { id: string; [key: string]: unknown };
type Dashboard = {
  products: number;
  published: number;
  orders: number;
  amount: number;
  awaiting: number;
  pendingInquiries: number;
  recentOrders: Order[];
  recentInquiries: Row[];
};
export function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    request<Dashboard>("/api/dashboard")
      .then(setData)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <div className="commerce commerce-inset">
      <p className="demo-banner">
        以下均为演示数据，订单金额包含所有状态订单的下单金额，不代表真实营收。
      </p>
      {message && <p role="alert">{message}</p>}
      {data && (
        <>
          <div className="commerce-metrics">
            {[
              ["商品总数", data.products],
              ["上架商品", data.published],
              ["演示订单", data.orders],
              ["订单总金额", money(data.amount)],
              ["待模拟发货", data.awaiting],
              ["待处理询盘", data.pendingInquiries],
            ].map(([label, value]) => (
              <article key={label}>
                <small>{label}</small>
                <b>{value}</b>
              </article>
            ))}
          </div>
          <div className="commerce-grid">
            <section className="commerce-card">
              <h2>最近演示订单</h2>
              {data.recentOrders.map((o) => (
                <p key={o.id}>
                  {o.number}
                  <small>
                    {orderLabels[o.status]} · {money(o.total)}
                  </small>
                </p>
              ))}
            </section>
            <section className="commerce-card">
              <h2>最新询盘</h2>
              {data.recentInquiries.map((i) => (
                <p key={i.id}>
                  {String(i.name)}
                  <small>
                    {String(i.email)} · {String(i.status)}
                  </small>
                </p>
              ))}
            </section>
          </div>
        </>
      )}
      <a href="/admin/operations">进入订单、配送、询盘与内容管理 →</a>
    </div>
  );
}
export function AdminCommerce() {
  const [tab, setTab] = useState("orders");
  const tabs = [
    ["orders", "订单"],
    ["inquiries", "询盘"],
    ["subscriptions", "订阅"],
    ["shipping", "配送规则"],
    ["cases", "空间案例"],
    ["content", "品牌 / FAQ / 政策"],
    ["spaces", "空间分类"],
    ["categories", "商品分类"],
    ["security", "密码与重置"],
  ];
  return (
    <main className="commerce">
      <a href="/admin">← 后台首页</a>
      <h1>演示业务管理</h1>
      <p className="demo-banner">所有订单、支付、物流和退款操作均为模拟。</p>
      <div className="commerce-actions">
        <a href="/admin/products">商品与规格</a>
        <a href="/shop">前台演示选购</a>
        <a href="/information">预览内容</a>
      </div>
      <nav className="commerce-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "orders" ? (
        <OrdersManager />
      ) : tab === "shipping" ? (
        <ShippingManager />
      ) : tab === "security" ? (
        <SecurityManager />
      ) : (
        <ResourceManager key={tab} kind={tab} />
      )}
    </main>
  );
}
function OrdersManager() {
  const [rows, setRows] = useState<Order[]>([]),
    [selected, setSelected] = useState<Order | null>(null),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [carrier, setCarrier] = useState("Demo Logistics"),
    [tracking, setTracking] = useState("");
  async function load() {
    try {
      const data = await request<{ items: Order[]; total: number }>(
        `/api/orders?page=${page}&q=${encodeURIComponent(q)}&status=${status}`,
      );
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [q, status, page]);
  async function select(id: string) {
    try {
      setSelected(await request<Order>(`/api/orders?id=${id}`));
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function action(action: string) {
    if (!selected || busy) return;
    setBusy(true);
    try {
      setSelected(
        await request<Order>("/api/orders", "PATCH", {
          id: selected.id,
          action,
          carrier,
          tracking,
        }),
      );
      setMessage("演示订单状态已更新。");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="commerce-grid">
        <label>
          订单编号搜索
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          状态筛选
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {Object.entries(orderLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {message && (
        <p role="status" className="commerce-message">
          {message}
        </p>
      )}
      <div className="commerce-card commerce-scroll">
        <table>
          <thead>
            <tr>
              <th>演示订单编号</th>
              <th>状态</th>
              <th>金额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.number}</td>
                <td>{orderLabels[o.status]}</td>
                <td>{money(o.total)}</td>
                <td>
                  <button onClick={() => void select(o.id)}>详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p>暂无订单</p>}
      </div>
      <div className="commerce-actions">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          上一页
        </button>
        <span>
          第 {page} 页 · 共 {total} 条
        </span>
        <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>
          下一页
        </button>
        <button onClick={() => void load()}>刷新</button>
      </div>
      {selected && (
        <>
          <OrderDetails order={selected} />
          {selected.status === "paid" && (
            <div className="commerce-grid">
              <label>
                物流公司
                <input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </label>
              <label>
                物流单号
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </label>
            </div>
          )}
          <div className="commerce-actions">
            {["pending", "payment_failed"].includes(selected.status) && (
              <button disabled={busy} onClick={() => void action("pay")}>
                模拟支付成功
              </button>
            )}
            {selected.status === "pending" && (
              <button disabled={busy} onClick={() => void action("fail")}>
                模拟支付失败
              </button>
            )}
            {selected.status === "paid" && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => void action("ship")}
              >
                模拟发货
              </button>
            )}
            {["pending", "payment_failed", "paid"].includes(
              selected.status,
            ) && (
              <button disabled={busy} onClick={() => void action("cancel")}>
                取消订单
              </button>
            )}
            {["paid", "shipped"].includes(selected.status) && (
              <button disabled={busy} onClick={() => void action("refund")}>
                模拟退款并恢复库存
              </button>
            )}
            <button onClick={() => void select(selected.id)}>刷新详情</button>
          </div>
        </>
      )}
    </>
  );
}
function ResourceManager({ kind }: { kind: string }) {
  const [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [editing, setEditing] = useState<Row | null>(null),
    [products, setProducts] = useState<Row[]>([]),
    [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const data = await request<{ items: Row[]; total: number }>(
        `/api/${kind}?page=${page}&q=${encodeURIComponent(q)}&status=${status}`,
      );
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [page, q, status]);
  useEffect(() => {
    if (kind === "cases")
      request<Row[]>("/api/products")
        .then(setProducts)
        .catch((e) => setMessage(e.message));
  }, [kind]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await request<Row>(
        `/api/${kind}`,
        editing?.id ? "PUT" : "POST",
        { ...editing, ...(kind === "inquiries" ? { note } : {}) },
      );
      setEditing(result);
      setNote("");
      setMessage("已保存");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!editing || !confirm("确定删除此记录？")) return;
    try {
      await request(`/api/${kind}`, "DELETE", { id: editing.id });
      setEditing(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const fields =
    kind === "categories"
      ? [
          ["name", "英文名称"],
          ["nameZh", "中文名称"],
          ["slug", "URL 别名"],
          ["description", "描述"],
        ]
      : kind === "spaces"
        ? [["name", "空间名称"]]
        : [
            ["title", "标题"],
            ["content", "内容"],
            ...(kind === "cases" ? [["image", "图片地址"]] : []),
          ];
  return (
    <>
      <div className="commerce-actions">
        <label>
          搜索
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {kind === "inquiries" && (
          <label>
            处理状态
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="New">待处理</option>
              <option value="Contacted">跟进中</option>
              <option value="Quoted">已报价</option>
              <option value="Closed">已完成</option>
            </select>
          </label>
        )}
        {!["inquiries", "subscriptions"].includes(kind) && (
          <button
            onClick={() =>
              setEditing({
                id: "",
                title: "",
                content: "",
                published: true,
                productIds: [],
              })
            }
          >
            新增
          </button>
        )}
        <button onClick={() => void load()}>刷新</button>
      </div>
      {message && (
        <p role="status" className="commerce-message">
          {message}
        </p>
      )}
      <div className="commerce-grid">
        <div className="commerce-card">
          {rows.map((r, i) => (
            <div key={r.id || i} className="commerce-actions">
              <div>
                <b>{String(r.name || r.title || r.email)}</b>
                <small>
                  {String(r.status || r.slug || r.created_at || "")}
                </small>
              </div>
              {kind !== "subscriptions" && (
                <button
                  onClick={() => {
                    setEditing(r);
                    setNote("");
                  }}
                >
                  查看 / 编辑
                </button>
              )}
            </div>
          ))}
          {!rows.length && <p>暂无记录</p>}
          <div className="commerce-actions">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <span>
              {page} · 共 {total} 条
            </span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </div>
        {editing && (
          <form className="commerce-card commerce-fields" onSubmit={save}>
            {kind === "inquiries" ? (
              <>
                <h2>{String(editing.name)}</h2>
                <p>
                  {String(editing.email)} · {String(editing.company || "")}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {String(editing.message)}
                </p>
                <label>
                  处理状态
                  <select
                    value={String(editing.status)}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value })
                    }
                  >
                    <option value="New">待处理</option>
                    <option value="Contacted">跟进中</option>
                    <option value="Quoted">已报价</option>
                    <option value="Closed">已完成</option>
                  </select>
                </label>
                <h3>内部跟进备注</h3>
                {(
                  (editing.notes || []) as { text: string; createdAt: string }[]
                ).map((n, i) => (
                  <p key={i}>
                    {n.text}
                    <small>{n.createdAt}</small>
                  </p>
                ))}
                <label>
                  添加内部备注
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={2000}
                  />
                </label>
              </>
            ) : (
              <>
                {fields.map(([key, label]) => (
                  <label key={key}>
                    {label}
                    {["content", "description"].includes(key) ? (
                      <textarea
                        required={key === "content"}
                        value={String(editing[key] || "")}
                        onChange={(e) =>
                          setEditing({ ...editing, [key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        required={["name", "title", "slug"].includes(key)}
                        value={String(editing[key] || "")}
                        onChange={(e) =>
                          setEditing({ ...editing, [key]: e.target.value })
                        }
                      />
                    )}
                  </label>
                ))}
                <label className="commerce-check">
                  <input
                    type="checkbox"
                    checked={editing.published !== false}
                    onChange={(e) =>
                      setEditing({ ...editing, published: e.target.checked })
                    }
                  />
                  公开展示
                </label>
                {kind === "cases" && (
                  <fieldset>
                    <legend>关联商品</legend>
                    {products.map((p) => (
                      <label className="commerce-check" key={p.id}>
                        <input
                          type="checkbox"
                          checked={(
                            (editing.productIds as string[]) || []
                          ).includes(p.id)}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              productIds: e.target.checked
                                ? [
                                    ...((editing.productIds as string[]) || []),
                                    p.id,
                                  ]
                                : (
                                    (editing.productIds as string[]) || []
                                  ).filter((x) => x !== p.id),
                            })
                          }
                        />
                        {String(p.name)}
                      </label>
                    ))}
                  </fieldset>
                )}
              </>
            )}
            <div className="commerce-actions">
              <button className="primary" disabled={busy}>
                保存
              </button>
              {editing.id && kind !== "inquiries" && (
                <button
                  className="danger"
                  type="button"
                  onClick={() => void remove()}
                >
                  删除
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
function ShippingManager() {
  const [rules, setRules] = useState({
      regions: ["CN"],
      fee: 1500,
      freeThreshold: 30000,
      method: "Demo standard",
    }),
    [message, setMessage] = useState("");
  useEffect(() => {
    request<typeof rules>("/api/shipping")
      .then(setRules)
      .catch((e) => setMessage(e.message));
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await request("/api/shipping", "PUT", rules);
      setMessage("配送规则已保存，仅影响新订单。");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <form className="commerce-card commerce-fields" onSubmit={save}>
      <h2>配送地区与运费</h2>
      <label>
        国家代码（英文逗号分隔，如 CN,US,GB,AU）
        <input
          required
          value={rules.regions.join(",")}
          onChange={(e) =>
            setRules({
              ...rules,
              regions: e.target.value
                .split(",")
                .map((s) => s.trim().toUpperCase()),
            })
          }
        />
      </label>
      <label>
        固定运费（美元分）
        <input
          type="number"
          min="0"
          required
          value={rules.fee}
          onChange={(e) => setRules({ ...rules, fee: Number(e.target.value) })}
        />
      </label>
      <label>
        免邮门槛（美元分）
        <input
          type="number"
          min="0"
          required
          value={rules.freeThreshold}
          onChange={(e) =>
            setRules({ ...rules, freeThreshold: Number(e.target.value) })
          }
        />
      </label>
      <label>
        配送方式
        <input
          required
          value={rules.method}
          onChange={(e) => setRules({ ...rules, method: e.target.value })}
        />
      </label>
      <button className="primary">保存</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
function SecurityManager() {
  const [oldPassword, setOld] = useState(""),
    [newPassword, setNew] = useState(""),
    [confirm, setConfirm] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function password(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await request("/api/auth/password", "POST", { oldPassword, newPassword });
      location.href = "/login";
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reset(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await request<{ message: string }>(
        "/api/demo/reset",
        "POST",
        { confirm },
      );
      setMessage(data.message);
      setConfirm("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="commerce-card commerce-fields" onSubmit={password}>
        <h2>修改管理员密码</h2>
        <label>
          旧密码
          <input
            type="password"
            required
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOld(e.target.value)}
          />
        </label>
        <label>
          新密码（至少 12 位）
          <input
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
        </label>
        <button disabled={busy}>修改密码并重新登录</button>
      </form>
      <form className="commerce-card commerce-fields" onSubmit={reset}>
        <h2>重置演示数据</h2>
        <p>
          将商品恢复为 16
          款种子商品，重置订单、询盘、订阅和内容配置。管理员账号、密码和上传文件保留。
        </p>
        <label>
          输入 RESET DEMO 确认
          <input
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button className="danger" disabled={busy || confirm !== "RESET DEMO"}>
          执行演示重置
        </button>
      </form>
      {message && (
        <p role="status" className="commerce-message">
          {message}
        </p>
      )}
    </>
  );
}
