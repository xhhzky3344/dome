import { requireAdmin } from "../../../lib/auth";
import { get, put } from "../../../lib/db";
import {
  api,
  body,
  integer,
  requireValue,
  sameOrigin,
  str,
} from "../../../lib/http";
export function GET() {
  return api(() => get("shipping", "rules"));
}
export function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    const input = await body(request);
    requireValue(
      Array.isArray(input.regions) &&
        input.regions.length > 0 &&
        input.regions.length <= 250,
      "配送地区不正确",
    );
    const regions = input.regions.map((x) =>
      str(x, "地区代码", 2).toUpperCase(),
    );
    requireValue(
      regions.every((x) => /^[A-Z]{2}$/.test(x)),
      "使用两位国家代码",
    );
    return put("shipping", {
      id: "rules",
      regions: [...new Set(regions)],
      fee: integer(input.fee, "运费（分）"),
      freeThreshold: integer(input.freeThreshold, "免邮门槛（分）"),
      method: str(input.method, "配送方式", 100),
    });
  });
}
