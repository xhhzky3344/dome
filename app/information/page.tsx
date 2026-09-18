import { list } from "../../lib/db";
import { getProducts } from "../../lib/catalog";
import { DemoSubscribe } from "../../components/DemoSubscribe";
export default async function Page() {
  const products = await getProducts();
  return (
    <main className="commerce">
      <a href="/">← 网站首页</a>
      <h1>品牌、空间案例与服务说明</h1>
      <p className="demo-banner">以下内容用于演示，无真实交易或服务承诺。</p>
      <a href="/shop">演示选购 →</a>
      {list("content")
        .filter((x) => x.published !== false)
        .map((c) => (
          <article className="commerce-card" key={c.id}>
            <h2>{String(c.title)}</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{String(c.content)}</p>
          </article>
        ))}
      <h2>空间案例</h2>
      {list("cases")
        .filter((x) => x.published !== false)
        .map((c) => (
          <article className="commerce-card" key={c.id}>
            {!!c.image && (
              <img
                className="commerce-image"
                src={String(c.image)}
                alt={String(c.title)}
              />
            )}
            <h2>{String(c.title)}</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{String(c.content)}</p>
            <div className="commerce-actions">
              {products
                .filter(
                  (p) =>
                    p.status === "Published" &&
                    ((c.productIds as string[]) || []).includes(p.id),
                )
                .map((p) => (
                  <a key={p.id} href={`/product/${p.id}`}>
                    {p.name}
                  </a>
                ))}
            </div>
          </article>
        ))}
      <DemoSubscribe />
    </main>
  );
}
