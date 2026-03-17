"use client";

import { useEffect, useState } from "react";
import { Crosshair, Loader2, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

interface SuspiciousWallet {
  address: string;
  percentage: number;
  reason: string;
  amount: number;
}

interface SniperAnalysis {
  pairCreatedAt: number | null;
  tokenAge: string;
  suspiciousWallets: SuspiciousWallet[];
  riskLevel: "high" | "medium" | "low";
  totalSuspiciousPercentage: number;
}

interface SniperDetectionProps {
  tokenAddress: string;
}

const riskConfig = {
  high: {
    label: "High Risk",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
    barColor: "bg-red-500",
    dot: "bg-red-400",
  },
  medium: {
    label: "Medium Risk",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
    barColor: "bg-amber-500",
    dot: "bg-amber-400",
  },
  low: {
    label: "Low Risk",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    barColor: "bg-emerald-500",
    dot: "bg-emerald-400",
  },
};

const ageBadgeColor = (age: string): string => {
  if (age.includes("minute") || age.includes("hour")) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }
  if (age.includes("day")) {
    const days = parseInt(age);
    if (!isNaN(days) && days <= 3) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  }
  return "bg-gray-500/10 text-gray-400 border-gray-500/20";
};

export default function SniperDetection({ tokenAddress }: SniperDetectionProps) {
  const [data, setData] = useState<SniperAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/snipers?address=${encodeURIComponent(tokenAddress)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sniper analysis");
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

  if (loading) {
    return (
      <div className="card-3d rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Sniper / Insider Detection
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="ml-3 text-sm text-gray-500">
            Analyzing wallet activity...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-3d rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Sniper / Insider Detection
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {error || "Unable to load sniper analysis."}
        </p>
      </div>
    );
  }

  const rc = riskConfig[data.riskLevel];

  return (
    <div className="card-3d rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${rc.bg} border ${rc.border} flex items-center justify-center shadow-lg ${rc.glow}`}
          >
            <Crosshair className={`w-5 h-5 ${rc.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Sniper / Insider Detection
            </h2>
            <p className={`text-sm font-bold ${rc.text}`}>{rc.label}</p>
          </div>
        </div>

        {/* Token Age Badge */}
        {data.tokenAge !== "Unknown" && (
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${ageBadgeColor(
              data.tokenAge
            )}`}
          >
            {data.tokenAge} old
          </span>
        )}
      </div>

      {/* Total Suspicious Percentage Bar */}
      {data.suspiciousWallets.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Suspicious Holdings
            </span>
            <span className={`text-sm font-bold ${rc.text}`}>
              {data.totalSuspiciousPercentage}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${rc.barColor} shadow-lg`}
              style={{
                width: `${Math.min(data.totalSuspiciousPercentage, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Suspicious Wallets List */}
      {data.suspiciousWallets.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Suspicious Wallets ({data.suspiciousWallets.length})
          </h3>
          {data.suspiciousWallets.map((wallet, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl glass-card border border-white/[0.04]"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  wallet.percentage > 10
                    ? "bg-red-400 shadow-lg shadow-red-400/50"
                    : wallet.percentage > 5
                    ? "bg-amber-400 shadow-lg shadow-amber-400/50"
                    : "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://solscan.io/account/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {shortenAddress(wallet.address, 6)}
                  </a>
                  <ExternalLink className="w-3 h-3 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {wallet.reason}
                </p>
              </div>
              <span
                className={`text-sm font-bold flex-shrink-0 ${
                  wallet.percentage > 10
                    ? "text-red-400"
                    : wallet.percentage > 5
                    ? "text-amber-400"
                    : "text-yellow-400"
                }`}
              >
                {wallet.percentage}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl glass-card border border-emerald-500/10">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              No suspicious activity detected
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              No wallets were flagged based on holder concentration and token
              age analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
