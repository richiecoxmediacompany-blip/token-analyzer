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
}

function toTime(ts: number): Time {
  return (ts / 1000) as Time;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySeries = any;

export default function PriceChart({ data }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<AnySeries>(null);
  const volumeSeriesRef = useRef<AnySeries>(null);
  const prevDataLenRef = useRef(0);
  const initializedRef = useRef(false);

  // Create chart once
  const initChart = useCallback(() => {
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
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
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
      initializedRef.current = false;
    };
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  // Update data incrementally
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const chart = chartRef.current;
    if (!candleSeries || !volumeSeries || !chart || !data || data.length === 0)
      return;

    const prevLen = prevDataLenRef.current;

    // Full reset if data changed shape (e.g. timeframe switch) or first load
    if (
      !initializedRef.current ||
      prevLen === 0 ||
      data.length < prevLen - 2
    ) {
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
      chart.timeScale().fitContent();
      initializedRef.current = true;
    } else {
      // Incremental update: update changed candles at the end
      // Find how many candles are new/updated (at least the last one)
      const updateCount = Math.max(1, data.length - prevLen + 1);
      const startIdx = Math.max(0, data.length - updateCount);

      for (let i = startIdx; i < data.length; i++) {
        const d = data[i];
        candleSeries.update({
          time: toTime(d.timestamp),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        });
        volumeSeries.update({
          time: toTime(d.timestamp),
          value: d.volume,
          color:
            d.close >= d.open
              ? "rgba(34,197,94,0.25)"
              : "rgba(239,68,68,0.25)",
        });
      }
    }

    prevDataLenRef.current = data.length;
  }, [data]);

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
