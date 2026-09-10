const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { redirect: "manual", ...options });
  const body = await response.text();
  return { response, body };
}
function assert(condition, label) { if (!condition) throw new Error(`Smoke check failed: ${label}`); console.log(`✓ ${label}`); }

const home = await request("/");
assert(home.response.status === 200 && home.body.includes("LUMENHAUS"), "home page renders");

const products = await request("/api/products");
const catalogue = JSON.parse(products.body);
assert(products.response.status === 200 && catalogue.length >= 30, "public catalogue API returns published products");

const categories = await request("/api/categories");
const publicCategories = JSON.parse(categories.body);
assert(categories.response.status === 200 && publicCategories.every((category) => category.published), "public category API excludes drafts");

const productPage = await request(`/product/${catalogue[0].id}`);
assert(productPage.response.status === 200 && productPage.body.includes(catalogue[0].model), "product detail renders");

const privateAdmin = await request("/admin");
assert(privateAdmin.response.status === 307 && privateAdmin.response.headers.get("location") === "/login", "admin redirects unauthenticated visitors");

const login = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: process.env.ADMIN_USERNAME || "admin", password: process.env.ADMIN_PASSWORD || "demo-2026" }) });
const cookie = login.headers.get("set-cookie")?.split(";")[0];
assert(login.status === 200 && cookie, "admin authentication issues session cookie");

for (const path of ["/admin", "/admin/products", "/admin/categories", "/admin/articles", "/admin/media"]) {
  const page = await request(path, { headers: { Cookie: cookie } });
  assert(page.response.status === 200, `authenticated CMS page ${path} renders`);
}

const logout = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
assert(logout.status === 200, "admin logout endpoint clears the session");

console.log("Smoke checks passed.");
