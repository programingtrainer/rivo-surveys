const FAUCETPAY_API = "https://faucetpay.io/api/v2";
const CURRENCY = "USDT";

const USDT_DECIMALS = 6;

type FaucetPayResponse = {
  success?: boolean;
  message?: string;
  data?: {
    payout_id?: string | number;
    payout_user_hash?: string;
    [key: string]: unknown;
  };
};

export class FaucetPayError extends Error {
  status: number;
  definitive: boolean;

  constructor(
    message: string,
    status: number,
    definitive = false
  ) {
    super(message);
    this.name = "FaucetPayError";
    this.status = status;
    this.definitive = definitive;
  }
}

function getApiKey() {
  const key = process.env.FAUCETPAY_API_KEY;

  if (!key) {
    throw new Error("FAUCETPAY_API_KEY is not configured");
  }

  return key;
}

async function faucetPayRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{
  httpStatus: number;
  payload: FaucetPayResponse;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response: Response;

  try {
    response = await fetch(`${FAUCETPAY_API}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new FaucetPayError(
        "FaucetPay request timed out.",
        504,
        false
      );
    }

    throw new FaucetPayError(
      "Unable to reach FaucetPay.",
      503,
      false
    );
  } finally {
    clearTimeout(timeout);
  }

  let payload: FaucetPayResponse;

  try {
    payload = (await response.json()) as FaucetPayResponse;
  } catch {
    throw new FaucetPayError(
      "Invalid response from FaucetPay.",
      response.status,
      false
    );
  }

  return {
    httpStatus: response.status,
    payload,
  };
}

export function usdtToSmallestUnit(amount: string | number) {
  const raw = String(amount).trim();

  if (!/^\d+(?:\.\d{1,6})?$/.test(raw)) {
    throw new Error("Invalid USDT amount.");
  }

  const [whole, fraction = ""] = raw.split(".");
  const paddedFraction = fraction.padEnd(USDT_DECIMALS, "0");

  const units = BigInt(whole) * 1_000_000n + BigInt(paddedFraction);

  if (units <= 0n || units > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("USDT amount is out of range.");
  }

  return Number(units);
}

export async function checkFaucetPayAddress(address: string) {
  const result = await faucetPayRequest("/check-address", {
    address,
  });

  const message =
    result.payload?.message ||
    "FaucetPay rejected the address.";

  if (
    result.httpStatus !== 200 ||
    result.payload?.success !== true
  ) {
    throw new FaucetPayError(
      message,
      result.httpStatus,
      result.httpStatus >= 400 &&
      result.httpStatus < 500
    );
  }

  const payoutUserHash =
    result.payload?.data?.payout_user_hash;

  if (!payoutUserHash) {
    throw new FaucetPayError(
      "FaucetPay did not return a payout user.",
      502,
      false
    );
  }

  return {
    payoutUserHash,
  };
}

export async function sendFaucetPayPayout({
  withdrawalId,
  address,
  amount,
  ipAddress,
}: {
  withdrawalId: string;
  address: string;
  amount: string;
  ipAddress?: string;
}) {
  const smallestUnitAmount =
    usdtToSmallestUnit(amount);

  const idempotencyKey =
    `rivo-withdrawal-${withdrawalId}`;

  const result = await faucetPayRequest("/send", {
    idempotency_key: idempotencyKey,
    to: address,
    amount: smallestUnitAmount,
    currency: CURRENCY,
    ...(ipAddress
      ? { ip_address: ipAddress }
      : {}),
  });

  const message =
    result.payload?.message ||
    "FaucetPay payout failed.";

  if (
    result.httpStatus !== 200 ||
    result.payload?.success !== true
  ) {
    const definitive =
      result.httpStatus >= 400 &&
      result.httpStatus < 500 &&
      result.httpStatus !== 409 &&
      result.httpStatus !== 429;

    throw new FaucetPayError(
      message,
      result.httpStatus,
      definitive
    );
  }

  const payoutId =
    result.payload?.data?.payout_id;

  return {
    payoutId:
      payoutId !== undefined &&
      payoutId !== null
        ? String(payoutId)
        : null,
    message,
  };
}
