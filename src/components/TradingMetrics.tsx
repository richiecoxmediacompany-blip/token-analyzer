"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
} from "lucide-react";
import type { TransactionMetrics } from "@/types";
import { formatNumber, formatLargeNumber } from "@/lib/utils";
import PriceChart from "./PriceChart";

interface TradingMetricsProps {
  metrics: TransactionMetrics;
  tokenAddress: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function TradingMetrics({
  metrics,
  tokenAddress,
  onTimeframeChange,
}: TradingMetricsProps) {
  const [timeframe, setTimeframe] = useState("24h");

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  const buyRatio =
    metrics.buyCount + metrics.sellCount > 0
      ? (metrics.buyCount / (metrics.buyCount + metrics.sellCount)) * 100
      : 50;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Trading Activity</h2>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <ArrowUpDown className="w-3 h-3" />
            24h Transactions
          </div>
          <p className="text-lg font-semibold text-white mt-1">
            {formatNumber(metrics.count24h)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-green-500 text-xs">
            <TrendingUp className="w-3 h-3" />
            Buys
          </div>
          <p className="text-lg font-semibold text-green-400 mt-1">
            {formatNumber(metrics.buyCount)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-red-500 text-xs">
            <TrendingDown className="w-3 h-3" />
            Sells
          </div>
          <p className="text-lg font-semibold text-red-400 mt-1">
            {formatNumber(metrics.sellCount)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Users className="w-3 h-3" />
            Unique Buyers
          </div>
          <p className="text-lg font-semibold text-white mt-1">
            {formatNumber(metrics.uniqueBuyers)}
          </p>
        </div>
      </div>

      {/* Buy/Sell ratio bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-green-400">
            Buy {buyRatio.toFixed(0)}%
          </span>
          <span className="text-red-400">
            Sell {(100 - buyRatio).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-red-500/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-3 rounded-l-full transition-all"
            style={{ width: `${buyRatio}%` }}
          />
        </div>
      </div>

      {/* Average transaction */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-6 bg-gray-800/50 rounded-lg p-3">
        <span>Average Transaction Size</span>
        <span className="text-white font-semibold">
          {formatLargeNumber(metrics.avgTransactionSize)}
        </span>
      </div>

      {/* Price chart */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          {["1h", "6h", "24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeframe === tf
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <PriceChart data={metrics.priceHistory} />
      </div>
    </div>
  );
}
