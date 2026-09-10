import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse("google-verification: google71642b6433407971.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
