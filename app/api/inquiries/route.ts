import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";

const file = path.join(process.cwd(), "data", "inquiries.json");
async function read() { return JSON.parse(await fs.readFile(file, "utf8")); }
async function write(data: unknown) { await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function GET() { if (!await isAdmin()) return NextResponse.json([]); return NextResponse.json(await read()); }
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || !body.email || !body.message) return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
  const inquiries = await read(); const entry = { ...body, id: crypto.randomUUID(), status: "New", createdAt: new Date().toISOString() };
  inquiries.unshift(entry); await write(inquiries); return NextResponse.json(entry, { status: 201 });
}
export async function PUT(request: Request) {
  if (!await isAdmin()) return forbidden();
  const update = await request.json(); const inquiries = await read(); const index = inquiries.findIndex((item: { id: string }) => item.id === update.id);
  if (index < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  inquiries[index] = { ...inquiries[index], ...update }; await write(inquiries); return NextResponse.json(inquiries[index]);
}
