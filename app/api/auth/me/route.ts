import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/config";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const admin = user.email.toLowerCase() === ADMIN_EMAIL;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isBlocked: user.isBlocked,
        isAdmin: admin,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Unable to load current user." },
      { status: 500 }
    );
  }
}
