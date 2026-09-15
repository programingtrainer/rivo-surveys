import { NextResponse } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  telegramCodes,
  telegramCodeRedemptions,
  wallets,
} from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

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
    const code =
      typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json(
        { error: "Please enter a code." },
        { status: 400 }
      );
    }

    const now = new Date();

    const rows = await db
      .select()
      .from(telegramCodes)
      .where(
        and(
          eq(telegramCodes.code, code),
          lt(telegramCodes.startsAt, now),
          gt(telegramCodes.expiresAt, now)
        )
      )
      .limit(1);

    const telegramCode = rows[0];

    if (!telegramCode) {
      return NextResponse.json(
        { error: "This code is invalid or has expired." },
        { status: 404 }
      );
    }

    const redemption = await db
      .insert(telegramCodeRedemptions)
      .values({
        codeId: telegramCode.id,
        userId: user.id,
        reward: telegramCode.reward,
      })
      .onConflictDoNothing({
        target: [
          telegramCodeRedemptions.codeId,
          telegramCodeRedemptions.userId,
        ],
      })
      .returning({ id: telegramCodeRedemptions.id });

    if (redemption.length === 0) {
      return NextResponse.json(
        { error: "You have already redeemed this code." },
        { status: 409 }
      );
    }

    const updatedWallet = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${telegramCode.reward}::numeric`,
        updatedAt: now,
      })
      .where(eq(wallets.userId, user.id))
      .returning({ balance: wallets.balance });

    if (updatedWallet.length === 0) {
      console.error("Telegram redemption wallet not found:", user.id);

      return NextResponse.json(
        { error: "Unable to update your wallet. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Code redeemed successfully.",
      reward: telegramCode.reward,
      balance: updatedWallet[0].balance,
    });
  } catch (error) {
    console.error("Telegram code redemption error:", error);

    return NextResponse.json(
      { error: "Unable to redeem this code. Please try again." },
      { status: 500 }
    );
  }
}
