"use client";

import { useMemo, useState } from "react";
import type { PricePoint } from "@/types";

interface PriceChartProps {
  data: PricePoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (!data || data.length === 0) return null;

    const chartWidth = 900;
    const chartHeight = 280;
    const volumeHeight = 60;
    const totalHeight = chartHeight + volumeHeight + 10;
    const padding = { top: 20, bottom: 5, left: 0, right: 0 };

    const allHighs = data.map((d) => d.high);
    const allLows = data.map((d) => d.low);
    const volumes = data.map((d) => d.volume);
    const minPrice = Math.min(...allLows);
    const maxPrice = Math.max(...allHighs);
    const maxVolume = Math.max(...volumes, 1);
    const priceRange = maxPrice - minPrice || maxPrice * 0.01 || 1;

    const candleWidth = (chartWidth / data.length) * 0.7;
    const wickWidth = Math.max(1, candleWidth * 0.15);
    const gap = (chartWidth / data.length) * 0.3;

    const priceToY = (price: number) => {
      return padding.top + (1 - (price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
    };

    // Build close line for overlay
    const closePath = data.map((d, i) => {
      const x = (i / data.length) * chartWidth + (chartWidth / data.length) / 2;
      const y = priceToY(d.close);
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    }).join(" ");

    return {
      chartWidth,
      chartHeight,
      volumeHeight,
      totalHeight,
      minPrice,
      maxPrice,
      maxVolume,
      priceRange,
      candleWidth,
      wickWidth,
      gap,
      priceToY,
      closePath,
    };
  }, [data]);

  if (!data || data.length === 0 || !chart) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-600 bg-white/[0.02] rounded-xl border border-white/5">
        No price data available
      </div>
    );
  }

  const hoveredCandle = hoveredIndex !== null ? data[hoveredIndex] : null;
  const isOverallPositive = data[data.length - 1].close >= data[0].open;

  return (
    <div className="w-full">
      {/* Hover tooltip */}
      <div className="h-6 mb-2 flex items-center gap-4 text-xs">
        {hoveredCandle ? (
          <>
            <span className="text-gray-500">
              {new Date(hoveredCandle.timestamp).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-gray-400">
              O <span className="text-white font-mono">{formatChartPrice(hoveredCandle.open)}</span>
            </span>
            <span className="text-gray-400">
              H <span className="text-emerald-400 font-mono">{formatChartPrice(hoveredCandle.high)}</span>
            </span>
            <span className="text-gray-400">
              L <span className="text-red-400 font-mono">{formatChartPrice(hoveredCandle.low)}</span>
            </span>
            <span className="text-gray-400">
              C <span className={`font-mono ${hoveredCandle.close >= hoveredCandle.open ? "text-emerald-400" : "text-red-400"}`}>
                {formatChartPrice(hoveredCandle.close)}
              </span>
            </span>
            <span className="text-gray-400">
              Vol <span className="text-blue-400 font-mono">{formatVolume(hoveredCandle.volume)}</span>
            </span>
          </>
        ) : (
          <span className="text-gray-600">Hover over chart for details</span>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-xl bg-[#08081a] border border-white/5">
        <svg
          viewBox={`0 0 ${chart.chartWidth} ${chart.totalHeight}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="candleGradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="candleGradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Background area fill under close line */}
          <path
            d={`${chart.closePath} L ${chart.chartWidth},${chart.chartHeight} L 0,${chart.chartHeight} Z`}
            fill={isOverallPositive ? "url(#candleGradientGreen)" : "url(#candleGradientRed)"}
          />

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct) => {
            const y = chart.priceToY(chart.minPrice + chart.priceRange * pct);
            const price = chart.minPrice + chart.priceRange * pct;
            return (
              <g key={pct}>
                <line
                  x1="0"
                  y1={y}
                  x2={chart.chartWidth}
                  y2={y}
                  stroke="white"
                  strokeOpacity="0.04"
                  strokeWidth="1"
                />
                <text
                  x={chart.chartWidth - 5}
                  y={y - 4}
                  fill="white"
                  fillOpacity="0.2"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatChartPrice(price)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {data.map((d, i) => {
            const isGreen = d.close >= d.open;
            const x = (i / data.length) * chart.chartWidth;
            const centerX = x + (chart.chartWidth / data.length) / 2;
            const candleX = centerX - chart.candleWidth / 2;

            const bodyTop = chart.priceToY(Math.max(d.open, d.close));
            const bodyBottom = chart.priceToY(Math.min(d.open, d.close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

            const wickTop = chart.priceToY(d.high);
            const wickBottom = chart.priceToY(d.low);

            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={centerX}
                  y1={wickTop}
                  x2={centerX}
                  y2={wickBottom}
                  stroke={isGreen ? "#22c55e" : "#ef4444"}
                  strokeWidth={chart.wickWidth}
                  strokeOpacity={isHovered ? 1 : 0.7}
                />
                {/* Candle body */}
                <rect
                  x={candleX}
                  y={bodyTop}
                  width={chart.candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? "#22c55e" : "#ef4444"}
                  fillOpacity={isHovered ? 1 : 0.85}
                  rx={Math.min(1.5, chart.candleWidth / 4)}
                />
                {/* Hover zone (invisible, wider) */}
                <rect
                  x={x}
                  y={0}
                  width={chart.chartWidth / data.length}
                  height={chart.totalHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hoveredIndex !== null && (
            <line
              x1={(hoveredIndex / data.length) * chart.chartWidth + (chart.chartWidth / data.length) / 2}
              y1={0}
              x2={(hoveredIndex / data.length) * chart.chartWidth + (chart.chartWidth / data.length) / 2}
              y2={chart.chartHeight}
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* Volume bars */}
          {data.map((d, i) => {
            const x = (i / data.length) * chart.chartWidth;
            const barWidth = (chart.chartWidth / data.length) * 0.7;
            const centerX = x + (chart.chartWidth / data.length) / 2;
            const barX = centerX - barWidth / 2;
            const barHeight = Math.max((d.volume / chart.maxVolume) * chart.volumeHeight, 1);
            const isGreen = d.close >= d.open;

            return (
              <rect
                key={`v${i}`}
                x={barX}
                y={chart.chartHeight + 10 + (chart.volumeHeight - barHeight)}
                width={barWidth}
                height={barHeight}
                fill={isGreen ? "#22c55e" : "#ef4444"}
                fillOpacity={hoveredIndex === i ? 0.5 : 0.2}
                rx={1}
              />
            );
          })}
        </svg>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-gray-600 mt-2 px-1 font-mono">
        <span>
          {new Date(data[0].timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>
          {new Date(data[Math.floor(data.length / 2)].timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>
          {new Date(data[data.length - 1].timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function formatChartPrice(price: number): string {
  if (price === 0) return "$0";
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toPrecision(4)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(0)}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(0);
}
