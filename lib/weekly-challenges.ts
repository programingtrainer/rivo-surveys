import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { weeklyChallenges } from "@/lib/schema";
import { sql } from "drizzle-orm";

export const WEEKLY_CHALLENGE_TYPES = [
  "most_surveys",
  "most_earnings",
  "survey_target",
  "earnings_target",
] as const;

export type WeeklyChallengeType = (typeof WEEKLY_CHALLENGE_TYPES)[number];

export function isWeeklyChallengeType(value: string): value is WeeklyChallengeType {
  return (WEEKLY_CHALLENGE_TYPES as readonly string[]).includes(value);
}

export async function settleExpiredWeeklyChallenges() {
  const now = new Date();
  const expired = await db
    .select()
    .from(weeklyChallenges)
    .where(
      and(
        lt(weeklyChallenges.expiresAt, now),
        sql`${weeklyChallenges.status} <> 'settled'`,
      ),
    );

  for (const challenge of expired) {
    if (challenge.status === "settled") continue;

    if (challenge.challengeType === "most_surveys" || challenge.challengeType === "most_earnings") {
      const metric = challenge.challengeType === "most_surveys"
        ? sql`count(*)::numeric`
        : sql`coalesce(sum(amount_usd), 0)::numeric`;

      await db.execute(sql`
        WITH ranked AS (
          SELECT
            user_id,
            ROW_NUMBER() OVER (
              ORDER BY ${metric} DESC, user_id ASC
            )::numeric AS rank,
            ${metric} AS metric_value
          FROM cpx_transactions
          WHERE created_at >= ${challenge.startsAt}
            AND created_at < ${challenge.expiresAt}
            AND lower(status) = 'completed'
            AND lower(coalesce(type, '')) = 'complete'
          GROUP BY user_id
        ),
        eligible AS (
          SELECT r.user_id, r.rank, p.reward_usd
          FROM ranked r
          INNER JOIN weekly_challenge_prizes p
            ON p.challenge_id = ${challenge.id}
           AND p.rank = r.rank
        ),
        inserted AS (
          INSERT INTO weekly_challenge_winners (
            challenge_id, user_id, rank, reward_usd, settled_at
          )
          SELECT challenge_id, user_id, rank, reward_usd, NOW()
          FROM (
            SELECT ${challenge.id}::uuid AS challenge_id, e.*
            FROM eligible e
          ) x
          ON CONFLICT (challenge_id, user_id) DO NOTHING
          RETURNING user_id, reward_usd
        )
        INSERT INTO wallets (user_id, balance, updated_at)
        SELECT user_id, reward_usd, NOW()
        FROM inserted
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + EXCLUDED.balance,
          updated_at = NOW()
      `);
    } else if (challenge.challengeType === "survey_target" || challenge.challengeType === "earnings_target") {
      const metric = challenge.challengeType === "survey_target"
        ? sql`count(*)::numeric`
        : sql`coalesce(sum(amount_usd), 0)::numeric`;

      await db.execute(sql`
        WITH eligible AS (
          SELECT
            user_id,
            ROW_NUMBER() OVER (ORDER BY ${metric} DESC, user_id ASC)::numeric AS rank
          FROM cpx_transactions
          WHERE created_at >= ${challenge.startsAt}
            AND created_at < ${challenge.expiresAt}
            AND lower(status) = 'completed'
            AND lower(coalesce(type, '')) = 'complete'
          GROUP BY user_id
          HAVING ${metric} >= ${challenge.target ?? "0"}::numeric
        ),
        inserted AS (
          INSERT INTO weekly_challenge_winners (
            challenge_id, user_id, rank, reward_usd, settled_at
          )
          SELECT
            ${challenge.id},
            user_id,
            rank,
            ${challenge.rewardUsd ?? "0"}::numeric,
            NOW()
          FROM eligible
          ON CONFLICT (challenge_id, user_id) DO NOTHING
          RETURNING user_id, reward_usd
        )
        INSERT INTO wallets (user_id, balance, updated_at)
        SELECT user_id, reward_usd, NOW()
        FROM inserted
        ON CONFLICT (user_id)
        DO UPDATE SET
          balance = wallets.balance + EXCLUDED.balance,
          updated_at = NOW()
      `);
    }

    await db
      .update(weeklyChallenges)
      .set({ status: "settled", updatedAt: new Date() })
      .where(eq(weeklyChallenges.id, challenge.id));
  }
}
