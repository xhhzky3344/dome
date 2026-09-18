import { randomUUID } from "node:crypto";
import { requireAdmin, isAdmin } from "./auth";
import { get, list, put, remove, transaction, type RecordData } from "./db";
import {
  api,
  body,
  email,
  paginate,
  rateLimit,
  requireValue,
  safeUrl,
  sameOrigin,
  str,
} from "./http";
export function resource(kind: string) {
  return {
    GET: (request: Request) =>
      api(async () => {
        const admin = await isAdmin();
        if (kind === "inquiries") await requireAdmin();
        let rows = list(kind);
        if (!admin)
          rows = rows.filter((x) =>
            kind === "articles"
              ? x.status === "Published"
              : x.published !== false,
          );
        const q = new URL(request.url).searchParams;
        if (q.get("id")) {
          const item = rows.find((x) => x.id === q.get("id"));
          requireValue(item, "记录不存在", 404);
          return item;
        }
        if (q.get("q"))
          rows = rows.filter((x) =>
            JSON.stringify(x).toLowerCase().includes(q.get("q")!.toLowerCase()),
          );
        if (q.get("status"))
          rows = rows.filter((x) => x.status === q.get("status"));
        return paginate(rows, request);
      }),
    POST: (request: Request) => write(request, true),
    PUT: (request: Request) => write(request, false),
    DELETE: (request: Request) =>
      api(async () => {
        sameOrigin(request);
        await requireAdmin();
        const input = await body(request);
        const id = str(input.id, "ID");
        const existing = get(kind, id);
        requireValue(existing, "记录不存在", 404);
        if (kind === "categories")
          requireValue(
            !list("products").some((p) => p.category === existing.name),
            "分类仍有关联商品",
            409,
          );
        if (kind === "spaces")
          requireValue(
            !list("products").some((p) =>
              ((p.spaces as string[]) || []).includes(id),
            ),
            "空间仍有关联商品",
            409,
          );
        remove(kind, id);
        return { ok: true };
      }),
  };
  function write(request: Request, creating: boolean) {
    return api(async () => {
      sameOrigin(request);
      if (kind !== "inquiries" || !creating) await requireAdmin();
      else rateLimit(request, "inquiries", 10);
      const input = await body(request);
      return transaction(() => {
        const id = creating ? randomUUID() : str(input.id, "ID");
        const existing = get(kind, id);
        requireValue(creating || existing, "记录不存在", 404);
        const p: RecordData = { ...existing, ...input, id };
        if (kind === "inquiries") {
          if (creating) {
            const entry = {
              id,
              name: str(input.name, "姓名", 120),
              email: email(input.email),
              company: str(input.company, "公司", 200, true),
              message: str(input.message, "需求内容", 10000),
              status: "New",
              notes: [],
              demo: true,
              createdAt: new Date().toISOString(),
            };
            put(kind, entry);
            return {
              id,
              demo: true,
              message: "演示询盘已保存，不承诺实际回复",
            };
          }
          requireValue(
            ["New", "Contacted", "Quoted", "Closed"].includes(
              String(input.status || existing?.status),
            ),
            "询盘状态不正确",
          );
          const notes = Array.isArray(existing?.notes) ? existing.notes : [];
          if (input.note)
            notes.push({
              text: str(input.note, "内部备注", 2000),
              createdAt: new Date().toISOString(),
            });
          return put(kind, {
            ...existing!,
            id,
            status: input.status || existing!.status,
            notes,
          });
        }
        if (kind === "categories" || kind === "spaces") {
          p.name = str(p.name, "名称");
          if (kind === "categories") {
            p.slug = str(p.slug, "别名");
            requireValue(
              !list(kind).some(
                (x) => x.id !== id && (x.slug === p.slug || x.name === p.name),
              ),
              "分类名称或别名重复",
              409,
            );
            if (existing && existing.name !== p.name)
              for (const product of list("products").filter(
                (x) => x.category === existing.name,
              ))
                put("products", { ...product, category: p.name });
          }
          p.published = p.published !== false;
        }
        if (kind === "articles") {
          p.title = str(p.title, "标题");
          p.excerpt = str(p.excerpt, "摘要", 10000);
          requireValue(
            ["Published", "Draft"].includes(String(p.status)),
            "状态错误",
          );
        }
        if (kind === "cases" || kind === "content") {
          p.title = str(p.title, "标题");
          p.content = str(p.content, "内容", 20000);
          if (p.image) p.image = safeUrl(p.image);
          if (kind === "cases")
            requireValue(
              Array.isArray(p.productIds) &&
                p.productIds.every(
                  (id: unknown) =>
                    typeof id === "string" && get("products", id),
                ),
              "关联商品不存在",
            );
        }
        return put(kind, p);
      });
    });
  }
}
