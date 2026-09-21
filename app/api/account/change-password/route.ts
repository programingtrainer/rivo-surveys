import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { users, sessions } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const password =
      typeof body.password === "string" ? body.password : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Both password fields are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Rotate the session after a password change.
    // This invalidates every old session, including any stolen session token.
    const newSessionToken = crypto.randomBytes(32).toString("hex");
    const newTokenHash = crypto
      .createHash("sha256")
      .update(newSessionToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    );

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx
        .delete(sessions)
        .where(eq(sessions.userId, user.id));

      await tx.insert(sessions).values({
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      });
    });

    const cookieStore = await cookies();

    cookieStore.set("rivo_session", newSessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      expires: expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { error: "Unable to change password right now." },
      { status: 500 }
    );
  }
}
