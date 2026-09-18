import { list } from "./db";
export type Article={id:string;title:string;titleZh:string;category:string;excerpt:string;published:string;author:string;status:string};
async function readArticles(){return list("articles") as unknown as Article[]}
export async function getArticles(){return (await readArticles()).filter(a=>a.status==="Published")}
export async function getArticle(id:string){return (await getArticles()).find(a=>a.id===id)}
