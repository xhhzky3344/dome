import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogout } from "../../components/AdminLogout";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const jar = await cookies(); if (jar.get("lumenhaus_admin")?.value !== "1") redirect("/login"); return <>{children}<AdminLogout/></>; }
