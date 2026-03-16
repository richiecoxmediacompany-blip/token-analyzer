import { NextRequest, NextResponse } from "next/server";
import { isValidSolanaAddress } from "@/lib/utils";

/**
 * Lightweight endpoint that returns the latest price from DexScreener.
 * No caching — every call fetches fresh data for true real-time.
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
    // Bypass the cache entirely for real-time ticks
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json({ price: null });
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ price: null });
    }

    const pair = data.pairs[0];
    const price = parseFloat(pair.priceUsd || "0");
    const change1h = pair.priceChange?.h1 ?? 0;
    const change5m = pair.priceChange?.m5 ?? 0;
    const volume24h = pair.volume?.h24 ?? 0;
    const buys1h = pair.txns?.h1?.buys ?? 0;
    const sells1h = pair.txns?.h1?.sells ?? 0;

    return NextResponse.json({
      price,
      change1h,
      change5m,
      volume24h,
      buys1h,
      sells1h,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ price: null }, { status: 500 });
  }
}
