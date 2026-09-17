const TELEGRAM_API = "https://api.telegram.org";

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  return token;
}

export async function telegramApi<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${getBotToken()}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(
      `Telegram API ${method} failed: ${data?.description ?? response.statusText}`,
    );
  }

  return data.result as T;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

export async function getTelegramChatMember(
  chatId: string | number,
  userId: string | number,
) {
  return telegramApi<{
    user: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    status: string;
    is_anonymous?: boolean;
    is_member?: boolean;
  }>("getChatMember", {
    chat_id: chatId,
    user_id: userId,
  });
}
