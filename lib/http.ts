import { createHash } from "node:crypto";
import { db } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireValue(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export function str(
  value: unknown,
  name: string,
  max = 200,
  optional = false,
): string {
  requireValue(
    typeof value === "string" || (optional && value == null),
    `${name} 必须是文本`,
  );
  const s = String(value ?? "").trim();
  requireValue(
    (optional || s.length > 0) && s.length <= max,
    `${name} 长度不正确`,
  );
  return s;
}
export function integer(
  value: unknown,
  name: string,
  min = 0,
  max = 100000000,
) {
  requireValue(
    Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max,
    `${name} 必须是 ${min}–${max} 的整数`,
  );
  return Number(value);
}
export function email(value: unknown) {
  const s = str(value, "邮箱", 254).toLowerCase();
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), "邮箱格式不正确");
  return s;
}
export function safeUrl(value: unknown) {
  const s = str(value, "图片或链接", 2000);
  requireValue(
    /^\/(?!\/)/.test(s) || /^https?:\/\//.test(s),
    "仅支持站内路径或 HTTP(S) 链接",
  );
  return s;
}
export function digest(s: string) {
  return createHash("sha256").update(s).digest("hex");
}
export async function readBytes(request: Request, max = 262144) {
  requireValue(
    Number(request.headers.get("content-length") || 0) <= max,
    "请求过大",
    413,
  );
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > max) {
          await reader.cancel();
          throw new HttpError(413, "请求过大");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  return Buffer.concat(chunks);
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  const raw = (await readBytes(request)).toString("utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "JSON 格式不正确");
  }
  requireValue(
    data && typeof data === "object" && !Array.isArray(data),
    "需要 JSON 对象",
  );
  return data;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  requireValue(!origin || origin === expected, "不允许跨站提交", 403);
  requireValue(
    request.headers.get("sec-fetch-site") !== "cross-site",
    "不允许跨站提交",
    403,
  );
}
export function rateLimit(request: Request, bucket: string, limit = 30) {
  const ip =
    process.env.TRUST_PROXY === "1"
      ? request.headers.get("x-real-ip") || "unknown"
      : "shared";
  const key = digest(`${bucket}:${ip}`);
  const now = Date.now();
  db().prepare("DELETE FROM rate_limits WHERE expires<?").run(now);
  const row = db()
    .prepare(
      "INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .get(key, now + 60000);
  requireValue(
    Number(row?.count) <= limit,
    "请求过于频繁，请一分钟后重试",
    429,
  );
}
export async function api(fn: () => unknown | Promise<unknown>) {
  try {
    return Response.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const known = error instanceof HttpError;
    if (!known) console.error(error);
    return Response.json(
      {
        error: known ? error.message : "服务器处理失败",
        code: known ? error.status : 500,
      },
      { status: known ? error.status : 500 },
    );
  }
}
export function paginate(items: unknown[], request: Request) {
  const q = new URL(request.url).searchParams;
  if (!q.has("page")) return items;
  const page = integer(Number(q.get("page")), "页码", 1, 100000);
  const pageSize = integer(Number(q.get("pageSize") || 20), "每页条数", 1, 100);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
