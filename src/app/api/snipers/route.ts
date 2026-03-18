import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, rpcFetch } from "@/lib/api-client";
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
      rpcFetch<{
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
        id: "snipers-largest",
        method: "getTokenLargestAccounts",
        params: [address],
      }),
      rpcFetch<{
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
        id: "snipers-supply",
        method: "getTokenSupply",
        params: [address],
      }),
    ]);

    const largestAccounts = largestResponse.result?.value || [];
    const totalSupply = supplyResponse.result?.value?.uiAmount || 1;

    // 3. Batch-resolve owners using getMultipleAccounts (1 call instead of 10)
    const topAccounts = largestAccounts.slice(0, 10);
    const accountAddresses = topAccounts
      .filter((a) => !KNOWN_PROGRAMS.has(a.address))
      .map((a) => a.address);

    let ownerMap: Record<string, string> = {};
    if (accountAddresses.length > 0) {
      try {
        const multiResponse = await rpcFetch<{
          result?: {
            value?: Array<{
              data?: {
                parsed?: {
                  info?: { owner?: string };
                };
              };
            } | null>;
          };
        }>({
          jsonrpc: "2.0",
          id: "snipers-owners",
          method: "getMultipleAccounts",
          params: [accountAddresses, { encoding: "jsonParsed" }],
        });

        const accountInfos = multiResponse.result?.value || [];
        for (let i = 0; i < accountAddresses.length; i++) {
          const info = accountInfos[i];
          const owner = info?.data?.parsed?.info?.owner;
          if (owner) {
            ownerMap[accountAddresses[i]] = owner;
          }
        }
      } catch {
        // Fall back to using token account addresses
      }
    }

    // 4. Analyze suspicious wallets
    const suspiciousWallets: SuspiciousWallet[] = [];

    for (const account of topAccounts) {
      const amount =
        account.uiAmount || parseFloat(account.uiAmountString || "0") || 0;
      if (amount <= 0) continue;

      const percentage = (amount / totalSupply) * 100;

      // Skip known programs
      if (KNOWN_PROGRAMS.has(account.address)) continue;

      const ownerAddress = ownerMap[account.address] || account.address;

      // Skip known programs after resolving owner
      if (KNOWN_PROGRAMS.has(ownerAddress)) continue;

      const reasons: string[] = [];

      // Flag large holders
      if (percentage > 10) {
        reasons.push(`Holds ${percentage.toFixed(1)}% of supply (whale)`);
      } else if (percentage > 5) {
        reasons.push(`Holds ${percentage.toFixed(1)}% of supply`);
      }

      // Cross-reference with token age
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

    // 5. Compute aggregate risk
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
