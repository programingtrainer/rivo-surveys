import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/config";
import { sessions, users } from "@/lib/schema";
export async function getCurrentUser() {
  const token = (await cookies()).get("rivo_session")?.value; if (!token) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await db.select({ id: users.id, email: users.email, name: users.name, googleId: users.googleId, avatarUrl: users.avatarUrl, isBlocked: users.isBlocked }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()), eq(users.isBlocked, false))).limit(1);
  return result[0] ?? null;
}
export async function isAdmin() { const user = await getCurrentUser(); return !!user && user.email.toLowerCase() === ADMIN_EMAIL; }
