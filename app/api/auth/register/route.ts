import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  users,
  sessions,
  wallets,
  referrals,
} from "@/lib/schema";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !/\s/.test(password)
  );
}

function generateReferralCode() {
  return `RIVO-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return false;
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "Turnstile siteverify HTTP error:",
      response.status
    );
    return false;
  }

  const result = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (result.success !== true) {
    console.error(
      "Turnstile validation failed:",
      Array.isArray(result["error-codes"])
        ? result["error-codes"]
        : ["unknown-error"]
    );
  }

  return result.success === true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const turnstileToken =
      typeof body.turnstileToken === "string"
        ? body.turnstileToken
        : "";

    const referralCode =
      typeof body.referralCode === "string"
        ? body.referralCode.trim().toUpperCase()
        : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Please enter a valid name." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character, with no spaces.",
        },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Security verification is required." },
        { status: 400 }
      );
    }

    const turnstileValid =
      await verifyTurnstile(turnstileToken);

    if (!turnstileValid) {
      return NextResponse.json(
        {
          error:
            "Security verification failed. Please try again.",
        },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    let referrerUserId: string | null = null;

    if (referralCode) {
      const referrer = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (referrer.length > 0) {
        referrerUserId = referrer[0].id;
      }
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

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
          30 * 24 * 60 * 60 * 1000
      );

    const userId = crypto.randomUUID();
    const newReferralCode = generateReferralCode();

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        passwordHash,
        referralCode: newReferralCode,
      });

      await tx.insert(wallets).values({
        userId,
        balance: "0",
      });

      await tx.insert(sessions).values({
        userId,
        tokenHash,
        expiresAt,
      });

      if (referrerUserId && referrerUserId !== userId) {
        await tx.insert(referrals).values({
          referrerUserId,
          referredUserId: userId,
          status: "pending",
        });
      }
    });

    const cookieStore = await cookies();

    cookieStore.set(
      "rivo_session",
      sessionToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          30 * 24 * 60 * 60,
      }
    );

    return NextResponse.json(
      {
        success: true,
        userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}
