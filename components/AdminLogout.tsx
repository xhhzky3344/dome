"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminLogout() {
  const router = useRouter();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  return <div className="global-admin-actions"><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/articles">Journal</Link><Link href="/admin/media">Media</Link><button onClick={logout}>Sign out</button></div>;
}
