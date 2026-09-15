import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  cpxTransactions,
  referrals,
  surveyAttempts,
  users,
  wallets,
  withdrawals,
} from "@/lib/schema";
import { isAdmin } from "@/lib/auth";

const ADMIN_EMAIL = "gatapro901@gmail.com";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        googleId: users.googleId,
        avatarUrl: users.avatarUrl,
        isBlocked: users.isBlocked,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        referralCode: users.referralCode,

        balance: sql<string>`coalesce((
          select ${wallets.balance}
          from ${wallets}
          where ${wallets.userId} = ${users.id}
          limit 1
        ), '0')`,

        totalSurveys: sql<number>`(
          select count(*)
          from ${surveyAttempts}
          where ${surveyAttempts.userId} = ${users.id}
        )`,

        successfulSurveys: sql<number>`(
          select count(*)
          from ${surveyAttempts}
          where ${surveyAttempts.userId} = ${users.id}
            and lower(${surveyAttempts.status}) = 'completed'
        )`,

        outSurveys: sql<number>`(
          select count(*)
          from ${surveyAttempts}
          where ${surveyAttempts.userId} = ${users.id}
            and lower(${surveyAttempts.status}) = 'out'
        )`,

        failedSurveys: sql<number>`(
          select count(*)
          from ${surveyAttempts}
          where ${surveyAttempts.userId} = ${users.id}
            and lower(${surveyAttempts.status}) = 'failed'
        )`,

        startedSurveys: sql<number>`(
          select count(*)
          from ${surveyAttempts}
          where ${surveyAttempts.userId} = ${users.id}
            and lower(${surveyAttempts.status}) = 'started'
        )`,

        totalEarnedUsd: sql<string>`coalesce((
          select sum(${cpxTransactions.amountUsd})
          from ${cpxTransactions}
          where ${cpxTransactions.userId} = ${users.id}
            and lower(${cpxTransactions.status}) = 'completed'
            and lower(coalesce(${cpxTransactions.type}, '')) = 'complete'
        ), '0')`,

        withdrawalCount: sql<number>`(
          select count(*)
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
        )`,

        paidWithdrawalCount: sql<number>`(
          select count(*)
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
            and lower(${withdrawals.status}) = 'paid'
        )`,

        totalWithdrawn: sql<string>`coalesce((
          select sum(${withdrawals.netAmount})
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
            and lower(${withdrawals.status}) = 'paid'
        ), '0')`,

        totalRequestedWithdrawals: sql<string>`coalesce((
          select sum(${withdrawals.amount})
          from ${withdrawals}
          where ${withdrawals.userId} = ${users.id}
        ), '0')`,

        successfulReferrals: sql<number>`(
          select count(*)
          from ${referrals}
          where ${referrals.referrerUserId} = ${users.id}
            and lower(${referrals.status}) = 'qualified'
        )`,

        pendingReferrals: sql<number>`(
          select count(*)
          from ${referrals}
          where ${referrals.referrerUserId} = ${users.id}
            and lower(${referrals.status}) = 'pending'
        )`,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = userRows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user.email.toLowerCase() === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Administrator details are not available here." },
        { status: 403 }
      );
    }

    const [
      surveyRows,
      surveyAttemptRows,
      withdrawalRows,
      surveyStats,
      referralRows,
      referralRewardStats,
    ] = await Promise.all([
      db
        .select({
          id: cpxTransactions.id,
          transactionId: cpxTransactions.transactionId,
          offerId: cpxTransactions.offerId,
          status: cpxTransactions.status,
          type: cpxTransactions.type,
          amountLocal: cpxTransactions.amountLocal,
          amountUsd: cpxTransactions.amountUsd,
          ipClick: cpxTransactions.ipClick,
          createdAt: cpxTransactions.createdAt,
          updatedAt: cpxTransactions.updatedAt,
        })
        .from(cpxTransactions)
        .where(eq(cpxTransactions.userId, id))
        .orderBy(asc(cpxTransactions.createdAt)),

      db
        .select({
          id: surveyAttempts.id,
          offerId: surveyAttempts.offerId,
          status: surveyAttempts.status,
          type: surveyAttempts.type,
          transactionId: surveyAttempts.transactionId,
          amountLocal: surveyAttempts.amountLocal,
          amountUsd: surveyAttempts.amountUsd,
          startedAt: surveyAttempts.startedAt,
          completedAt: surveyAttempts.completedAt,
          updatedAt: surveyAttempts.updatedAt,
        })
        .from(surveyAttempts)
        .where(eq(surveyAttempts.userId, id))
        .orderBy(asc(surveyAttempts.startedAt)),

      db
        .select({
          id: withdrawals.id,
          amount: withdrawals.amount,
          fee: withdrawals.fee,
          netAmount: withdrawals.netAmount,
          currency: withdrawals.currency,
          payoutAddress: withdrawals.payoutAddress,
          status: withdrawals.status,
          provider: withdrawals.provider,
          providerPayoutId: withdrawals.providerPayoutId,
          failureReason: withdrawals.failureReason,
          createdAt: withdrawals.createdAt,
          updatedAt: withdrawals.updatedAt,
        })
        .from(withdrawals)
        .where(eq(withdrawals.userId, id))
        .orderBy(asc(withdrawals.createdAt)),

      db
        .select({
          totalSurveys: sql<number>`count(*)`.as("total_surveys"),
          successfulSurveys: sql<number>`count(*) filter (
            where lower(${surveyAttempts.status}) = 'completed'
          )`.as("successful_surveys"),
          outSurveys: sql<number>`count(*) filter (
            where lower(${surveyAttempts.status}) = 'out'
          )`.as("out_surveys"),
          failedSurveys: sql<number>`count(*) filter (
            where lower(${surveyAttempts.status}) = 'failed'
          )`.as("failed_surveys"),
          startedSurveys: sql<number>`count(*) filter (
            where lower(${surveyAttempts.status}) = 'started'
          )`.as("started_surveys"),
          totalEarnedUsd: sql<string>`coalesce(
            sum(${surveyAttempts.amountUsd}) filter (
              where lower(${surveyAttempts.status}) = 'completed'
            ),
            0
          )`.as("total_earned_usd"),
        })
        .from(surveyAttempts)
        .where(eq(surveyAttempts.userId, id)),

      db.execute(sql`
        SELECT
          r.id,
          r.referred_user_id,
          r.status,
          r.qualified_at,
          r.created_at,
          u.name AS referred_name,
          u.email AS referred_email
        FROM referrals r
        INNER JOIN users u ON u.id = r.referred_user_id
        WHERE r.referrer_user_id = ${id}
        ORDER BY r.created_at DESC
      `),

      db.execute(sql`
        SELECT COALESCE(SUM(reward_usd), 0) AS referral_earnings
        FROM referral_rewards
        WHERE user_id = ${id}
      `),
    ]);

    const stats = surveyStats[0];

    return NextResponse.json({
      user: {
        ...user,
        totalSurveys: Number(stats?.totalSurveys ?? 0),
        successfulSurveys: Number(stats?.successfulSurveys ?? 0),
        outSurveys: Number(stats?.outSurveys ?? 0),
        failedSurveys: Number(stats?.failedSurveys ?? 0),
        startedSurveys: Number(stats?.startedSurveys ?? 0),
        totalEarnedUsd: String(stats?.totalEarnedUsd ?? "0"),
        successfulReferrals: Number(user.successfulReferrals ?? 0),
        pendingReferrals: Number(user.pendingReferrals ?? 0),
        referralEarnings: String(
          referralRewardStats.rows[0]?.referral_earnings ?? "0"
        ),
      },
      surveys: surveyRows,
      surveyAttempts: surveyAttemptRows,
      withdrawals: withdrawalRows,
      referrals: referralRows.rows.map((row) => ({
        id: String(row.id),
        referredUserId: String(row.referred_user_id),
        referredName: row.referred_name
          ? String(row.referred_name)
          : null,
        referredEmail: String(row.referred_email),
        status: String(row.status),
        qualifiedAt: row.qualified_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    return NextResponse.json(
      { error: "Unable to load user details." },
      { status: 500 }
    );
  }
}
