import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, transactionDb } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

const ADMIN_EMAIL = "gatapro901@gmail.com";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const action = body?.action;

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json(
        { error: "Invalid action." },
        { status: 400 },
      );
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    if (user.email.toLowerCase() === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "The administrator account cannot be modified here." },
        { status: 403 },
      );
    }

    const isBlocked = action === "block";

    await transactionDb.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          isBlocked,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      if (isBlocked) {
        await tx.delete(sessions).where(eq(sessions.userId, id));
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id,
        isBlocked,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to update account." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    if (user.email.toLowerCase() === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "The administrator account cannot be deleted." },
        { status: 403 },
      );
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to delete account." },
      { status: 500 },
    );
  }
        }
