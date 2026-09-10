import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function isAdmin(){return (await cookies()).get("lumenhaus_admin")?.value==="1"}
export function forbidden(){return NextResponse.json({error:"Administrator authentication required."},{status:401})}
