"use client";

import { useState, useEffect } from "react";
import { Network, Loader2, ExternalLink } from "lucide-react";
import { formatLargeNumber, formatNumber, shortenAddress } from "@/lib/utils";

interface DexPool {
  dex: string;
  pairAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
  volume24h: number;
  liquidity: number;
  buys24h: number;
  sells24h: number;
  priceUsd: number;
}

interface DexInfo {
  name: string;
  volume: number;
  liquidity: number;
  percentage: number;
  color: string;
}

interface DexBreakdownData {
  pools: DexPool[];
  totalVolume: number;
  totalLiquidity: number;
  dexes: DexInfo[];
}

interface DexBreakdownProps {
  tokenAddress: string;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  // Clamp to avoid full-circle issues with SVG arc
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const endA = startAngle + sweep;

  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endA - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = sweep > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default function DexBreakdown({ tokenAddress }: DexBreakdownProps) {
  const [data, setData] = useState<DexBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/dex-breakdown?address=${tokenAddress}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenAddress]);

  return (
    <div className="card-3d rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <Network className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white">DEX Activity</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="glass-card rounded-xl p-4 border border-red-500/20">
          <p className="text-sm text-red-300/80">Failed to load DEX data</p>
        </div>
      )}

      {!loading && !error && data && data.pools.length === 0 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-gray-400">No DEX pools found for this token.</p>
        </div>
      )}

      {!loading && !error && data && data.pools.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="glass-card rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Volume 24h</p>
              <p className="text-lg font-bold text-white">{formatLargeNumber(data.totalVolume)}</p>
            </div>
            <div className="glass-card rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Liquidity</p>
              <p className="text-lg font-bold text-white">{formatLargeNumber(data.totalLiquidity)}</p>
            </div>
          </div>

          {/* Donut chart + legend */}
          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                {/* Arcs for each DEX */}
                {data.dexes.reduce<{ elements: React.ReactNode[]; offset: number }>(
                  (acc, dex, i) => {
                    const sweepAngle = (dex.percentage / 100) * 360;
                    if (sweepAngle < 0.5) return acc;
                    const gap = data.dexes.length > 1 ? 2 : 0;
                    const effectiveSweep = Math.max(sweepAngle - gap, 0.5);
                    const startAngle = acc.offset + gap / 2;

                    acc.elements.push(
                      <path
                        key={dex.name}
                        d={describeArc(50, 50, 38, startAngle, startAngle + effectiveSweep)}
                        fill="none"
                        stroke={dex.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        style={{
                          filter: `drop-shadow(0 0 6px ${dex.color}66)`,
                        }}
                      />
                    );
                    acc.offset += sweepAngle;
                    return acc;
                  },
                  { elements: [], offset: 0 }
                ).elements}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500">{data.dexes.length}</span>
                <span className="text-[10px] text-gray-600">
                  {data.dexes.length === 1 ? "DEX" : "DEXs"}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 min-w-0 flex-1">
              {data.dexes.map((dex) => (
                <div key={dex.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: dex.color, boxShadow: `0 0 8px ${dex.color}80` }}
                  />
                  <span className="text-sm text-gray-300 capitalize truncate">{dex.name}</span>
                  <span className="text-sm text-gray-500 ml-auto flex-shrink-0">
                    {dex.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pool table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600 text-[10px] uppercase tracking-wider border-b border-white/5">
                  <th className="text-left py-3">DEX</th>
                  <th className="text-left py-3">Pair</th>
                  <th className="text-right py-3">Volume 24h</th>
                  <th className="text-right py-3">Liquidity</th>
                  <th className="text-right py-3">Buys/Sells</th>
                </tr>
              </thead>
              <tbody>
                {data.pools.map((pool) => {
                  const dexInfo = data.dexes.find(
                    (d) => d.name.toLowerCase() === pool.dex.toLowerCase()
                  );
                  const color = dexInfo?.color || "#64748b";
                  const totalTxns = pool.buys24h + pool.sells24h;
                  const buyRatio = totalTxns > 0 ? (pool.buys24h / totalTxns) * 100 : 50;

                  return (
                    <tr
                      key={pool.pairAddress}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-gray-300 capitalize text-xs font-medium">
                            {pool.dex}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <a
                          href={`https://dexscreener.com/solana/${pool.pairAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-mono"
                        >
                          {pool.baseSymbol}/{pool.quoteSymbol}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 text-right text-gray-400 text-xs">
                        {formatLargeNumber(pool.volume24h)}
                      </td>
                      <td className="py-3 text-right text-gray-400 text-xs">
                        {formatLargeNumber(pool.liquidity)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-emerald-400 text-xs">
                            {formatNumber(pool.buys24h)}
                          </span>
                          <span className="text-gray-600 text-xs">/</span>
                          <span className="text-red-400 text-xs">
                            {formatNumber(pool.sells24h)}
                          </span>
                        </div>
                        {/* Buy/sell ratio bar */}
                        <div className="w-full h-1 rounded-full bg-red-500/30 mt-1">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${buyRatio}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
