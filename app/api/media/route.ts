import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const uploadDirectory = path.join(process.cwd(), "public", "uploads");

export async function GET() {
  if (!await isAdmin()) return forbidden();
  await fs.mkdir(uploadDirectory, { recursive: true });
  const files = await fs.readdir(uploadDirectory, { withFileTypes: true });
  const media = await Promise.all(files.filter((entry) => entry.isFile()).map(async (entry) => {
    const stat = await fs.stat(path.join(uploadDirectory, entry.name));
    return { name: entry.name, url: `/uploads/${entry.name}`, size: stat.size, updatedAt: stat.mtime.toISOString() };
  }));
  return NextResponse.json(media.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function POST(request: Request) {
  if (!await isAdmin()) return forbidden();
  const data = await request.formData(); const source = data.get("file");
  if (!(source instanceof File) || !source.size) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  if (!allowed.has(source.type)) return NextResponse.json({ error: "Only JPG, PNG, WebP and GIF images are supported." }, { status: 400 });
  if (source.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });
  await fs.mkdir(uploadDirectory, { recursive: true });
  const extension = path.extname(source.name).toLowerCase() || ".png";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), Buffer.from(await source.arrayBuffer()));
  return NextResponse.json({ name: filename, url: `/uploads/${filename}`, size: source.size, updatedAt: new Date().toISOString() }, { status: 201 });
}
