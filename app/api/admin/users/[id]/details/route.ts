import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  cpxTransactions,
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

        successfulSurveys: sql<number>`(
          select count(*)
          from ${cpxTransactions}
          where ${cpxTransactions.userId} = ${users.id}
            and lower(${cpxTransactions.status}) = 'completed'
        )`,

        failedSurveys: sql<number>`(
          select count(*)
          from ${cpxTransactions}
          where ${cpxTransactions.userId} = ${users.id}
            and lower(${cpxTransactions.status}) in (
              'failed',
              'canceled',
              'cancelled',
              'reversed',
              'rejected'
            )
        )`,

        totalEarnedUsd: sql<string>`coalesce((
          select sum(${cpxTransactions.amountUsd})
          from ${cpxTransactions}
          where ${cpxTransactions.userId} = ${users.id}
            and lower(${cpxTransactions.status}) = 'completed'
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

    const [surveyRows, withdrawalRows] = await Promise.all([
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
    ]);

    return NextResponse.json({
      user,
      surveys: surveyRows,
      withdrawals: withdrawalRows,
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    return NextResponse.json(
      { error: "Unable to load user details." },
      { status: 500 }
    );
  }
}
