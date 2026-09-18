import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base=process.argv[2]||"http://demo.hekecm.com";
mkdirSync(".backend-test/online",{recursive:true});
const browser=await chromium.launch();const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on("pageerror",e=>errors.push(e.message));
 for(const route of ["/","/shop","/information"]){const response=await page.goto(base+route);assert.equal(response.status(),200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),1440,route+" desktop width");}
 await page.goto(base+"/login");await page.getByLabel("用户名").fill("admin");await page.getByLabel("密码",{exact:true}).fill(process.env.ADMIN_PASSWORD||"demo-2026");await page.getByRole("button",{name:"登录"}).click();await page.waitForURL("**/admin");await page.getByText("订单总金额",{exact:true}).waitFor();await page.screenshot({path:".backend-test/online/admin.png",fullPage:true});
 await page.goto(base+"/admin/operations");await page.getByRole("button",{name:"详情",exact:true}).first().waitFor();await page.screenshot({path:".backend-test/online/operations.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto(base+"/shop");await page.getByRole("button",{name:"加入演示购物车"}).first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390,"online mobile width");await page.screenshot({path:".backend-test/online/shop-mobile.png",fullPage:true});
 await page.request.post(base+"/api/auth/logout");assert.deepEqual(errors,[]);console.log("Public domain: homepage, shop, content, administrator login/dashboard/orders and mobile viewport verified; no browser errors.");
}finally{await browser.close();}
