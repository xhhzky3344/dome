import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.UI_BASE_URL || "http://localhost:3102";
const browser = await chromium.launch();
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  page.on("pageerror", error => failures.push(error.message));
  const visit = path => page.goto(base + path);
  const toggle = () => page.getByRole("button", { name: "Switch site language" }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/products", "/contact", "/product/lh-101", "/quote-list"]) {
      await visit(path);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, path + " must not overflow at " + width);
      if (path === "/" && width < 761) {
        const boxes = await page.locator(".hero-actions a").evaluateAll(elements => elements.map(e => e.getBoundingClientRect().toJSON()));
        assert.ok(boxes.every(b => b.x >= 0 && b.right <= width && b.height >= 44));
        assert.ok(boxes[1].top >= boxes[0].bottom, "mobile actions are stacked");
      }
      const contrast = await page.locator(".nav-search").evaluate(e => {
        const color = getComputedStyle(e).color.match(/\d+/g).map(Number);
        const background = getComputedStyle(e.closest("header")).backgroundColor.match(/\d+/g).map(Number);
        const lum = a => a.slice(0,3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((s,x,i) => s + x * [.2126,.7152,.0722][i], 0);
        const values = [lum(color), lum(background)].sort((a,b) => a-b);
        return (values[1]+.05)/(values[0]+.05);
      });
      assert.ok(contrast >= 3, "navigation contrast");
    }
  }
  console.log("PASS responsive layout and navigation contrast at four widths");
  await page.setViewportSize({ width:390, height:900 });
  await visit("/products");
  assert.equal(await page.locator(".archive-card").count(), 6);
  const first = await page.locator(".archive-card").first().getAttribute("href");
  await page.getByRole("button", { name:"Next", exact:true }).click();
  assert.notEqual(await page.locator(".archive-card").first().getAttribute("href"), first);
  await page.locator(".mobile-category select").selectOption("Table Lamps");
  assert.equal(await page.locator(".archive-card").count(), 3);
  assert.equal(await page.locator(".catalog-pagination").count(), 0);
  await page.locator(".mobile-category select").selectOption("All");
  await toggle();
  await page.getByRole("textbox", { name:"搜索型号或产品名称" }).fill("线形吊灯");
  await page.waitForFunction(() => document.querySelector(".archive-card h3")?.textContent.includes("线形吊灯"));
  assert.equal(await page.locator(".archive-card").count(), 2);
  await page.getByRole("textbox", { name:"搜索型号或产品名称" }).fill("does-not-exist");
  await page.getByRole("button", { name:"清除筛选" }).click();
  assert.equal(await page.locator(".archive-card").count(), 6);
  await page.evaluate(() => window.scrollTo(0,1000));
  await page.waitForFunction(() => Math.abs(document.querySelector(".archive-toolbar").getBoundingClientRect().top) < 1);
  console.log("PASS pagination, category reset, Chinese search, empty state and sticky filters");

  await visit("/product/lh-101");
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Aster 线形吊灯");
  assert.equal(await page.locator(".gallery-thumbs").count(), 0, "do not pad single-image galleries");
  await page.locator(".gallery-main").click();
  assert.equal(await page.locator("dialog[open]").count(),1);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(),0);
  await page.getByRole("button", { name:"加入报价单", exact:true }).click();
  await page.waitForFunction(() => document.querySelector(".quote-count")?.textContent === "1");
  await page.locator(".quote-button").click();
  await page.waitForFunction(() => document.querySelector(".quote-items h2")?.textContent === "Aster 线形吊灯");
  await toggle();
  await page.waitForFunction(() => document.querySelector(".quote-items h2")?.textContent === "Aster Linear Chandelier");
  await toggle();
  await page.getByRole("link", { name:"为 1 个型号获取报价" }).click();
  await page.waitForSelector(".selected-models");
  assert.match(await page.locator(".selected-models").innerText(), /LH-101/);
  console.log("PASS genuine gallery, quote count, bilingual list and contact handoff");

  let calls = 0;
  let release;
  let payload;
  await page.route("**/api/inquiries", async route => {
    calls++;
    payload = route.request().postDataJSON();
    if (calls === 1) await new Promise(resolve => { release = resolve; });
    await route.fulfill({ status:calls === 1 ? 500 : 201, contentType:"application/json", body:"{}" });
  });
  await page.getByLabel("您的姓名 *").fill("UI review");
  await page.getByLabel("工作邮箱 *").fill("ui@example.com");
  await page.getByLabel("采购需求 *").fill("20 件，黄铜色");
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name:"发送询盘", exact:true }).click();
  await page.getByRole("button", { name:"发送中…" }).waitFor();
  assert.ok(await page.getByRole("button", { name:"发送中…" }).isDisabled());
  assert.equal(calls, 1);
  await page.waitForFunction(() => document.querySelector("form").getAttribute("aria-busy") === "true");
  while (!release) await new Promise(resolve => setTimeout(resolve,10));
  release();
  await page.locator(".inquiry-form").getByRole("alert").waitFor();
  assert.equal(await page.getByLabel("采购需求 *").inputValue(), "20 件，黄铜色");
  await page.getByRole("button", { name:"重新发送", exact:true }).click();
  await page.locator(".form-success").waitFor();
  assert.match(payload.message, /LH-101/);
  assert.equal(calls,2);
  assert.equal(await page.getByLabel("采购需求 *").inputValue(),"");
  assert.equal(await page.locator(".form-error").count(),0);
  console.log("PASS pending, single submit, visible failure, preserved input and successful retry (mocked requests)");

  await page.unroute("**/api/inquiries");
  await visit("/contact");
  assert.ok(await page.locator("form").evaluate(e => e.getBoundingClientRect().top) < 750, "form appears early");
  await page.route("**/api/inquiries", route => route.abort());
  await page.getByLabel("您的姓名 *").fill("UI review");
  await page.getByLabel("工作邮箱 *").fill("ui@example.com");
  await page.getByLabel("采购需求 *").fill("网络错误测试");
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name:"发送询盘", exact:true }).click();
  await page.locator(".inquiry-form").getByRole("alert").waitFor();
  assert.match(await page.locator(".inquiry-form").getByRole("alert").innerText(), /网络/);
  assert.equal(await page.getByLabel("采购需求 *").inputValue(),"网络错误测试");
  await page.getByRole("button", { name:"打开菜单" }).click();
  assert.ok(await page.getByRole("link", { name:"直接咨询", exact:true }).isVisible());
  await page.getByRole("button", { name:"搜索产品", exact:true }).click();
  await page.getByRole("textbox", { name:"搜索产品", exact:true }).fill("线形吊灯");
  await page.waitForSelector(".search-results a");
  assert.match(await page.locator(".search-results").innerText(), /线形吊灯/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(),0);
  await visit("/quote-list");
  await page.getByRole("button", { name:/移除 Aster/ }).click();
  await page.waitForFunction(() => document.querySelector(".quote-count")?.textContent === "0");
  assert.ok(await page.locator(".empty-actions").getByRole("link",{name:"直接咨询"}).isVisible());
  await visit("/");
  await page.getByLabel("您的姓名 *").fill("Homepage review");
  await page.getByLabel("工作邮箱 *").fill("ui@example.com");
  await page.getByLabel("采购需求 *").fill("首页询盘测试");
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name:"发送询盘", exact:true }).click();
  await page.locator(".inquiry-form").getByRole("alert").waitFor();
  assert.equal(await page.getByLabel("采购需求 *").inputValue(),"首页询盘测试");
  await page.unroute("**/api/inquiries");
  await page.route("**/api/inquiries", route => route.fulfill({status:201, contentType:"application/json", body:"{}"}));
  await page.getByRole("button", { name:"重新发送", exact:true }).click();
  await page.locator(".form-success").waitFor();
  console.log("PASS homepage inquiry feedback and retry (mocked requests)");
  assert.deepEqual(failures, []);
  console.log("PASS network feedback, early form, menu, search dialog and empty quote list");
} finally {
  await browser.close();
}
