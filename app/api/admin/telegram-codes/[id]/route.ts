import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramCodes } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const code =
      typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    const reward =
      typeof body?.reward === "string" || typeof body?.reward === "number"
        ? String(body.reward).trim()
        : "";

    const startsAt =
      typeof body?.startsAt === "string" ? body.startsAt.trim() : "";

    const expiresAt =
      typeof body?.expiresAt === "string" ? body.expiresAt.trim() : "";

    if (!id || !code || !reward || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const rewardNumber = Number(reward);
    const startDate = new Date(startsAt);
    const expiryDate = new Date(expiresAt);

    if (
      !Number.isFinite(rewardNumber) ||
      rewardNumber <= 0 ||
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(expiryDate.getTime()) ||
      expiryDate <= startDate
    ) {
      return NextResponse.json(
        { error: "Invalid reward or time range." },
        { status: 400 }
      );
    }

    const updated = await db
      .update(telegramCodes)
      .set({
        code,
        reward: rewardNumber.toFixed(4),
        startsAt: startDate,
        expiresAt: expiryDate,
        updatedAt: new Date(),
      })
      .where(eq(telegramCodes.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Telegram code not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: updated[0] });
  } catch (error: unknown) {
    console.error("Telegram codes PATCH error:", error);

    const message =
      error instanceof Error && error.message.includes("unique")
        ? "This code already exists."
        : "Unable to update Telegram code.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required." },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(telegramCodes)
      .where(eq(telegramCodes.id, id))
      .returning({ id: telegramCodes.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Telegram code not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram codes DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to delete Telegram code." },
      { status: 500 }
    );
  }
}
