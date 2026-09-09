import { NextResponse } from "next/server"; import { desc, ne } from "drizzle-orm"; import { db } from "@/lib/db"; import { users } from "@/lib/schema"; import { isAdmin } from "@/lib/auth";
const ADMIN_EMAIL="gatapro901@gmail.com";
export async function GET(){if(!(await isAdmin()))return NextResponse.json({error:"Forbidden."},{status:403}); const result=await db.select({id:users.id,name:users.name,email:users.email,isBlocked:users.isBlocked,createdAt:users.createdAt}).from(users).where(ne(users.email,ADMIN_EMAIL)).orderBy(desc(users.createdAt)); return NextResponse.json({users:result});}
