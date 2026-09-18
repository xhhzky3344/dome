import { NextResponse } from "next/server";
import { adminCookieValue } from "../../../../lib/auth";
import { db, verifyPassword } from "../../../../lib/db";
import {
  api,
  body,
  rateLimit,
  sameOrigin,
  str,
  requireValue,
} from "../../../../lib/http";
export async function POST(request: Request) {
  let token = "";
  const result = await api(async () => {
    sameOrigin(request);
    rateLimit(request, "login", 10);
    const data = await body(request);
    const username = str(data.username, "用户名", 100);
    const password = str(data.password, "密码", 200);
    const row = db()
      .prepare("SELECT * FROM administrators WHERE username=?")
      .get(username);
    requireValue(
      row && verifyPassword(password, String(row.password_hash)),
      "用户名或密码错误",
      401,
    );
    token = adminCookieValue(Number(row.id));
    return { ok: true };
  });
  if (!token) return result;
  const response = NextResponse.json({ ok: true });
  response.cookies.set("lumenhaus_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "1",
    path: "/",
    maxAge: 28800,
  });
  return response;
}
