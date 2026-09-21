import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramCodes } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const codes = await db
      .select()
      .from(telegramCodes)
      .orderBy(desc(telegramCodes.createdAt));

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Telegram codes GET error:", error);

    return NextResponse.json(
      { error: "Unable to load Telegram codes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

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

    if (!code || !reward || !startsAt || !expiresAt) {
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

    const created = await db
      .insert(telegramCodes)
      .values({
        code,
        reward: rewardNumber.toFixed(4),
        startsAt: startDate,
        expiresAt: expiryDate,
      })
      .returning();

    return NextResponse.json(
      { code: created[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Telegram codes POST error:", error);

    const message =
      error instanceof Error && error.message.includes("unique")
        ? "This code already exists."
        : "Unable to create Telegram code.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
