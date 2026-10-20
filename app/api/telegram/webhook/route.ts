import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, transactionDb } from "@/lib/db";
import {
  telegramAccounts,
  telegramLinkTokens,
} from "@/lib/schema";
import {
  getTelegramChatMember,
  sendTelegramMessage,
} from "@/lib/telegram";

type TelegramWebhookUpdate = {
  update_id?: number;
  message?: {
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    text?: unknown;
  };
};

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
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!webhookSecret || !/^[A-Za-z0-9_-]{32,256}$/.test(webhookSecret)) {
    console.error("TELEGRAM_WEBHOOK_SECRET is missing or invalid");
    return NextResponse.json(
      { error: "Telegram webhook is not configured." },
      { status: 500 },
    );
  }

  const suppliedSecret =
    request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const expectedSecretBytes = Buffer.from(webhookSecret);
  const suppliedSecretBytes = Buffer.from(suppliedSecret);

  if (
    expectedSecretBytes.length !== suppliedSecretBytes.length ||
    !timingSafeEqual(expectedSecretBytes, suppliedSecretBytes)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: TelegramWebhookUpdate | null = null;
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
      isStartCommand: /^\/start(?:@\w+)?(?:\s|$)/i.test(text),
    });

    if (!message || !telegramUser?.id || !text) {
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

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      await safeSendMessage(
        telegramUser.id,
        "❌ This Rivo linking link is invalid or expired.\n\nPlease generate a new linking link from your Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    const tokenHash = await hashToken(token);

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

    const chatId = getChatId();

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

    if (!isMember) {
      await safeSendMessage(
        telegramUser.id,
        "❌ Telegram account detected, but you are not currently a member of @RivoSurveys.\n\nJoin the group first, then send this same linking link again.",
      );

      return NextResponse.json({ ok: true });
    }

    const linkResult = await transactionDb.transaction(async (tx) => {
      const [existingTelegramAccount] = await tx
        .select({ userId: telegramAccounts.userId })
        .from(telegramAccounts)
        .where(eq(telegramAccounts.telegramUserId, String(telegramUser.id)))
        .limit(1);

      if (
        existingTelegramAccount &&
        existingTelegramAccount.userId !== linkToken.userId
      ) {
        return "already-linked" as const;
      }

      const now = new Date();
      const [claimedToken] = await tx
        .update(telegramLinkTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(telegramLinkTokens.id, linkToken.id),
            isNull(telegramLinkTokens.usedAt),
            gt(telegramLinkTokens.expiresAt, now),
          ),
        )
        .returning({ id: telegramLinkTokens.id });

      if (!claimedToken) {
        return "expired" as const;
      }

      const [existingUserAccount] = await tx
        .select({ id: telegramAccounts.id })
        .from(telegramAccounts)
        .where(eq(telegramAccounts.userId, linkToken.userId))
        .limit(1);

      const accountData = {
        telegramUserId: String(telegramUser.id),
        username: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
        updatedAt: now,
      };

      if (existingUserAccount) {
        await tx
          .update(telegramAccounts)
          .set(accountData)
          .where(eq(telegramAccounts.userId, linkToken.userId));
      } else {
        await tx.insert(telegramAccounts).values({
          userId: linkToken.userId,
          ...accountData,
        });
      }

      return "linked" as const;
    });

    if (linkResult === "already-linked") {
      await safeSendMessage(
        telegramUser.id,
        "❌ This Telegram account is already linked to another Rivo account.\n\nOne Telegram account can only be linked to one Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

    if (linkResult === "expired") {
      await safeSendMessage(
        telegramUser.id,
        "❌ This Rivo linking link is invalid or expired.\n\nPlease generate a new linking link from your Rivo account.",
      );

      return NextResponse.json({ ok: true });
    }

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
        "⚠️ We couldn't complete Telegram linking right now. Please generate a new linking link and try again.",
      );
    }

    // Always acknowledge the Telegram update so it is not retried forever.
    return NextResponse.json({ ok: true });
  }
}
