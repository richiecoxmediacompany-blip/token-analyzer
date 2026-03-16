import { NextRequest, NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/utils";
import type { HolderAnalysis, Holder } from "@/types";

const KNOWN_LABELS: Record<string, string> = {
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1": "Raydium Authority",
  "1111111111111111111111111111111111": "Burn Address",
  "11111111111111111111111111111111": "System Program",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
};

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    const holders = await fetchTopHolders(address);

    const totalHolders = holders.totalHolders;
    const top10 = holders.holders.slice(0, 10);
    const top100 = holders.holders.slice(0, 100);

    const top10Percentage = top10.reduce((sum, h) => sum + h.percentage, 0);
    const top100Percentage = top100.reduce((sum, h) => sum + h.percentage, 0);

    let distributionScore: number;
    if (top10Percentage > 80) distributionScore = 1;
    else if (top10Percentage > 60) distributionScore = 3;
    else if (top10Percentage > 50) distributionScore = 4;
    else if (top10Percentage > 40) distributionScore = 5;
    else if (top10Percentage > 30) distributionScore = 6;
    else if (top10Percentage > 20) distributionScore = 8;
    else distributionScore = 9;

    const concentration: "low" | "medium" | "high" =
      top10Percentage > 50 ? "high" : top10Percentage > 30 ? "medium" : "low";

    const analysis: HolderAnalysis = {
      totalHolders,
      top10Percentage: Math.round(top10Percentage * 100) / 100,
      top100Percentage: Math.round(top100Percentage * 100) / 100,
      distributionScore,
      holders: top10,
      concentration,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Holder analysis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holder data" },
      { status: 500 }
    );
  }
}

/** Direct RPC call with fallback endpoints - no caching layer */
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
      console.error(`RPC endpoint ${url} failed:`, lastError.message);
    }
  }

  throw lastError || new Error("All RPC endpoints failed");
}

async function fetchTopHolders(
  mintAddress: string
): Promise<{ totalHolders: number; holders: Holder[] }> {
  try {
    // Step 1: Get largest token accounts
    const largestResponse = await rpcCall<{
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
      params: [mintAddress],
    });

    const accounts = largestResponse.result?.value || [];
    if (accounts.length === 0) {
      console.error("No token accounts found for", mintAddress);
      return { totalHolders: 0, holders: [] };
    }

    // Step 2: Get token supply
    const supplyResponse = await rpcCall<{
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
      params: [mintAddress],
    });

    const totalSupply = supplyResponse.result?.value?.uiAmount || 1;

    // Step 3: Resolve owner addresses (batch - max 10 to avoid rate limits)
    const topAccounts = accounts.slice(0, 10);
    const holders: Holder[] = [];

    // Resolve owners sequentially to avoid rate limiting
    for (const account of topAccounts) {
      const amount = account.uiAmount || parseFloat(account.uiAmountString || "0") || 0;
      if (amount <= 0) continue;

      const percentage = (amount / totalSupply) * 100;
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
          infoResponse.result?.value?.data?.parsed?.info?.owner || account.address;
      } catch {
        // Keep token account address if owner lookup fails
      }

      holders.push({
        address: ownerAddress,
        amount,
        usdValue: 0,
        percentage: Math.round(percentage * 100) / 100,
        label: KNOWN_LABELS[ownerAddress] || null,
      });
    }

    const estimatedHolders = accounts.length >= 20 ? 1000 : accounts.length * 50;

    return {
      totalHolders: estimatedHolders,
      holders,
    };
  } catch (err) {
    console.error("fetchTopHolders failed:", err);
    return { totalHolders: 0, holders: [] };
  }
}
