import { randomUUID } from "node:crypto";
import { db, get, list, put, transaction, type RecordData } from "./db";
import { integer, requireValue, safeUrl, str } from "./http";
export function products() {
  return list("products")
    .map(product)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}
export function product(p: RecordData): RecordData {
  return {
    ...p,
    images: db()
      .prepare(
        "SELECT url FROM product_images WHERE product_id=? ORDER BY position",
      )
      .all(p.id)
      .map((x) => String(x.url)),
    variants: db()
      .prepare(
        "SELECT * FROM variants WHERE product_id=? AND active=1 ORDER BY rowid",
      )
      .all(p.id)
      // node:sqlite returns rows with a null prototype. Convert them at the
      // server/client boundary so React can serialize the props safely.
      .map((row) => ({ ...row })),
  };
}
export function saveProduct(input: Record<string, unknown>, creating: boolean) {
  return transaction(() => {
    const id = creating ? randomUUID() : str(input.id, "商品 ID");
    const previous = get("products", id);
    requireValue(creating || previous, "商品不存在", 404);
    requireValue(
      creating ||
        Number(input.revision || 0) === Number(previous?.revision || 0),
      "商品或库存已变化，请刷新后重新编辑",
      409,
    );
    const p: RecordData = { ...previous, ...input, id };
    p.name = str(p.name, "名称");
    p.model = str(p.model, "型号");
    p.description = str(p.description, "英文描述", 10000);
    p.category = str(p.category, "分类");
    requireValue(
      list("categories").some((c) => c.name === p.category),
      "分类不存在",
    );
    p.image = safeUrl(p.image);
    requireValue(
      ["Draft", "Published"].includes(String(p.status)),
      "状态不正确",
    );
    p.featured = !!p.featured;
    for (const field of ["material", "installation", "nameZh", "descriptionZh"])
      p[field] = str(p[field], field, 10000, true);
    p.sortOrder = integer(p.sortOrder ?? 0, "推荐排序", 0, 10000);
    requireValue(
      !p.spaces ||
        (Array.isArray(p.spaces) &&
          p.spaces.every(
            (s: unknown) => typeof s === "string" && get("spaces", s),
          )),
      "空间分类不存在",
    );
    if (input.images !== undefined) {
      requireValue(
        Array.isArray(input.images) && input.images.length <= 20,
        "图片最多 20 张",
      );
      db().prepare("DELETE FROM product_images WHERE product_id=?").run(id);
      input.images.forEach((url, i) =>
        db()
          .prepare("INSERT INTO product_images VALUES(?,?,?)")
          .run(id, i, safeUrl(url)),
      );
    }
    if (input.variants !== undefined) {
      requireValue(
        Array.isArray(input.variants) &&
          input.variants.length > 0 &&
          input.variants.length <= 100,
        "规格数量需要为 1–100",
      );
      db().prepare("UPDATE variants SET active=0 WHERE product_id=?").run(id);
      const combinations = new Set();
      const ids = new Set();
      for (const raw of input.variants) {
        requireValue(raw && typeof raw === "object", "规格格式错误");
        const v = raw as Record<string, unknown>;
        const vid = v.id ? str(v.id, "规格 ID") : randomUUID();
        requireValue(!ids.has(vid), "规格 ID 重复");
        ids.add(vid);
        const existing = db()
          .prepare("SELECT product_id FROM variants WHERE id=?")
          .get(vid);
        requireValue(!existing || existing.product_id === id, "规格归属不正确");
        const color = str(v.color, "颜色"),
          size = str(v.size, "尺寸"),
          temperature = str(v.temperature, "色温");
        const key = JSON.stringify([color, size, temperature]);
        requireValue(!combinations.has(key), "规格组合重复");
        combinations.add(key);
        db()
          .prepare(
            "INSERT INTO variants VALUES(?,?,?,?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET color=excluded.color,size=excluded.size,temperature=excluded.temperature,price=excluded.price,stock=excluded.stock,image=excluded.image,active=1",
          )
          .run(
            vid,
            id,
            color,
            size,
            temperature,
            integer(v.price, "价格（分）", 1),
            integer(v.stock, "库存"),
            safeUrl(v.image || p.image),
          );
      }
    } else if (creating) {
      db()
        .prepare("INSERT INTO variants VALUES(?,?,?,?,?,?,?,?,1)")
        .run(
          randomUUID(),
          id,
          "Brass",
          "Standard",
          "3000K",
          9900,
          0,
          String(p.image),
        );
    }
    const min = db()
      .prepare(
        "SELECT MIN(price) price FROM variants WHERE product_id=? AND active=1",
      )
      .get(id);
    p.price = `From $${(Number(min?.price || 0) / 100).toFixed(2)}`;
    p.revision = Number(previous?.revision || 0) + 1;
    delete p.variants;
    delete p.images;
    put("products", p);
    return product(p);
  });
}
