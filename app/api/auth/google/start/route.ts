import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth is not configured." },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const referralCode =
    requestUrl.searchParams
      .get("ref")
      ?.trim()
      .toUpperCase() || "";

  const redirectUri =
    new URL("/api/auth/google/callback", request.url).toString().replace(/\/$/, "");

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  const state =
    crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();

  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  if (referralCode) {
    cookieStore.set(
      "google_referral_code",
      referralCode,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
      }
    );
  } else {
    cookieStore.delete("google_referral_code");
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: [
      "openid",
      "email",
      "profile",
    ],
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(url);
}
