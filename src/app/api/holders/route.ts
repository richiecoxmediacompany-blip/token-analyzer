import { NextRequest, NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/utils";
import { rpcFetch } from "@/lib/api-client";
import type { HolderAnalysis, Holder } from "@/types";

const KNOWN_LABELS: Record<string, string> = {
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1": "Raydium Authority",
  "1111111111111111111111111111111111": "Burn Address",
  "11111111111111111111111111111111": "System Program",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
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


async function fetchTopHolders(
  mintAddress: string
): Promise<{ totalHolders: number; holders: Holder[] }> {
  // Step 1: Get largest token accounts and supply in parallel
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
      id: "holders-largest",
      method: "getTokenLargestAccounts",
      params: [mintAddress],
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
      id: "holders-supply",
      method: "getTokenSupply",
      params: [mintAddress],
    }),
  ]);

  const accounts = largestResponse.result?.value || [];
  if (accounts.length === 0) {
    throw new Error("No token accounts found");
  }

  const totalSupply = supplyResponse.result?.value?.uiAmount || 1;

  // Step 2: Batch-resolve owner addresses using getMultipleAccounts (1 RPC call instead of 10)
  const topAccounts = accounts.slice(0, 10);
  const accountAddresses = topAccounts.map((a) => a.address);

  let ownerMap: Record<string, string> = {};
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
      id: "holders-owners",
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
    // If batch lookup fails, we'll use token account addresses as fallback
  }

  // Step 3: Build holder list
  const holders: Holder[] = [];
  for (const account of topAccounts) {
    const amount =
      account.uiAmount || parseFloat(account.uiAmountString || "0") || 0;
    if (amount <= 0) continue;

    const percentage = (amount / totalSupply) * 100;
    const ownerAddress = ownerMap[account.address] || account.address;

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
}
