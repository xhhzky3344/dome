import { requireAdmin } from "../../../../lib/auth";
import {
  db,
  hashPassword,
  verifyPassword,
  transaction,
} from "../../../../lib/db";
import {
  api,
  body,
  rateLimit,
  sameOrigin,
  str,
  requireValue,
} from "../../../../lib/http";
export function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const id = await requireAdmin();
    rateLimit(request, "password", 10);
    const input = await body(request);
    const old = str(input.oldPassword, "旧密码", 200),
      password = str(input.newPassword, "新密码", 200);
    requireValue(password.length >= 12, "新密码至少 12 位");
    transaction(() => {
      const row = db()
        .prepare("SELECT password_hash FROM administrators WHERE id=?")
        .get(id);
      requireValue(
        row && verifyPassword(old, String(row.password_hash)),
        "旧密码不正确",
        400,
      );
      db()
        .prepare("UPDATE administrators SET password_hash=? WHERE id=?")
        .run(hashPassword(password), id);
      db().prepare("DELETE FROM sessions WHERE admin_id=?").run(id);
    });
    return { ok: true, message: "密码已修改，请重新登录" };
  });
}
