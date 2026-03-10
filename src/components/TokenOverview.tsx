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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Token Logo & Name */}
        <div className="flex items-center gap-4">
          {token.logo ? (
            <img
              src={token.logo}
              alt={token.name}
              className="w-16 h-16 rounded-full bg-gray-800"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {token.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{token.name}</h1>
            <p className="text-gray-400 text-lg">{token.symbol}</p>
          </div>
        </div>

        {/* Price */}
        <div className="sm:ml-auto text-right">
          <p className="text-3xl font-bold text-white">
            {formatPrice(token.price)}
          </p>
          <div
            className={`flex items-center gap-1 justify-end ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-semibold">
              {formatPercentage(token.priceChange24h)}
            </span>
            <span className="text-gray-500 text-sm">24h</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <MetricItem label="Market Cap" value={formatLargeNumber(token.marketCap)} />
        <MetricItem label="FDV" value={formatLargeNumber(token.fdv)} tooltip="Fully Diluted Valuation - total supply multiplied by current price" />
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
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 font-mono text-sm text-gray-300 flex-1 min-w-0">
          <span className="truncate">{token.address}</span>
          <button
            onClick={copyAddress}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
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
            label="DexScreener"
          />
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3" title={tooltip}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
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
      className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors border border-gray-700"
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
