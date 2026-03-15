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
  shortenAddress,
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
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Token Logo & Name */}
        <div className="flex items-center gap-4">
          {token.logo ? (
            <img
              src={token.logo}
              alt={token.name}
              className="w-14 h-14 rounded-2xl bg-white/5 ring-2 ring-white/10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/10">
              {token.symbol.charAt(0)}
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mt-1 ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="font-semibold text-sm">
              {formatPercentage(token.priceChange24h)}
            </span>
            <span className="text-gray-500 text-xs">24h</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <MetricItem label="Market Cap" value={formatLargeNumber(token.marketCap)} />
        <MetricItem label="FDV" value={formatLargeNumber(token.fdv)} />
        <MetricItem label="24h Volume" value={formatLargeNumber(token.volume24h)} />
        <MetricItem
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
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-400 flex-1 min-w-0">
          <span className="truncate">{token.address}</span>
          <button
            onClick={copyAddress}
            className="text-gray-600 hover:text-white transition-colors flex-shrink-0"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <ExternalLinkButton
            href={`https://solscan.io/token/${token.address}`}
            label="Solscan"
          />
          <ExternalLinkButton
            href={`https://birdeye.so/token/${token.address}?chain=solana`}
            label="Birdeye"
          />
          <ExternalLinkButton
            href={`https://dexscreener.com/solana/${token.address}`}
            label="DEX"
          />
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function ExternalLinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white text-xs rounded-xl transition-colors border border-white/5"
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
