import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogout } from "../../components/AdminLogout";
import { isAdmin } from "../../lib/auth";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { if (!await isAdmin()) redirect("/login"); return <>{children}<AdminLogout/></>; }
