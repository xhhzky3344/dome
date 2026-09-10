import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";

const file = path.join(process.cwd(), "data", "articles.json");
async function read() { return JSON.parse(await fs.readFile(file, "utf8")); }
async function write(data: unknown) { await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function GET() {
  const articles = await read();
  return NextResponse.json(await isAdmin() ? articles : articles.filter((article: { status: string }) => article.status === "Published"));
}

export async function POST(request: Request) {
  if (!await isAdmin()) return forbidden();
  const article = await request.json();
  const articles = await read();
  const entry = { ...article, id: article.id || crypto.randomUUID(), status: article.status || "Draft", published: article.published || new Date().toISOString().slice(0, 10), author: article.author || "Lumenhaus Studio" };
  articles.unshift(entry); await write(articles); return NextResponse.json(entry, { status: 201 });
}

export async function PUT(request: Request) {
  if (!await isAdmin()) return forbidden();
  const article = await request.json(); const articles = await read();
  const index = articles.findIndex((item: { id: string }) => item.id === article.id);
  if (index < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  articles[index] = article; await write(articles); return NextResponse.json(article);
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) return forbidden();
  const { id } = await request.json(); const articles = await read();
  await write(articles.filter((article: { id: string }) => article.id !== id)); return new NextResponse(null, { status: 204 });
}
