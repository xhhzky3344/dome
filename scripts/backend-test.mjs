import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { browserChecks } from "./backend-browser.mjs";
const root = process.cwd();
mkdirSync(path.join(root, ".backend-test"), { recursive: true });
const directory = mkdtempSync(path.join(root, ".backend-test", "run-"));
const port = Number(process.env.TEST_PORT || 3317),
  base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-p",
    String(port),
    "-H",
    "127.0.0.1",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_PATH: path.join(directory, "demo.sqlite"),
      UPLOAD_DIR: path.join(directory, "uploads"),
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "demo-test-password",
      APP_ORIGIN: base,
      TRUST_PROXY: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
server.stdout.on("data", (x) => (logs += x));
server.stderr.on("data", (x) => (logs += x));
let checks = 0,
  cookie = "";
const check = (condition, label) => {
  assert.ok(condition, label);
  checks++;
  console.log(`PASS ${label}`);
};
async function call(
  url,
  method = "GET",
  data,
  admin = false,
  token,
  extra = {},
) {
  const response = await fetch(base + url, {
    method,
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(admin ? { Cookie: cookie } : {}),
      ...(token ? { "x-order-token": token } : {}),
      ...extra,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  return { status: response.status, data: result, response };
}
async function ok(url, method = "GET", data, admin = false, token) {
  const result = await call(url, method, data, admin, token);
  assert.equal(
    result.status,
    200,
    `${method} ${url}: ${JSON.stringify(result.data)}`,
  );
  return result.data;
}
const address = {
  name: "Demo test",
  email: "test@example.com",
  phone: "000000000",
  region: "CN",
  city: "Test city",
  street: "Test only",
  postalCode: "000000",
};
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + "/api/health")).ok) break;
    } catch {}
    if (server.exitCode !== null) throw new Error(logs);
    await new Promise((r) => setTimeout(r, 250));
  }
  check(
    (await call("/api/health")).status === 200,
    "health and database initialization",
  );
  for (const route of [
    "dashboard",
    "orders",
    "inquiries",
    "subscriptions",
    "media",
  ])
    check(
      (await call(`/api/${route}`)).status === 401,
      `${route} rejects anonymous access`,
    );
  for (const route of [
    "products",
    "categories",
    "spaces",
    "cases",
    "content",
    "articles",
    "settings",
    "shipping",
  ])
    check(
      (await call(`/api/${route}`, "PUT", {})).status === 401,
      `${route} rejects anonymous mutation`,
    );
  check(
    (await call("/api/demo/reset", "POST", { confirm: "RESET DEMO" }))
      .status === 401,
    "anonymous reset forbidden",
  );
  const login = await call("/api/auth/login", "POST", {
    username: "admin",
    password: "demo-test-password",
  });
  cookie = login.response.headers.get("set-cookie")?.split(";")[0] || "";
  check(
    login.status === 200 && cookie.includes("lumenhaus_admin="),
    "login creates session",
  );
  check(
    (
      await call("/api/shipping", "PUT", {}, true, undefined, {
        Origin: "https://evil.example",
      })
    ).status === 403,
    "cross-origin admin write rejected",
  );
  const seed = await ok("/api/products");
  check(
    seed.length >= 12 && seed.every((p) => p.variants.length > 0),
    "existing catalogue migrated with variants",
  );
  const entry = await ok(
    "/api/products",
    "POST",
    {
      name: "Backend test lamp",
      nameZh: "测试灯具",
      model: "BACKEND-TEST",
      category: seed[0].category,
      status: "Published",
      featured: true,
      sortOrder: 0,
      description: "Test description",
      image: seed[0].image,
      images: [seed[0].image],
      material: "Brass",
      installation: "Professional",
      spaces: [],
      variants: [
        {
          color: "Gold",
          size: "30cm",
          temperature: "3000K",
          price: 12000,
          stock: 3,
          image: seed[0].image,
        },
      ],
    },
    true,
  );
  const vid = entry.variants[0].id;
  check(
    (await ok(`/api/products?id=${entry.id}`)).name === entry.name,
    "admin product immediately visible to storefront",
  );
  check(
    (await ok("/api/products?page=1&pageSize=2")).items.length === 2,
    "paginated products",
  );
  const token = randomUUID() + randomUUID(),
    payload = {
      items: [{ variantId: vid, quantity: 1, price: 1 }],
      address,
      idempotencyKey: randomUUID(),
      queryToken: token,
      total: 1,
    };
  const created = await ok("/api/orders", "POST", payload);
  check(
    created.subtotal === 12000 && created.total === 13500 && created.demo === 1,
    "server ignores client prices and marks demo",
  );
  const duplicate = await ok("/api/orders", "POST", payload);
  check(duplicate.id === created.id, "duplicate submission returns same order");
  check(
    (
      await call("/api/orders", "POST", {
        ...payload,
        items: [{ variantId: vid, quantity: 2 }],
      })
    ).status === 409,
    "idempotency conflict rejects changed payload",
  );
  check(
    (await call(`/api/orders?id=${created.id}`)).status === 404,
    "order address protected without credential",
  );
  check(
    (
      await call(
        `/api/orders?id=${created.id}`,
        "GET",
        undefined,
        false,
        "bad-token",
      )
    ).status === 404,
    "invalid order credential rejected",
  );
  check(
    (await ok(`/api/orders?id=${created.id}`, "GET", undefined, false, token))
      .address.email === address.email,
    "correct credential reads order",
  );
  check(
    (
      await call(
        "/api/orders",
        "PATCH",
        { id: created.id, action: "ship", carrier: "X", tracking: "Y" },
        false,
        token,
      )
    ).status === 401,
    "customer cannot ship order",
  );
  await ok(
    "/api/products",
    "PUT",
    { ...entry, variants: entry.variants.map((v) => ({ ...v, price: 15000 })) },
    true,
  );
  const fail = await ok(
    "/api/orders",
    "PATCH",
    { id: created.id, action: "fail" },
    false,
    token,
  );
  check(fail.status === "payment_failed", "simulated payment failure");
  const paid = await ok(
    "/api/orders",
    "PATCH",
    { id: created.id, action: "pay" },
    false,
    token,
  );
  check(
    paid.items[0].price === 12000 && paid.total === 13500,
    "order snapshot unchanged after catalogue price change",
  );
  await Promise.all(
    Array.from({ length: 4 }, () =>
      ok(
        "/api/orders",
        "PATCH",
        { id: created.id, action: "pay" },
        false,
        token,
      ),
    ),
  );
  const afterPay = await ok(`/api/products?id=${entry.id}`);
  check(
    afterPay.variants[0].stock === 2,
    "concurrent duplicate payment deducts once",
  );
  check(
    (await call("/api/products", "PUT", entry, true)).status === 409,
    "stale admin edits cannot overwrite stock",
  );
  await ok(
    "/api/orders",
    "PATCH",
    {
      id: created.id,
      action: "ship",
      carrier: "Demo carrier",
      tracking: "DEMO-TEST",
    },
    true,
  );
  const shipped = await ok(
    `/api/orders?id=${created.id}`,
    "GET",
    undefined,
    false,
    token,
  );
  check(
    shipped.status === "shipped" && shipped.tracking === "DEMO-TEST",
    "admin shipping visible to customer",
  );
  await ok("/api/orders", "PATCH", { id: created.id, action: "refund" }, true);
  await ok("/api/orders", "PATCH", { id: created.id, action: "refund" }, true);
  check(
    (await ok(`/api/products?id=${entry.id}`)).variants[0].stock === 3,
    "duplicate refund restores stock once",
  );
  check(
    (
      await call(
        "/api/orders",
        "PATCH",
        { id: created.id, action: "pay" },
        false,
        token,
      )
    ).status === 409,
    "refunded order cannot be paid again",
  );
  const newPayload = (quantity = 1, region = "CN") => ({
    ...payload,
    idempotencyKey: randomUUID(),
    items: [{ variantId: vid, quantity }],
    address: { ...address, region },
  });
  check(
    (await call("/api/orders", "POST", newPayload(4))).status === 409,
    "insufficient stock on creation",
  );
  check(
    (await call("/api/orders", "POST", newPayload(1, "ZZ"))).status === 400,
    "unsupported shipping region",
  );
  const race1 = await ok("/api/orders", "POST", newPayload(3)),
    race2 = await ok("/api/orders", "POST", newPayload(3));
  const raced = await Promise.all(
    [race1, race2].map((o) =>
      call("/api/orders", "PATCH", { id: o.id, action: "pay" }, false, token),
    ),
  );
  check(
    raced.filter((r) => r.status === 200).length === 1 &&
      raced.filter((r) => r.status === 409).length === 1,
    "competing payments cannot oversell",
  );
  const winner = raced.find((r) => r.status === 200).data;
  await ok(
    "/api/orders",
    "PATCH",
    { id: winner.id, action: "cancel" },
    false,
    token,
  );
  await ok(
    "/api/orders",
    "PATCH",
    { id: winner.id, action: "cancel" },
    false,
    token,
  );
  check(
    (await ok(`/api/products?id=${entry.id}`)).variants[0].stock === 3,
    "paid cancellation restores stock exactly once",
  );
  const current = await ok(`/api/products?id=${entry.id}`);
  await ok("/api/products", "PUT", { ...current, status: "Draft" }, true);
  check(
    (await call("/api/orders", "POST", newPayload())).status === 409,
    "unpublished product cannot be ordered",
  );
  check(
    (
      await call("/api/inquiries", "POST", {
        name: " ",
        email: "invalid",
        message: "hi",
      })
    ).status === 400,
    "inquiry validation",
  );
  const inquiry = await ok("/api/inquiries", "POST", {
    name: "Demo inquiry",
    email: "demo@example.com",
    message: "Demo only",
  });
  await ok(
    "/api/inquiries",
    "PUT",
    { id: inquiry.id, status: "Contacted", note: "Internal follow-up" },
    true,
  );
  const detail = await ok(
    `/api/inquiries?id=${inquiry.id}`,
    "GET",
    undefined,
    true,
  );
  check(
    detail.status === "Contacted" && detail.notes.length === 1,
    "inquiry workflow and internal notes",
  );
  await ok("/api/subscriptions", "POST", { email: "Demo@Example.com" });
  await ok("/api/subscriptions", "POST", { email: "demo@example.com" });
  check(
    (await ok("/api/subscriptions", "GET", undefined, true)).length === 1,
    "subscription normalized and deduplicated",
  );
  const shipping = await ok("/api/shipping");
  check(
    (await call("/api/shipping", "PUT", { ...shipping, fee: -1 }, true))
      .status === 400,
    "negative shipping rejected",
  );
  const settings = await ok("/api/settings");
  check(
    (
      await call(
        "/api/settings",
        "PUT",
        { ...settings, facebookUrl: "javascript:alert(1)" },
        true,
      )
    ).status === 400,
    "unsafe content URL rejected",
  );
  const form = new FormData();
  form.set(
    "file",
    new Blob(["<script>bad</script>"], { type: "image/png" }),
    "fake.png",
  );
  check(
    (
      await fetch(base + "/api/media", {
        method: "POST",
        headers: { Cookie: cookie },
        body: form,
      })
    ).status === 400,
    "fake image signature rejected",
  );
  const valid = new FormData();
  valid.set(
    "file",
    new Blob([readFileSync("public/images/lumenhaus-aster-chandelier.webp")], {
      type: "image/webp",
    }),
    "test.webp",
  );
  const upload = await fetch(base + "/api/media", {
    method: "POST",
    headers: { Cookie: cookie },
    body: valid,
  });
  const uploaded = await upload.json();
  check(
    upload.ok && (await fetch(base + uploaded.url)).ok,
    "new upload served without server restart",
  );
  check(
    (await ok("/api/dashboard", "GET", undefined, true)).orders >= 6,
    "dashboard includes demo orders",
  );
  await ok("/api/auth/logout", "POST", undefined, true);
  check(
    (await call("/api/dashboard", "GET", undefined, true)).status === 401,
    "logout revokes server-side session",
  );
  const relogin = await call("/api/auth/login", "POST", {
    username: "admin",
    password: "demo-test-password",
  });
  cookie = relogin.response.headers.get("set-cookie").split(";")[0];
  await ok(
    "/api/auth/password",
    "POST",
    { oldPassword: "demo-test-password", newPassword: "new-demo-password-123" },
    true,
  );
  check(
    (await call("/api/dashboard", "GET", undefined, true)).status === 401,
    "password change invalidates sessions",
  );
  check(
    (
      await call("/api/auth/login", "POST", {
        username: "admin",
        password: "demo-test-password",
      })
    ).status === 401,
    "old password no longer authenticates",
  );
  const fresh = await call("/api/auth/login", "POST", {
    username: "admin",
    password: "new-demo-password-123",
  });
  cookie = fresh.response.headers.get("set-cookie").split(";")[0];
  check(
    (await call("/api/demo/reset", "POST", { confirm: "wrong" }, true))
      .status === 400,
    "reset requires explicit confirmation phrase",
  );
  await ok("/api/demo/reset", "POST", { confirm: "RESET DEMO" }, true);
  check(
    (await ok("/api/products")).length === 16,
    "reset seeds sixteen products",
  );
  check(
    (await ok("/api/orders", "GET", undefined, true)).length === 3,
    "reset seeds three example orders",
  );
  check(
    (await call("/api/dashboard", "GET", undefined, true)).status === 200,
    "reset preserves administrator and active session",
  );
  const connection = new DatabaseSync(path.join(directory, "demo.sqlite"));
  const hash = connection
    .prepare("SELECT password_hash FROM administrators")
    .get().password_hash;
  check(
    !hash.includes("new-demo-password") && hash.includes(":"),
    "password stored as salted scrypt hash",
  );
  check(
    connection.prepare("PRAGMA integrity_check").get().integrity_check === "ok",
    "SQLite integrity check",
  );
  connection.close();
  if (process.env.TEST_BROWSER !== "0")
    await browserChecks({ base, password: "new-demo-password-123", directory });
  const limited = await Promise.all(
    Array.from({ length: 12 }, () =>
      call("/api/auth/login", "POST", { username: "wrong", password: "wrong" }),
    ),
  );
  check(
    limited.some((r) => r.status === 429),
    "login rate limiting",
  );
  console.log(
    `\n${checks} backend checks passed. Isolated database: ${directory}`,
  );
} catch (error) {
  console.error(logs.slice(-6000));
  throw error;
} finally {
  server.kill();
}
