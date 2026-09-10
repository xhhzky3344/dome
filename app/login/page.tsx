"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [error, setError] = useState(""); const router = useRouter();
  async function login(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const body = Object.fromEntries(new FormData(event.currentTarget)); const result = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (result.ok) { router.replace("/admin"); router.refresh(); } else setError("Incorrect username or password."); }
  return <main className="login-page"><form onSubmit={login}><Link className="brand" href="/"><i /> LUMENHAUS<small>CMS WORKSPACE</small></Link><span className="eyebrow">ADMINISTRATION</span><h1>Welcome<br />back.</h1><p>Sign in to manage products, content, inquiries and storefront settings.</p><label>Username<input required name="username" autoComplete="username" placeholder="Username" /></label><label>Password<input required type="password" name="password" autoComplete="current-password" placeholder="Password" /></label>{error && <em>{error}</em>}<button>Sign in ↗</button><small>Demo credentials: <b>admin</b> / <b>demo-2026</b></small></form><div className="login-image"><img src="/images/lumenhaus-lobby-hero.png" alt="" /></div></main>;
}
