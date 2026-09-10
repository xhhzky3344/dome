import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { forbidden, isAdmin } from "../../../lib/auth";
import type { SiteSettings } from "../../../lib/settings";
const file=path.join(process.cwd(),"data","site-settings.json");
export async function GET(){return NextResponse.json(JSON.parse(await fs.readFile(file,"utf8")))}
export async function PUT(request:Request){
  if(!await isAdmin())return forbidden();
  const data = await request.json() as SiteSettings;
  if (data.heroSlides && (!Array.isArray(data.heroSlides) || data.heroSlides.length !== 3)) {
    return NextResponse.json({ error: "Homepage carousel requires exactly three slides." }, { status: 400 });
  }
  await fs.writeFile(file,JSON.stringify(data,null,2));
  return NextResponse.json(data);
}
