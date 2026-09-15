import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { referrals, referralRewards } from "@/lib/schema";

function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)rivo_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

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
    const sessionToken = getSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const sessionRows = await db.execute(sql`
      SELECT user_id
      FROM sessions
      WHERE token_hash = ${tokenHash}
        AND expires_at > NOW()
      LIMIT 1
    `);

    const session = sessionRows.rows[0];

    if (!session?.user_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRows = await db.execute(sql`
      SELECT referral_code
      FROM users
      WHERE id = ${String(session.user_id)}
      LIMIT 1
    `);

    const user = userRows.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const referralCode = user.referral_code
      ? String(user.referral_code)
      : null;

    const countRows = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM referrals
      WHERE referrer_user_id = ${String(session.user_id)}
        AND status = 'qualified'
    `);

    const successfulReferrals = Number(countRows.rows[0]?.count ?? 0);

    const rewardRows = await db.execute(sql`
      SELECT milestone, reward_usd
      FROM referral_rewards
      WHERE user_id = ${String(session.user_id)}
      ORDER BY milestone ASC
    `);

    const reachedMilestones = rewardRows.rows.map((row) => ({
      count: Number(row.milestone),
      reward: Number(row.reward_usd),
    }));

    const currentMilestone =
      [...milestones]
        .reverse()
        .find((item) => successfulReferrals >= item.count) ?? null;

    const nextMilestone =
      milestones.find((item) => successfulReferrals < item.count) ?? null;

    const progress = nextMilestone
      ? Math.min(
          100,
          Math.round(
            (successfulReferrals / nextMilestone.count) * 100
          )
        )
      : 100;

    const origin = new URL(request.url).origin;

    const referralLink = referralCode
      ? `${origin}/register?ref=${encodeURIComponent(referralCode)}`
      : null;

    return NextResponse.json({
      referralCode,
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

    const details =
      error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      process.env.NODE_ENV === "production"
        ? { error: "Internal server error" }
        : { error: "Referral API error", details },
      { status: 500 }
    );
  }
}
