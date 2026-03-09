"use client";

import type { PricePoint } from "@/types";

interface PriceChartProps {
  data: PricePoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-800/30 rounded-lg">
        No price data available
      </div>
    );
  }

  // Calculate chart bounds
  const prices = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const maxVolume = Math.max(...volumes, 1);
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = 800;
  const chartHeight = 200;
  const volumeHeight = 50;
  const totalHeight = chartHeight + volumeHeight;

  // Determine if price went up or down overall
  const isPositive = prices[prices.length - 1] >= prices[0];

  // Build SVG path for price line
  const pricePoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.close - minPrice) / priceRange) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const linePath = `M ${pricePoints.join(" L ")}`;
  const areaPath = `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${chartWidth} ${totalHeight}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isPositive ? "#22c55e" : "#ef4444"}
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? "#22c55e" : "#ef4444"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={10 + (chartHeight - 20) * pct}
            x2={chartWidth}
            y2={10 + (chartHeight - 20) * pct}
            stroke="#374151"
            strokeWidth="0.5"
            strokeDasharray="4"
          />
        ))}

        {/* Price area fill */}
        <path d={areaPath} fill="url(#priceGradient)" />

        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke={isPositive ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
        />

        {/* Volume bars */}
        {data.map((d, i) => {
          const x = (i / data.length) * chartWidth;
          const barWidth = chartWidth / data.length;
          const barHeight = (d.volume / maxVolume) * volumeHeight;
          return (
            <rect
              key={i}
              x={x}
              y={chartHeight + (volumeHeight - barHeight)}
              width={Math.max(barWidth - 1, 1)}
              height={barHeight}
              fill={d.close >= d.open ? "#22c55e40" : "#ef444440"}
            />
          );
        })}
      </svg>

      {/* Price labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>
          {new Date(data[0].timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>
          {new Date(data[data.length - 1].timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
