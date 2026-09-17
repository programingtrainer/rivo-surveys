import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { telegramLinkTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const token = generateToken();
    const tokenHash = hashToken(token);

    await db
      .delete(telegramLinkTokens)
      .where(eq(telegramLinkTokens.userId, user.id));

    await db.insert(telegramLinkTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const botUsername = "RivoSurveysBot";

    return NextResponse.json({
      success: true,
      expiresInSeconds: 600,
      telegramUrl: `https://t.me/${botUsername}?start=${token}`,
    });
  } catch (error) {
    console.error("Telegram link token error:", error);

    return NextResponse.json(
      { error: "Unable to create Telegram link." },
      { status: 500 },
    );
  }
}
