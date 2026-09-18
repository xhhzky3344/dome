import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export type RecordData = { id: string; [key: string]: unknown };
let instance: DatabaseSync;
const tables: Record<string, string> = {
  products: "products",
  categories: "categories",
  spaces: "spaces",
  articles: "articles",
  inquiries: "inquiries",
  settings: "content_settings",
  shipping: "shipping_rules",
  cases: "space_cases",
  content: "content_pages",
};
function table(kind: string) {
  const name = tables[kind];
  if (!name) throw new Error("Unknown resource");
  return name;
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function db() {
  if (instance) return instance;
  const file =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "demo.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  instance = new DatabaseSync(file);
  instance.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
    CREATE TABLE IF NOT EXISTS administrators(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,admin_id INTEGER NOT NULL REFERENCES administrators(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS variants(id TEXT PRIMARY KEY,product_id TEXT NOT NULL,color TEXT NOT NULL,size TEXT NOT NULL,temperature TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),stock INTEGER NOT NULL CHECK(stock>=0),image TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
    CREATE INDEX IF NOT EXISTS variants_product ON variants(product_id);
    CREATE TABLE IF NOT EXISTS product_images(product_id TEXT NOT NULL,position INTEGER NOT NULL,url TEXT NOT NULL,PRIMARY KEY(product_id,position));
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,number TEXT UNIQUE NOT NULL,token_hash TEXT NOT NULL,idempotency TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,status TEXT NOT NULL,subtotal INTEGER NOT NULL,shipping INTEGER NOT NULL,total INTEGER NOT NULL,address TEXT NOT NULL,method TEXT NOT NULL,carrier TEXT NOT NULL DEFAULT '',tracking TEXT NOT NULL DEFAULT '',stock_deducted INTEGER NOT NULL DEFAULT 0,demo INTEGER NOT NULL DEFAULT 1 CHECK(demo=1),created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,variant_id TEXT NOT NULL REFERENCES variants(id),product_id TEXT NOT NULL,name TEXT NOT NULL,specification TEXT NOT NULL,price INTEGER NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),image TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_events(id INTEGER PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,status TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscriptions(email TEXT PRIMARY KEY,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
  for (const name of Object.values(tables))
    instance.exec(
      `CREATE TABLE IF NOT EXISTS ${name}(id TEXT PRIMARY KEY,data TEXT NOT NULL)`,
    );
  // Copy records created by the first development schema without losing edits.
  for (const [kind, name] of Object.entries(tables))
    instance
      .prepare(
        `INSERT OR IGNORE INTO ${name}(id,data) SELECT id,data FROM records WHERE kind=?`,
      )
      .run(kind);
  instance.exec("DELETE FROM records");
  transaction(() => {
    if (
      !instance
        .prepare("SELECT key FROM metadata WHERE key='initialized'")
        .get()
    ) {
      for (const [kind, file] of Object.entries({
        products: "catalog",
        categories: "categories",
        articles: "articles",
        inquiries: "inquiries",
      })) {
        for (const item of JSON.parse(
          readFileSync(
            path.join(process.cwd(), "data", `${file}.json`),
            "utf8",
          ),
        ))
          put(kind, item);
      }
      put("settings", {
        ...JSON.parse(
          readFileSync(
            path.join(process.cwd(), "data/site-settings.json"),
            "utf8",
          ),
        ),
        id: "site",
      });
      for (const [id, name] of [
        ["living", "客厅"],
        ["dining", "餐厅"],
        ["bedroom", "卧室"],
      ])
        put("spaces", { id, name, published: true });
      put("shipping", {
        id: "rules",
        regions: ["CN", "US", "GB", "AU"],
        fee: 1500,
        freeThreshold: 30000,
        method: "Demo standard",
      });
      for (const [i, p] of list("products").entries()) {
        p.material = "Metal and glass";
        p.installation = "Professional installation required.";
        p.spaces = ["living", "dining", "bedroom"][i % 3].split(",");
        p.sortOrder = i;
        put("products", p);
        instance
          .prepare(
            "INSERT INTO variants(id,product_id,color,size,temperature,price,stock,image) VALUES(?,?,?,?,?,?,?,?)",
          )
          .run(
            `${p.id}-default`,
            p.id,
            "Brass",
            "Standard",
            "3000K",
            Math.round(
              Number(String(p.price).match(/[\d.]+/)?.[0] || 99) * 100,
            ),
            20,
            String(p.image),
          );
        (Array.isArray(p.images) && p.images.length
          ? p.images
          : [p.image]
        ).forEach((url, position) =>
          instance
            .prepare("INSERT INTO product_images VALUES(?,?,?)")
            .run(p.id, position, String(url)),
        );
      }
      instance.prepare("INSERT INTO metadata VALUES('initialized','1')").run();
    }
    if (
      !instance
        .prepare("SELECT key FROM metadata WHERE key='demo_seed_v1'")
        .get()
    ) {
      for (const [id, title, content] of [
        [
          "faq",
          "常见问题 / FAQ",
          "所有价格、付款和物流均为演示。商品可按颜色、尺寸和色温选择。",
        ],
        [
          "delivery",
          "配送说明 / Delivery",
          "目前演示配送地区为 CN、US、GB、AU。运费以结算页计算结果为准。",
        ],
        [
          "returns",
          "退换货说明 / Returns",
          "本网站不产生真实交易。演示订单可以由管理员模拟退款并恢复库存。",
        ],
        [
          "brand",
          "品牌介绍 / Our studio",
          "Lumenhaus 是灯具独立站演示项目，提供空间照明方案展示。",
        ],
      ])
        put("content", { id, title, content, published: true });
      const first = list("products")[0];
      if (first)
        put("cases", {
          id: "demo-living",
          title: "客厅灯光案例 / Living room",
          content: "以柔和暖光营造舒适的客厅空间。",
          image: first.image,
          productIds: [first.id],
          published: true,
        });
      seedOrders();
      const snapshot = Object.fromEntries(
        Object.keys(tables).map((kind) => [kind, list(kind)]),
      );
      instance
        .prepare("INSERT INTO metadata VALUES('demo_seed_v1',?)")
        .run(JSON.stringify(snapshot));
    }
    if (!instance.prepare("SELECT id FROM administrators LIMIT 1").get())
      instance
        .prepare(
          "INSERT INTO administrators(username,password_hash) VALUES(?,?)",
        )
        .run(
          process.env.ADMIN_USERNAME || "admin",
          hashPassword(process.env.ADMIN_PASSWORD || "demo-2026"),
        );
  });
  return instance;
}
export function transaction<T>(fn: () => T): T {
  const connection = db();
  connection.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    connection.exec("COMMIT");
    return result;
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
}
export function list(kind: string): RecordData[] {
  return db()
    .prepare(`SELECT data FROM ${table(kind)} ORDER BY rowid DESC`)
    .all()
    .map((row) => JSON.parse(String(row.data)));
}
export function get(kind: string, id: string): RecordData | undefined {
  const row = db()
    .prepare(`SELECT data FROM ${table(kind)} WHERE id=?`)
    .get(id);
  return row ? JSON.parse(String(row.data)) : undefined;
}
export function put(kind: string, item: RecordData) {
  db()
    .prepare(
      `INSERT INTO ${table(kind)}(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
    )
    .run(item.id, JSON.stringify(item));
  return item;
}
export function remove(kind: string, id: string) {
  db()
    .prepare(`DELETE FROM ${table(kind)} WHERE id=?`)
    .run(id);
}
function seedOrders() {
  const p = list("products").find((x) => x.status === "Published");
  if (!p) return;
  const v = db()
    .prepare("SELECT * FROM variants WHERE product_id=? AND active=1 LIMIT 1")
    .get(p.id);
  if (!v) return;
  for (const status of ["pending", "paid", "shipped"]) {
    const id = randomUUID(),
      now = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO orders(id,number,token_hash,idempotency,request_hash,status,subtotal,shipping,total,address,method,carrier,tracking,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        id,
        `DEMO-SEED-${status}-${id.slice(0, 8)}`,
        randomBytes(32).toString("hex"),
        randomUUID(),
        "seed",
        status,
        Number(v.price),
        0,
        Number(v.price),
        JSON.stringify({
          name: "Demo buyer",
          email: "buyer@example.com",
          phone: "000000000",
          region: "CN",
          city: "Demo city",
          street: "Demo address",
          postalCode: "000000",
        }),
        "Demo standard",
        status === "shipped" ? "Demo Logistics" : "",
        status === "shipped" ? "DEMO123456" : "",
        status === "pending" ? 0 : 1,
        now,
      );
    db()
      .prepare(
        "INSERT INTO order_items(order_id,variant_id,product_id,name,specification,price,quantity,image) VALUES(?,?,?,?,?,?,1,?)",
      )
      .run(
        id,
        String(v.id),
        p.id,
        String(p.name),
        `${v.color} / ${v.size} / ${v.temperature}`,
        Number(v.price),
        String(v.image),
      );
    if (status !== "pending")
      db()
        .prepare("UPDATE variants SET stock=stock-1 WHERE id=? AND stock>0")
        .run(String(v.id));
    for (const state of status === "shipped"
      ? ["pending", "paid", "shipped"]
      : status === "paid"
        ? ["pending", "paid"]
        : ["pending"])
      db()
        .prepare(
          "INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)",
        )
        .run(id, state, "初始化演示订单", now);
  }
}
export function resetDemo() {
  return transaction(() => {
    const snapshot = JSON.parse(
      String(
        db()
          .prepare("SELECT value FROM metadata WHERE key='demo_seed_v1'")
          .get()!.value,
      ),
    );
    db().exec(
      "DELETE FROM order_events; DELETE FROM order_items; DELETE FROM orders; DELETE FROM variants; DELETE FROM product_images; DELETE FROM subscriptions; DELETE FROM records;",
    );
    for (const kind of Object.keys(tables)) {
      db().exec(`DELETE FROM ${table(kind)}`);
      const rows: RecordData[] =
        kind === "products" ? snapshot[kind].slice(0, 16) : snapshot[kind];
      for (const row of rows) put(kind, row);
    }
    for (const p of list("products"))
      db()
        .prepare("INSERT INTO variants VALUES(?,?,?,?,?,?,?,?,1)")
        .run(
          `${p.id}-default`,
          p.id,
          "Brass",
          "Standard",
          "3000K",
          Math.round(Number(String(p.price).match(/[\d.]+/)?.[0] || 99) * 100),
          20,
          String(p.image),
        );
    for (const p of list("products"))
      (Array.isArray(p.images) && p.images.length
        ? p.images
        : [p.image]
      ).forEach((url, position) =>
        db()
          .prepare("INSERT INTO product_images VALUES(?,?,?)")
          .run(p.id, position, String(url)),
      );
    for (const c of list("cases"))
      put("cases", {
        ...c,
        productIds: (c.productIds as string[]).filter(
          (id) => !!get("products", id),
        ),
      });
    seedOrders();
    return {
      ok: true,
      products: list("products").length,
      message: "演示数据已重置，管理员密码与上传文件保留",
    };
  });
}
