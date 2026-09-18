"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function login(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if(busy)return; setBusy(true); setError(""); const body = Object.fromEntries(new FormData(event.currentTarget)); try {const result = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data=await result.json(); if (result.ok) { router.replace("/admin"); router.refresh(); } else setError(data.error || "登录失败");}catch{setError("网络异常，请重试");}finally{setBusy(false);} }
  return <main className="login-page"><form onSubmit={login}><Link className="brand" href="/"><i /> LUMENHAUS<small>后台工作台</small></Link><span className="eyebrow">管理员登录</span><h1>欢迎<br />回来。</h1><p>登录后管理产品、内容、询盘和网站设置。</p><label>用户名<input required name="username" autoComplete="username" placeholder="请输入用户名" /></label><label>密码<input required type="password" name="password" autoComplete="current-password" placeholder="请输入密码" /></label>{error && <em role="alert">{error}</em>}<button disabled={busy}>{busy ? "Loading..." : "登录 ↗"}</button><small>演示账号：<b>admin</b> / <b>demo-2026</b></small></form><div className="login-image"><img src="/images/lumenhaus-lobby-hero.webp" alt="" /></div></main>;
}

