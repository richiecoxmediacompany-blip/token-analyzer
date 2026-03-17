import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";

export interface DexPool {
  dex: string;
  pairAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  volume24h: number;
  liquidity: number;
  buys24h: number;
  sells24h: number;
  priceUsd: number;
}

export interface DexBreakdown {
  pools: DexPool[];
  totalVolume: number;
  totalLiquidity: number;
  dexes: { name: string; volume: number; liquidity: number; percentage: number; color: string }[];
}

const DEX_COLORS: Record<string, string> = {
  raydium: "#6366f1",
  orca: "#06b6d4",
  meteora: "#f59e0b",
  jupiter: "#22c55e",
  phoenix: "#ef4444",
  lifinity: "#a855f7",
  openbook: "#3b82f6",
};

function getDexColor(dex: string): string {
  return DEX_COLORS[dex.toLowerCase()] || "#64748b";
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const data = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ pools: [], totalVolume: 0, totalLiquidity: 0, dexes: [] });
    }

    const solanaPairs = data.pairs.filter((p) => (p.chainId as string) === "solana");

    const pools: DexPool[] = solanaPairs.map((pair) => {
      const baseToken = pair.baseToken as Record<string, string>;
      const quoteToken = pair.quoteToken as Record<string, string>;
      const volume = pair.volume as Record<string, number> | undefined;
      const liq = pair.liquidity as Record<string, number> | undefined;
      const txns = pair.txns as Record<string, Record<string, number>> | undefined;

      return {
        dex: (pair.dexId as string) || "unknown",
        pairAddress: (pair.pairAddress as string) || "",
        baseSymbol: baseToken?.symbol || "?",
        quoteSymbol: quoteToken?.symbol || "?",
        volume24h: volume?.h24 ?? 0,
        liquidity: liq?.usd ?? 0,
        buys24h: txns?.h24?.buys ?? 0,
        sells24h: txns?.h24?.sells ?? 0,
        priceUsd: parseFloat(pair.priceUsd as string) || 0,
      };
    });

    // Aggregate by DEX
    const dexMap = new Map<string, { volume: number; liquidity: number }>();
    for (const pool of pools) {
      const existing = dexMap.get(pool.dex) || { volume: 0, liquidity: 0 };
      existing.volume += pool.volume24h;
      existing.liquidity += pool.liquidity;
      dexMap.set(pool.dex, existing);
    }

    const totalVolume = pools.reduce((s, p) => s + p.volume24h, 0);
    const totalLiquidity = pools.reduce((s, p) => s + p.liquidity, 0);

    const dexes = Array.from(dexMap.entries())
      .map(([name, data]) => ({
        name,
        volume: data.volume,
        liquidity: data.liquidity,
        percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
        color: getDexColor(name),
      }))
      .sort((a, b) => b.volume - a.volume);

    return NextResponse.json({ pools, totalVolume, totalLiquidity, dexes });
  } catch (error) {
    console.error("DEX breakdown error:", error);
    return NextResponse.json({ error: "Failed to fetch DEX data" }, { status: 500 });
  }
}
