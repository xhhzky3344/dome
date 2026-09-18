import { NextResponse } from "next/server";
import { revokeSession } from "../../../../lib/auth";
import { api, sameOrigin } from "../../../../lib/http";
export async function POST(request: Request) {
  const result = await api(async () => {
    sameOrigin(request);
    await revokeSession();
    return { ok: true };
  });
  if (!result.ok) return result;
  const response = NextResponse.json({ ok: true });
  response.cookies.set("lumenhaus_admin", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
