"use client";
import { useEffect, useState, type FormEvent } from "react";
import { request } from "./commerce-client";
import { money, type Product, type Variant } from "../lib/commerce-types";
type Category = { id: string; name: string };
const image = "/images/lumenhaus-aster-chandelier.webp";
const variant: Variant = {
  color: "Brass",
  size: "Standard",
  temperature: "3000K",
  price: 9900,
  stock: 20,
  image,
};
const blank: Product = {
  id: "",
  name: "",
  nameZh: "",
  model: "",
  category: "Chandeliers",
  price: "",
  description: "",
  descriptionZh: "",
  image,
  images: [image],
  featured: false,
  status: "Draft",
  material: "",
  installation: "",
  spaces: [],
  sortOrder: 0,
  variants: [variant],
};
export function ProductManager() {
  const [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [category, setCategory] = useState("");
  const [rows, setRows] = useState<Product[]>([]),
    [total, setTotal] = useState(0),
    [categories, setCategories] = useState<Category[]>([]),
    [spaces, setSpaces] = useState<Category[]>([]),
    [editing, setEditing] = useState<Product | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const data = await request<{ items: Product[]; total: number }>(
        `/api/products?page=${page}&pageSize=12&q=${encodeURIComponent(query)}&status=${status}&category=${encodeURIComponent(category)}`,
      );
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [page, query, status, category]);
  useEffect(() => {
    Promise.all([
      request<Category[]>("/api/categories"),
      request<Category[]>("/api/spaces"),
    ])
      .then(([c, s]) => {
        setCategories(c);
        setSpaces(s);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await request<Product>(
        "/api/products",
        editing?.id ? "PUT" : "POST",
        editing,
      );
      setEditing(saved);
      setMessage("商品已保存，前台读取已更新数据。");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!editing || !confirm("删除该商品？历史订单快照会保留。")) return;
    try {
      await request("/api/products", "DELETE", { id: editing.id });
      setEditing(null);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function upload(file: File | undefined) {
    if (!file || !editing) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/media", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEditing({ ...editing, images: [...editing.images, result.url] });
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function changeVariant(
    index: number,
    key: keyof Variant,
    value: string | number,
  ) {
    setEditing((current) =>
      current
        ? {
            ...current,
            variants: current.variants.map((v, i) =>
              i === index ? { ...v, [key]: value } : v,
            ),
          }
        : null,
    );
  }
  return (
    <main className="commerce">
      <a href="/admin">← 后台首页</a>
      <h1>商品与规格管理</h1>
      <p className="demo-banner">
        价格以美元显示，规格价格输入单位为美元分（100 =
        $1.00）。库存为可售数量。
      </p>
      <div className="commerce-actions">
        <a href="/admin/operations">订单与内容管理</a>
        <button
          className="primary"
          onClick={() => {
            setEditing({
              ...blank,
              category: categories[0]?.name || blank.category,
            });
            setMessage("");
          }}
        >
          新增商品
        </button>
        <button onClick={() => void load()}>刷新列表</button>
      </div>
      {message && (
        <p role="status" className="commerce-message">
          {message}
        </p>
      )}
      <div className="commerce-stock">
        <label>
          搜索
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          状态
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </label>
        <label>
          分类
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {categories.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="commerce-grid">
        <section>
          <div className="commerce-card">
            {rows.map((p) => (
              <div key={p.id} className="commerce-actions">
                <img className="commerce-image" src={p.image} alt="" />
                <div>
                  <b>{p.name}</b>
                  <small>
                    {p.model} · {p.status} · {p.price}
                  </small>
                  <button
                    onClick={() => {
                      setEditing(p);
                      setMessage("");
                    }}
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
            {!rows.length && <p>没有匹配商品</p>}
          </div>
          <div className="commerce-actions">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <span>
              {page} / {Math.max(1, Math.ceil(total / 12))} · {total} 件
            </span>
            <button
              disabled={page * 12 >= total}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </section>
        {editing ? (
          <form className="commerce-card commerce-fields" onSubmit={save}>
            <h2>{editing.id ? "编辑商品" : "新增商品"}</h2>
            {[
              ["name", "英文名称"],
              ["nameZh", "中文名称"],
              ["model", "型号"],
              ["description", "英文描述"],
              ["descriptionZh", "中文描述"],
              ["material", "材质"],
              ["installation", "安装说明"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                {["description", "descriptionZh", "installation"].includes(
                  key,
                ) ? (
                  <textarea
                    required={key === "description"}
                    value={String(editing[key as keyof Product] || "")}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    required={["name", "model"].includes(key)}
                    value={String(editing[key as keyof Product] || "")}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
            <label>
              分类
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              上下架
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option value="Draft">下架 / 草稿</option>
                <option value="Published">上架</option>
              </select>
            </label>
            <label className="commerce-check">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) =>
                  setEditing({ ...editing, featured: e.target.checked })
                }
              />
              首页精选推荐
            </label>
            <label>
              首页展示顺序（小值在前）
              <input
                type="number"
                min="0"
                max="10000"
                value={editing.sortOrder || 0}
                onChange={(e) =>
                  setEditing({ ...editing, sortOrder: Number(e.target.value) })
                }
              />
            </label>
            <fieldset>
              <legend>空间分类</legend>
              {spaces.map((s) => (
                <label key={s.id} className="commerce-check">
                  <input
                    type="checkbox"
                    checked={editing.spaces?.includes(s.id) || false}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        spaces: e.target.checked
                          ? [...(editing.spaces || []), s.id]
                          : (editing.spaces || []).filter((x) => x !== s.id),
                      })
                    }
                  />
                  {s.name}
                </label>
              ))}
            </fieldset>
            <h3>图片排序与封面</h3>
            <label>
              封面地址
              <input
                required
                value={editing.image}
                onChange={(e) =>
                  setEditing({ ...editing, image: e.target.value })
                }
              />
            </label>
            <label>
              上传图片（最大 5 MB）
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={busy}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            {(editing.images || []).map((url, i) => (
              <div key={`${url}-${i}`}>
                <img
                  src={url}
                  className="commerce-image"
                  alt={`商品图 ${i + 1}`}
                />
                <div className="commerce-actions">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, image: url })}
                  >
                    {editing.image === url ? "当前封面" : "设为封面"}
                  </button>
                  <button
                    type="button"
                    disabled={!i}
                    onClick={() => {
                      const images = [...editing.images];
                      [images[i - 1], images[i]] = [images[i], images[i - 1]];
                      setEditing({ ...editing, images });
                    }}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        images: editing.images.filter((_, j) => j !== i),
                      })
                    }
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setEditing({
                  ...editing,
                  images: [...(editing.images || []), editing.image],
                })
              }
            >
              将封面加入图库
            </button>
            <h3>规格组合</h3>
            {editing.variants.map((v, i) => (
              <fieldset key={v.id || i}>
                <legend>
                  规格 {i + 1} · {money(v.price)}
                </legend>
                <div className="commerce-fields">
                  {[
                    ["color", "颜色"],
                    ["size", "尺寸"],
                    ["temperature", "色温"],
                    ["image", "规格图片地址"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        required
                        value={String(v[key as keyof Variant] || "")}
                        onChange={(e) =>
                          changeVariant(i, key as keyof Variant, e.target.value)
                        }
                      />
                    </label>
                  ))}
                  <div className="commerce-grid">
                    <label>
                      价格（分）
                      <input
                        required
                        type="number"
                        min="1"
                        max="100000000"
                        value={v.price}
                        onChange={(e) =>
                          changeVariant(i, "price", Number(e.target.value))
                        }
                      />
                    </label>
                    <label>
                      库存
                      <input
                        required
                        type="number"
                        min="0"
                        max="100000000"
                        value={v.stock}
                        onChange={(e) =>
                          changeVariant(i, "stock", Number(e.target.value))
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={editing.variants.length === 1}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        variants: editing.variants.filter((_, j) => j !== i),
                      })
                    }
                  >
                    删除规格
                  </button>
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              onClick={() =>
                setEditing({
                  ...editing,
                  variants: [
                    ...editing.variants,
                    { ...variant, image: editing.image, color: "New color" },
                  ],
                })
              }
            >
              添加规格组合
            </button>
            <div className="commerce-actions">
              <button className="primary" disabled={busy}>
                保存商品
              </button>
              {editing.id && (
                <button
                  type="button"
                  className="danger"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  删除商品
                </button>
              )}
              <button type="button" onClick={() => setEditing(null)}>
                关闭
              </button>
            </div>
          </form>
        ) : (
          <section className="commerce-card">
            <h2>选择商品开始编辑</h2>
            <p>变更保存后前台会读取最新商品和规格。</p>
          </section>
        )}
      </div>
    </main>
  );
}
