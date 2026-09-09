import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH;

function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export async function GET(request: Request) {
  try {
    if (!CPX_SECURE_HASH) {
      console.error("CPX_SECURE_HASH is missing");

      return NextResponse.json(
        { error: "Postback is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const transactionId = searchParams.get("trans_id");
    const userId = searchParams.get("user_id");
    const amountLocalRaw = searchParams.get("amount_local");
    const amountUsdRaw = searchParams.get("amount_usd");
    const offerId = searchParams.get("offer_id");
    const type = searchParams.get("type");
    const ipClick = searchParams.get("ip_click");
    const receivedHash = searchParams.get("hash");

    if (
      !status ||
      !transactionId ||
      !userId ||
      !amountLocalRaw ||
      !receivedHash
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const expectedHash = md5(`${transactionId}-${CPX_SECURE_HASH}`);

    if (receivedHash.toLowerCase() !== expectedHash.toLowerCase()) {
      console.error("Invalid CPX secure hash", {
        transactionId,
        userId,
      });

      return NextResponse.json(
        { error: "Invalid hash" },
        { status: 403 }
      );
    }

    const amountLocal = Number(amountLocalRaw);
    const amountUsd = amountUsdRaw ? Number(amountUsdRaw) : null;

    if (!Number.isFinite(amountLocal) || amountLocal <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error("CPX postback user not found:", userId);

      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    /*
     * CPX is configured as:
     * 1 USD = 1000 Rivo Coins
     *
     * Wallet balance is stored in USD.
     */
    const rewardUsd = amountLocal / 1000;

    if (status === "1") {
      /*
       * Atomic credit:
       *
       * 1. Insert the transaction.
       * 2. ON CONFLICT prevents the same transaction_id from
       *    being credited again.
       * 3. Only if the insert succeeds, update/create the wallet.
       *
       * Everything happens inside ONE PostgreSQL statement.
       */
      const result = await db.execute(sql`
        WITH inserted AS (
          INSERT INTO cpx_transactions (
            transaction_id,
            user_id,
            offer_id,
            status,
            type,
            amount_local,
            amount_usd,
            ip_click
          )
          VALUES (
            ${transactionId},
            ${userId},
            ${offerId},
            'completed',
            ${type},
            ${amountLocal.toFixed(2)},
            ${
              amountUsd !== null && Number.isFinite(amountUsd)
                ? amountUsd.toFixed(4)
                : rewardUsd.toFixed(4)
            },
            ${ipClick}
          )
          ON CONFLICT (transaction_id) DO NOTHING
          RETURNING user_id, amount_local
        )
        INSERT INTO wallets (
          user_id,
          balance,
          updated_at
        )
        SELECT
          user_id,
          (amount_local::numeric / 1000),
          NOW()
        FROM inserted
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + EXCLUDED.balance,
          updated_at = NOW()
        RETURNING user_id
      `);

      const credited = result.rows.length > 0;

      return NextResponse.json({
        success: true,
        credited,
        duplicate: !credited,
        transaction_id: transactionId,
        reward_usd: credited ? rewardUsd : 0,
      });
    }

    if (status === "2") {
      /*
       * Atomic reversal:
       *
       * The transaction is changed from completed -> canceled
       * only once. Only that successful transition can subtract
       * the reward from the wallet.
       */
      const result = await db.execute(sql`
        WITH reversed AS (
          UPDATE cpx_transactions
          SET
            status = 'canceled',
            updated_at = NOW()
          WHERE transaction_id = ${transactionId}
            AND status = 'completed'
          RETURNING user_id, amount_local
        )
        UPDATE wallets
        SET
          balance = GREATEST(
            0,
            wallets.balance - (reversed.amount_local::numeric / 1000)
          ),
          updated_at = NOW()
        FROM reversed
        WHERE wallets.user_id = reversed.user_id
        RETURNING wallets.user_id
      `);

      const reversed = result.rows.length > 0;

      return NextResponse.json({
        success: true,
        reversed,
        duplicate: !reversed,
        transaction_id: transactionId,
      });
    }

    return NextResponse.json({
      success: true,
      ignored: true,
      status,
      transaction_id: transactionId,
    });
  } catch (error) {
    console.error("CPX postback error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
