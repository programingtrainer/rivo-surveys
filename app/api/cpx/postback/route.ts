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

    /*
     * status=1:
     * - type=complete -> successful survey
     * - type=out      -> screened out / out, but still credited by CPX
     * - anything else -> failed/unknown attempt
     */
    if (status === "1") {
      const normalizedType = String(type || "").trim().toLowerCase();

      const attemptStatus =
        normalizedType === "complete"
          ? "completed"
          : normalizedType === "out"
            ? "out"
            : "failed";

      /*
       * Atomic financial operation:
       *
       * 1. Insert CPX transaction.
       * 2. Prevent duplicate transaction credit.
       * 3. Qualify referral ONLY for type=complete.
       * 4. Calculate cumulative referral milestones.
       * 5. Credit CPX reward + referral milestone rewards.
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
          RETURNING user_id, amount_local, type
        ),

        qualified AS (
          UPDATE referrals r
          SET
            status = 'qualified',
            qualified_at = NOW()
          FROM inserted i
          WHERE r.referred_user_id = i.user_id
            AND r.status = 'pending'
            AND r.referrer_user_id <> r.referred_user_id
            AND LOWER(COALESCE(i.type, '')) = 'complete'
          RETURNING r.referrer_user_id
        ),

        milestone_data (milestone, total_reward, delta_reward) AS (
          VALUES
            (1,   0.02::numeric, 0.02::numeric),
            (5,   0.12::numeric, 0.10::numeric),
            (20,  0.30::numeric, 0.18::numeric),
            (30,  0.42::numeric, 0.12::numeric),
            (50,  0.85::numeric, 0.43::numeric),
            (70,  1.20::numeric, 0.35::numeric),
            (100, 5.00::numeric, 3.80::numeric)
        ),

        referrer_counts AS (
          SELECT
            q.referrer_user_id,
            (
              SELECT COUNT(*)::int
              FROM referrals r
              WHERE r.referrer_user_id = q.referrer_user_id
                AND r.status = 'qualified'
            ) + COUNT(*)::int AS qualified_count
          FROM qualified q
          GROUP BY q.referrer_user_id
        ),

        new_rewards AS (
          INSERT INTO referral_rewards (
            user_id,
            milestone,
            reward_usd
          )
          SELECT
            rc.referrer_user_id,
            md.milestone,
            md.total_reward
          FROM referrer_counts rc
          CROSS JOIN milestone_data md
          WHERE rc.qualified_count >= md.milestone
            AND NOT EXISTS (
              SELECT 1
              FROM referral_rewards rr
              WHERE rr.user_id = rc.referrer_user_id
                AND rr.milestone = md.milestone
            )
          ON CONFLICT (user_id, milestone) DO NOTHING
          RETURNING user_id, milestone
        ),

        wallet_changes AS (
          SELECT
            user_id,
            SUM(amount)::numeric AS amount
          FROM (
            SELECT
              user_id,
              amount_local::numeric / 1000 AS amount
            FROM inserted

            UNION ALL

            SELECT
              nr.user_id,
              md.delta_reward AS amount
            FROM new_rewards nr
            JOIN milestone_data md
              ON md.milestone = nr.milestone
          ) changes
          GROUP BY user_id
        ),

        wallet_credit AS (
          INSERT INTO wallets (
            user_id,
            balance,
            updated_at
          )
          SELECT
            user_id,
            amount,
            NOW()
          FROM wallet_changes
          ON CONFLICT (user_id)
          DO UPDATE SET
            balance = wallets.balance + EXCLUDED.balance,
            updated_at = NOW()
          RETURNING user_id
        )

        SELECT
          (SELECT COUNT(*) FROM inserted)::int AS inserted_count,
          (SELECT COUNT(*) FROM qualified)::int AS qualified_count,
          (SELECT COUNT(*) FROM new_rewards)::int AS new_reward_count
      `);

      /*
       * Link this CPX postback to the survey attempt that
       * started most recently for the same user + offer.
       *
       * We intentionally match only "started" attempts so
       * duplicate CPX callbacks cannot rewrite an old attempt.
       */
      const attemptResult = await db.execute(sql`
        UPDATE survey_attempts
        SET
          status = ${attemptStatus},
          type = ${type},
          transaction_id = ${transactionId},
          amount_local = ${amountLocal.toFixed(2)},
          amount_usd = ${
            amountUsd !== null && Number.isFinite(amountUsd)
              ? amountUsd.toFixed(4)
              : rewardUsd.toFixed(4)
          },
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = (
          SELECT id
          FROM survey_attempts
          WHERE user_id = ${userId}
            AND offer_id = ${offerId}
            AND status = 'started'
            AND started_at >= NOW() - INTERVAL '24 hours'
          ORDER BY started_at DESC
          LIMIT 1
        )
        RETURNING id
      `);

      const row = result.rows[0] as {
        inserted_count: number;
        qualified_count: number;
        new_reward_count: number;
      };

      const credited = Number(row?.inserted_count ?? 0) > 0;
      const referralQualified =
        Number(row?.qualified_count ?? 0) > 0;
      const referralRewardsGranted =
        Number(row?.new_reward_count ?? 0);

      return NextResponse.json({
        success: true,
        credited,
        duplicate: !credited,
        transaction_id: transactionId,
        reward_usd: credited ? rewardUsd : 0,
        survey_attempt_updated: attemptResult.rows.length > 0,
        survey_status: attemptStatus,
        referral_qualified: referralQualified,
        referral_rewards_granted: referralRewardsGranted,
      });
    }

    /*
     * status=2 = CPX cancellation/reversal.
     *
     * The financial transaction is reversed only once.
     * Referral qualification/rewards are intentionally NOT
     * reversed in this v1 implementation.
     */
    if (status === "2") {
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

      /*
       * If this transaction belongs to a survey attempt,
       * mark that attempt as failed/canceled.
       */
      const attemptResult = await db.execute(sql`
        UPDATE survey_attempts
        SET
          status = 'failed',
          type = ${type},
          transaction_id = ${transactionId},
          amount_local = ${amountLocal.toFixed(2)},
          amount_usd = ${
            amountUsd !== null && Number.isFinite(amountUsd)
              ? amountUsd.toFixed(4)
              : rewardUsd.toFixed(4)
          },
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = (
          SELECT id
          FROM survey_attempts
          WHERE (
            transaction_id = ${transactionId}
            OR (
              user_id = ${userId}
              AND offer_id = ${offerId}
              AND status = 'started'
              AND started_at >= NOW() - INTERVAL '24 hours'
            )
          )
          ORDER BY
            CASE
              WHEN transaction_id = ${transactionId} THEN 0
              ELSE 1
            END,
            started_at DESC
          LIMIT 1
        )
        RETURNING id
      `);

      const reversed = result.rows.length > 0;

      return NextResponse.json({
        success: true,
        reversed,
        duplicate: !reversed,
        transaction_id: transactionId,
        survey_attempt_updated: attemptResult.rows.length > 0,
        survey_status: "failed",
      });
    }

    /*
     * Unknown CPX status:
     * record it as a failed attempt if a matching started
     * attempt exists, but do not touch the wallet.
     */
    const attemptResult = await db.execute(sql`
      UPDATE survey_attempts
      SET
        status = 'failed',
        type = ${type},
        transaction_id = ${transactionId},
        amount_local = ${amountLocal.toFixed(2)},
        amount_usd = ${
          amountUsd !== null && Number.isFinite(amountUsd)
            ? amountUsd.toFixed(4)
            : rewardUsd.toFixed(4)
        },
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = (
        SELECT id
        FROM survey_attempts
        WHERE user_id = ${userId}
          AND offer_id = ${offerId}
          AND status = 'started'
          AND started_at >= NOW() - INTERVAL '24 hours'
        ORDER BY started_at DESC
        LIMIT 1
      )
      RETURNING id
    `);

    return NextResponse.json({
      success: true,
      ignored: true,
      status,
      transaction_id: transactionId,
      survey_attempt_updated: attemptResult.rows.length > 0,
      survey_status: "failed",
    });
  } catch (error) {
    console.error("CPX postback error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
