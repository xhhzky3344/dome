import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";

const file = path.join(process.cwd(), "data", "catalog.json");
async function read() { return JSON.parse(await fs.readFile(file, "utf8")); }
async function write(data: unknown) { await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function GET() { const products = await read(); return NextResponse.json(await isAdmin() ? products : products.filter((product: { status: string }) => product.status === "Published")); }
export async function POST(request: Request) {
  if (!await isAdmin()) return forbidden();
  const product = await request.json(); const products = await read();
  const entry = { ...product, id: crypto.randomUUID(), status: product.status || "Draft", featured: Boolean(product.featured) };
  products.unshift(entry); await write(products); return NextResponse.json(entry, { status: 201 });
}
export async function PUT(request: Request) {
  if (!await isAdmin()) return forbidden();
  const product = await request.json(); const products = await read();
  const index = products.findIndex((item: { id: string }) => item.id === product.id);
  if (index < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  products[index] = product; await write(products); return NextResponse.json(product);
}
export async function DELETE(request: Request) {
  if (!await isAdmin()) return forbidden();
  const { id } = await request.json(); const products = await read();
  await write(products.filter((item: { id: string }) => item.id !== id)); return new NextResponse(null, { status: 204 });
}
