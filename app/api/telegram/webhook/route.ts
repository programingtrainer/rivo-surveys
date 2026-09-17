import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  telegramAccounts,
  telegramLinkTokens,
} from "@/lib/schema";
import {
  getTelegramChatMember,
  sendTelegramMessage,
} from "@/lib/telegram";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getChatId() {
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is not configured");
  }

  return chatId;
}

export async function POST(request: Request) {
  try {
    const update = await request.json();

    const message = update?.message;
    const telegramUser = message?.from;
    const text =
      typeof message?.text === "string" ? message.text.trim() : "";

    if (!message || !telegramUser || !text) {
      return NextResponse.json({ ok: true });
    }

    const startMatch = text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);

    if (!startMatch) {
      return NextResponse.json({ ok: true });
    }

    const token = startMatch[1]?.trim();

    if (!token) {
      await sendTelegramMessage(
        telegramUser.id,
        "Welcome to Rivo Surveys! 👋\n\nOpen the Telegram linking link from your Rivo account to securely connect your Telegram account.",
      );

      return NextResponse.json({ ok: true });
    }

    const tokenHash = hashToken(token);

    const tokenRows = await db
      .select()
      .from(telegramLinkTokens)
      .where(
        and(
          eq(telegramLinkTokens.tokenHash, tokenHash),
          isNull(telegramLinkTokens.usedAt),
          gt(telegramLinkTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    const linkToken = tokenRows[0];

    if (!linkToken) {
      await sendTelegramMessage(
        telegramUser.id,
        "❌ This Rivo linking link is invalid or expired.\n\nPlease generate a new linking link from your Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    const chatId = getChatId();

    let membership;

    try {
      membership = await getTelegramChatMember(
        chatId,
        telegramUser.id,
      );
    } catch (error) {
      console.error("Telegram membership check failed:", error);

      await sendTelegramMessage(
        telegramUser.id,
        "⚠️ I couldn't verify your membership in the Rivo Surveys Telegram group right now. Please make sure you joined @RivoSurveys and try again.",
      );

      return NextResponse.json({ ok: true });
    }

    const validStatuses = new Set([
      "creator",
      "administrator",
      "member",
      "restricted",
    ]);

    const isMember =
      validStatuses.has(membership.status) &&
      (membership.status !== "restricted" || membership.is_member === true);

    if (!isMember) {
      await sendTelegramMessage(
        telegramUser.id,
        "❌ Telegram account detected, but you are not currently a member of @RivoSurveys.\n\nJoin the group first, then send this same linking link again.",
      );

      return NextResponse.json({ ok: true });
    }

    const existingTelegramAccount = await db
      .select()
      .from(telegramAccounts)
      .where(eq(telegramAccounts.telegramUserId, String(telegramUser.id)))
      .limit(1);

    if (
      existingTelegramAccount[0] &&
      existingTelegramAccount[0].userId !== linkToken.userId
    ) {
      await sendTelegramMessage(
        telegramUser.id,
        "❌ This Telegram account is already linked to another Rivo account.\n\nOne Telegram account can only be linked to one Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    const existingUserAccount = await db
      .select()
      .from(telegramAccounts)
      .where(eq(telegramAccounts.userId, linkToken.userId))
      .limit(1);

    if (existingUserAccount[0]) {
      await db
        .update(telegramAccounts)
        .set({
          telegramUserId: String(telegramUser.id),
          username: telegramUser.username ?? null,
          firstName: telegramUser.first_name ?? null,
          lastName: telegramUser.last_name ?? null,
          updatedAt: new Date(),
        })
        .where(eq(telegramAccounts.userId, linkToken.userId));
    } else {
      await db.insert(telegramAccounts).values({
        userId: linkToken.userId,
        telegramUserId: String(telegramUser.id),
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
      });
    }

    await db
      .update(telegramLinkTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(telegramLinkTokens.id, linkToken.id));

    await sendTelegramMessage(
      telegramUser.id,
      "✅ Your Telegram account is now securely linked to Rivo Surveys!\n\n👥 Membership verified: @RivoSurveys\n\nYou can now return to Rivo Surveys.",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    );
  }
}
