import { requireAdmin } from "../../../../lib/auth";
import { resetDemo } from "../../../../lib/db";
import {
  api,
  body,
  rateLimit,
  requireValue,
  sameOrigin,
} from "../../../../lib/http";
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    rateLimit(request, "reset", 2);
    const input = await body(request);
    requireValue(input.confirm === "RESET DEMO", "请输入 RESET DEMO 确认重置");
    return resetDemo();
  });
}
