import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { digest, HttpError } from "./http";
export function adminCookieValue(adminId = 1) {
  const token = randomBytes(32).toString("hex");
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(digest(token), adminId, Date.now() + 8 * 3600000);
  return token;
}
export async function currentAdmin() {
  const raw = (await cookies()).get("lumenhaus_admin")?.value || "";
  return db()
    .prepare("SELECT admin_id FROM sessions WHERE token=? AND expires>?")
    .get(digest(raw), Date.now());
}
export async function isAdmin() {
  return !!(await currentAdmin());
}
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new HttpError(401, "请先登录管理员账号");
  return Number(admin.admin_id);
}
export async function revokeSession() {
  const raw = (await cookies()).get("lumenhaus_admin")?.value || "";
  db().prepare("DELETE FROM sessions WHERE token=?").run(digest(raw));
}
export function forbidden() {
  return NextResponse.json(
    { error: "Administrator authentication required." },
    { status: 401 },
  );
}
