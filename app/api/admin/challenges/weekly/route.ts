import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { weeklyChallengePrizes, weeklyChallenges } from "@/lib/schema";
import { WEEKLY_CHALLENGE_TYPES, isWeeklyChallengeType } from "@/lib/weekly-challenges";

function parseDate(value: unknown) {
  const d = new Date(String(value ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function validText(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text && text.length <= max ? text : null;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const challenges = await db.select().from(weeklyChallenges).orderBy(desc(weeklyChallenges.startsAt));
  const prizes = await db.select().from(weeklyChallengePrizes);
  return NextResponse.json({ challenges, prizes });
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await (await import("@/lib/auth")).getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const title = validText(body.title, 120);
    const description = validText(body.description, 1000);
    const type = String(body.challengeType ?? "").trim();
    const startsAt = parseDate(body.startsAt);
    const expiresAt = parseDate(body.expiresAt);
    const target = body.target === "" || body.target == null ? null : Number(body.target);
    const rewardUsd = body.rewardUsd === "" || body.rewardUsd == null ? null : Number(body.rewardUsd);
    const prizes = Array.isArray(body.prizes) ? body.prizes : [];

    if (!title || !description || !isWeeklyChallengeType(type) || !startsAt || !expiresAt) {
      return NextResponse.json({ error: "Invalid challenge data" }, { status: 400 });
    }
    const duration = expiresAt.getTime() - startsAt.getTime();
    if (duration !== 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Every weekly challenge must last exactly 7 days." }, { status: 400 });
    }
    if (startsAt >= expiresAt || expiresAt <= new Date()) {
      return NextResponse.json({ error: "Challenge must be scheduled for a future 7-day period." }, { status: 400 });
    }
    if (
      (type === "survey_target" || type === "earnings_target") &&
      (target == null || !Number.isFinite(target) || target <= 0)
    ) {
      return NextResponse.json({ error: "A positive target is required." }, { status: 400 });
    }
    if (
      (type === "survey_target" || type === "earnings_target") &&
      (rewardUsd == null || !Number.isFinite(rewardUsd) || rewardUsd <= 0 || rewardUsd > 10000)
    ) {
      return NextResponse.json({ error: "A valid target reward is required." }, { status: 400 });
    }
    if ((type === "most_surveys" || type === "most_earnings") && !prizes.length) {
      return NextResponse.json({ error: "At least one leaderboard prize is required." }, { status: 400 });
    }

    const normalizedPrizes = prizes.map((p: any) => ({ rank: Number(p.rank), rewardUsd: Number(p.rewardUsd) }))
      .filter((p: { rank: number; rewardUsd: number }) => Number.isInteger(p.rank) && p.rank >= 1 && Number.isFinite(p.rewardUsd) && p.rewardUsd > 0 && p.rewardUsd <= 10000)
      .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank);

    if ((type === "most_surveys" || type === "most_earnings") && normalizedPrizes.length !== prizes.length) {
      return NextResponse.json({ error: "Invalid leaderboard prize." }, { status: 400 });
    }
    if (new Set(normalizedPrizes.map((p: { rank: number }) => p.rank)).size !== normalizedPrizes.length) {
      return NextResponse.json({ error: "Prize ranks must be unique." }, { status: 400 });
    }

    const [challenge] = await db.insert(weeklyChallenges).values({
      title,
      description,
      challengeType: type,
      target: target == null ? null : target.toFixed(2),
      rewardUsd: rewardUsd == null ? null : rewardUsd.toFixed(2),
      startsAt,
      expiresAt,
      status: "scheduled",
      createdBy: user.id,
    }).returning();

    if (normalizedPrizes.length) {
      await db.insert(weeklyChallengePrizes).values(normalizedPrizes.map((p: { rank: number; rewardUsd: number }) => ({
        challengeId: challenge.id,
        rank: p.rank.toFixed(0),
        rewardUsd: p.rewardUsd.toFixed(2),
      })));
    }

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error("Create weekly challenge error:", error);
    return NextResponse.json({ error: "Failed to create weekly challenge" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ types: WEEKLY_CHALLENGE_TYPES });
}
