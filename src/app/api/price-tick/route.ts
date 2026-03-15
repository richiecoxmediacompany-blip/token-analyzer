import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";

/**
 * Lightweight endpoint that returns only the latest price + 24h change
 * from DexScreener. Cached for only 3 seconds so the chart gets fresh
 * real-time ticks on every poll.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address" },
      { status: 400 }
    );
  }

  try {
    const data = await cachedFetch<{
      pairs?: Array<{
        priceUsd?: string;
        priceChange?: { h1?: number; h24?: number };
        volume?: { h24?: number };
        txns?: { h1?: { buys?: number; sells?: number } };
      }>;
    }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      3_000 // 3 second cache — near real-time
    );

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ price: null });
    }

    const pair = data.pairs[0];
    const price = parseFloat(pair.priceUsd || "0");
    const change1h = pair.priceChange?.h1 ?? 0;
    const volume24h = pair.volume?.h24 ?? 0;
    const buys1h = pair.txns?.h1?.buys ?? 0;
    const sells1h = pair.txns?.h1?.sells ?? 0;

    return NextResponse.json({
      price,
      change1h,
      volume24h,
      buys1h,
      sells1h,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ price: null }, { status: 500 });
  }
}
