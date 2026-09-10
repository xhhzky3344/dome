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
    setBusy(false); event.target.value = ""; if (!response.ok) { setNotice(result.error || "Upload failed."); return; } setNotice("Image uploaded. Copy its URL into a product record."); await refresh();
  }
  async function copy(url: string) { await navigator.clipboard.writeText(url); setNotice("Image URL copied."); }
  return <main className="article-manager media-manager"><header><div><small>MEDIA MANAGEMENT</small><h1>Asset library</h1></div><a href="/admin">← Dashboard</a></header><section><div className="manager-heading"><div><span className="eyebrow">LOCAL DEMO ASSETS</span><h2>Upload an image,<br />then <i>use its URL.</i></h2></div><p>Upload original JPG, PNG, WebP or GIF artwork up to 5 MB. Each image receives a local public URL that can be pasted into the product editor.</p></div><div className="media-upload"><label className={busy ? "uploading" : ""}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy} /><b>{busy ? "Uploading…" : "Upload image +"}</b><span>JPG · PNG · WEBP · GIF — max. 5 MB</span></label>{notice && <p>{notice}</p>}</div><div className="asset-grid">{items.length ? items.map((item) => <article key={item.url}><img src={item.url} alt="" /><div><b>{item.name}</b><small>{Math.ceil(item.size / 1024)} KB · {new Date(item.updatedAt).toLocaleDateString()}</small><button onClick={() => copy(item.url)}>Copy URL</button></div></article>) : <div className="manager-empty"><b>▧</b><h2>No uploaded images yet.</h2><p>Use the upload control above. Generated placeholders remain in the built-in image collection.</p></div>}</div></section></main>;
}
