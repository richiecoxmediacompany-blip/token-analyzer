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

const OHLCV_POLL_INTERVAL = 30_000; // Full candle refresh every 30s
const TICK_INTERVAL = 3_000; // Fetch live price tick every 3s

interface TradingMetricsProps {
  metrics: TransactionMetrics;
  tokenAddress: string;
}

/**
 * Apply a real price tick from DexScreener to the latest candle.
 * Updates close, high, low in-place so the chart visibly moves.
 */
function applyPriceTick(
  data: PricePoint[],
  price: number
): PricePoint[] {
  if (data.length === 0 || price <= 0) return data;
  const copy = [...data];
  const last = { ...copy[copy.length - 1] };

  last.close = price;
  last.high = Math.max(last.high, price);
  last.low = Math.min(last.low, price);

  copy[copy.length - 1] = last;
  return copy;
}

export default function TradingMetrics({
  metrics,
  tokenAddress,
}: TradingMetricsProps) {
  const [timeframe, setTimeframe] = useState("24h");
  const [chartData, setChartData] = useState<PricePoint[]>(metrics.priceHistory);
  const [chartLoading, setChartLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeframeRef = useRef(timeframe);
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
        }
      }
    } catch {
      // Keep existing data
    } finally {
      if (!silent) setChartLoading(false);
    }
  }, [tokenAddress]);

  // Full OHLCV candle refresh (slower, heavier)
  useEffect(() => {
    if (isLive) {
      pollRef.current = setInterval(() => {
        fetchChart(timeframeRef.current, true);
      }, OHLCV_POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, fetchChart]);

  // Real-time price ticks from DexScreener (fast, lightweight)
  useEffect(() => {
    if (!isLive) return;

    const fetchTick = async () => {
      try {
        const res = await fetch(
          `/api/price-tick?address=${encodeURIComponent(tokenAddress)}`
        );
        if (res.ok) {
          const tick = await res.json();
          if (tick.price && tick.price > 0) {
            setChartData((prev) => applyPriceTick(prev, tick.price));
          }
        }
      } catch {
        // Silently skip failed ticks
      }
    };

    // Fetch immediately on mount, then every TICK_INTERVAL
    fetchTick();
    tickRef.current = setInterval(fetchTick, TICK_INTERVAL);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLive, tokenAddress]);

  useEffect(() => {
    setChartData(metrics.priceHistory);
  }, [tokenAddress, metrics.priceHistory]);

  const handleTimeframeChange = useCallback(async (tf: string) => {
    setTimeframe(tf);
    await fetchChart(tf);
  }, [fetchChart]);

  const buyRatio =
    metrics.buyCount + metrics.sellCount > 0
      ? (metrics.buyCount / (metrics.buyCount + metrics.sellCount)) * 100
      : 50;

  return (
    <div className="card-3d rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Trading Activity</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">24h Overview</p>
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
            glow="shadow-emerald-500/5"
          />
          <MetricCard
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            label="Sells"
            value={formatNumber(metrics.sellCount)}
            color="text-red-400"
            glow="shadow-red-500/5"
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
            <span className="text-emerald-400 font-medium">Buy {buyRatio.toFixed(0)}%</span>
            <span className="text-red-400 font-medium">Sell {(100 - buyRatio).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-red-500/15 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-l-full transition-all shadow-lg shadow-emerald-500/20"
              style={{ width: `${buyRatio}%` }}
            />
          </div>
        </div>

        {/* Avg transaction */}
        <div className="flex items-center justify-between text-sm text-gray-400 glass-card rounded-xl px-4 py-3">
          <span>Avg Transaction Size</span>
          <span className="text-white font-semibold">{formatLargeNumber(metrics.avgTransactionSize)}</span>
        </div>
      </div>

      {/* Chart section */}
      <div className="border-t border-white/5">
        <div className="px-6 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-400">Price Chart</h3>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                isLive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                  : "glass-card text-gray-500 hover:text-gray-300"
              }`}
            >
              <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "Live" : "Paused"}
            </button>
          </div>
          <div className="flex items-center gap-1 glass-card rounded-xl p-1">
            {["1h", "6h", "24h", "7d", "30d"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                disabled={chartLoading}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                  timeframe === tf
                    ? "bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/20"
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
            <div className="absolute inset-0 flex items-center justify-center bg-[#050510]/60 z-10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs text-gray-400">Loading chart...</span>
              </div>
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
  glow = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  glow?: string;
}) {
  return (
    <div className={`glass-card rounded-xl p-3 ${glow}`}>
      <div className={`flex items-center gap-1.5 text-xs ${color} mb-1`}>
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
