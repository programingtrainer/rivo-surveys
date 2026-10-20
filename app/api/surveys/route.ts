import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";

const CPX_APP_ID = process.env.CPX_APP_ID || "36059";
const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH;

function getClientIp(request: Request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "0.0.0.0";
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!CPX_SECURE_HASH) {
      console.error("CPX_SECURE_HASH is not configured");

      return NextResponse.json(
        { error: "Survey service is not configured" },
        { status: 500 }
      );
    }

    const extUserId = user.id;
    const ipUser = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";

    const secureHash = crypto
      .createHash("md5")
      .update(`${extUserId}-${CPX_SECURE_HASH}`)
      .digest("hex");

    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: extUserId,
      output_method: "api",
      ip_user: ipUser,
      user_agent: userAgent,
      limit: "12",
      secure_hash: secureHash,
    });

    const response = await fetch(
      `https://live-api.cpx-research.com/api/get-surveys.php?${params.toString()}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("CPX API HTTP error:", response.status);

      return NextResponse.json(
        { error: "Unable to load surveys" },
        { status: 502 }
      );
    }

    const responseData: unknown = await response.json();

    if (
      !responseData ||
      typeof responseData !== "object" ||
      !("status" in responseData) ||
      responseData.status !== "success"
    ) {
      console.error("CPX API returned an error:", responseData);

      return NextResponse.json(
        { error: "Unable to load surveys" },
        { status: 502 }
      );
    }

    const data = responseData as Record<string, unknown>;
    const surveyItems = Array.isArray(data.surveys) ? data.surveys : [];
    const surveys = surveyItems.flatMap((item) => {
      if (typeof item !== "object" || item === null || !("id" in item)) {
        return [];
      }

      const survey = item as Record<string, unknown>;
      if (survey.id === null || survey.id === undefined) return [];

      return [{
        id: String(survey.id),
        loi: Number(survey.loi) || 0,
        payout: Number(survey.payout) || 0,
        payoutUsd: Number(survey.payout_publisher_usd) || 0,
        conversionRate: Number(survey.conversion_rate) || 0,
        type: typeof survey.type === "string" ? survey.type : null,
        top: Number(survey.top) || 0,
        href:
          typeof survey.href === "string"
            ? survey.href
            : typeof survey.href_new === "string"
              ? survey.href_new
              : null,
      }];
    });
    const reportedAvailable = Number(data.count_available_surveys);
    const available = Number.isFinite(reportedAvailable) && reportedAvailable >= 0
      ? reportedAvailable
      : surveys.length;

    return NextResponse.json(
      {
        surveys,
        count: surveys.length,
        available,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=0, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Surveys API error:", error);

    return NextResponse.json(
      { error: "Unable to load surveys" },
      { status: 500 }
    );
  }
}
