import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { surveyAttempts } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const offerId = String(body?.offerId || "").trim();
    const href = String(body?.href || "").trim();

    if (!offerId || !href) {
      return NextResponse.json(
        { error: "Missing survey information" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(href);
    } catch {
      return NextResponse.json(
        { error: "Invalid survey URL" },
        { status: 400 }
      );
    }

    const allowedHosts = new Set([
      "live-api.cpx-research.com",
      "offers.cpx-research.com",
      "click.cpx-research.com",
    ]);

    if (!allowedHosts.has(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Invalid survey provider" },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .insert(surveyAttempts)
      .values({
        userId: user.id,
        offerId,
        status: "started",
      })
      .returning({
        id: surveyAttempts.id,
      });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      href,
    });
  } catch (error) {
    console.error("Survey start error:", error);

    return NextResponse.json(
      { error: "Unable to start survey" },
      { status: 500 }
    );
  }
}
