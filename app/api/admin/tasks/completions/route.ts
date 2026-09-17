import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  dailyTaskCompletions,
  dailyTasks,
  users,
  wallets,
} from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const completions = await db
    .select({
      id: dailyTaskCompletions.id,
      taskId: dailyTaskCompletions.taskId,
      taskTitle: dailyTasks.title,
      userId: dailyTaskCompletions.userId,
      userEmail: users.email,
      rewardUsd: dailyTaskCompletions.rewardUsd,
      verificationStatus: dailyTaskCompletions.verificationStatus,
      evidenceId: dailyTaskCompletions.evidenceId,
      completedAt: dailyTaskCompletions.completedAt,
      verifiedAt: dailyTaskCompletions.verifiedAt,
    })
    .from(dailyTaskCompletions)
    .innerJoin(dailyTasks, eq(dailyTasks.id, dailyTaskCompletions.taskId))
    .innerJoin(users, eq(users.id, dailyTaskCompletions.userId))
    .where(eq(dailyTaskCompletions.verificationStatus, "pending"))
    .orderBy(dailyTaskCompletions.completedAt);

  return NextResponse.json({ completions });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const completionId = String(body.completionId ?? "").trim();
    const action = String(body.action ?? "").trim().toLowerCase();

    if (!completionId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const [completion] = await db
      .select()
      .from(dailyTaskCompletions)
      .where(eq(dailyTaskCompletions.id, completionId))
      .limit(1);

    if (!completion) {
      return NextResponse.json({ error: "Completion not found" }, { status: 404 });
    }

    if (completion.verificationStatus !== "pending") {
      return NextResponse.json({ error: "Completion already processed" }, { status: 400 });
    }

    if (action === "reject") {
      await db
        .update(dailyTaskCompletions)
        .set({
          verificationStatus: "rejected",
        })
        .where(eq(dailyTaskCompletions.id, completionId));

      return NextResponse.json({
        success: true,
        status: "rejected",
      });
    }

    const [updated] = await db
      .update(dailyTaskCompletions)
      .set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
      })
      .where(
        and(
          eq(dailyTaskCompletions.id, completionId),
          eq(dailyTaskCompletions.verificationStatus, "pending")
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Completion was already processed" }, { status: 409 });
    }

    await db
      .insert(wallets)
      .values({
        userId: updated.userId,
        balance: updated.rewardUsd,
      })
      .onConflictDoUpdate({
        target: wallets.userId,
        set: {
          balance: sql`${wallets.balance} + ${updated.rewardUsd}`,
        },
      });

    return NextResponse.json({
      success: true,
      status: "verified",
      rewardCredited: true,
    });
  } catch (error) {
    console.error("Admin task verification error:", error);

    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 }
    );
  }
}
