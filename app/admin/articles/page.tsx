"use client";

import { FormEvent, useEffect, useState } from "react";

type Article = { id: string; title: string; titleZh?: string; category: string; excerpt: string; published: string; author: string; status: "草稿" | "已发布" };
const blank: Article = { id: "", title: "", titleZh: "", category: "Lighting Buying Guides", excerpt: "", published: new Date().toISOString().slice(0, 10), author: "Lumenhaus Studio", status: "草稿" };

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [current, setCurrent] = useState<Article>(blank);
  const [loading, set加载中] = useState(true);
  const refresh = async () => { const response = await fetch("/api/articles"); setArticles(await response.json()); set加载中(false); };
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
    <header><div><small>内容管理</small><h1>期刊编辑</h1></div><a href="/admin">← 返回后台</a></header>
    <section><div className="manager-heading"><div><span className="eyebrow">期刊内容库</span><h2>发布管理<br />用于<i>期刊内容。</i></h2></div><p>创建演示文章、管理草稿，并编辑客户展示所需的双语标题。</p></div>
      <div className="manager-grid"><aside className="manager-list"><div className="manager-filter"><b>全部期刊</b><span>{loading ? "加载中" : `${articles.length} 条记录`}</span></div>{articles.map((article) => <button className={current.id === article.id ? "selected" : ""} onClick={() => choose(article)} key={article.id}><span className="article-initial">{article.title.charAt(0)}</span><span><b>{article.title}</b><small>{article.category} · {article.published}</small></span><em>{article.status}</em></button>)}</aside>
        <form className="manager-form" onSubmit={save}><div className="manager-form-title"><h2>{current.id ? "编辑期刊" : "新建期刊"}</h2><button type="button" onClick={() => setCurrent(blank)} aria-label="创建新期刊">＋</button></div>
          <label>英文标题<input required value={current.title} onChange={(event) => change("title", event.target.value)} /></label>
          <label>中文标题<input value={current.titleZh || ""} onChange={(event) => change("titleZh", event.target.value)} /></label>
          <div className="manager-fields"><label>Category<input required value={current.category} onChange={(event) => change("category", event.target.value)} /></label><label>发布日期<input required type="date" value={current.published} onChange={(event) => change("published", event.target.value)} /></label></div>
          <label>Excerpt<textarea required value={current.excerpt} onChange={(event) => change("excerpt", event.target.value)} /></label>
          <div className="manager-fields"><label>作者<input required value={current.author} onChange={(event) => change("author", event.target.value)} /></label><label>状态<select value={current.status} onChange={(event) => change("status", event.target.value)}><option>草稿</option><option>已发布</option></select></label></div>
          <div className="form-actions"><button className="gold">{current.id ? "保存修改" : "创建期刊"}</button>{current.id && <button type="button" className="danger" onClick={remove}>删除</button>}</div>
        </form></div>
    </section>
  </main>;
}
