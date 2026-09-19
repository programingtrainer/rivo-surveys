import { NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cpxTransactions,
  dailyTaskCompletions,
  dailyTasks,
  referrals,
  telegramAccounts,
  users,
} from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { getTelegramChatMember } from "@/lib/telegram";

function isTelegramMember(status: string, isMember?: boolean) {
  return (
    status === "creator" ||
    status === "administrator" ||
    status === "member" ||
    (status === "restricted" && isMember === true)
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const taskId =
      typeof body?.taskId === "string"
        ? body.taskId.trim()
        : "";

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const [task] = await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.id, taskId))
      .limit(1);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 },
      );
    }

    const now = new Date();

    if (now < task.startsAt || now >= task.expiresAt) {
      return NextResponse.json(
        { error: "Task is not active" },
        { status: 400 },
      );
    }

    const [userRecord] = await db
      .select({
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const ageDays =
      (now.getTime() - new Date(userRecord.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (task.audience === "new" && ageDays > 7) {
      return NextResponse.json(
        { error: "This task is only available to new users" },
        { status: 403 },
      );
    }

    if (task.audience === "old" && ageDays <= 7) {
      return NextResponse.json(
        { error: "This task is only available to older users" },
        { status: 403 },
      );
    }

    const [existing] = await db
      .select({
        id: dailyTaskCompletions.id,
        verificationStatus:
          dailyTaskCompletions.verificationStatus,
        evidenceId: dailyTaskCompletions.evidenceId,
      })
      .from(dailyTaskCompletions)
      .where(
        and(
          eq(dailyTaskCompletions.taskId, task.id),
          eq(dailyTaskCompletions.userId, user.id),
        ),
      )
      .limit(1);

    if (existing?.verificationStatus === "verified") {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        verificationStatus: "verified",
        rewardCredited: false,
      });
    }

    let verificationStatus = "verified";
    let evidenceId = "task-claim";
    let lockKey = `task:${task.id}:user:${user.id}`;

    /*
     * TELEGRAM MEMBERSHIP
     *
     * verificationValue can optionally contain a Telegram chat ID.
     * If empty, TELEGRAM_CHAT_ID is used.
     */
    if (task.verificationType === "telegram_membership") {
      const chatId =
        task.verificationValue?.trim() ||
        process.env.TELEGRAM_CHAT_ID;

      if (!chatId) {
        return NextResponse.json(
          {
            error:
              "Telegram verification is not configured",
          },
          { status: 500 },
        );
      }

      const [telegramAccount] = await db
        .select({
          telegramUserId: telegramAccounts.telegramUserId,
          username: telegramAccounts.username,
        })
        .from(telegramAccounts)
        .where(eq(telegramAccounts.userId, user.id))
        .limit(1);

      if (!telegramAccount) {
        return NextResponse.json(
          {
            error:
              "Link your Telegram account before completing this task",
          },
          { status: 400 },
        );
      }

      const membership = await getTelegramChatMember(
        chatId,
        telegramAccount.telegramUserId,
      );

      if (
        !isTelegramMember(
          membership.status,
          membership.is_member,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "You must be a member of the required Telegram group",
          },
          { status: 400 },
        );
      }

      evidenceId =
        `telegram:${telegramAccount.telegramUserId}:${membership.status}`;
    }

    /*
     * CPX SURVEY COMPLETION
     *
     * IMPORTANT:
     * The CPX transaction is the source of truth.
     * survey_attempts is NOT used as the verification source.
     *
     * A valid survey completion must have:
     * - the same user
     * - CPX status = completed
     * - CPX type = complete
     * - created inside the task window
     * - matching offer_id when the task specifies one
     */
    else if (task.verificationType === "survey_complete") {
      const conditions = [
        eq(cpxTransactions.userId, user.id),
        eq(cpxTransactions.status, "completed"),
        sql`LOWER(COALESCE(${cpxTransactions.type}, '')) = 'complete'`,
        gte(cpxTransactions.createdAt, task.startsAt),
        lt(cpxTransactions.createdAt, task.expiresAt),
      ];

      if (task.verificationValue?.trim()) {
        conditions.push(
          eq(
            cpxTransactions.offerId,
            task.verificationValue.trim(),
          ),
        );
      }

      const [evidence] = await db
        .select({
          transactionId: cpxTransactions.transactionId,
          offerId: cpxTransactions.offerId,
          createdAt: cpxTransactions.createdAt,
        })
        .from(cpxTransactions)
        .where(and(...conditions))
        .orderBy(sql`${cpxTransactions.createdAt} DESC`)
        .limit(1);

      if (!evidence) {
        return NextResponse.json(
          {
            error:
              "No verified successful CPX survey was found for this task",
          },
          { status: 400 },
        );
      }

      evidenceId = `cpx:${evidence.transactionId}`;

      /*
       * Serialize all claims using the same CPX transaction.
       * This prevents two concurrent requests from using the
       * same CPX transaction for different Daily Tasks.
       */
      lockKey = evidenceId;
    }

    /*
     * QUALIFIED REFERRAL
     */
    else if (task.verificationType === "referral_qualified") {
      const parsedTarget = Number(
        task.verificationValue || "1",
      );

      const target = Number.isFinite(parsedTarget)
        ? Math.max(1, Math.floor(parsedTarget))
        : 1;

      const [countRow] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerUserId, user.id),
            eq(referrals.status, "qualified"),
            gte(referrals.qualifiedAt, task.startsAt),
            lt(referrals.qualifiedAt, task.expiresAt),
          ),
        );

      const count = Number(countRow?.count ?? 0);

      if (count < target) {
        return NextResponse.json(
          {
            error:
              `You need ${target} qualified referral(s) for this task`,
          },
          { status: 400 },
        );
      }

      evidenceId = `referrals:${count}`;
    }

    else {
      return NextResponse.json(
        {
          error:
            "This task does not have an automatic verification method",
        },
        { status: 400 },
      );
    }

    /*
     * ATOMIC CLAIM + WALLET CREDIT
     *
     * No Drizzle transaction is used because the current
     * neon-http driver does not support db.transaction().
     *
     * Instead, PostgreSQL performs:
     *
     * 1. transaction-level advisory lock
     * 2. completion insert/update
     * 3. wallet credit
     *
     * inside ONE SQL statement.
     *
     * The advisory lock also prevents the same CPX transaction
     * from being claimed concurrently by another Daily Task.
     */
    const claimResult = await db.execute(sql`
      WITH lock AS (
        SELECT pg_advisory_xact_lock(
          hashtextextended(${lockKey}, 0)
        ) AS locked
      ),

      claim AS (
        INSERT INTO daily_task_completions (
          task_id,
          user_id,
          reward_usd,
          verification_status,
          evidence_id,
          verified_at,
          completed_at
        )
        SELECT
          ${task.id},
          ${user.id},
          ${task.rewardUsd},
          ${verificationStatus},
          ${evidenceId},
          ${now},
          ${now}
        FROM lock
        WHERE NOT EXISTS (
          SELECT 1
          FROM daily_task_completions other
          WHERE other.evidence_id = ${evidenceId}
            AND NOT (
              other.task_id = ${task.id}
              AND other.user_id = ${user.id}
            )
        )
        ON CONFLICT (task_id, user_id)
        DO UPDATE SET
          verification_status = EXCLUDED.verification_status,
          evidence_id = EXCLUDED.evidence_id,
          verified_at = EXCLUDED.verified_at,
          completed_at = EXCLUDED.completed_at
        WHERE daily_task_completions.verification_status = 'pending'
        RETURNING
          id,
          task_id,
          user_id,
          reward_usd,
          verification_status,
          evidence_id,
          verified_at,
          completed_at
      ),

      wallet_credit AS (
        INSERT INTO wallets (
          user_id,
          balance,
          updated_at
        )
        SELECT
          user_id,
          reward_usd,
          ${now}
        FROM claim
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + EXCLUDED.balance,
          updated_at = ${now}
        RETURNING user_id
      )

      SELECT
        claim.id,
        claim.task_id,
        claim.user_id,
        claim.reward_usd,
        claim.verification_status,
        claim.evidence_id,
        claim.verified_at,
        claim.completed_at,
        EXISTS (
          SELECT 1
          FROM wallet_credit wc
          WHERE wc.user_id = claim.user_id
        ) AS wallet_credited
      FROM claim
    `);

    if (claimResult.rows.length === 0) {
      const [currentCompletion] = await db
        .select({
          id: dailyTaskCompletions.id,
          verificationStatus:
            dailyTaskCompletions.verificationStatus,
          evidenceId: dailyTaskCompletions.evidenceId,
        })
        .from(dailyTaskCompletions)
        .where(
          and(
            eq(dailyTaskCompletions.taskId, task.id),
            eq(dailyTaskCompletions.userId, user.id),
          ),
        )
        .limit(1);

      if (
        currentCompletion?.verificationStatus ===
        "verified"
      ) {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          verificationStatus: "verified",
          rewardCredited: false,
        });
      }

      if (
        task.verificationType === "survey_complete"
      ) {
        return NextResponse.json(
          {
            error:
              "This CPX survey completion has already been used for a Daily Task",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error:
            "This task has already been processed",
        },
        { status: 409 },
      );
    }

    const completion = claimResult.rows[0] as {
      id: string;
      task_id: string;
      user_id: string;
      reward_usd: string;
      verification_status: string;
      evidence_id: string | null;
      verified_at: string | null;
      completed_at: string;
      wallet_credited: boolean;
    };

    return NextResponse.json({
      success: true,
      completion: {
        id: completion.id,
        taskId: completion.task_id,
        userId: completion.user_id,
        rewardUsd: completion.reward_usd,
        verificationStatus:
          completion.verification_status,
        evidenceId: completion.evidence_id,
        verifiedAt: completion.verified_at,
        completedAt: completion.completed_at,
      },
      verificationStatus:
        completion.verification_status,
      rewardCredited:
        Boolean(completion.wallet_credited),
    });
  } catch (error) {
    console.error(
      "========== TASK COMPLETION ERROR ==========",
    );

    if (error instanceof Error) {
      console.error("NAME:", error.name);
      console.error("MESSAGE:", error.message);
      console.error("STACK:", error.stack);
      console.error("CAUSE:", error.cause);
    } else {
      console.error("RAW ERROR:", error);
    }

    console.error(
      "============================================",
    );

    return NextResponse.json(
      { error: "Failed to process task completion" },
      { status: 500 },
    );
  }
}
