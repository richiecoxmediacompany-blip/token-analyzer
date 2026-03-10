import { NextRequest, NextResponse } from "next/server";
import { heliusRpcUrl, birdeyeHeaders, cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { TokenInfo } from "@/types";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    // Fetch token metadata from Helius DAS API
    const [assetData, priceData] = await Promise.allSettled([
      fetchTokenMetadata(address),
      fetchPriceData(address),
    ]);

    const metadata =
      assetData.status === "fulfilled" ? assetData.value : null;
    const price = priceData.status === "fulfilled" ? priceData.value : null;

    if (!metadata && !price) {
      return NextResponse.json(
        { error: "Token not found on Solana blockchain" },
        { status: 404 }
      );
    }

    const tokenInfo: TokenInfo = {
      address,
      name: metadata?.name || price?.name || "Unknown Token",
      symbol: metadata?.symbol || price?.symbol || "???",
      decimals: metadata?.decimals ?? 9,
      logo: metadata?.logo || price?.logo || null,
      price: price?.price ?? 0,
      priceChange24h: price?.priceChange24h ?? 0,
      marketCap: price?.marketCap ?? 0,
      fdv: price?.fdv ?? 0,
      volume24h: price?.volume24h ?? 0,
      ath: price?.ath ?? null,
      atl: price?.atl ?? null,
      supply: metadata?.supply ?? 0,
      circulatingSupply: metadata?.circulatingSupply ?? 0,
    };

    return NextResponse.json(tokenInfo);
  } catch (error) {
    console.error("Token info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}

interface MetadataResult {
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
  supply: number;
  circulatingSupply: number;
}

async function fetchTokenMetadata(
  address: string
): Promise<MetadataResult | null> {
  try {
    const rpcUrl = heliusRpcUrl();
    const response = await cachedFetch<{ result?: Record<string, unknown> }>(
      rpcUrl,
      {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "token-metadata",
          method: "getAsset",
          params: { id: address },
        }),
      },
      120_000
    );

    const result = response.result;
    if (!result) {
      // Fallback: try getAccountInfo for SPL token mint
      return fetchSplMintInfo(address);
    }

    const content = result.content as Record<string, unknown> | undefined;
    const metadata = content?.metadata as Record<string, unknown> | undefined;
    const links = content?.links as Record<string, unknown> | undefined;
    const tokenInfoField = result.token_info as
      | Record<string, unknown>
      | undefined;

    return {
      name: (metadata?.name as string) || "Unknown",
      symbol: (metadata?.symbol as string) || "???",
      decimals: (tokenInfoField?.decimals as number) ?? 9,
      logo: (links?.image as string) || null,
      supply: (tokenInfoField?.supply as number) ?? 0,
      circulatingSupply: (tokenInfoField?.supply as number) ?? 0,
    };
  } catch {
    return fetchSplMintInfo(address);
  }
}

async function fetchSplMintInfo(
  address: string
): Promise<MetadataResult | null> {
  try {
    const rpcUrl = heliusRpcUrl();
    const response = await cachedFetch<{
      result?: { value?: Record<string, unknown> };
    }>(
      rpcUrl,
      {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "mint-info",
          method: "getAccountInfo",
          params: [address, { encoding: "jsonParsed" }],
        }),
      },
      120_000
    );

    const parsed = response.result?.value?.data as
      | { parsed?: { info?: Record<string, unknown> } }
      | undefined;
    const info = parsed?.parsed?.info;

    if (!info) return null;

    return {
      name: "Unknown Token",
      symbol: "???",
      decimals: (info.decimals as number) ?? 9,
      logo: null,
      supply: parseFloat(info.supply as string) || 0,
      circulatingSupply: parseFloat(info.supply as string) || 0,
    };
  } catch {
    return null;
  }
}

interface PriceResult {
  name: string;
  symbol: string;
  logo: string | null;
  price: number;
  priceChange24h: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  ath: { price: number; date: string } | null;
  atl: { price: number; date: string } | null;
}

async function fetchPriceData(address: string): Promise<PriceResult | null> {
  try {
    // Try DexScreener first (no API key needed)
    const dexData = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    if (dexData.pairs && dexData.pairs.length > 0) {
      const pair = dexData.pairs[0];
      const baseToken = pair.baseToken as Record<string, string>;
      const priceChange = pair.priceChange as Record<string, number> | undefined;

      return {
        name: baseToken?.name || "Unknown",
        symbol: baseToken?.symbol || "???",
        logo: null,
        price: parseFloat(pair.priceUsd as string) || 0,
        priceChange24h: priceChange?.h24 ?? 0,
        marketCap: (pair.marketCap as number) || (pair.fdv as number) || 0,
        fdv: (pair.fdv as number) || 0,
        volume24h: (pair.volume as Record<string, number>)?.h24 ?? 0,
        ath: null,
        atl: null,
      };
    }

    // Fallback to Birdeye
    return fetchBirdeyePrice(address);
  } catch {
    return fetchBirdeyePrice(address);
  }
}

async function fetchBirdeyePrice(
  address: string
): Promise<PriceResult | null> {
  try {
    const data = await cachedFetch<{
      data?: Record<string, unknown>;
      success?: boolean;
    }>(
      `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
      { headers: birdeyeHeaders() },
      60_000
    );

    if (!data.success || !data.data) return null;
    const d = data.data;

    return {
      name: (d.name as string) || "Unknown",
      symbol: (d.symbol as string) || "???",
      logo: (d.logoURI as string) || null,
      price: (d.price as number) || 0,
      priceChange24h: (d.priceChange24hPercent as number) || 0,
      marketCap: (d.mc as number) || 0,
      fdv: (d.fdv as number) || (d.mc as number) || 0,
      volume24h: (d.v24hUSD as number) || 0,
      ath: null,
      atl: null,
    };
  } catch {
    return null;
  }
}
