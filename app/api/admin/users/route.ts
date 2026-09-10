import { NextResponse } from "next/server";
import { desc, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { cpxTransactions, users, wallets, withdrawals } from "@/lib/schema";
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

      withdrawalCount: sql<number>`(
        select count(*)
        from ${withdrawals}
        where ${withdrawals.userId} = ${users.id}
      )`,

      totalWithdrawn: sql<string>`coalesce((
        select sum(${withdrawals.netAmount})
        from ${withdrawals}
        where ${withdrawals.userId} = ${users.id}
          and lower(${withdrawals.status}) = 'paid'
      ), '0')`,

      totalEarnedUsd: sql<string>`coalesce((
        select sum(${cpxTransactions.amountUsd})
        from ${cpxTransactions}
        where ${cpxTransactions.userId} = ${users.id}
          and lower(${cpxTransactions.status}) = 'completed'
      ), '0')`,
    })
    .from(users)
    .where(ne(users.email, ADMIN_EMAIL))
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: result });
}
