import { NextResponse } from "next/server";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dailyTaskCompletions,
  dailyTasks,
  users,
} from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [account] = await db
      .select({
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    const tasks = await db
      .select()
      .from(dailyTasks)
      .where(
        and(
          lt(dailyTasks.startsAt, now),
          gt(dailyTasks.expiresAt, now)
        )
      )
      .orderBy(dailyTasks.startsAt);

    const completions = await db
      .select({
        taskId: dailyTaskCompletions.taskId,
        verificationStatus: dailyTaskCompletions.verificationStatus,
        evidenceId: dailyTaskCompletions.evidenceId,
      })
      .from(dailyTaskCompletions)
      .where(eq(dailyTaskCompletions.userId, user.id));

    const completionMap = new Map(
      completions.map((item) => [
        item.taskId,
        {
          status: item.verificationStatus,
          evidenceId: item.evidenceId,
        },
      ])
    );

    const ageDays =
      (now.getTime() - new Date(account.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const visibleTasks = tasks.filter((task) => {
      if (task.audience === "all") return true;
      if (task.audience === "new") return ageDays <= 7;
      if (task.audience === "old") return ageDays > 7;
      return false;
    });

    return NextResponse.json({
      tasks: visibleTasks.map((task) => {
        const completion = completionMap.get(task.id);

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          rewardUsd: task.rewardUsd,
          audience: task.audience,
          actionUrl: task.actionUrl,
          startsAt: task.startsAt,
          expiresAt: task.expiresAt,
          verificationType: task.verificationType,
          verificationValue: task.verificationValue,
          verificationStatus: completion?.status ?? null,
          evidenceId: completion?.evidenceId ?? null,
          completed: completion?.status === "verified",
        };
      }),
    });
  } catch (error) {
    console.error("Tasks fetch error:", error);

    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}
