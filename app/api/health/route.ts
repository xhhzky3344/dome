import { db } from "../../../lib/db";
export function GET() {
  try {
    db().prepare("SELECT 1").get();
    return Response.json(
      { ok: true, demo: true, service: "lumenhaus-backend" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
