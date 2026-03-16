"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import type { IChartApi, Time } from "lightweight-charts";
import type { PricePoint } from "@/types";

interface PriceChartProps {
  data: PricePoint[];
  livePrice?: number | null;
  liveTick?: number; // Incrementing counter to force updates
}

function toTime(ts: number): Time {
  return (ts / 1000) as Time;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySeries = any;

/** Returns the number of decimal places needed to show meaningful digits for a price */
function getPrecision(price: number): number {
  if (price <= 0) return 2;
  if (price >= 1) return 2;
  if (price >= 0.01) return 4;
  // For very small prices, count leading zeros after decimal then add 4 significant digits
  const str = price.toFixed(20);
  const match = str.match(/^0\.0*/);
  if (!match) return 4;
  const leadingZeros = match[0].length - 2; // subtract "0."
  return leadingZeros + 4;
}

/** Format a price with appropriate precision for display */
function formatPrice(price: number): string {
  if (price <= 0) return "0";
  const precision = getPrecision(price);
  return price.toFixed(precision);
}

export default function PriceChart({ data, livePrice, liveTick }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<AnySeries>(null);
  const volumeSeriesRef = useRef<AnySeries>(null);
  const fittedRef = useRef(false);
  const lastDataIdRef = useRef("");

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(147, 51, 234, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#7c3aed",
        },
        horzLine: {
          color: "rgba(147, 51, 234, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#7c3aed",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
      localization: {
        priceFormatter: formatPrice,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "custom",
        formatter: formatPrice,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // Set full candle data when dataset changes
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const chart = chartRef.current;
    if (!candleSeries || !volumeSeries || !chart || !data || data.length === 0)
      return;

    const dataId = `${data.length}:${data[0]?.timestamp}:${data[data.length - 1]?.timestamp}`;
    const isNewDataset = dataId !== lastDataIdRef.current;
    lastDataIdRef.current = dataId;

    const candleData = data.map((d) => ({
      time: toTime(d.timestamp),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d) => ({
      time: toTime(d.timestamp),
      value: d.volume,
      color:
        d.close >= d.open
          ? "rgba(34,197,94,0.25)"
          : "rgba(239,68,68,0.25)",
    }));

    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    if (!fittedRef.current || isNewDataset) {
      chart.timeScale().fitContent();
      fittedRef.current = true;
    }
  }, [data]);

  // Live price tick - update the current candle in real-time
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries || !livePrice || livePrice <= 0 || !data || data.length === 0)
      return;

    const last = data[data.length - 1];
    const now = Math.floor(Date.now() / 1000);
    const lastCandleTime = Math.floor(last.timestamp / 1000);

    // If the last candle is more than 2 minutes old, create a new candle at current time
    // rounded down to the nearest minute
    const currentMinute = Math.floor(now / 60) * 60;
    const candleAge = now - lastCandleTime;

    if (candleAge > 120) {
      // Create a new candle at the current minute
      candleSeries.update({
        time: currentMinute as Time,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
      });
    } else {
      // Update the existing last candle
      candleSeries.update({
        time: toTime(last.timestamp),
        open: last.open,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
        close: livePrice,
      });
    }
  }, [livePrice, liveTick]); // liveTick forces re-run even if price is same

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-600 glass-card rounded-2xl">
        No price data available
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-[#06061a] border border-white/5 shadow-xl shadow-black/30">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
