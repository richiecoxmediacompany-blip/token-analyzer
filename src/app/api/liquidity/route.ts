import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { LiquidityInfo } from "@/types";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    const liquidityData = await fetchLiquidityData(address);
    return NextResponse.json(liquidityData);
  } catch (error) {
    console.error("Liquidity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch liquidity data" },
      { status: 500 }
    );
  }
}

async function fetchLiquidityData(address: string): Promise<LiquidityInfo> {
  try {
    // Use DexScreener for liquidity data (no API key required)
    const data = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (!data.pairs || data.pairs.length === 0) {
      return {
        totalLiquidityUsd: 0,
        mainPool: null,
        locked: null,
        lockDetails: null,
        liquidityToMcapRatio: 0,
      };
    }

    // Aggregate liquidity across all pairs
    let totalLiquidity = 0;
    for (const pair of data.pairs) {
      const liq = pair.liquidity as Record<string, number> | undefined;
      totalLiquidity += liq?.usd ?? 0;
    }

    // Get main pool (highest liquidity)
    const sortedPairs = [...data.pairs].sort((a, b) => {
      const liqA = (a.liquidity as Record<string, number>)?.usd ?? 0;
      const liqB = (b.liquidity as Record<string, number>)?.usd ?? 0;
      return liqB - liqA;
    });

    const mainPair = sortedPairs[0];
    const baseToken = mainPair.baseToken as Record<string, string>;
    const quoteToken = mainPair.quoteToken as Record<string, string>;
    const mainLiquidity = (mainPair.liquidity as Record<string, number>)?.usd ?? 0;
    const marketCap = (mainPair.marketCap as number) || (mainPair.fdv as number) || 1;

    const ratio = totalLiquidity / marketCap;

    return {
      totalLiquidityUsd: totalLiquidity,
      mainPool: {
        name: `${baseToken?.symbol || "?"} / ${quoteToken?.symbol || "?"}`,
        dex: (mainPair.dexId as string) || "Unknown DEX",
        liquidityUsd: mainLiquidity,
        baseToken: baseToken?.symbol || "?",
        quoteToken: quoteToken?.symbol || "?",
      },
      locked: null, // Would need specialized API for lock detection
      lockDetails: null,
      liquidityToMcapRatio: Math.round(ratio * 10000) / 100,
    };
  } catch {
    return {
      totalLiquidityUsd: 0,
      mainPool: null,
      locked: null,
      lockDetails: null,
      liquidityToMcapRatio: 0,
    };
  }
}
