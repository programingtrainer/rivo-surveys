import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";

import { transactionDb } from "@/lib/db";
import { users, sessions } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { isStrongPassword } from "@/lib/password";

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

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters, no more than 72 UTF-8 bytes, and contain uppercase, lowercase, number, and special character, with no spaces.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sessionToken = (await cookies()).get("rivo_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401 }
      );
    }

    const currentTokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await transactionDb.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx
        .delete(sessions)
        .where(
          and(
            eq(sessions.userId, user.id),
            ne(sessions.tokenHash, currentTokenHash),
          ),
        );
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Other sessions were signed out.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { error: "Unable to change password right now." },
      { status: 500 }
    );
  }
}
