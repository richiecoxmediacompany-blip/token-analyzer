import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { TransactionMetrics, PricePoint } from "@/types";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const timeframe = request.nextUrl.searchParams.get("timeframe") || "24h";

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    const [metrics, priceHistory] = await Promise.allSettled([
      fetchTransactionMetrics(address),
      fetchPriceHistory(address, timeframe),
    ]);

    const txMetrics =
      metrics.status === "fulfilled" ? metrics.value : getDefaultMetrics();
    const history =
      priceHistory.status === "fulfilled" ? priceHistory.value : [];

    const result: TransactionMetrics = {
      ...txMetrics,
      priceHistory: history,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Transaction metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction data" },
      { status: 500 }
    );
  }
}

function getDefaultMetrics(): Omit<TransactionMetrics, "priceHistory"> {
  return {
    count24h: 0,
    buyCount: 0,
    sellCount: 0,
    uniqueBuyers: 0,
    uniqueSellers: 0,
    avgTransactionSize: 0,
    largestTransaction: null,
  };
}

async function fetchTransactionMetrics(
  address: string
): Promise<Omit<TransactionMetrics, "priceHistory">> {
  try {
    const data = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (!data.pairs || data.pairs.length === 0) return getDefaultMetrics();

    // Aggregate across all pairs
    let totalBuys = 0;
    let totalSells = 0;
    let totalVolume = 0;

    for (const pair of data.pairs) {
      const txns = pair.txns as Record<string, Record<string, number>> | undefined;
      const volume = pair.volume as Record<string, number> | undefined;

      totalBuys += txns?.h24?.buys ?? 0;
      totalSells += txns?.h24?.sells ?? 0;
      totalVolume += volume?.h24 ?? 0;
    }

    const totalTxns = totalBuys + totalSells;
    const avgSize = totalTxns > 0 ? totalVolume / totalTxns : 0;

    return {
      count24h: totalTxns,
      buyCount: totalBuys,
      sellCount: totalSells,
      uniqueBuyers: Math.round(totalBuys * 0.7), // Estimate
      uniqueSellers: Math.round(totalSells * 0.7),
      avgTransactionSize: Math.round(avgSize * 100) / 100,
      largestTransaction: null,
    };
  } catch {
    return getDefaultMetrics();
  }
}

async function fetchPriceHistory(
  address: string,
  timeframe: string
): Promise<PricePoint[]> {
  try {
    // First, get pool address from DexScreener
    const dexData = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (!dexData.pairs || dexData.pairs.length === 0) return [];

    // Find the best Solana pair (highest liquidity)
    const solanaPairs = dexData.pairs.filter(
      (p) => (p.chainId as string) === "solana"
    );
    const bestPair = solanaPairs[0] || dexData.pairs[0];
    const poolAddress = bestPair.pairAddress as string;

    if (!poolAddress) return [];

    // Map timeframe to GeckoTerminal OHLCV params (free, no API key needed)
    const geckoParams: Record<string, { timeframe: string; aggregate: number; limit: number }> = {
      "1h":  { timeframe: "minute", aggregate: 1, limit: 60 },
      "6h":  { timeframe: "minute", aggregate: 5, limit: 72 },
      "24h": { timeframe: "minute", aggregate: 15, limit: 96 },
      "7d":  { timeframe: "hour", aggregate: 1, limit: 168 },
      "30d": { timeframe: "hour", aggregate: 4, limit: 180 },
    };

    const params = geckoParams[timeframe] || geckoParams["24h"];

    // Use Birdeye OHLCV if API key available
    const birdeyeKey = process.env.BIRDEYE_API_KEY;
    if (birdeyeKey) {
      const now = Math.floor(Date.now() / 1000);
      const timeframeSeconds: Record<string, number> = {
        "1h": 3600,
        "6h": 21600,
        "24h": 86400,
        "7d": 604800,
        "30d": 2592000,
      };
      const from = now - (timeframeSeconds[timeframe] || 86400);

      const intervalTypeMap: Record<string, string> = {
        "1h": "1m",
        "6h": "5m",
        "24h": "15m",
        "7d": "1H",
        "30d": "4H",
      };
      const intervalType = intervalTypeMap[timeframe] || "15m";

      const data = await cachedFetch<{
        data?: { items?: Array<Record<string, number>> };
        success?: boolean;
      }>(
        `https://public-api.birdeye.so/defi/ohlcv?address=${address}&type=${intervalType}&time_from=${from}&time_to=${now}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": birdeyeKey,
            "x-chain": "solana",
          },
        },
        60_000
      );

      if (data.success && data.data?.items && data.data.items.length > 0) {
        return data.data.items.map((item) => ({
          timestamp: (item.unixTime || 0) * 1000,
          open: item.o || 0,
          high: item.h || 0,
          low: item.l || 0,
          close: item.c || 0,
          volume: item.v || 0,
        }));
      }
    }

    // Free fallback: GeckoTerminal OHLCV API (no key needed)
    const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${params.timeframe}?aggregate=${params.aggregate}&limit=${params.limit}&currency=usd`;

    const geckoData = await cachedFetch<{
      data?: {
        attributes?: {
          ohlcv_list?: Array<[number, string, string, string, string, string]>;
        };
      };
    }>(
      geckoUrl,
      { headers: { Accept: "application/json" } },
      30_000
    );

    const ohlcvList = geckoData?.data?.attributes?.ohlcv_list;
    if (ohlcvList && ohlcvList.length > 0) {
      // GeckoTerminal returns [timestamp, open, high, low, close, volume] sorted newest first
      return ohlcvList
        .map((candle) => ({
          timestamp: candle[0] * 1000,
          open: parseFloat(candle[1]) || 0,
          high: parseFloat(candle[2]) || 0,
          low: parseFloat(candle[3]) || 0,
          close: parseFloat(candle[4]) || 0,
          volume: parseFloat(candle[5]) || 0,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    return [];
  } catch {
    return [];
  }
}
