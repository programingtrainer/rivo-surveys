import { users } from "../../../../../lib/schema";
import { NextResponse } from "next/server";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dailyTaskCompletions,
  dailyTasks,
  wallets,
} from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [account] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskId = String(body.taskId ?? "");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    const [task] = await db
      .select()
      .from(dailyTasks)
      .where(
        and(
          eq(dailyTasks.id, taskId),
          lt(dailyTasks.startsAt, now),
          gt(dailyTasks.expiresAt, now)
        )
      )
      .limit(1);

    if (!task) {
      return NextResponse.json(
        { error: "This task is no longer available" },
        { status: 410 }
      );
    }

    const ageMs =
      now.getTime() - new Date(account.createdAt).getTime();

    const isNew =
      ageMs <= 7 * 24 * 60 * 60 * 1000;

    if (
      (task.audience === "new" && !isNew) ||
      (task.audience === "old" && isNew)
    ) {
      return NextResponse.json(
        { error: "You are not eligible for this task" },
        { status: 403 }
      );
    }

    const result = await db.transaction(async (tx) => {
      /*
       * Insert first.
       * The unique (taskId,userId) constraint guarantees that
       * only the first request can receive the reward.
       */
      const inserted = await tx
        .insert(dailyTaskCompletions)
        .values({
          taskId: task.id,
          userId: user.id,
          rewardUsd: task.rewardUsd,
        })
        .onConflictDoNothing({
          target: [
            dailyTaskCompletions.taskId,
            dailyTaskCompletions.userId,
          ],
        })
        .returning({
          id: dailyTaskCompletions.id,
        });

      if (!inserted.length) {
        return {
          alreadyCompleted: true,
          reward: "0",
        };
      }

      await tx
        .insert(wallets)
        .values({
          userId: user.id,
          balance: task.rewardUsd,
        })
        .onConflictDoUpdate({
          target: wallets.userId,
          set: {
            balance: sql`${wallets.balance} + ${task.rewardUsd}::numeric`,
            updatedAt: new Date(),
          },
        });

      return {
        alreadyCompleted: false,
        reward: task.rewardUsd,
      };
    });

    if (result.alreadyCompleted) {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
    });
  } catch (error) {
    console.error("Daily task completion error:", error);

    return NextResponse.json(
      { error: "Unable to claim task reward" },
      { status: 500 }
    );
  }
}
