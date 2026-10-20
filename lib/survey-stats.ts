import { sql } from "drizzle-orm";
import { cpxTransactions } from "@/lib/schema";

export const successfulSurveyCondition = sql`
  (
  lower(${cpxTransactions.status}) = 'completed'
  and lower(coalesce(${cpxTransactions.type}, '')) = 'complete'
  )
`;

export const outSurveyCondition = sql`
  (
  lower(${cpxTransactions.status}) = 'completed'
  and lower(coalesce(${cpxTransactions.type}, '')) = 'out'
  )
`;

export const failedSurveyCondition = sql`
  (
  lower(${cpxTransactions.status}) <> 'completed'
  or lower(coalesce(${cpxTransactions.type}, '')) not in ('complete', 'out')
  )
`;

export const rewardedSurveyCondition = sql`
  (
  lower(${cpxTransactions.status}) = 'completed'
  and lower(coalesce(${cpxTransactions.type}, '')) in ('complete', 'out')
  )
`;
