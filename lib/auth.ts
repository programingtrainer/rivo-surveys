import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/config";
import { sessions, users } from "@/lib/schema";
export async function getCurrentUser() {
  const token = (await cookies()).get("rivo_session")?.value;

  if (!token) return null;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      googleId: users.googleId,
      avatarUrl: users.avatarUrl,
      isBlocked: users.isBlocked,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, now),
        eq(users.isBlocked, false)
      )
    )
    .limit(1);

  const user = result[0];

  if (!user) return null;

  // Rolling 7-day inactivity window.
  // Every authenticated request using getCurrentUser()
  // extends the server-side session by 7 days.
  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await db
    .update(sessions)
    .set({ expiresAt: newExpiresAt })
    .where(eq(sessions.tokenHash, tokenHash));

  return user;
}

export async function isAdmin() { const user = await getCurrentUser(); return !!user && user.email.toLowerCase() === ADMIN_EMAIL; }
