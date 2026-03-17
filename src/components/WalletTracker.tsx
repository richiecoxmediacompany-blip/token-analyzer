"use client";

import { useState, useCallback } from "react";
import {
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  formatPrice,
  formatLargeNumber,
  formatNumber,
  shortenAddress,
  isValidSolanaAddress,
  formatPercentage,
  cn,
} from "@/lib/utils";

interface WalletToken {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  price: number;
  value: number;
  change24h: number;
  logo: string | null;
}

interface WalletData {
  address: string;
  solBalance: number;
  solValue: number;
  tokens: WalletToken[];
  totalValue: number;
}

export default function WalletTracker() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WalletData | null>(null);

  const fetchWallet = useCallback(async (address: string) => {
    if (!isValidSolanaAddress(address)) {
      setError("Invalid Solana wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const walletData: WalletData = await res.json();
      setData(walletData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) fetchWallet(trimmed);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card-3d rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl solana-gradient">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Wallet Tracker</h2>
            <p className="text-xs text-gray-500">
              Analyze any Solana wallet&apos;s holdings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className="w-full pl-10 pr-4 py-3 glass-card rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/40 transition-all bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={cn(
              "px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center gap-2",
              loading || !input.trim()
                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                : "solana-gradient hover:opacity-90 shadow-lg shadow-purple-500/20"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Analyze
          </button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-3d rounded-2xl p-4">
                <div className="h-3 bg-white/[0.03] rounded-lg w-1/2 mb-2" />
                <div className="h-7 bg-white/[0.03] rounded-lg w-3/4" />
              </div>
            ))}
          </div>
          <div className="card-3d rounded-2xl p-6">
            <div className="h-5 bg-white/[0.04] rounded-lg w-1/4 mb-5" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.03]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/[0.03] rounded-lg w-1/3" />
                    <div className="h-3 bg-white/[0.03] rounded-lg w-1/4" />
                  </div>
                  <div className="h-4 bg-white/[0.03] rounded-lg w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-3d rounded-2xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Total Value
              </p>
              <p className="text-2xl font-bold solana-text mt-0.5">
                {formatLargeNumber(data.totalValue)}
              </p>
            </div>
            <div className="card-3d rounded-2xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                SOL Balance
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {formatNumber(parseFloat(data.solBalance.toFixed(4)))} SOL
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatPrice(data.solValue)}
              </p>
            </div>
            <div className="card-3d rounded-2xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Token Holdings
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {data.tokens.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {shortenAddress(data.address)}
              </p>
            </div>
          </div>

          {/* Token Holdings Table */}
          {data.tokens.length > 0 && (
            <div className="card-3d rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Token Holdings
              </h3>

              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-3 pb-3 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                <span>Token</span>
                <span className="text-right w-24">Amount</span>
                <span className="text-right w-24">Price</span>
                <span className="text-right w-24">Value</span>
                <span className="text-right w-24">24h</span>
              </div>

              {/* Token Rows */}
              <div className="divide-y divide-white/5">
                {data.tokens.map((token) => {
                  const isPositive = token.change24h >= 0;
                  return (
                    <div
                      key={token.mint}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 items-center px-3 py-3 hover:bg-white/[0.02] rounded-xl transition-colors"
                    >
                      {/* Token Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {token.logo ? (
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-9 h-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (
                                e.target as HTMLImageElement
                              ).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl solana-gradient flex items-center justify-center text-sm font-bold text-white ring-1 ring-white/10 flex-shrink-0",
                            token.logo ? "hidden" : ""
                          )}
                        >
                          {token.symbol.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {token.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {token.symbol}
                            </span>
                            <a
                              href={`https://solscan.io/token/${token.mint}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-purple-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right w-24">
                        <p className="text-sm text-gray-300 font-mono">
                          {formatNumber(
                            parseFloat(token.amount.toFixed(token.decimals > 4 ? 4 : token.decimals))
                          )}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right w-24">
                        <p className="text-sm text-gray-300">
                          {token.price > 0 ? formatPrice(token.price) : "--"}
                        </p>
                      </div>

                      {/* Value */}
                      <div className="text-right w-24">
                        <p className="text-sm font-semibold text-white">
                          {token.value > 0 ? formatPrice(token.value) : "--"}
                        </p>
                      </div>

                      {/* 24h Change */}
                      <div className="text-right w-24">
                        {token.change24h !== 0 ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold",
                              isPositive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            )}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {formatPercentage(token.change24h)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">--</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {data.tokens.length === 0 && (
            <div className="card-3d rounded-2xl p-10 text-center">
              <Wallet className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No token holdings found for this wallet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
