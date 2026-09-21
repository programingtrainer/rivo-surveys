import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { referrals, referralRewards, users } from "@/lib/schema";

const milestones = [
  { count: 1, reward: 0.02 },
  { count: 5, reward: 0.12 },
  { count: 20, reward: 0.30 },
  { count: 30, reward: 0.42 },
  { count: 50, reward: 0.85 },
  { count: 70, reward: 1.20 },
  { count: 100, reward: 5.00 },
];

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [account] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(
        sql`${referrals.referrerUserId} = ${user.id} AND ${referrals.status} = 'qualified'`
      );

    const successfulReferrals = Number(countRow?.count ?? 0);

    const rewardRows = await db
      .select({ milestone: referralRewards.milestone, reward: referralRewards.rewardUsd })
      .from(referralRewards)
      .where(eq(referralRewards.userId, user.id))
      .orderBy(referralRewards.milestone);

    const reachedMilestones = rewardRows.map((row) => ({
      count: Number(row.milestone),
      reward: Number(row.reward),
    }));

    const currentMilestone =
      [...milestones].reverse().find((item) => successfulReferrals >= item.count) ?? null;

    const nextMilestone =
      milestones.find((item) => successfulReferrals < item.count) ?? null;

    const progress = nextMilestone
      ? Math.min(100, Math.round((successfulReferrals / nextMilestone.count) * 100))
      : 100;

    const origin = new URL(request.url).origin;
    const referralLink = account.referralCode
      ? `${origin}/register?ref=${encodeURIComponent(account.referralCode)}`
      : null;

    return NextResponse.json({
      referralCode: account.referralCode,
      referralLink,
      successfulReferrals,
      currentMilestone,
      nextMilestone,
      progress,
      milestones,
      reachedMilestones,
    });
  } catch (error) {
    console.error("Referral API error:", error);
    return NextResponse.json({ error: "Unable to load referral information." }, { status: 500 });
  }
}
