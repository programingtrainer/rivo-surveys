import { NextResponse } from "next/server";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyTasks } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

function validAudience(value: string) {
  return ["all", "new", "old"].includes(value);
}

function parseDate(value: unknown) {
  const d = new Date(String(value ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await db
    .select()
    .from(dailyTasks)
    .orderBy(desc(dailyTasks.startsAt));

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const rewardUsd = Number(body.rewardUsd);
    const audience = String(body.audience ?? "all");
    const actionUrl = body.actionUrl ? String(body.actionUrl).trim() : null;
    const startsAt = parseDate(body.startsAt);
    const expiresAt = parseDate(body.expiresAt);

    if (!title || title.length > 120) {
      return NextResponse.json({ error: "Invalid task title" }, { status: 400 });
    }

    if (!description || description.length > 1000) {
      return NextResponse.json({ error: "Invalid task description" }, { status: 400 });
    }

    if (!Number.isFinite(rewardUsd) || rewardUsd <= 0 || rewardUsd > 100) {
      return NextResponse.json({ error: "Invalid reward" }, { status: 400 });
    }

    if (!validAudience(audience)) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
    }

    if (!startsAt || !expiresAt || expiresAt <= startsAt) {
      return NextResponse.json({ error: "Invalid task schedule" }, { status: 400 });
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
      .insert(dailyTasks)
      .values({
        title,
        description,
        rewardUsd: rewardUsd.toFixed(2),
        audience,
        actionUrl,
        startsAt,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
