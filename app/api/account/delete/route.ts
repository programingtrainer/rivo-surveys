import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/config";


export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (user.email.toLowerCase() === ADMIN_EMAIL) {
      return NextResponse.json(
        {
          error:
            "The administrator account cannot be deleted.",
        },
        { status: 403 }
      );
    }

    await db.delete(users).where(eq(users.id, user.id));

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: "rivo_session",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Delete account error:", error);

    return NextResponse.json(
      { error: "Unable to delete your account right now." },
      { status: 500 }
    );
  }
}
