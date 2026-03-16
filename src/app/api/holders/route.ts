import { NextRequest, NextResponse } from "next/server";
import { heliusRpcUrl, cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { HolderAnalysis, Holder } from "@/types";

const KNOWN_LABELS: Record<string, string> = {
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1": "Raydium Authority",
  "1111111111111111111111111111111111": "Burn Address",
  "11111111111111111111111111111111": "System Program",
};

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

    // Distribution score: 10 = well distributed, 1 = highly concentrated
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

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-mainnet.g.alchemy.com/v2/demo",
  "https://rpc.ankr.com/solana",
];

function getEndpoints(): string[] {
  const key = process.env.HELIUS_API_KEY;
  if (key) {
    return [`https://mainnet.helius-rpc.com/?api-key=${key}`, ...RPC_ENDPOINTS];
  }
  return RPC_ENDPOINTS;
}

async function rpcFetch<T>(body: object, cacheDuration = 120_000): Promise<T> {
  const endpoints = getEndpoints();
  let lastError: Error | null = null;

  for (const rpcUrl of endpoints) {
    try {
      const result = await cachedFetch<T>(
        rpcUrl,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        cacheDuration
      );
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next endpoint
    }
  }

  throw lastError || new Error("All RPC endpoints failed");
}

async function fetchTopHolders(
  mintAddress: string
): Promise<{ totalHolders: number; holders: Holder[] }> {
  try {
    // Use getTokenLargestAccounts for top holders
    const response = await rpcFetch<{
      result?: { value?: Array<{ address: string; amount: string; decimals: number; uiAmount: number }> };
    }>({
      jsonrpc: "2.0",
      id: "largest-accounts",
      method: "getTokenLargestAccounts",
      params: [mintAddress],
    });

    const accounts = response.result?.value || [];
    if (accounts.length === 0) {
      return { totalHolders: 0, holders: [] };
    }

    // Get token supply for percentage calculation
    const supplyResponse = await rpcFetch<{
      result?: { value?: { uiAmount: number } };
    }>({
      jsonrpc: "2.0",
      id: "token-supply",
      method: "getTokenSupply",
      params: [mintAddress],
    });

    const totalSupply = supplyResponse.result?.value?.uiAmount || 1;

    // Get owner addresses for token accounts (batch with concurrency limit)
    const holdersWithOwners = await Promise.all(
      accounts.slice(0, 20).map(async (account) => {
        const ownerAddress = await getTokenAccountOwner(account.address);
        const amount = account.uiAmount || 0;
        const percentage = (amount / totalSupply) * 100;

        return {
          address: ownerAddress || account.address,
          amount,
          usdValue: 0,
          percentage: Math.round(percentage * 100) / 100,
          label: KNOWN_LABELS[ownerAddress || ""] || null,
        };
      })
    );

    // Estimate total holders
    const estimatedHolders = accounts.length >= 20 ? 1000 : accounts.length * 50;

    return {
      totalHolders: estimatedHolders,
      holders: holdersWithOwners.filter((h) => h.percentage > 0),
    };
  } catch (err) {
    console.error("fetchTopHolders failed:", err);
    return { totalHolders: 0, holders: [] };
  }
}

async function getTokenAccountOwner(
  tokenAccountAddress: string
): Promise<string | null> {
  try {
    const response = await rpcFetch<{
      result?: { value?: { data?: { parsed?: { info?: { owner?: string } } } } };
    }>(
      {
        jsonrpc: "2.0",
        id: "account-info",
        method: "getAccountInfo",
        params: [tokenAccountAddress, { encoding: "jsonParsed" }],
      },
      300_000
    );

    return response.result?.value?.data?.parsed?.info?.owner || null;
  } catch {
    return null;
  }
}
