"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Media = { name: string; url: string; size: number; updatedAt: string };
export default function MediaManager() {
  const [items, setItems] = useState<Media[]>([]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const refresh = async () => { const response = await fetch("/api/media"); if (response.ok) setItems(await response.json()); };
  useEffect(() => { refresh(); }, []);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setBusy(true); setNotice("");
    const data = new FormData(); data.set("file", file); const response = await fetch("/api/media", { method: "POST", body: data }); const result = await response.json();
    setBusy(false); event.target.value = ""; if (!response.ok) { setNotice(result.error || "上传失败。"); return; } setNotice("图片已上传，请将地址复制到产品记录中。"); await refresh();
  }
  async function copy(url: string) { await navigator.clipboard.writeText(url); setNotice("图片地址已复制。"); }
  return <main className="article-manager media-manager"><header><div><small>媒体管理</small><h1>资源库</h1></div><a href="/admin">← 返回后台</a></header><section><div className="manager-heading"><div><span className="eyebrow">本地演示资源</span><h2>上传图片，<br />然后<i>使用图片地址。</i></h2></div><p>上传不超过 5 MB 的 JPG、PNG、WebP 或 GIF 原图。每张图片都会生成本地公开地址，可粘贴到产品编辑器中。</p></div><div className="media-upload"><label className={busy ? "uploading" : ""}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy} /><b>{busy ? "上传中…" : "上传图片 +"}</b><span>JPG · PNG · WEBP · GIF — 最大 5 MB</span></label>{notice && <p>{notice}</p>}</div><div className="asset-grid">{items.length ? items.map((item) => <article key={item.url}><img src={item.url} alt="" /><div><b>{item.name}</b><small>{Math.ceil(item.size / 1024)} KB · {new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small><button onClick={() => copy(item.url)}>复制地址</button></div></article>) : <div className="manager-empty"><b>▧</b><h2>暂未上传图片</h2><p>请使用上方上传控件。内置图片集合中的占位图仍可继续使用。</p></div>}</div></section></main>;
}
