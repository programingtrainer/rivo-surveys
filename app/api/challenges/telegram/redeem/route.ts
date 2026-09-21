import { NextResponse } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramCodes, telegramCodeRedemptions, wallets } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json({ error: "Please enter a code." }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const now = new Date();
      const [telegramCode] = await tx
        .select()
        .from(telegramCodes)
        .where(
          and(
            eq(telegramCodes.code, code),
            lt(telegramCodes.startsAt, now),
            gt(telegramCodes.expiresAt, now),
          ),
        )
        .limit(1);

      if (!telegramCode) {
        return { error: "This code is invalid or has expired.", status: 404 } as const;
      }

      const [redemption] = await tx
        .insert(telegramCodeRedemptions)
        .values({
          codeId: telegramCode.id,
          userId: user.id,
          reward: telegramCode.reward,
        })
        .onConflictDoNothing({
          target: [telegramCodeRedemptions.codeId, telegramCodeRedemptions.userId],
        })
        .returning({ id: telegramCodeRedemptions.id });

      if (!redemption) {
        return { error: "You have already redeemed this code.", status: 409 } as const;
      }

      const [wallet] = await tx
        .insert(wallets)
        .values({ userId: user.id, balance: telegramCode.reward })
        .onConflictDoUpdate({
          target: wallets.userId,
          set: {
            balance: sql`${wallets.balance} + ${telegramCode.reward}`,
            updatedAt: now,
          },
        })
        .returning({ balance: wallets.balance });

      if (!wallet) {
        throw new Error("Wallet update failed");
      }

      return {
        success: true,
        message: "Code redeemed successfully.",
        reward: telegramCode.reward,
        balance: wallet.balance,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Telegram code redemption error:", error);
    return NextResponse.json(
      { error: "Unable to redeem this code. Please try again." },
      { status: 500 },
    );
  }
}
