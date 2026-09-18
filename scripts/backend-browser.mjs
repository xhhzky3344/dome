import assert from "node:assert/strict";
import { chromium } from "playwright";
import path from "node:path";
export async function browserChecks({ base, password, directory }) {
  const browser = await chromium.launch();
  const errors = [];
  try {
    const admin = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    admin.on("pageerror", (e) => errors.push(e.message));
    await admin.goto(base + "/login");
    await admin.getByLabel("用户名").fill("admin");
    await admin.getByLabel("密码", { exact: true }).fill(password);
    await admin.getByRole("button", { name: "登录" }).click();
    await admin.waitForURL("**/admin");
    await admin.getByText("订单总金额", { exact: true }).waitFor();
    await admin.goto(base + "/admin/products");
    await admin
      .getByRole("button", { name: "编辑", exact: true })
      .first()
      .click();
    const name = await admin
      .getByLabel("英文名称", { exact: true })
      .inputValue();
    await admin.getByLabel("材质", { exact: true }).fill("UI verified brass");
    await admin.getByRole("button", { name: "保存商品", exact: true }).click();
    await admin.getByText("商品已保存，前台读取已更新数据。").waitFor();
    const customer = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    customer.on("pageerror", (e) => errors.push(e.message));
    await customer.goto(base + "/shop");
    await customer.getByLabel("搜索名称或型号").fill(name);
    await customer
      .getByRole("button", { name: "加入演示购物车" })
      .first()
      .click();
    for (const [label, value] of [
      ["收货人 / Name", "UI Demo"],
      ["邮箱 / Email", "ui@example.com"],
      ["电话 / Phone", "0000000000"],
      ["城市 / City", "Demo city"],
      ["地址 / Street", "Demo street"],
      ["邮编 / Postal code", "000000"],
    ])
      await customer.getByLabel(label, { exact: true }).fill(value);
    await customer
      .getByRole("button", {
        name: "创建演示订单 / Place demo order",
        exact: true,
      })
      .click();
    await customer.waitForURL("**/orders?id=*");
    await customer
      .getByRole("button", { name: "模拟支付成功", exact: true })
      .click();
    await customer.getByText("待模拟发货", { exact: true }).first().waitFor();
    const orderNumber = await customer.locator(".commerce-card h2").innerText();
    await admin.goto(base + "/admin/operations");
    await admin.getByLabel("订单编号搜索").fill(orderNumber);
    await admin
      .locator("tr")
      .filter({ hasText: orderNumber })
      .getByRole("button", { name: "详情", exact: true })
      .click();
    await admin
      .getByLabel("物流单号", { exact: true })
      .fill("UI-DEMO-TRACKING");
    await admin.getByRole("button", { name: "模拟发货", exact: true }).click();
    await admin.getByText("演示订单状态已更新。").waitFor();
    await customer.getByRole("button", { name: "刷新物流状态" }).click();
    await customer
      .getByText("模拟物流：Demo Logistics / UI-DEMO-TRACKING")
      .waitFor();
    await customer.screenshot({
      path: path.join(directory, "order-desktop.png"),
      fullPage: true,
    });
    await customer.setViewportSize({ width: 390, height: 844 });
    await customer.screenshot({
      path: path.join(directory, "order-mobile.png"),
      fullPage: true,
    });
    assert.equal(
      await customer.evaluate(() => document.documentElement.scrollWidth),
      390,
      "order page fits mobile",
    );
    await customer.goto(base + "/shop");
    await customer
      .getByRole("button", { name: "加入演示购物车" })
      .first()
      .waitFor();
    assert.equal(
      await customer.evaluate(() => document.documentElement.scrollWidth),
      390,
      "shop fits mobile",
    );
    await customer.screenshot({
      path: path.join(directory, "shop-mobile.png"),
      fullPage: true,
    });
    await admin.getByRole("button", { name: "空间案例", exact: true }).click();
    await admin.getByRole("button", { name: "新增", exact: true }).click();
    await admin.getByLabel("标题", { exact: true }).fill("Browser demo case");
    await admin
      .getByLabel("内容", { exact: true })
      .fill("Browser checked content");
    await admin.getByRole("button", { name: "保存", exact: true }).click();
    await admin.getByText("已保存", { exact: true }).waitFor();
    await customer.goto(base + "/information");
    await customer
      .getByRole("heading", { name: "Browser demo case" })
      .waitFor();
    await admin.screenshot({
      path: path.join(directory, "admin-desktop.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, [], "browser has no uncaught errors");
    console.log(
      "PASS browser: admin edit → storefront purchase → payment → admin shipping → customer tracking; content sync; desktop/mobile layout",
    );
  } finally {
    await browser.close();
  }
}
