import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyTasks } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

function validVerificationType(value: string) {
  return ["external_action", "survey_complete", "referral_qualified", "telegram_membership", "manual"].includes(value);
}

function parseDate(value: unknown) {
  const d = new Date(String(value ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const rewardUsd = Number(body.rewardUsd);
    const audience = String(body.audience ?? "all");
    const actionUrl = body.actionUrl ? String(body.actionUrl).trim() : null;
    const verificationType = String(body.verificationType ?? "manual").trim();
    const verificationValue =
      body.verificationValue === null || body.verificationValue === undefined
        ? null
        : String(body.verificationValue).trim() || null;
    const startsAt = parseDate(body.startsAt);
    const expiresAt = parseDate(body.expiresAt);

    if (!title || title.length > 120 ||
        !description || description.length > 1000 ||
        !Number.isFinite(rewardUsd) || rewardUsd <= 0 || rewardUsd > 100 ||
        !["all", "new", "old"].includes(audience) ||
        !startsAt || !expiresAt || expiresAt <= startsAt) {
      return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
    }

    if (actionUrl) {
      let parsed: URL;
      try {
        parsed = new URL(actionUrl);
      } catch {
        return NextResponse.json({ error: "Invalid action URL" }, { status: 400 });
      }

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "Invalid action URL" }, { status: 400 });
      }
    }

    const [task] = await db
      .update(dailyTasks)
      .set({
        title,
        description,
        rewardUsd: rewardUsd.toFixed(2),
        audience,
        actionUrl,
        verificationType,
        verificationValue,
        startsAt,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(dailyTasks.id, id))
      .returning();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const deleted = await db
    .delete(dailyTasks)
    .where(eq(dailyTasks.id, id))
    .returning({ id: dailyTasks.id });

  if (!deleted.length) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
