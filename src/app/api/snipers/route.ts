import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";

interface SuspiciousWallet {
  address: string;
  percentage: number;
  reason: string;
  amount: number;
}

interface SniperAnalysis {
  pairCreatedAt: number | null;
  tokenAge: string;
  suspiciousWallets: SuspiciousWallet[];
  riskLevel: "high" | "medium" | "low";
  totalSuspiciousPercentage: number;
}

const KNOWN_PROGRAMS = new Set([
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1", // Raydium Authority
  "1111111111111111111111111111111111",               // Burn Address
  "11111111111111111111111111111111",                  // System Program
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",     // Token Program
]);

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

async function rpcCall<T>(body: object): Promise<T> {
  const heliusKey = process.env.HELIUS_API_KEY;
  const endpoints = heliusKey
    ? [`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, ...RPC_ENDPOINTS]
    : RPC_ENDPOINTS;

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`RPC ${res.status}: ${await res.text().catch(() => "")}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(`RPC error: ${JSON.stringify(json.error)}`);
      }

      return json as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All RPC endpoints failed");
}

function computeTokenAge(pairCreatedAt: number): string {
  const ageMs = Date.now() - pairCreatedAt;
  const minutes = Math.floor(ageMs / 60000);
  const hours = Math.floor(ageMs / 3600000);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    // 1. Get pair creation time from DexScreener
    const dexData = await cachedFetch<{
      pairs?: Array<Record<string, unknown>>;
    }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    const pairs =
      dexData.pairs?.filter((p) => (p.chainId as string) === "solana") || [];
    const pairCreatedAt =
      pairs.length > 0
        ? (pairs[0].pairCreatedAt as number) || null
        : null;

    const tokenAge = pairCreatedAt ? computeTokenAge(pairCreatedAt) : "Unknown";

    // 2. Get largest token accounts and supply in parallel
    const [largestResponse, supplyResponse] = await Promise.all([
      rpcCall<{
        result?: {
          value?: Array<{
            address: string;
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
          }>;
        };
      }>({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [address],
      }),
      rpcCall<{
        result?: {
          value?: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
          };
        };
      }>({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenSupply",
        params: [address],
      }),
    ]);

    const largestAccounts = largestResponse.result?.value || [];
    const totalSupply = supplyResponse.result?.value?.uiAmount || 1;

    // 3. Resolve owners and analyze suspicious wallets
    const suspiciousWallets: SuspiciousWallet[] = [];

    for (const account of largestAccounts.slice(0, 10)) {
      const amount =
        account.uiAmount || parseFloat(account.uiAmountString || "0") || 0;
      if (amount <= 0) continue;

      const percentage = (amount / totalSupply) * 100;

      // Skip known programs early
      if (KNOWN_PROGRAMS.has(account.address)) continue;

      // Resolve the owner wallet address
      let ownerAddress = account.address;
      try {
        const infoResponse = await rpcCall<{
          result?: {
            value?: {
              data?: {
                parsed?: {
                  info?: { owner?: string };
                };
              };
            };
          };
        }>({
          jsonrpc: "2.0",
          id: 3,
          method: "getAccountInfo",
          params: [account.address, { encoding: "jsonParsed" }],
        });

        ownerAddress =
          infoResponse.result?.value?.data?.parsed?.info?.owner ||
          account.address;
      } catch {
        // Keep token account address if owner lookup fails
      }

      // Skip known programs after resolving owner
      if (KNOWN_PROGRAMS.has(ownerAddress)) continue;

      const reasons: string[] = [];

      // Flag large holders
      if (percentage > 10) {
        reasons.push(`Holds ${percentage.toFixed(1)}% of supply (whale)`);
      } else if (percentage > 5) {
        reasons.push(`Holds ${percentage.toFixed(1)}% of supply`);
      }

      // Cross-reference with token age: new token + large holder = suspicious
      if (pairCreatedAt) {
        const ageHours = (Date.now() - pairCreatedAt) / 3600000;
        if (ageHours < 24 && percentage > 3) {
          reasons.push("Large position in token < 24h old");
        } else if (ageHours < 168 && percentage > 5) {
          reasons.push("Large position in token < 7 days old");
        }
      }

      if (reasons.length > 0) {
        suspiciousWallets.push({
          address: ownerAddress,
          percentage: Math.round(percentage * 100) / 100,
          reason: reasons.join("; "),
          amount,
        });
      }
    }

    // 4. Compute aggregate risk
    const totalSuspiciousPercentage = suspiciousWallets.reduce(
      (sum, w) => sum + w.percentage,
      0
    );

    let riskLevel: SniperAnalysis["riskLevel"] = "low";
    if (
      totalSuspiciousPercentage > 30 ||
      suspiciousWallets.some((w) => w.percentage > 15)
    ) {
      riskLevel = "high";
    } else if (
      totalSuspiciousPercentage > 15 ||
      suspiciousWallets.some((w) => w.percentage > 8)
    ) {
      riskLevel = "medium";
    }

    const analysis: SniperAnalysis = {
      pairCreatedAt,
      tokenAge,
      suspiciousWallets: suspiciousWallets.sort(
        (a, b) => b.percentage - a.percentage
      ),
      riskLevel,
      totalSuspiciousPercentage:
        Math.round(totalSuspiciousPercentage * 100) / 100,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Sniper detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze snipers" },
      { status: 500 }
    );
  }
}
