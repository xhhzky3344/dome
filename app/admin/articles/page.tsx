"use client";

import { FormEvent, useEffect, useState } from "react";

type Article = { id: string; title: string; titleZh?: string; category: string; excerpt: string; published: string; author: string; status: "Draft" | "Published" };
const blank: Article = { id: "", title: "", titleZh: "", category: "Lighting Buying Guides", excerpt: "", published: new Date().toISOString().slice(0, 10), author: "Lumenhaus Studio", status: "Draft" };

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [current, setCurrent] = useState<Article>(blank);
  const [loading, setLoading] = useState(true);
  const refresh = async () => { const response = await fetch("/api/articles"); setArticles(await response.json()); setLoading(false); };
  useEffect(() => { refresh(); }, []);
  const choose = (article: Article) => setCurrent(article);
  const change = (key: keyof Article, value: string) => setCurrent((item) => ({ ...item, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault();
    const method = current.id ? "PUT" : "POST";
    const response = await fetch("/api/articles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(current) });
    const saved = await response.json(); setCurrent(saved); await refresh();
  }
  async function remove() {
    if (!current.id || !window.confirm("Remove this article from the demo CMS?")) return;
    await fetch("/api/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: current.id }) });
    setCurrent(blank); await refresh();
  }
  return <main className="article-manager">
    <header><div><small>CONTENT MANAGEMENT</small><h1>Journal editor</h1></div><a href="/admin">← Dashboard</a></header>
    <section><div className="manager-heading"><div><span className="eyebrow">ARTICLE LIBRARY</span><h2>Publishing control<br />for the <i>journal.</i></h2></div><p>Create original demo articles, keep drafts out of the public journal, and edit the bilingual titles used in the customer presentation.</p></div>
      <div className="manager-grid"><aside className="manager-list"><div className="manager-filter"><b>All articles</b><span>{loading ? "Loading" : `${articles.length} entries`}</span></div>{articles.map((article) => <button className={current.id === article.id ? "selected" : ""} onClick={() => choose(article)} key={article.id}><span className="article-initial">{article.title.charAt(0)}</span><span><b>{article.title}</b><small>{article.category} · {article.published}</small></span><em>{article.status}</em></button>)}</aside>
        <form className="manager-form" onSubmit={save}><div className="manager-form-title"><h2>{current.id ? "Edit article" : "New article"}</h2><button type="button" onClick={() => setCurrent(blank)} aria-label="Create a new article">＋</button></div>
          <label>English title<input required value={current.title} onChange={(event) => change("title", event.target.value)} /></label>
          <label>Chinese title<input value={current.titleZh || ""} onChange={(event) => change("titleZh", event.target.value)} /></label>
          <div className="manager-fields"><label>Category<input required value={current.category} onChange={(event) => change("category", event.target.value)} /></label><label>Publish date<input required type="date" value={current.published} onChange={(event) => change("published", event.target.value)} /></label></div>
          <label>Excerpt<textarea required value={current.excerpt} onChange={(event) => change("excerpt", event.target.value)} /></label>
          <div className="manager-fields"><label>Author<input required value={current.author} onChange={(event) => change("author", event.target.value)} /></label><label>Status<select value={current.status} onChange={(event) => change("status", event.target.value)}><option>Draft</option><option>Published</option></select></label></div>
          <div className="form-actions"><button className="gold">{current.id ? "Save changes" : "Create article"}</button>{current.id && <button type="button" className="danger" onClick={remove}>Delete</button>}</div>
        </form></div>
    </section>
  </main>;
}
