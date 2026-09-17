import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const update = await request.json();

    console.log("Telegram webhook update received:", {
      updateId: update?.update_id ?? null,
      hasMessage: Boolean(update?.message),
      hasCallbackQuery: Boolean(update?.callback_query),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
