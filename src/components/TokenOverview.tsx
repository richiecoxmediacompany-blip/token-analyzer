"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { TokenInfo } from "@/types";
import {
  formatPrice,
  formatLargeNumber,
  formatPercentage,
} from "@/lib/utils";

interface TokenOverviewProps {
  token: TokenInfo;
}

export default function TokenOverview({ token }: TokenOverviewProps) {
  const [copied, setCopied] = useState(false);
  const isPositive = token.priceChange24h >= 0;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-3d rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Token Logo & Name */}
        <div className="flex items-center gap-4">
          {token.logo ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl" />
              <img
                src={token.logo}
                alt={token.name}
                className="relative w-14 h-14 rounded-2xl bg-white/5 ring-2 ring-white/10 shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl solana-gradient opacity-30 blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl solana-gradient flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/10 shadow-xl">
                {token.symbol.charAt(0)}
              </div>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{token.name}</h1>
            <p className="text-gray-500 text-sm font-medium">{token.symbol}</p>
          </div>
        </div>

        {/* Price */}
        <div className="sm:ml-auto text-right">
          <p className="text-3xl font-bold text-white tracking-tight">
            {formatPrice(token.price)}
          </p>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mt-1 ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5"
                : "bg-red-500/10 text-red-400 shadow-lg shadow-red-500/5"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="font-bold text-sm">
              {formatPercentage(token.priceChange24h)}
            </span>
            <span className="text-gray-500 text-xs">24h</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard label="Market Cap" value={formatLargeNumber(token.marketCap)} />
        <StatCard label="FDV" value={formatLargeNumber(token.fdv)} />
        <StatCard label="24h Volume" value={formatLargeNumber(token.volume24h)} />
        <StatCard
          label="Vol/MCap"
          value={
            token.marketCap > 0
              ? `${((token.volume24h / token.marketCap) * 100).toFixed(1)}%`
              : "N/A"
          }
        />
      </div>

      {/* Contract Address */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-2.5 font-mono text-sm text-gray-400 flex-1 min-w-0">
          <span className="truncate">{token.address}</span>
          <button
            onClick={copyAddress}
            className="text-gray-600 hover:text-white transition-colors flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex gap-2">
          {[
            { href: `https://solscan.io/token/${token.address}`, label: "Solscan" },
            { href: `https://birdeye.so/token/${token.address}?chain=solana`, label: "Birdeye" },
            { href: `https://dexscreener.com/solana/${token.address}`, label: "DEX" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 glass-card hover:bg-white/[0.06] text-gray-400 hover:text-white text-xs rounded-xl transition-all"
            >
              {link.label}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}
