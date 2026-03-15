"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle, PieChart } from "lucide-react";
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
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Holder Distribution</h2>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Holders</p>
          <p className="text-lg font-bold text-white">
            ~{formatNumber(holders.totalHolders)}
          </p>
        </div>
        <div className={`bg-white/[0.03] rounded-xl p-3 border ${
          holders.concentration === "high" ? "border-red-500/20" :
          holders.concentration === "medium" ? "border-amber-500/20" : "border-emerald-500/20"
        }`}>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top 10 Hold</p>
          <p className={`text-lg font-bold ${concentrationColor}`}>
            {holders.top10Percentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Top 100 Hold</p>
          <p className="text-lg font-bold text-white">
            {holders.top100Percentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Score</p>
          <p className={`text-lg font-bold ${concentrationColor}`}>
            {holders.distributionScore}/10
          </p>
        </div>
      </div>

      {/* Concentration warning */}
      {holders.concentration === "high" && (
        <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300/80">
            Highly Concentrated - Top 10 holders own more than 50% of supply
          </p>
        </div>
      )}

      {/* Donut chart */}
      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="14" />
            <circle
              cx="50" cy="50" r="38" fill="none"
              stroke={holders.concentration === "high" ? "#ef4444" : holders.concentration === "medium" ? "#f59e0b" : "#22c55e"}
              strokeWidth="14"
              strokeDasharray={`${holders.top10Percentage * 2.39} ${239 - holders.top10Percentage * 2.39}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${concentrationColor}`}>
              {holders.top10Percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              holders.concentration === "high" ? "bg-red-500" : holders.concentration === "medium" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <span className="text-sm text-gray-400">
              Top 10 ({holders.top10Percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
            <span className="text-sm text-gray-400">
              Others ({(100 - holders.top10Percentage).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Holders table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600 text-[10px] uppercase tracking-wider border-b border-white/5">
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
    <tr className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${isWhale ? "bg-red-500/[0.03]" : ""}`}>
      <td className="py-3 pr-2 text-gray-600">{index}</td>
      <td className="py-3">
        <div className="flex items-center gap-1">
          <a
            href={`https://solscan.io/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-400 hover:text-blue-300 text-xs"
          >
            {shortenAddress(address)}
          </a>
          <button onClick={copy} className="text-gray-700 hover:text-white">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          {isWhale && <AlertTriangle className="w-3 h-3 text-red-400" />}
        </div>
      </td>
      <td className="py-3">
        {label && (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded-md font-medium">
            {label}
          </span>
        )}
      </td>
      <td className="py-3 text-right text-gray-400 font-mono text-xs">
        {formatNumber(Math.round(amount))}
      </td>
      <td className="py-3 text-right text-gray-400">
        ${formatNumber(Math.round(usdValue))}
      </td>
      <td className={`py-3 text-right font-semibold ${isWhale ? "text-red-400" : "text-gray-300"}`}>
        {percentage.toFixed(2)}%
      </td>
    </tr>
  );
}
