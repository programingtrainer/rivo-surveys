import { NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { transactionDb } from "@/lib/db";
import {
  dailyTaskCompletions,
  dailyTasks,
  referrals,
  surveyAttempts,
  users,
  wallets,
} from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";


export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const result = await transactionDb.transaction(async (tx) => {
      const [task] = await tx
        .select()
        .from(dailyTasks)
        .where(eq(dailyTasks.id, taskId))
        .limit(1);

      if (!task) {
        return { error: "Task not found", status: 404 } as const;
      }

      const now = new Date();

      if (now < task.startsAt || now >= task.expiresAt) {
        return { error: "Task is not active", status: 400 } as const;
      }

      const [userRecord] = await tx
        .select({ createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!userRecord) {
        return { error: "User not found", status: 404 } as const;
      }

      const ageDays =
        (now.getTime() - new Date(userRecord.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);

      if (task.audience === "new" && ageDays > 7) {
        return { error: "This task is only available to new users", status: 403 } as const;
      }

      if (task.audience === "old" && ageDays <= 7) {
        return { error: "This task is only available to older users", status: 403 } as const;
      }

      const [existing] = await tx
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
        return {
          success: true,
          alreadyClaimed: true,
          verificationStatus: "verified",
          rewardCredited: false,
        } as const;
      }

      let verificationStatus = "verified";
      let evidenceId = "task-claim";

      if (task.verificationType === "survey_complete") {
        const conditions = [
          eq(surveyAttempts.userId, user.id),
          eq(surveyAttempts.status, "completed"),
          eq(surveyAttempts.type, "complete"),
          gte(surveyAttempts.completedAt, task.startsAt),
          lte(surveyAttempts.completedAt, task.expiresAt),
        ];

        if (task.verificationValue?.trim()) {
          conditions.push(eq(surveyAttempts.offerId, task.verificationValue.trim()));
        }

        const [evidence] = await tx
          .select({ id: surveyAttempts.id, transactionId: surveyAttempts.transactionId })
          .from(surveyAttempts)
          .where(and(...conditions))
          .orderBy(sql`${surveyAttempts.completedAt} DESC`)
          .limit(1);

        if (!evidence) {
          return {
            error: "No verified successful survey was found for this task",
            status: 400,
          } as const;
        }

        evidenceId = evidence.transactionId || evidence.id;
      } else if (task.verificationType === "referral_qualified") {
        const target = Math.max(1, Number(task.verificationValue || "1"));

        const [countRow] = await tx
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
          return {
            error: `You need ${target} qualified referral(s) for this task`,
            status: 400,
          } as const;
        }

        evidenceId = `referrals:${count}`;
      }

      if (existing) {
        const [updated] = await tx
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
          return {
            success: true,
            alreadyClaimed: true,
            verificationStatus: "verified",
            rewardCredited: false,
          } as const;
        }

        await tx
          .insert(wallets)
          .values({ userId: user.id, balance: task.rewardUsd })
          .onConflictDoUpdate({
            target: wallets.userId,
            set: {
              balance: sql`${wallets.balance} + ${task.rewardUsd}`,
              updatedAt: now,
            },
          });

        return {
          success: true,
          completion: updated,
          verificationStatus,
          rewardCredited: true,
        } as const;
      }

      const [completion] = await tx
        .insert(dailyTaskCompletions)
        .values({
          taskId: task.id,
          userId: user.id,
          rewardUsd: task.rewardUsd,
          verificationStatus,
          evidenceId,
          verifiedAt: now,
        })
        .returning();

      await tx
        .insert(wallets)
        .values({ userId: user.id, balance: task.rewardUsd })
        .onConflictDoUpdate({
          target: wallets.userId,
          set: {
            balance: sql`${wallets.balance} + ${task.rewardUsd}`,
            updatedAt: now,
          },
        });

      return {
        success: true,
        completion,
        verificationStatus,
        rewardCredited: true,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
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
