import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)rivo_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const result: Record<string, unknown> = {};

  try {
    const token = getSessionToken(request);
    result.hasCookie = Boolean(token);

    const dbTest = await db.execute(sql`SELECT 1 AS ok`);
    result.database = dbTest.rows;

    if (!token) {
      return NextResponse.json(result);
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const sessionRows = await db.execute(sql`
      SELECT user_id
      FROM sessions
      WHERE token_hash = ${tokenHash}
        AND expires_at > NOW()
      LIMIT 1
    `);

    result.session = sessionRows.rows;

    const userId = sessionRows.rows[0]?.user_id;

    if (!userId) {
      return NextResponse.json(result);
    }

    const userRows = await db.execute(sql`
      SELECT id, referral_code
      FROM users
      WHERE id = ${String(userId)}
      LIMIT 1
    `);

    result.user = userRows.rows;

    return NextResponse.json(result);
  } catch (error) {
    result.errorMessage =
      error instanceof Error ? error.message : String(error);

    result.errorName =
      error instanceof Error ? error.name : typeof error;

    result.errorStack =
      error instanceof Error ? error.stack : null;

    result.errorCause =
      error instanceof Error && error.cause
        ? String(error.cause)
        : null;

    result.errorObject = error;

    return NextResponse.json(result, { status: 500 });
  }
}
