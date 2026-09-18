import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.UI_BASE_URL || "http://localhost:3102";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  // Hold the actual navigation response to reproduce a slow network/server.
  let release;
  await page.route("**/blog?*", async route => {
    if (route.request().headers()["next-router-prefetch"]) return route.continue();
    await new Promise(resolve => { release = resolve; });
    await route.continue();
  });
  const link = page.locator('#primary-nav a[href="/blog"]');
  try {
    await link.click();
    await page.waitForFunction(() =>
      document.querySelector('[role="status"][data-navigation-pending="true"]') ||
      document.querySelector('[data-route-loading="true"]'), { }, { timeout: 1000 });
    console.log("PASS navigation shows feedback before the delayed response");
  } finally {
    release?.();
    await page.unrouteAll({ behavior: "ignoreErrors" });
  }
  await page.waitForURL("**/blog");
  await page.locator(".blog-cats").waitFor();
  assert.equal(await page.locator('[data-navigation-pending="true"]').count(), 0);
  console.log("PASS journal renders and pending feedback clears");
} finally {
  await browser.close();
}
