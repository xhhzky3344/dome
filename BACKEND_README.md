# Lumenhaus 演示后端

本项目已包含 Next.js 前台、管理员后台、SQLite 数据库和演示交易链路。所有价格为美元，数据库金额字段统一使用整数分；不接入真实支付、真实物流或税费计算。

## 本地启动

需要 Node.js **24.12.x**（使用内置 `node:sqlite`），不需要另装数据库服务。

```powershell
Copy-Item .env.example .env
npm install --include=optional
npm run build
npm start
```

开发模式：`npm run dev`。启动后访问：

- 网站：`http://localhost:3000/`
- 后台：`http://localhost:3000/admin`
- 订单、配送、内容、询盘、修改密码：`/admin/operations`
- 商品、图片、规格和库存：`/admin/products`
- 前台演示选购：`/shop`
- 凭证查单与模拟支付：`/orders`
- 空间案例、FAQ、品牌和政策内容：`/information`

初始演示账号 **admin / demo-2026**。`ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 仅用于数据库首次初始化。之后在后台修改密码；修改会立即注销该管理员全部会话，修改环境变量不会覆盖数据库密码。

密码使用独立随机盐的 scrypt 哈希保存。会话为随机令牌，数据库只存令牌哈希，8 小时过期；退出会立即撤销服务端会话。Cookie 设置 HttpOnly 和 SameSite=Lax，HTTPS 部署设置 `COOKIE_SECURE=1`。

## 数据与迁移

- 默认数据库：`data/demo.sqlite`，启用 WAL、外键和写锁等待；可通过 `DATABASE_PATH` 指向发布目录外的持久路径。
- 默认图片：`public/uploads`，可通过 `UPLOAD_DIR` 指定共享目录。
- 首次启动导入现有 JSON 商品、分类、文章、询盘、首页设置，保留现有 **35 款**商品；以后修改写入数据库，不再写 JSON。
- 产品参考价转换成演示规格价格；无可解析价格时采用 $99 的演示价格，初始默认规格为 Brass / Standard / 3000K、库存 20。
- 数据表包括 products、categories、spaces、variants、product_images、orders、order_items、order_events、administrators、sessions、inquiries、subscriptions、content_settings、space_cases、content_pages、shipping_rules、metadata、rate_limits。内容类表使用经过接口校验的 JSON 数据列；规格、订单和库存使用独立列与约束。
- 初始化 3 张示例订单（待支付、待发货、已发货），含下单快照和状态记录。示例订单可在管理员后台查看；新建前台订单会产生可保存的查询凭证。
- `/admin/operations` → 密码与重置：输入 `RESET DEMO` 后恢复初始导入快照的 16 款商品、内容与示例询盘，清空订阅并重建 3 张示例订单。管理员、密码、会话和上传文件保留。此操作只允许管理员。
- 重置接口不会在服务器发布时自动调用；服务器原始 JSON 和已上传图片保留。

## 订单、库存和配送规则

1. 后台上架商品并设置每个规格的价格与库存。
2. 用户在 `/shop` 选规格、加入购物车，填写虚构收货信息，创建演示订单。
3. 下单仅校验库存，不预占库存；服务器从规格表计算金额，忽略客户端价格。下单快照包括商品名称、规格、单价、图片、收货信息、配送方式与运费。
4. 创建订单需提供 `idempotencyKey`（至少 16 字符）和随机 `queryToken`（至少 32 字符）。相同提交标识与相同规范化内容返回原订单；内容或凭证不同返回 409。前台会保留未确认请求的标识以便重试。
5. 公开查单只接受 `x-order-token` 请求头；凭证不放 URL，数据库只存哈希。浏览器保存查询凭证，换设备需输入订单 ID 与凭证。
6. `pending → paid`、`payment_failed → paid`：在同一 SQLite 写事务中检查可售状态、条件扣库存、更新状态并记录事件。库存不足则整个事务回滚。重复支付不会重复扣减。
7. `pending → payment_failed`：只模拟失败，不扣库存。订单建立后管理员调价不会改变已保存的订单单价。
8. `paid → shipped`：仅管理员，物流公司和单号必填；详情页点击刷新可看到状态。
9. `pending/payment_failed/paid → cancelled`：未付款不恢复库存；已付款恢复已扣库存。`paid/shipped → refunded`：仅管理员，模拟退款并恢复库存一次。重复取消/退款不重复恢复；已退款不能重新支付。
10. 商品编辑带 `revision` 乐观锁；支付或库存恢复也会推进版本，旧后台页面不能覆盖新库存。商品删除会停用规格，保留历史订单快照。

默认配送地区 CN、US、GB、AU，固定运费 $15，满 $300 免邮。后台可配置地区与金额；不支持地区返回 400。更改规则只影响新订单。

## 主要接口

所有写接口接受 JSON（图片上传除外）。参数错误返回 `{error, code}`，HTTP 400；未登录 401；跨站请求 403；不存在 404；库存/版本/状态冲突 409；过大 413；限流 429。公开返回的询盘提交结果不包含完整个人信息。

| 路径 | 功能 |
| --- | --- |
| POST `/api/auth/login`, `/api/auth/logout`, `/api/auth/password` | 登录、注销、改密 |
| GET/POST/PUT/DELETE `/api/products` | 商品查询与管理 |
| GET/POST/PUT/DELETE `/api/categories`, `/api/spaces` | 商品与空间分类 |
| GET/POST `/api/orders`, PATCH `/api/orders` | 订单列表/详情、创建、状态动作 |
| GET/PUT `/api/shipping` | 配送规则 |
| GET/PUT `/api/settings` | 首页主图、按钮、联系方式、SEO |
| GET/POST/PUT/DELETE `/api/cases`, `/api/content`, `/api/articles` | 案例、品牌/FAQ/政策、文章 |
| POST `/api/inquiries`, 管理员 GET/PUT | 询盘提交、查询、状态与内部备注 |
| POST `/api/subscriptions`, 管理员 GET | 订阅去重保存和列表 |
| 管理员 GET/POST `/api/media` | 图片列表与上传 |
| 管理员 GET `/api/dashboard` | 演示统计、最近订单、最新询盘 |
| 管理员 POST `/api/demo/reset` | `{confirm:"RESET DEMO"}` 重置 |
| GET `/api/health` | 应用和数据库健康状态 |

列表增加 `?page=1&pageSize=20` 返回 `{items,total,page,pageSize}`，页大小 1–100。为兼容原前台，不传 page 时返回数组。商品支持 q/category/space/status/featured；订单支持 q（编号）/status；询盘支持 q/status；详情使用 `?id=...`。

示例订单请求（价格无需由前端提交）：

```json
{
  "idempotencyKey": "a-unique-random-request-id",
  "queryToken": "a-random-secret-at-least-32-characters-long",
  "items": [{"variantId": "商品接口返回的规格ID", "quantity": 1}],
  "address": {"name":"Demo buyer","email":"demo@example.com","phone":"0000000000","region":"CN","city":"Demo city","street":"Demo address","postalCode":"000000"}
}
```

状态操作：`PATCH /api/orders`，`{id, action}`，action 为 pay/fail/cancel/ship/refund；ship 还需 carrier/tracking。公开 pay/fail/cancel 必须带订单凭证，ship/refund 必须管理员会话。

## 上传与请求限制

- 图片只接受 JPG、PNG、WebP、GIF，校验声明类型与文件魔数；单图最大 5 MB，上传请求最大 6 MB；服务器生成随机文件名，上传后可立即访问。
- JSON 请求流最大 256 KiB；参数长度、数量、整数范围在服务端校验。
- 每分钟：登录/改密 10 次、下单 20 次、订单动作/查询 60 次、询盘/订阅 10 次、上传 20 次、重置 2 次。限流写入 SQLite，多进程共用计数。
- `TRUST_PROXY=0` 使用共享限流桶；受控 Nginx 设置 X-Real-IP、Next 仅监听回环地址时，才能设置 `TRUST_PROXY=1` 进行 IP 限流。
- `APP_ORIGIN` 必须匹配用户实际访问的源地址，写请求校验 Origin 和 Sec-Fetch-Site。

## 验证与运维

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm run test:backend
```

验收脚本启动独立端口 3317 和 `.backend-test/run-*` 数据库、上传目录，不重置本地或线上数据库。默认执行 57 项后端检查和 Playwright 浏览器链路，截图写入同一测试目录；无浏览器环境可设置 `TEST_BROWSER=0` 只跑 API 验证。浏览器首次使用可运行 `npx playwright install chromium`。

现有 `npm run smoke` 为旧版前台验收脚本；重置为 16 款后其旧的“至少 30 款”断言不适用，请使用新的后端验收脚本。

在线 SQLite 备份使用 Node.js `node:sqlite` 的 `backup` API，或停服务后连同 WAL 文件备份数据库目录；不要在运行时只复制主 `.sqlite` 文件。发布前备份 JSON 和上传目录，发布后验证健康、管理员登录、公开商品、凭证查单与新建订单链路。演示交易的支付/物流为模拟，页面不收集银行卡资料。

服务器发布详情和实际验收结果见 `BACKEND_DEPLOYMENT.md`。
