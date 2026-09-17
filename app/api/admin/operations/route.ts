import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, withdrawals, wallets } from "@/lib/schema";
import { isAdmin } from "@/lib/auth";
import {
  checkFaucetPayAddress,
  sendFaucetPayPayout,
  FaucetPayError,
} from "@/lib/faucetpay";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const rows = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        name: users.name,
        email: users.email,
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
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt))
      .limit(200);

    const summary = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${withdrawals.status} = 'pending')`,
        processing: sql<number>`count(*) filter (where ${withdrawals.status} = 'processing')`,
        paid: sql<number>`count(*) filter (where ${withdrawals.status} = 'paid')`,
        failed: sql<number>`count(*) filter (where ${withdrawals.status} = 'failed')`,
        canceled: sql<number>`count(*) filter (where ${withdrawals.status} = 'canceled')`,
        totalAmount: sql<string>`coalesce(sum(${withdrawals.amount}) filter (where ${withdrawals.status} <> 'canceled'), 0)`,
        totalPaid: sql<string>`coalesce(sum(${withdrawals.netAmount}) filter (where ${withdrawals.status} = 'paid'), 0)`,
      })
      .from(withdrawals);

    return NextResponse.json({
      withdrawals: rows,
      summary: summary[0] ?? {
        total: 0,
        pending: 0,
        processing: 0,
        paid: 0,
        failed: 0,
        canceled: 0,
        totalAmount: "0",
        totalPaid: "0",
      },
    });
  } catch (error) {
    console.error("Admin operations GET error:", error);

    return NextResponse.json(
      { error: "Unable to load operations." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();

    const id = String(body?.id || "");
    const action = String(body?.action || "");
    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim().slice(0, 500)
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Withdrawal ID is required." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid operation." },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "A rejection reason is required." },
        { status: 400 }
      );
    }

    /*
     * REJECT
     *
     * Only a pending withdrawal can be manually rejected.
     * The full gross amount is refunded because that amount was
     * originally deducted from the user's wallet.
     */
    if (action === "reject") {
      const result = await db.transaction(async (tx) => {
        const updated = await tx
          .update(withdrawals)
          .set({
            status: "canceled",
            failureReason: reason,
            updatedAt: new Date(),
          })
          .where(
            sql`${withdrawals.id} = ${id} AND ${withdrawals.status} = 'pending'`
          )
          .returning({
            id: withdrawals.id,
            userId: withdrawals.userId,
            amount: withdrawals.amount,
            status: withdrawals.status,
          });

        if (!updated.length) {
          return null;
        }

        const withdrawal = updated[0];

        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${withdrawal.amount}::numeric`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, withdrawal.userId));

        return withdrawal;
      });

      if (!result) {
        return NextResponse.json(
          {
            error:
              "This withdrawal is no longer pending or has already been processed.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        withdrawal: result,
        refunded: true,
      });
    }

    /*
     * APPROVE / PAY
     *
     * Claim pending -> processing atomically.
     *
     * If it is already processing, we allow a retry. The same
     * withdrawal ID creates the same FaucetPay idempotency key,
     * so retrying cannot double-pay.
     */
    const claimed = await db
      .update(withdrawals)
      .set({
        status: "processing",
        updatedAt: new Date(),
      })
      .where(
        sql`${withdrawals.id} = ${id} AND ${withdrawals.status} IN ('pending', 'processing')`
      )
      .returning({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        netAmount: withdrawals.netAmount,
        currency: withdrawals.currency,
        payoutAddress: withdrawals.payoutAddress,
        status: withdrawals.status,
        providerPayoutId: withdrawals.providerPayoutId,
      });

    if (!claimed.length) {
      return NextResponse.json(
        {
          error:
            "This withdrawal is no longer pending or processing.",
        },
        { status: 409 }
      );
    }

    const withdrawal = claimed[0];

    if (withdrawal.currency !== "USDT") {
      const refunded = await db.transaction(async (tx) => {
        const updated = await tx
          .update(withdrawals)
          .set({
            status: "failed",
            failureReason: "Unsupported payout currency.",
            updatedAt: new Date(),
          })
          .where(
            sql`${withdrawals.id} = ${withdrawal.id} AND ${withdrawals.status} = 'processing'`
          )
          .returning({
            userId: withdrawals.userId,
            amount: withdrawals.amount,
          });

        if (!updated.length) return false;

        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${updated[0].amount}::numeric`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, updated[0].userId));

        return true;
      });

      return NextResponse.json(
        {
          error: "Unsupported payout currency. The amount was refunded.",
          refunded,
        },
        { status: 400 }
      );
    }

    try {
      /*
       * First verify that the address belongs to a payable
       * FaucetPay user for USDT.
       */
      await checkFaucetPayAddress(withdrawal.payoutAddress);

      /*
       * Send ONLY netAmount.
       *
       * The 25% Rivo fee has already been taken when the withdrawal
       * was created. Never deduct it again here.
       */
      const cfConnectingIp = request.headers.get("cf-connecting-ip");
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ipAddress =
        cfConnectingIp ||
        (forwardedFor ? forwardedFor.split(",")[0].trim() : undefined);

      const payout = await sendFaucetPayPayout({
        withdrawalId: withdrawal.id,
        address: withdrawal.payoutAddress,
        amount: withdrawal.netAmount,
        ipAddress,
      });

      const paid = await db
        .update(withdrawals)
        .set({
          status: "paid",
          providerPayoutId: payout.payoutId,
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(
          sql`${withdrawals.id} = ${withdrawal.id} AND ${withdrawals.status} = 'processing'`
        )
        .returning({
          id: withdrawals.id,
          status: withdrawals.status,
          providerPayoutId: withdrawals.providerPayoutId,
          netAmount: withdrawals.netAmount,
        });

      if (!paid.length) {
        /*
         * The payout may already have happened. Do NOT refund here.
         * The idempotency key makes a future retry safe.
         */
        return NextResponse.json({
          success: true,
          status: "processing",
          message:
            "Payout was submitted, but the database status needs reconciliation.",
          payoutId: payout.payoutId,
        });
      }

      return NextResponse.json({
        success: true,
        withdrawal: paid[0],
        message: "Payout sent successfully.",
      });
    } catch (error) {
      console.error("FaucetPay payout error:", error);

      const faucetPayError =
        error instanceof FaucetPayError ? error : null;

      /*
       * Definitive errors mean FaucetPay confirmed that the payout
       * did not happen. Refund the original gross amount.
       *
       * Non-definitive errors stay processing because the request
       * might have reached FaucetPay. Retrying is safe because the
       * idempotency key is derived from the withdrawal ID.
       */
      if (faucetPayError?.definitive) {
        const failed = await db.transaction(async (tx) => {
          const updated = await tx
            .update(withdrawals)
            .set({
              status: "failed",
              failureReason: faucetPayError.message.slice(0, 500),
              updatedAt: new Date(),
            })
            .where(
              sql`${withdrawals.id} = ${withdrawal.id} AND ${withdrawals.status} = 'processing'`
            )
            .returning({
              id: withdrawals.id,
              userId: withdrawals.userId,
              amount: withdrawals.amount,
              status: withdrawals.status,
            });

          if (!updated.length) {
            return null;
          }

          const failedWithdrawal = updated[0];

          await tx
            .update(wallets)
            .set({
              balance: sql`${wallets.balance} + ${failedWithdrawal.amount}::numeric`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.userId, failedWithdrawal.userId));

          return failedWithdrawal;
        });

        return NextResponse.json(
          {
            error:
              faucetPayError?.message ||
              "FaucetPay rejected the payout.",
            refunded: Boolean(failed),
            status: "failed",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            faucetPayError?.message ||
            "Payout could not be confirmed. The withdrawal remains processing and can be retried safely.",
          status: "processing",
          retryable: true,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Admin operations PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update withdrawal." },
      { status: 500 }
    );
  }
}
