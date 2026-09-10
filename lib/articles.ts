import { promises as fs } from "node:fs";
import path from "node:path";
export type Article={id:string;title:string;titleZh:string;category:string;excerpt:string;published:string;author:string;status:string};
const file=path.join(process.cwd(),"data","articles.json");
async function readArticles(){return JSON.parse(await fs.readFile(file,"utf8")) as Article[]}
export async function getArticles(){return (await readArticles()).filter((article)=>article.status==="Published")}
export async function getArticle(id:string){return (await getArticles()).find((article)=>article.id===id)}
