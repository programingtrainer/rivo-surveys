export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "gatapro901@gmail.com").trim().toLowerCase();

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://rivo-surveys.programingtrainer2.workers.dev"
).replace(/\/$/, "");

export const WITHDRAWAL = {
  minAmount: 15,
  maxDailyAmount: 30,
  feeRate: 0.25,
  currency: "USDT" as const,
};
