import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  users,
  sessions,
  wallets,
  referrals,
} from "@/lib/schema";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/login?error=google_auth_failed",
          request.url
        )
      );
    }

    const cookieStore = await cookies();

    const savedState =
      cookieStore.get(
        "google_oauth_state"
      )?.value;

    if (
      !savedState ||
      savedState !== state
    ) {
      return NextResponse.redirect(
        new URL(
          "/login?error=invalid_oauth_state",
          request.url
        )
      );
    }

    cookieStore.delete(
      "google_oauth_state"
    );

    const referralCode =
      cookieStore.get(
        "google_referral_code"
      )?.value || "";

    cookieStore.delete(
      "google_referral_code"
    );

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(
          "/login?error=google_not_configured",
          request.url
        )
      );
    }

    const redirectUri =
      new URL("/api/auth/google/callback", request.url).toString().replace(/\/$/, "");

    const oauth2Client =
      new OAuth2Client(
        clientId,
        clientSecret,
        redirectUri
      );

    const { tokens } =
      await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.redirect(
        new URL(
          "/login?error=no_google_id_token",
          request.url
        )
      );
    }

    const ticket =
      await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });

    const payload =
      ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email
    ) {
      return NextResponse.redirect(
        new URL(
          "/login?error=invalid_google_account",
          request.url
        )
      );
    }

    if (
      payload.email_verified !== true
    ) {
      return NextResponse.redirect(
        new URL(
          "/login?error=google_email_not_verified",
          request.url
        )
      );
    }

    const googleId = payload.sub;
    const email =
      payload.email.toLowerCase();

    const name =
      payload.name ||
      email.split("@")[0] ||
      "Rivo User";

    const avatarUrl =
      payload.picture || null;

    let userId: string;

    const existingGoogleUser =
      await db
        .select({
          id: users.id,
          isBlocked: users.isBlocked,
        })
        .from(users)
        .where(
          eq(users.googleId, googleId)
        )
        .limit(1);

    if (
      existingGoogleUser.length > 0
    ) {
      userId = existingGoogleUser[0].id;

      if (existingGoogleUser[0].isBlocked) {
        return NextResponse.redirect(new URL("/login?error=account_blocked", request.url));
      }

      await db
        .update(users)
        .set({
          name,
          avatarUrl,
          updatedAt: new Date(),
        })
        .where(
          eq(users.id, userId)
        );
    } else {
      const existingEmailUser =
        await db
          .select({
            id: users.id,
            isBlocked: users.isBlocked,
          })
          .from(users)
          .where(
            eq(users.email, email)
          )
          .limit(1);

      if (
        existingEmailUser.length > 0
      ) {
        userId = existingEmailUser[0].id;

        if (existingEmailUser[0].isBlocked) {
          return NextResponse.redirect(new URL("/login?error=account_blocked", request.url));
        }

        await db
          .update(users)
          .set({
            googleId,
            name,
            avatarUrl,
            updatedAt: new Date(),
          })
          .where(
            eq(users.id, userId)
          );

        await db
          .insert(wallets)
          .values({
            userId,
            balance: "0",
          })
          .onConflictDoNothing({
            target: wallets.userId,
          });
      } else {
        let referrerUserId:
          | string
          | null = null;

        if (referralCode) {
          const referrer =
            await db
              .select({
                id: users.id,
              })
              .from(users)
              .where(
                eq(
                  users.referralCode,
                  referralCode
                )
              )
              .limit(1);

          if (referrer.length > 0) {
            referrerUserId =
              referrer[0].id;
          }
        }

        const newReferralCode =
          `RIVO-${crypto
            .randomBytes(5)
            .toString("hex")
            .toUpperCase()}`;

        const created =
          await db.transaction(
            async (tx) => {
              const inserted =
                await tx
                  .insert(users)
                  .values({
                    email,
                    name,
                    googleId,
                    avatarUrl,
                    referralCode:
                      newReferralCode,
                  })
                  .returning({
                    id: users.id,
                  });

              const user =
                inserted[0];

              if (!user) {
                throw new Error(
                  "Failed to create Google user."
                );
              }

              await tx
                .insert(wallets)
                .values({
                  userId: user.id,
                  balance: "0",
                });

              if (
                referrerUserId &&
                referrerUserId !==
                  user.id
              ) {
                await tx
                  .insert(referrals)
                  .values({
                    referrerUserId,
                    referredUserId:
                      user.id,
                    status: "pending",
                  });
              }

              return user;
            }
          );

        userId = created.id;
      }
    }

    const sessionToken =
      crypto.randomBytes(32).toString("hex");

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex");

    const expiresAt =
      new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      );

    await db
      .insert(sessions)
      .values({
        userId,
        tokenHash,
        expiresAt,
      });

    cookieStore.set(
      "rivo_session",
      sessionToken,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge:
          7 * 24 * 60 * 60,
      }
    );

    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Google OAuth error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=google_auth_failed",
        request.url
      )
    );
  }
}
