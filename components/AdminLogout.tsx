"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminLogout() {
  const router = useRouter();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  return <div className="global-admin-actions"><Link href="/admin/operations">Orders</Link><Link href="/admin/products">产品</Link><Link href="/admin/categories">类别</Link><Link href="/admin/articles">期刊</Link><Link href="/admin/media">媒体</Link><button onClick={logout}>退出</button></div>;
}
