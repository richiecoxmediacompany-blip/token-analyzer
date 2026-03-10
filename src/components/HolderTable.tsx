"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import type { HolderAnalysis } from "@/types";
import { shortenAddress, formatNumber } from "@/lib/utils";

interface HolderTableProps {
  holders: HolderAnalysis;
  tokenPrice: number;
}

export default function HolderTable({ holders, tokenPrice }: HolderTableProps) {
  const concentrationColor =
    holders.concentration === "high"
      ? "text-red-400"
      : holders.concentration === "medium"
      ? "text-yellow-400"
      : "text-green-400";

  const concentrationBg =
    holders.concentration === "high"
      ? "bg-red-900/20 border-red-800"
      : holders.concentration === "medium"
      ? "bg-yellow-900/20 border-yellow-800"
      : "bg-green-900/20 border-green-800";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">
        Holder Distribution
      </h2>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Holders</p>
          <p className="text-lg font-semibold text-white">
            ~{formatNumber(holders.totalHolders)}
          </p>
        </div>
        <div className={`rounded-lg p-3 border ${concentrationBg}`}>
          <p className="text-xs text-gray-500">Top 10 Hold</p>
          <p className={`text-lg font-semibold ${concentrationColor}`}>
            {holders.top10Percentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Top 100 Hold</p>
          <p className="text-lg font-semibold text-white">
            {holders.top100Percentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Distribution Score</p>
          <p className={`text-lg font-semibold ${concentrationColor}`}>
            {holders.distributionScore}/10
          </p>
        </div>
      </div>

      {/* Concentration warning */}
      {holders.concentration === "high" && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            Highly Concentrated Risk - Top 10 holders own more than 50% of supply
          </p>
        </div>
      )}

      {/* Pie chart visualization */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1f2937"
              strokeWidth="20"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={
                holders.concentration === "high"
                  ? "#ef4444"
                  : holders.concentration === "medium"
                  ? "#eab308"
                  : "#22c55e"
              }
              strokeWidth="20"
              strokeDasharray={`${holders.top10Percentage * 2.51} ${251 - holders.top10Percentage * 2.51}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {holders.top10Percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                holders.concentration === "high"
                  ? "bg-red-500"
                  : holders.concentration === "medium"
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            />
            <span className="text-sm text-gray-300">
              Top 10 Holders ({holders.top10Percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-700" />
            <span className="text-sm text-gray-300">
              Other Holders ({(100 - holders.top10Percentage).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Holders table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-800">
              <th className="text-left py-3 pr-2">#</th>
              <th className="text-left py-3">Address</th>
              <th className="text-left py-3">Label</th>
              <th className="text-right py-3">Amount</th>
              <th className="text-right py-3">USD Value</th>
              <th className="text-right py-3">% Supply</th>
            </tr>
          </thead>
          <tbody>
            {holders.holders.map((holder, i) => (
              <HolderRow
                key={holder.address}
                index={i + 1}
                address={holder.address}
                amount={holder.amount}
                usdValue={holder.amount * tokenPrice}
                percentage={holder.percentage}
                label={holder.label}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HolderRow({
  index,
  address,
  amount,
  usdValue,
  percentage,
  label,
}: {
  index: number;
  address: string;
  amount: number;
  usdValue: number;
  percentage: number;
  label: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWhale = percentage > 10;

  return (
    <tr className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${isWhale ? "bg-red-900/10" : ""}`}>
      <td className="py-3 pr-2 text-gray-500">{index}</td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <a
            href={`https://solscan.io/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-400 hover:text-blue-300"
          >
            {shortenAddress(address)}
          </a>
          <button onClick={copy} className="text-gray-600 hover:text-white">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {isWhale && <AlertTriangle className="w-3 h-3 text-red-400" />}
        </div>
      </td>
      <td className="py-3">
        {label && (
          <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">
            {label}
          </span>
        )}
      </td>
      <td className="py-3 text-right text-gray-300 font-mono text-xs">
        {formatNumber(Math.round(amount))}
      </td>
      <td className="py-3 text-right text-gray-300">
        ${formatNumber(Math.round(usdValue))}
      </td>
      <td className={`py-3 text-right font-semibold ${isWhale ? "text-red-400" : "text-gray-300"}`}>
        {percentage.toFixed(2)}%
      </td>
    </tr>
  );
}
