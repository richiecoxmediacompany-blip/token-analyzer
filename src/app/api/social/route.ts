import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { SocialSignals } from "@/types";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    const social = await fetchSocialData(address);
    return NextResponse.json(social);
  } catch (error) {
    console.error("Social data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch social data" },
      { status: 500 }
    );
  }
}

async function fetchSocialData(address: string): Promise<SocialSignals> {
  let website: string | null = null;
  let twitter: string | null = null;
  let telegram: string | null = null;
  let discord: string | null = null;

  // Try to get social links from DexScreener
  try {
    const data = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      const info = pair.info as Record<string, unknown> | undefined;

      if (info) {
        const websites = info.websites as Array<{ url: string }> | undefined;
        const socials = info.socials as Array<{ type: string; url: string }> | undefined;

        website = websites?.[0]?.url || null;
        twitter = socials?.find((s) => s.type === "twitter")?.url || null;
        telegram = socials?.find((s) => s.type === "telegram")?.url || null;
        discord = socials?.find((s) => s.type === "discord")?.url || null;
      }
    }
  } catch {
    // Continue without DexScreener social data
  }

  // Try Birdeye for additional data
  let sentimentScore = 5;
  try {
    const birdeyeKey = process.env.BIRDEYE_API_KEY;
    if (birdeyeKey) {
      const data = await cachedFetch<{
        data?: Record<string, unknown>;
        success?: boolean;
      }>(
        `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": birdeyeKey,
            "x-chain": "solana",
          },
        },
        60_000
      );

      if (data.success && data.data) {
        const d = data.data;
        if (!website) website = (d.website as string) || null;
        if (!twitter) twitter = (d.twitter as string) || null;
        if (!telegram) telegram = (d.telegram as string) || null;
        if (!discord) discord = (d.discord as string) || null;

        // Estimate sentiment from trading activity
        const volume = (d.v24hUSD as number) || 0;
        const mc = (d.mc as number) || 1;
        const volumeToMc = volume / mc;
        sentimentScore = Math.min(10, Math.max(1, Math.round(volumeToMc * 20)));
      }
    }
  } catch {
    // Continue without Birdeye social data
  }

  // Generate estimated social metrics based on available data
  const hasAnySocial = !!(twitter || telegram || discord || website);

  return {
    twitterMentions24h: 0, // Would need Twitter API
    trending: false,
    recentTweets: [],
    telegramMembers: null,
    discordMembers: null,
    website,
    twitter,
    telegram,
    discord,
    sentimentScore: hasAnySocial ? sentimentScore : 3,
  };
}
