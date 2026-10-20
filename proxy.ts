import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/acceptable-use",
  "/rewards-policy",
  "/docs",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = randomBytes(16).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://live-api.cpx-research.com",
    "frame-src 'self' https://challenges.cloudflare.com https://*.cpx-research.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const next = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  if (PUBLIC_PATHS.has(pathname)) {
    return withCsp(next());
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return withCsp(NextResponse.redirect(new URL("/", request.url)));
    }

    return withCsp(next());
  } catch (error) {
    console.error("Route authentication error:", error);
    return withCsp(NextResponse.redirect(new URL("/", request.url)));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
