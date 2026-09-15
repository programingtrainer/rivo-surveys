import { NextResponse } from "next/server";
import { and, asc, eq, gt, lt, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyTaskCompletions, dailyTasks, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

function audienceMatches(audience: string, createdAt: Date) {
  if (audience === "all") return true;

  const ageMs = Date.now() - createdAt.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (audience === "new") return ageMs <= sevenDays;
  if (audience === "old") return ageMs > sevenDays;

  return false;
}

export async function GET() {
  const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ tasks: [] }, { status: 401 });
    }

    const [account] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const tasks = await db
    .select()
    .from(dailyTasks)
    .where(
      and(
        ltDate(dailyTasks.startsAt, now),
        gtDate(dailyTasks.expiresAt, now)
      )
    )
    .orderBy(asc(dailyTasks.expiresAt));

  const completed = await db
    .select({ taskId: dailyTaskCompletions.taskId })
    .from(dailyTaskCompletions)
    .where(eq(dailyTaskCompletions.userId, user.id));

  const completedIds = new Set(completed.map((x) => x.taskId));

  return NextResponse.json({
    tasks: tasks
      .filter((task) => audienceMatches(task.audience, new Date(account.createdAt)))
      .map((task) => ({
        ...task,
        completed: completedIds.has(task.id),
      })),
  });
}

function ltDate(column: typeof dailyTasks.startsAt, value: Date) {
  return lt(column, value);
}
function gtDate(column: typeof dailyTasks.expiresAt, value: Date) {
  return gt(column, value);
}
