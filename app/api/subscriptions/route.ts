import { requireAdmin } from "../../../lib/auth";
import { db } from "../../../lib/db";
import {
  api,
  body,
  email,
  paginate,
  rateLimit,
  sameOrigin,
} from "../../../lib/http";
export function GET(request: Request) {
  return api(async () => {
    await requireAdmin();
    const query =
      new URL(request.url).searchParams.get("q")?.toLowerCase() || "";
    return paginate(
      db()
        .prepare("SELECT * FROM subscriptions ORDER BY created_at DESC")
        .all()
        .filter((x) => String(x.email).includes(query)),
      request,
    );
  });
}
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    rateLimit(request, "subscribe", 10);
    const input = await body(request);
    db()
      .prepare("INSERT OR IGNORE INTO subscriptions VALUES(?,?)")
      .run(email(input.email), new Date().toISOString());
    return { ok: true, demo: true, message: "演示订阅已保存，不发送实际邮件" };
  });
}
