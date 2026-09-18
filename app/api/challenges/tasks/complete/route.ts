import { NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dailyTaskCompletions,
  dailyTasks,
  referrals,
  surveyAttempts,
  telegramAccounts,
  users,
  wallets,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskId =
      typeof body?.taskId === "string" ? body.taskId.trim() : "";

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
      .select({ createdAt: users.createdAt })
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
        verificationStatus: dailyTaskCompletions.verificationStatus,
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
          { error: "Telegram verification is not configured" },
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

      evidenceId = `telegram:${telegramAccount.telegramUserId}:${membership.status}`;
    } else if (task.verificationType === "survey_complete") {
      const conditions = [
        eq(surveyAttempts.userId, user.id),
        eq(surveyAttempts.status, "completed"),
        eq(surveyAttempts.type, "complete"),
        gte(surveyAttempts.completedAt, task.startsAt),
        lte(surveyAttempts.completedAt, task.expiresAt),
      ];

      if (task.verificationValue?.trim()) {
        conditions.push(
          eq(
            surveyAttempts.offerId,
            task.verificationValue.trim(),
          ),
        );
      }

      const [evidence] = await db
        .select({
          id: surveyAttempts.id,
          transactionId: surveyAttempts.transactionId,
        })
        .from(surveyAttempts)
        .where(and(...conditions))
        .orderBy(sql`${surveyAttempts.completedAt} DESC`)
        .limit(1);

      if (!evidence) {
        return NextResponse.json(
          {
            error:
              "No verified successful survey was found for this task",
          },
          { status: 400 },
        );
      }

      evidenceId = evidence.transactionId || evidence.id;
    } else if (task.verificationType === "referral_qualified") {
      const parsedTarget = Number(task.verificationValue || "1");
      const target = Number.isFinite(parsedTarget)
        ? Math.max(1, Math.floor(parsedTarget))
        : 1;

      const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerUserId, user.id),
            eq(referrals.status, "qualified"),
            gte(referrals.qualifiedAt, task.startsAt),
            lte(referrals.qualifiedAt, task.expiresAt),
          ),
        );

      const count = Number(countRow?.count ?? 0);

      if (count < target) {
        return NextResponse.json(
          {
            error: `You need ${target} qualified referral(s) for this task`,
          },
          { status: 400 },
        );
      }

      evidenceId = `referrals:${count}`;
    } else {
      return NextResponse.json(
        {
          error:
            "This task does not have an automatic verification method",
        },
        { status: 400 },
      );
    }

    /*
     * Rewarding is intentionally performed only after verification.
     *
     * The completion row is inserted first with ON CONFLICT DO NOTHING.
     * This gives us an idempotency barrier for task/user.
     */
    if (existing) {
      const [updated] = await db
        .update(dailyTaskCompletions)
        .set({
          verificationStatus,
          evidenceId,
          verifiedAt: now,
        })
        .where(
          and(
            eq(dailyTaskCompletions.id, existing.id),
            eq(dailyTaskCompletions.verificationStatus, "pending"),
          ),
        )
        .returning();

      if (!updated) {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          verificationStatus: "verified",
          rewardCredited: false,
        });
      }

      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${task.rewardUsd}`,
          updatedAt: now,
        })
        .where(eq(wallets.userId, user.id));

      return NextResponse.json({
        success: true,
        completion: updated,
        verificationStatus,
        rewardCredited: true,
      });
    }

    const [completion] = await db
      .insert(dailyTaskCompletions)
      .values({
        taskId: task.id,
        userId: user.id,
        rewardUsd: task.rewardUsd,
        verificationStatus,
        evidenceId,
        verifiedAt: now,
      })
      .onConflictDoNothing({
        target: [
          dailyTaskCompletions.taskId,
          dailyTaskCompletions.userId,
        ],
      })
      .returning();

    if (!completion) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        verificationStatus: "verified",
        rewardCredited: false,
      });
    }

    await db
      .insert(wallets)
      .values({
        userId: user.id,
        balance: task.rewardUsd,
      })
      .onConflictDoUpdate({
        target: wallets.userId,
        set: {
          balance: sql`${wallets.balance} + ${task.rewardUsd}`,
          updatedAt: now,
        },
      });

    return NextResponse.json({
      success: true,
      completion,
      verificationStatus,
      rewardCredited: true,
    });
  } catch (error) {
    console.error("========== TASK COMPLETION ERROR ==========");

    if (error instanceof Error) {
      console.error("NAME:", error.name);
      console.error("MESSAGE:", error.message);
      console.error("STACK:", error.stack);
      console.error("CAUSE:", error.cause);
    } else {
      console.error("RAW ERROR:", error);
    }

    console.error("============================================");

    return NextResponse.json(
      { error: "Failed to process task completion" },
      { status: 500 },
    );
  }
}
