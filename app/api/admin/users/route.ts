import { NextResponse } from "next/server";
import { desc, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { cpxTransactions, dailyTaskCompletions, telegramCodeRedemptions, referrals, users, wallets, withdrawals, weeklyChallengeWinners } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

const ADMIN_EMAIL = "gatapro901@gmail.com";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,

      balance: sql<string>`coalesce((
        select ${wallets.balance}
        from ${wallets}
        where ${wallets.userId} = ${users.id}
        limit 1
      ), '0')`,

      totalSurveys: sql<number>`(
        select count(*)
        from ${cpxTransactions}
        where ${cpxTransactions.userId} = ${users.id}
      )`,

      completedDailyTasks: sql<number>`(
        select count(*)
        from ${dailyTaskCompletions}
        where ${dailyTaskCompletions.userId} = ${users.id}
      )`,

      successfulSurveys: sql<number>`(
        select count(*)
        from ${cpxTransactions}
        where ${cpxTransactions.userId} = ${users.id}
          and lower(${cpxTransactions.status}) = 'completed'
          and lower(coalesce(${cpxTransactions.type}, '')) = 'complete'
      )`,

      outSurveys: sql<number>`(
        select count(*)
        from ${cpxTransactions}
        where ${cpxTransactions.userId} = ${users.id}
          and lower(${cpxTransactions.status}) = 'completed'
          and lower(coalesce(${cpxTransactions.type}, '')) = 'out'
      )`,

      failedSurveys: sql<number>`(
        select count(*)
        from ${cpxTransactions}
        where ${cpxTransactions.userId} = ${users.id}
          and (
            lower(${cpxTransactions.status}) <> 'completed'
            or lower(coalesce(${cpxTransactions.type}, '')) not in ('complete', 'out')
          )
      )`,

      withdrawalCount: sql<number>`(
        select count(*)
        from ${withdrawals}
        where ${withdrawals.userId} = ${users.id}
      )`,

      weeklyChallengeWins: sql<number>`(
        select count(*)
        from ${weeklyChallengeWinners}
        where ${weeklyChallengeWinners.userId} = ${users.id}
      )`,

      weeklyChallengeEarningsUsd: sql<string>`coalesce((
        select sum(${weeklyChallengeWinners.rewardUsd})
        from ${weeklyChallengeWinners}
        where ${weeklyChallengeWinners.userId} = ${users.id}
      ), '0')`,

      totalWithdrawn: sql<string>`coalesce((
        select sum(${withdrawals.netAmount})
        from ${withdrawals}
        where ${withdrawals.userId} = ${users.id}
          and lower(${withdrawals.status}) = 'paid'
      ), '0')`,

      totalEarnedUsd: sql<string>`(
        coalesce((
          select sum(${cpxTransactions.amountUsd})
          from ${cpxTransactions}
          where ${cpxTransactions.userId} = ${users.id}
            and lower(${cpxTransactions.status}) = 'completed'
            and lower(coalesce(${cpxTransactions.type}, '')) in ('complete', 'out')
        ), 0)
        +
        coalesce((
          select sum(${dailyTaskCompletions.rewardUsd})
          from ${dailyTaskCompletions}
          where ${dailyTaskCompletions.userId} = ${users.id}
            and lower(${dailyTaskCompletions.verificationStatus}) = 'verified'
        ), 0)
        +
        coalesce((
          select sum(rr.reward_usd)
          from referral_rewards rr
          where rr.user_id = ${users.id}
        ), 0)
        +
        coalesce((
          select sum(${telegramCodeRedemptions.reward})
          from ${telegramCodeRedemptions}
          where ${telegramCodeRedemptions.userId} = ${users.id}
        ), 0)
        +
        coalesce((
          select sum(${weeklyChallengeWinners.rewardUsd})
          from ${weeklyChallengeWinners}
          where ${weeklyChallengeWinners.userId} = ${users.id}
        ), 0)
      )`,

      successfulReferrals: sql<number>`(
        select count(*)
        from ${referrals}
        where ${referrals.referrerUserId} = ${users.id}
          and lower(${referrals.status}) = 'qualified'
      )`,
    })
    .from(users)
    .where(ne(users.email, ADMIN_EMAIL))
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: result });
}
