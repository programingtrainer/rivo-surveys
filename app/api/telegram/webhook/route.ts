import { NextResponse } from "next/server";
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

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getChatId() {
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is not configured");
  }

  return chatId;
}

async function safeSendMessage(chatId: string | number, text: string) {
  try {
    await sendTelegramMessage(chatId, text);
  } catch (error) {
    console.error("Telegram sendMessage failed:", error);
  }
}

export async function POST(request: Request) {
  let update: any = null;
  let telegramUserId: string | null = null;

  try {
    update = await request.json();

    const message = update?.message;
    const telegramUser = message?.from;

    telegramUserId = telegramUser?.id
      ? String(telegramUser.id)
      : null;

    const text =
      typeof message?.text === "string"
        ? message.text.trim()
        : "";

    console.log("Telegram webhook update:", {
      updateId: update?.update_id ?? null,
      telegramUserId,
      text: text ? text.slice(0, 80) : null,
    });

    if (!message || !telegramUser || !text) {
      return NextResponse.json({ ok: true });
    }

    const startMatch = text.match(
      /^\/start(?:@\w+)?(?:\s+(.+))?$/i,
    );

    if (!startMatch) {
      return NextResponse.json({ ok: true });
    }

    const token = startMatch[1]?.trim();

    if (!token) {
      await safeSendMessage(
        telegramUser.id,
        "Welcome to Rivo Surveys! 👋\n\nOpen the Telegram linking link from your Rivo account to securely connect your Telegram account.",
      );

      return NextResponse.json({ ok: true });
    }

    console.log("Telegram webhook: hashing link token");

    const tokenHash = await hashToken(token);

    console.log("Telegram webhook: looking up link token");

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
      await safeSendMessage(
        telegramUser.id,
        "❌ This Rivo linking link is invalid or expired.\n\nPlease generate a new linking link from your Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    console.log("Telegram webhook: link token valid");

    const chatId = getChatId();

    console.log("Telegram webhook: checking membership");

    let membership;

    try {
      membership = await getTelegramChatMember(
        chatId,
        telegramUser.id,
      );
    } catch (error) {
      console.error(
        "Telegram membership check failed:",
        error,
      );

      await safeSendMessage(
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
      (membership.status !== "restricted" ||
        membership.is_member === true);

    console.log("Telegram webhook: membership result", {
      status: membership.status,
      isMember,
    });

    if (!isMember) {
      await safeSendMessage(
        telegramUser.id,
        "❌ Telegram account detected, but you are not currently a member of @RivoSurveys.\n\nJoin the group first, then send this same linking link again.",
      );

      return NextResponse.json({ ok: true });
    }

    console.log("Telegram webhook: checking existing Telegram account");

    const existingTelegramAccount = await db
      .select()
      .from(telegramAccounts)
      .where(
        eq(
          telegramAccounts.telegramUserId,
          String(telegramUser.id),
        ),
      )
      .limit(1);

    if (
      existingTelegramAccount[0] &&
      existingTelegramAccount[0].userId !== linkToken.userId
    ) {
      await safeSendMessage(
        telegramUser.id,
        "❌ This Telegram account is already linked to another Rivo account.\n\nOne Telegram account can only be linked to one Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    console.log("Telegram webhook: saving Telegram account");

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

    console.log("Telegram webhook: marking link token as used");

    await db
      .update(telegramLinkTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(telegramLinkTokens.id, linkToken.id));

    console.log("Telegram webhook: linking completed");

    await safeSendMessage(
      telegramUser.id,
      "✅ Your Telegram account is now securely linked to Rivo Surveys!\n\n👥 Membership verified: @RivoSurveys\n\nYou can now return to Rivo Surveys.",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("========== TELEGRAM WEBHOOK ERROR ==========");
    console.error("Update ID:", update?.update_id ?? null);
    console.error("Telegram User ID:", telegramUserId);
    console.error("Error:", error);
    console.error("============================================");

    if (telegramUserId) {
      await safeSendMessage(
        telegramUserId,
        "⚠️ Something went wrong while linking your Telegram account. Please generate a new linking link from Rivo and try again.",
      );
    }

    // Always acknowledge the Telegram update so it is not retried forever.
    return NextResponse.json({ ok: true });
  }
}
