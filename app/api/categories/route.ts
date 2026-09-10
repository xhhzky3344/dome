import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";
const file=path.join(process.cwd(),"data","categories.json");
const read=async()=>JSON.parse(await fs.readFile(file,"utf8")); const write=async(data:unknown)=>fs.writeFile(file,JSON.stringify(data,null,2));
export async function GET(){const categories=await read();return NextResponse.json(await isAdmin()?categories:categories.filter((category:{published:boolean})=>category.published))}
export async function POST(request:Request){if(!await isAdmin())return forbidden();const item=await request.json();if(!item.name||!item.slug)return NextResponse.json({error:"Name and slug are required"},{status:400});const all=await read();const saved={...item,id:crypto.randomUUID(),published:Boolean(item.published)};all.push(saved);await write(all);return NextResponse.json(saved,{status:201})}
export async function PUT(request:Request){if(!await isAdmin())return forbidden();const item=await request.json();const all=await read();const index=all.findIndex((x:{id:string})=>x.id===item.id);if(index<0)return NextResponse.json({error:"Not found"},{status:404});all[index]=item;await write(all);return NextResponse.json(item)}
