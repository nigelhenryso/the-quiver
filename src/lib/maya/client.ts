const MAYA_BASE = process.env.MAYA_BASE_URL ?? "https://pg-sandbox.paymaya.com";

/** Maya uses Basic auth with the API key as username. Checkout = public key, payment lookups = secret key. */
export async function maya(
  path: string,
  { key, method = "GET", body }: { key: "public" | "secret"; method?: string; body?: unknown },
) {
  const apiKey = key === "public" ? process.env.MAYA_PUBLIC_KEY : process.env.MAYA_SECRET_KEY;
  if (!apiKey) throw new Error("Maya not configured");

  const res = await fetch(`${MAYA_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const MAYA_COOKIE = "maya_checkout";
