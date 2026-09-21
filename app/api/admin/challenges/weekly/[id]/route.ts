import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { weeklyChallengePrizes, weeklyChallenges } from "@/lib/schema";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const [challenge] = await db.select().from(weeklyChallenges).where(eq(weeklyChallenges.id, id)).limit(1);
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (challenge.status === "settled") return NextResponse.json({ error: "Settled challenges cannot be deleted." }, { status: 400 });
  await db.delete(weeklyChallenges).where(eq(weeklyChallenges.id, id));
  return NextResponse.json({ success: true });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const [challenge] = await db.select().from(weeklyChallenges).where(eq(weeklyChallenges.id, id)).limit(1);
  const prizes = await db.select().from(weeklyChallengePrizes).where(eq(weeklyChallengePrizes.challengeId, id));
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  return NextResponse.json({ challenge, prizes });
}
