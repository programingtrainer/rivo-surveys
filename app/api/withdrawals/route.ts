import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { WITHDRAWAL } from "@/lib/config";

const { minAmount: MIN_WITHDRAWAL, maxDailyAmount: MAX_DAILY_WITHDRAWAL, feeRate: FEE_RATE, currency: CURRENCY } = WITHDRAWAL;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const amount = Number(body?.amount);

    const payoutAddress =
      typeof body?.payoutAddress === "string"
        ? body.payoutAddress.trim()
        : "";

    if (!Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    if (amount > MAX_DAILY_WITHDRAWAL) {
      return NextResponse.json(
        {
          error: `Maximum withdrawal is $${MAX_DAILY_WITHDRAWAL.toFixed(2)} per day`,
        },
        { status: 400 }
      );
    }

    if (amount > 99999999.99) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    if (!payoutAddress || payoutAddress.length > 255) {
      return NextResponse.json(
        { error: "A valid USDT payout address is required" },
        { status: 400 }
      );
    }

    const amountFixed = amount.toFixed(2);
    const feeFixed = (amount * FEE_RATE).toFixed(2);
    const netFixed = (amount * (1 - FEE_RATE)).toFixed(2);

    /*
     * Saudi Arabia local day:
     * Asia/Riyadh = UTC+3
     *
     * The daily limit counts withdrawal requests created today
     * that have not been cancelled or failed.
     */
    const result = await db.execute(sql`
      WITH daily_total AS (
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM withdrawals
        WHERE user_id = ${user.id}
          AND status NOT IN ('failed', 'canceled')
          AND (created_at AT TIME ZONE 'Asia/Riyadh')::date =
              (NOW() AT TIME ZONE 'Asia/Riyadh')::date
      ),
      existing_pending AS (
        SELECT id
        FROM withdrawals
        WHERE user_id = ${user.id}
          AND status IN ('pending', 'processing')
        LIMIT 1
      ),
      deducted AS (
        UPDATE wallets
        SET
          balance = balance - ${amountFixed}::numeric,
          updated_at = NOW()
        WHERE user_id = ${user.id}
          AND balance >= ${amountFixed}::numeric
          AND NOT EXISTS (
            SELECT 1
            FROM existing_pending
          )
          AND (
            SELECT total
            FROM daily_total
          ) + ${amountFixed}::numeric <= ${MAX_DAILY_WITHDRAWAL}::numeric
        RETURNING user_id
      )
      INSERT INTO withdrawals (
        user_id,
        amount,
        fee,
        net_amount,
        currency,
        payout_address,
        status,
        provider
      )
      SELECT
        user_id,
        ${amountFixed}::numeric,
        ${feeFixed}::numeric,
        ${netFixed}::numeric,
        ${CURRENCY},
        ${payoutAddress},
        'pending',
        'faucetpay'
      FROM deducted
      RETURNING
        id,
        amount,
        fee,
        net_amount,
        currency,
        payout_address,
        status,
        provider,
        created_at
    `);

    if (result.rows.length === 0) {
      const walletResult = await db.execute(sql`
        SELECT balance
        FROM wallets
        WHERE user_id = ${user.id}
        LIMIT 1
      `);

      const wallet = walletResult.rows[0];
      const balance = Number(wallet?.balance ?? 0);

      if (balance < amount) {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance",
            balance,
          },
          { status: 400 }
        );
      }

      const pendingResult = await db.execute(sql`
        SELECT id
        FROM withdrawals
        WHERE user_id = ${user.id}
          AND status IN ('pending', 'processing')
        LIMIT 1
      `);

      if (pendingResult.rows.length > 0) {
        return NextResponse.json(
          {
            error:
              "You already have a pending withdrawal. Please wait until it is processed.",
          },
          { status: 409 }
        );
      }

      const dailyResult = await db.execute(sql`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM withdrawals
        WHERE user_id = ${user.id}
          AND status NOT IN ('failed', 'canceled')
          AND (created_at AT TIME ZONE 'Asia/Riyadh')::date =
              (NOW() AT TIME ZONE 'Asia/Riyadh')::date
      `);

      const withdrawnToday = Number(
        dailyResult.rows[0]?.total ?? 0
      );

      const remainingToday = Math.max(
        0,
        MAX_DAILY_WITHDRAWAL - withdrawnToday
      );

      if (remainingToday < amount) {
        return NextResponse.json(
          {
            error: `Daily withdrawal limit is $${MAX_DAILY_WITHDRAWAL.toFixed(2)}. You can withdraw up to $${remainingToday.toFixed(2)} more today.`,
            withdrawnToday,
            remainingToday,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Unable to create withdrawal request",
        },
        { status: 400 }
      );
    }

    const withdrawal = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount: Number(withdrawal.amount),
          fee: Number(withdrawal.fee),
          netAmount: Number(withdrawal.net_amount),
          currency: withdrawal.currency,
          payoutAddress: withdrawal.payout_address,
          status: withdrawal.status,
          provider: withdrawal.provider,
          createdAt: withdrawal.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Withdrawal creation error:", error);

    return NextResponse.json(
      { error: "Unable to create withdrawal request" },
      { status: 500 }
    );
  }
}
