import { NextRequest, NextResponse } from "next/server";
import { cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";

const RPC_ENDPOINTS = [
  ...(process.env.HELIUS_API_KEY
    ? [`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`]
    : []),
  "https://api.mainnet-beta.solana.com",
];

async function rpcCall<T>(body: object): Promise<T> {
  for (const url of RPC_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json = await res.json();
      if (json.error) throw new Error(JSON.stringify(json.error));
      return json as T;
    } catch {
      continue;
    }
  }
  throw new Error("All RPC endpoints failed");
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    // Get SOL balance
    const balanceRes = await rpcCall<{ result?: { value?: number } }>({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address],
    });
    const solBalance = (balanceRes.result?.value || 0) / 1e9;

    // Get SOL price
    let solPrice = 0;
    try {
      const solData = await cachedFetch<{
        pairs?: Array<Record<string, unknown>>;
      }>(
        "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112",
        {},
        60_000
      );
      if (solData.pairs && solData.pairs.length > 0) {
        solPrice = parseFloat(solData.pairs[0].priceUsd as string) || 0;
      }
    } catch {
      // SOL price fetch failed, continue with 0
    }

    // Get token accounts
    const tokenRes = await rpcCall<{
      result?: {
        value?: Array<{
          pubkey: string;
          account: {
            data: {
              parsed: {
                info: {
                  mint: string;
                  tokenAmount: { uiAmount: number; decimals: number };
                };
              };
            };
          };
        }>;
      };
    }>({
      jsonrpc: "2.0",
      id: 2,
      method: "getTokenAccountsByOwner",
      params: [
        address,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ],
    });

    const tokenAccounts = tokenRes.result?.value || [];

    // Filter out zero-balance accounts and collect mints
    const holdings = tokenAccounts
      .map((ta) => ({
        mint: ta.account.data.parsed.info.mint,
        amount: ta.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: ta.account.data.parsed.info.tokenAmount.decimals,
      }))
      .filter((h) => h.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20); // Top 20 holdings

    // Batch fetch prices from DexScreener
    const tokens: Array<{
      mint: string;
      symbol: string;
      name: string;
      amount: number;
      decimals: number;
      price: number;
      value: number;
      change24h: number;
      logo: string | null;
    }> = [];

    // Fetch token info in batches of 5 to avoid rate limits
    for (let i = 0; i < holdings.length; i += 5) {
      const batch = holdings.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (h) => {
          try {
            const data = await cachedFetch<{
              pairs?: Array<Record<string, unknown>>;
            }>(
              `https://api.dexscreener.com/latest/dex/tokens/${h.mint}`,
              {},
              60_000
            );
            if (data.pairs && data.pairs.length > 0) {
              const pair = data.pairs[0];
              const baseToken = pair.baseToken as Record<string, string>;
              const priceChange = pair.priceChange as
                | Record<string, number>
                | undefined;
              const info = pair.info as Record<string, unknown> | undefined;
              const imageUrl = (info?.imageUrl as string) || null;
              return {
                mint: h.mint,
                symbol: baseToken?.symbol || "???",
                name: baseToken?.name || "Unknown",
                amount: h.amount,
                decimals: h.decimals,
                price: parseFloat(pair.priceUsd as string) || 0,
                value:
                  h.amount * (parseFloat(pair.priceUsd as string) || 0),
                change24h: priceChange?.h24 ?? 0,
                logo: imageUrl,
              };
            }
            return {
              mint: h.mint,
              symbol: "???",
              name: "Unknown Token",
              amount: h.amount,
              decimals: h.decimals,
              price: 0,
              value: 0,
              change24h: 0,
              logo: null,
            };
          } catch {
            return {
              mint: h.mint,
              symbol: "???",
              name: "Unknown Token",
              amount: h.amount,
              decimals: h.decimals,
              price: 0,
              value: 0,
              change24h: 0,
              logo: null,
            };
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") tokens.push(r.value);
      }
    }

    // Sort by USD value descending
    tokens.sort((a, b) => b.value - a.value);

    const solValue = solBalance * solPrice;
    const tokenValue = tokens.reduce((s, t) => s + t.value, 0);

    return NextResponse.json({
      address,
      solBalance,
      solValue,
      tokens,
      totalValue: solValue + tokenValue,
    });
  } catch (error) {
    console.error("Wallet tracker error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}
