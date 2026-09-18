import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../../../lib/auth";
import {
  api,
  rateLimit,
  readBytes,
  requireValue,
  sameOrigin,
} from "../../../lib/http";
const directory =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
export function GET() {
  return api(async () => {
    await requireAdmin();
    await fs.mkdir(directory, { recursive: true });
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return Promise.all(
      entries
        .filter((x) => x.isFile() && /\.(png|jpg|jpeg|webp|gif)$/i.test(x.name))
        .map(async (x) => {
          const s = await fs.stat(path.join(directory, x.name));
          return {
            name: x.name,
            url: `/uploads/${x.name}`,
            size: s.size,
            updatedAt: s.mtime.toISOString(),
          };
        }),
    );
  });
}
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireAdmin();
    rateLimit(request, "upload", 20);
    const bytes = await readBytes(request, 6 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    requireValue(file instanceof File && file.size > 0, "请选择图片");
    requireValue(file.size <= 5 * 1024 * 1024, "图片不能超过 5 MB", 413);
    const data = Buffer.from(await file.arrayBuffer());
    let extension = "",
      type = "";
    if (
      data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      extension = "png";
      type = "image/png";
    } else if (data[0] === 255 && data[1] === 216 && data[2] === 255) {
      extension = "jpg";
      type = "image/jpeg";
    } else if (["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString())) {
      extension = "gif";
      type = "image/gif";
    } else if (
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WEBP"
    ) {
      extension = "webp";
      type = "image/webp";
    }
    requireValue(
      extension && type === file.type,
      "仅支持文件内容匹配的 JPG、PNG、WebP、GIF 图片",
    );
    await fs.mkdir(directory, { recursive: true });
    const name = `${randomUUID()}.${extension}`;
    await fs.writeFile(path.join(directory, name), data, { flag: "wx" });
    return {
      name,
      url: `/uploads/${name}`,
      size: file.size,
      updatedAt: new Date().toISOString(),
    };
  });
}
