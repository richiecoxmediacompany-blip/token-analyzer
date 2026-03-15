"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Loader2,
  Radio,
} from "lucide-react";
import type { TransactionMetrics, PricePoint } from "@/types";
import { formatNumber, formatLargeNumber } from "@/lib/utils";
import PriceChart from "./PriceChart";

const POLL_INTERVAL = 30_000; // 30 seconds

interface TradingMetricsProps {
  metrics: TransactionMetrics;
  tokenAddress: string;
}

export default function TradingMetrics({
  metrics,
  tokenAddress,
}: TradingMetricsProps) {
  const [timeframe, setTimeframe] = useState("24h");
  const [chartData, setChartData] = useState<PricePoint[]>(metrics.priceHistory);
  const [chartLoading, setChartLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeframeRef = useRef(timeframe);

  // Keep ref in sync
  timeframeRef.current = timeframe;

  const fetchChart = useCallback(async (tf: string, silent = false) => {
    if (!silent) setChartLoading(true);
    try {
      const q = `address=${encodeURIComponent(tokenAddress)}&timeframe=${tf}`;
      const res = await fetch(`/api/transactions?${q}`);
      if (res.ok) {
        const data = await res.json();
        if (data.priceHistory && data.priceHistory.length > 0) {
          setChartData(data.priceHistory);
          setLastUpdate(new Date());
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      if (!silent) setChartLoading(false);
    }
  }, [tokenAddress]);

  // Start/stop live polling
  useEffect(() => {
    if (isLive) {
      pollRef.current = setInterval(() => {
        fetchChart(timeframeRef.current, true);
      }, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, fetchChart]);

  // Reset when token changes
  useEffect(() => {
    setChartData(metrics.priceHistory);
    setLastUpdate(new Date());
  }, [tokenAddress, metrics.priceHistory]);

  const handleTimeframeChange = useCallback(async (tf: string) => {
    setTimeframe(tf);
    await fetchChart(tf);
  }, [fetchChart]);

  const buyRatio =
    metrics.buyCount + metrics.sellCount > 0
      ? (metrics.buyCount / (metrics.buyCount + metrics.sellCount)) * 100
      : 50;

  const timeSinceUpdate = Math.round((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Trading Activity</h2>
              <p className="text-xs text-gray-500">24h overview</p>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MetricCard
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            label="Transactions"
            value={formatNumber(metrics.count24h)}
            color="text-gray-400"
          />
          <MetricCard
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Buys"
            value={formatNumber(metrics.buyCount)}
            color="text-emerald-400"
          />
          <MetricCard
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            label="Sells"
            value={formatNumber(metrics.sellCount)}
            color="text-red-400"
          />
          <MetricCard
            icon={<Users className="w-3.5 h-3.5" />}
            label="Unique Buyers"
            value={formatNumber(metrics.uniqueBuyers)}
            color="text-gray-400"
          />
        </div>

        {/* Buy/Sell ratio bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-emerald-400 font-medium">
              Buy {buyRatio.toFixed(0)}%
            </span>
            <span className="text-red-400 font-medium">
              Sell {(100 - buyRatio).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-red-500/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-l-full transition-all"
              style={{ width: `${buyRatio}%` }}
            />
          </div>
        </div>

        {/* Avg transaction */}
        <div className="flex items-center justify-between text-sm text-gray-400 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
          <span>Avg Transaction Size</span>
          <span className="text-white font-semibold">
            {formatLargeNumber(metrics.avgTransactionSize)}
          </span>
        </div>
      </div>

      {/* Chart section */}
      <div className="border-t border-white/5">
        <div className="px-6 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-400">Price Chart</h3>
            {/* Live toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                isLive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.03] text-gray-500 border border-white/5 hover:text-gray-300"
              }`}
            >
              <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "Live" : "Paused"}
            </button>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1">
            {["1h", "6h", "24h", "7d", "30d"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                disabled={chartLoading}
                className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${
                  timeframe === tf
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6 relative">
          {chartLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d20]/60 z-10 rounded-xl">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}
          <PriceChart data={chartData} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
      <div className={`flex items-center gap-1.5 text-xs ${color} mb-1`}>
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
