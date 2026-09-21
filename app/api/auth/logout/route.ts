import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rivo_session")?.value;

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, tokenHash));
    }

    cookieStore.delete("rivo_session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);

    const cookieStore = await cookies();
    cookieStore.delete("rivo_session");

    return NextResponse.json({ success: true });
  }
}
