const CACHE = new Map<string, { data: unknown; expiry: number }>();

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheDurationMs = 60_000
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options?.body || "")}`;
  const cached = CACHE.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  CACHE.set(cacheKey, { data, expiry: Date.now() + cacheDurationMs });
  return data as T;
}

export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await cachedFetch<T>(url, options);
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

export function heliusRpcUrl(): string {
  const key = process.env.HELIUS_API_KEY;
  if (!key) return "https://api.mainnet-beta.solana.com";
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
}

export function birdeyeHeaders(): Record<string, string> {
  const key = process.env.BIRDEYE_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(key ? { "X-API-KEY": key } : {}),
    "x-chain": "solana",
  };
}

export function solscanHeaders(): Record<string, string> {
  const key = process.env.SOLSCAN_API_KEY;
  return {
    "Content-Type": "application/json",
    ...(key ? { token: key } : {}),
  };
}
