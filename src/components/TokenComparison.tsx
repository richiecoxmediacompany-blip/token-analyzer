"use client";

import { useState, type FormEvent } from "react";
import {
  Scale,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Shield,
  Droplets,
  Users,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";
import type {
  TokenInfo,
  HolderAnalysis,
  LiquidityInfo,
  SecurityAnalysis,
} from "@/types";
import {
  formatPrice,
  formatLargeNumber,
  formatNumber,
  formatPercentage,
  isValidSolanaAddress,
  cn,
} from "@/lib/utils";

interface TokenData {
  tokenInfo: TokenInfo | null;
  holders: HolderAnalysis | null;
  liquidity: LiquidityInfo | null;
  security: SecurityAnalysis | null;
}

interface TokenSide {
  address: string;
  data: TokenData;
  loading: boolean;
  error: string | null;
}

const EMPTY_TOKEN_DATA: TokenData = {
  tokenInfo: null,
  holders: null,
  liquidity: null,
  security: null,
};

const QUICK_TOKENS = [
  { label: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { label: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { label: "JUP", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
];

type Winner = "left" | "right" | "tie" | null;

interface MetricRow {
  label: string;
  icon: React.ReactNode;
  leftValue: string;
  rightValue: string;
  winner: Winner;
  leftColor?: string;
  rightColor?: string;
}

async function fetchTokenData(address: string): Promise<TokenData> {
  const [tokenInfoRes, holdersRes, liquidityRes, securityRes] =
    await Promise.allSettled([
      fetch(`/api/token-info?address=${address}`).then((r) => {
        if (!r.ok) throw new Error(`Token info failed (${r.status})`);
        return r.json();
      }),
      fetch(`/api/holders?address=${address}`).then((r) => {
        if (!r.ok) throw new Error(`Holders failed (${r.status})`);
        return r.json();
      }),
      fetch(`/api/liquidity?address=${address}`).then((r) => {
        if (!r.ok) throw new Error(`Liquidity failed (${r.status})`);
        return r.json();
      }),
      fetch(`/api/security?address=${address}`).then((r) => {
        if (!r.ok) throw new Error(`Security failed (${r.status})`);
        return r.json();
      }),
    ]);

  return {
    tokenInfo:
      tokenInfoRes.status === "fulfilled" ? tokenInfoRes.value : null,
    holders: holdersRes.status === "fulfilled" ? holdersRes.value : null,
    liquidity:
      liquidityRes.status === "fulfilled" ? liquidityRes.value : null,
    security:
      securityRes.status === "fulfilled" ? securityRes.value : null,
  };
}

function getConcentrationColor(pct: number): string {
  if (pct < 30) return "text-emerald-400";
  if (pct < 50) return "text-yellow-400";
  return "text-red-400";
}

function getLiqRatioColor(ratio: number): string {
  if (ratio >= 0.1) return "text-emerald-400";
  if (ratio >= 0.03) return "text-yellow-400";
  return "text-red-400";
}

function getSecurityScoreColor(score: number): string {
  if (score >= 7) return "text-emerald-400";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

export default function TokenComparison() {
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  const [left, setLeft] = useState<TokenSide>({
    address: "",
    data: EMPTY_TOKEN_DATA,
    loading: false,
    error: null,
  });

  const [right, setRight] = useState<TokenSide>({
    address: "",
    data: EMPTY_TOKEN_DATA,
    loading: false,
    error: null,
  });

  const fetchSide = async (
    address: string,
    setSide: typeof setLeft,
  ) => {
    setSide((prev) => ({
      ...prev,
      address,
      loading: true,
      error: null,
      data: EMPTY_TOKEN_DATA,
    }));

    try {
      const data = await fetchTokenData(address);
      if (!data.tokenInfo) {
        setSide((prev) => ({
          ...prev,
          loading: false,
          error: "Could not fetch token info. Check the address.",
        }));
        return;
      }
      setSide((prev) => ({ ...prev, data, loading: false }));
    } catch (err) {
      setSide((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  };

  const handleLeftSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = leftInput.trim();
    if (!trimmed) {
      setLeftError("Enter a token address");
      return;
    }
    if (!isValidSolanaAddress(trimmed)) {
      setLeftError("Invalid Solana address");
      return;
    }
    setLeftError(null);
    fetchSide(trimmed, setLeft);
  };

  const handleRightSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = rightInput.trim();
    if (!trimmed) {
      setRightError("Enter a token address");
      return;
    }
    if (!isValidSolanaAddress(trimmed)) {
      setRightError("Invalid Solana address");
      return;
    }
    setRightError(null);
    fetchSide(trimmed, setRight);
  };

  const bothLoaded =
    left.data.tokenInfo !== null && right.data.tokenInfo !== null;

  // Build comparison metrics
  const metrics: MetricRow[] = bothLoaded
    ? buildMetrics(left.data, right.data)
    : [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Token Comparison</h2>
        </div>
        <p className="text-gray-500 text-sm">
          Compare two Solana tokens side by side
        </p>
      </div>

      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Token Input */}
        <div className="card-3d rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
            Token A
          </p>
          <form onSubmit={handleLeftSubmit}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={leftInput}
                  onChange={(e) => {
                    setLeftInput(e.target.value);
                    setLeftError(null);
                  }}
                  placeholder="Token address..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] text-xs font-mono transition-all"
                  disabled={left.loading}
                />
              </div>
              <button
                type="submit"
                disabled={left.loading}
                className="px-4 py-2.5 solana-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-lg shadow-purple-500/20"
              >
                {left.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
          {leftError && (
            <p className="text-red-400 text-xs mt-2">{leftError}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-gray-600 text-[10px]">Quick:</span>
            {QUICK_TOKENS.map((t) => (
              <button
                key={t.address}
                type="button"
                onClick={() => {
                  setLeftInput(t.address);
                  setLeftError(null);
                  fetchSide(t.address, setLeft);
                }}
                disabled={left.loading}
                className="px-2 py-1 glass-card hover:bg-white/[0.06] text-gray-400 hover:text-white text-[10px] rounded-lg transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Left loading/error/loaded state */}
          <TokenSideStatus side={left} />
        </div>

        {/* Right Token Input */}
        <div className="card-3d rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
            Token B
          </p>
          <form onSubmit={handleRightSubmit}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={rightInput}
                  onChange={(e) => {
                    setRightInput(e.target.value);
                    setRightError(null);
                  }}
                  placeholder="Token address..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] text-xs font-mono transition-all"
                  disabled={right.loading}
                />
              </div>
              <button
                type="submit"
                disabled={right.loading}
                className="px-4 py-2.5 solana-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-lg shadow-purple-500/20"
              >
                {right.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </form>
          {rightError && (
            <p className="text-red-400 text-xs mt-2">{rightError}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-gray-600 text-[10px]">Quick:</span>
            {QUICK_TOKENS.map((t) => (
              <button
                key={t.address}
                type="button"
                onClick={() => {
                  setRightInput(t.address);
                  setRightError(null);
                  fetchSide(t.address, setRight);
                }}
                disabled={right.loading}
                className="px-2 py-1 glass-card hover:bg-white/[0.06] text-gray-400 hover:text-white text-[10px] rounded-lg transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
          <TokenSideStatus side={right} />
        </div>
      </div>

      {/* Comparison Table */}
      {bothLoaded && (
        <div className="card-3d rounded-2xl p-6 gradient-border">
          {/* Token Headers */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 mb-6">
            <TokenHeader token={left.data.tokenInfo!} />
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Scale className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  VS
                </span>
              </div>
            </div>
            <div className="md:hidden flex items-center justify-center py-2">
              <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">
                — VS —
              </span>
            </div>
            <TokenHeader token={right.data.tokenInfo!} />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

          {/* Metric Rows */}
          <div className="space-y-0">
            {metrics.map((metric, idx) => (
              <div
                key={metric.label}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 md:gap-4 py-3 px-3 rounded-xl transition-colors",
                  idx % 2 === 0 ? "bg-white/[0.02]" : ""
                )}
              >
                {/* Left Value */}
                <div
                  className={cn(
                    "flex items-center justify-center md:justify-end text-sm font-semibold rounded-lg px-3 py-1.5 transition-all",
                    metric.leftColor || "text-white",
                    metric.winner === "left" &&
                      "bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                  )}
                >
                  {metric.leftValue}
                </div>

                {/* Label */}
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium min-w-[140px] whitespace-nowrap">
                  <span className="text-gray-500">{metric.icon}</span>
                  {metric.label}
                </div>

                {/* Right Value */}
                <div
                  className={cn(
                    "flex items-center justify-center md:justify-start text-sm font-semibold rounded-lg px-3 py-1.5 transition-all",
                    metric.rightColor || "text-white",
                    metric.winner === "right" &&
                      "bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                  )}
                >
                  {metric.rightValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partial loading state */}
      {(left.loading || right.loading) && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-gray-400 text-sm">
            {left.loading && right.loading
              ? "Loading both tokens..."
              : left.loading
                ? "Loading Token A..."
                : "Loading Token B..."}
          </span>
        </div>
      )}
    </div>
  );
}

function TokenSideStatus({ side }: { side: TokenSide }) {
  if (side.loading) {
    return (
      <div className="flex items-center gap-2 mt-3 text-gray-400 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Fetching data...</span>
      </div>
    );
  }

  if (side.error) {
    return (
      <div className="flex items-center gap-2 mt-3 text-red-400 text-xs">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{side.error}</span>
      </div>
    );
  }

  if (side.data.tokenInfo) {
    return (
      <div className="flex items-center gap-2 mt-3">
        {side.data.tokenInfo.logo ? (
          <img
            src={side.data.tokenInfo.logo}
            alt={side.data.tokenInfo.name}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-5 h-5 rounded-full solana-gradient flex items-center justify-center text-[8px] font-bold text-white">
            {side.data.tokenInfo.symbol.charAt(0)}
          </div>
        )}
        <span className="text-white text-xs font-medium">
          {side.data.tokenInfo.name}
        </span>
        <span className="text-gray-500 text-xs">
          ({side.data.tokenInfo.symbol})
        </span>
      </div>
    );
  }

  return null;
}

function TokenHeader({ token }: { token: TokenInfo }) {
  const isPositive = token.priceChange24h >= 0;

  return (
    <div className="flex items-center gap-3">
      {token.logo ? (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-lg" />
          <img
            src={token.logo}
            alt={token.name}
            className="relative w-10 h-10 rounded-xl bg-white/5 ring-2 ring-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl solana-gradient opacity-30 blur-lg" />
          <div className="relative w-10 h-10 rounded-xl solana-gradient flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/10">
            {token.symbol.charAt(0)}
          </div>
        </div>
      )}
      <div>
        <p className="text-white font-bold text-sm">{token.name}</p>
        <p className="text-gray-500 text-xs">{token.symbol}</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-white font-bold text-sm">{formatPrice(token.price)}</p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-semibold",
            isPositive ? "text-emerald-400" : "text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-2.5 h-2.5" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5" />
          )}
          {formatPercentage(token.priceChange24h)}
        </span>
      </div>
    </div>
  );
}

function buildMetrics(leftData: TokenData, rightData: TokenData): MetricRow[] {
  const l = leftData;
  const r = rightData;
  const lt = l.tokenInfo!;
  const rt = r.tokenInfo!;

  const rows: MetricRow[] = [];

  // Helper: determine winner based on higher-is-better or lower-is-better
  function higher(a: number, b: number): Winner {
    if (a > b) return "left";
    if (b > a) return "right";
    return "tie";
  }

  function lower(a: number, b: number): Winner {
    if (a < b) return "left";
    if (b < a) return "right";
    return "tie";
  }

  // Price (informational, no winner)
  rows.push({
    label: "Price",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    leftValue: formatPrice(lt.price),
    rightValue: formatPrice(rt.price),
    winner: null,
  });

  // 24h Change
  const leftChangeColor =
    lt.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400";
  const rightChangeColor =
    rt.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400";
  rows.push({
    label: "24h Change",
    icon: lt.priceChange24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />,
    leftValue: formatPercentage(lt.priceChange24h),
    rightValue: formatPercentage(rt.priceChange24h),
    winner: higher(lt.priceChange24h, rt.priceChange24h),
    leftColor: leftChangeColor,
    rightColor: rightChangeColor,
  });

  // Market Cap
  rows.push({
    label: "Market Cap",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    leftValue: formatLargeNumber(lt.marketCap),
    rightValue: formatLargeNumber(rt.marketCap),
    winner: higher(lt.marketCap, rt.marketCap),
  });

  // Volume 24h
  rows.push({
    label: "Volume 24h",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    leftValue: formatLargeNumber(lt.volume24h),
    rightValue: formatLargeNumber(rt.volume24h),
    winner: higher(lt.volume24h, rt.volume24h),
  });

  // Vol/MCap Ratio
  const leftVolRatio =
    lt.marketCap > 0 ? lt.volume24h / lt.marketCap : 0;
  const rightVolRatio =
    rt.marketCap > 0 ? rt.volume24h / rt.marketCap : 0;
  rows.push({
    label: "Vol/MCap Ratio",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    leftValue:
      lt.marketCap > 0 ? `${(leftVolRatio * 100).toFixed(1)}%` : "N/A",
    rightValue:
      rt.marketCap > 0 ? `${(rightVolRatio * 100).toFixed(1)}%` : "N/A",
    winner: higher(leftVolRatio, rightVolRatio),
  });

  // Total Holders
  if (l.holders && r.holders) {
    rows.push({
      label: "Total Holders",
      icon: <Users className="w-3.5 h-3.5" />,
      leftValue: formatNumber(l.holders.totalHolders),
      rightValue: formatNumber(r.holders.totalHolders),
      winner: higher(l.holders.totalHolders, r.holders.totalHolders),
    });

    // Top 10 Concentration
    rows.push({
      label: "Top 10 Concentration",
      icon: <Users className="w-3.5 h-3.5" />,
      leftValue: `${l.holders.top10Percentage.toFixed(1)}%`,
      rightValue: `${r.holders.top10Percentage.toFixed(1)}%`,
      winner: lower(l.holders.top10Percentage, r.holders.top10Percentage),
      leftColor: getConcentrationColor(l.holders.top10Percentage),
      rightColor: getConcentrationColor(r.holders.top10Percentage),
    });

    // Distribution Score
    rows.push({
      label: "Distribution Score",
      icon: <Users className="w-3.5 h-3.5" />,
      leftValue: `${l.holders.distributionScore.toFixed(1)}/10`,
      rightValue: `${r.holders.distributionScore.toFixed(1)}/10`,
      winner: higher(
        l.holders.distributionScore,
        r.holders.distributionScore
      ),
    });
  }

  // Liquidity
  if (l.liquidity && r.liquidity) {
    rows.push({
      label: "Liquidity (USD)",
      icon: <Droplets className="w-3.5 h-3.5" />,
      leftValue: formatLargeNumber(l.liquidity.totalLiquidityUsd),
      rightValue: formatLargeNumber(r.liquidity.totalLiquidityUsd),
      winner: higher(
        l.liquidity.totalLiquidityUsd,
        r.liquidity.totalLiquidityUsd
      ),
    });

    // Liq/MCap Ratio
    rows.push({
      label: "Liq/MCap Ratio",
      icon: <Droplets className="w-3.5 h-3.5" />,
      leftValue: `${(l.liquidity.liquidityToMcapRatio * 100).toFixed(2)}%`,
      rightValue: `${(r.liquidity.liquidityToMcapRatio * 100).toFixed(2)}%`,
      winner: higher(
        l.liquidity.liquidityToMcapRatio,
        r.liquidity.liquidityToMcapRatio
      ),
      leftColor: getLiqRatioColor(l.liquidity.liquidityToMcapRatio),
      rightColor: getLiqRatioColor(r.liquidity.liquidityToMcapRatio),
    });

    // Lock Status
    const leftLocked = l.liquidity.locked;
    const rightLocked = r.liquidity.locked;
    const leftLockWins =
      leftLocked === true && rightLocked !== true
        ? "left"
        : rightLocked === true && leftLocked !== true
          ? "right"
          : leftLocked === rightLocked
            ? "tie"
            : null;
    rows.push({
      label: "Lock Status",
      icon: leftLocked ? (
        <Lock className="w-3.5 h-3.5" />
      ) : (
        <Unlock className="w-3.5 h-3.5" />
      ),
      leftValue:
        leftLocked === true
          ? "Locked"
          : leftLocked === false
            ? "Unlocked"
            : "Unknown",
      rightValue:
        rightLocked === true
          ? "Locked"
          : rightLocked === false
            ? "Unlocked"
            : "Unknown",
      winner: leftLockWins as Winner,
      leftColor:
        leftLocked === true
          ? "text-emerald-400"
          : leftLocked === false
            ? "text-red-400"
            : "text-gray-400",
      rightColor:
        rightLocked === true
          ? "text-emerald-400"
          : rightLocked === false
            ? "text-red-400"
            : "text-gray-400",
    });
  }

  // Security Score
  if (l.security && r.security) {
    rows.push({
      label: "Security Score",
      icon: <Shield className="w-3.5 h-3.5" />,
      leftValue: `${l.security.overallScore.toFixed(1)}/10`,
      rightValue: `${r.security.overallScore.toFixed(1)}/10`,
      winner: higher(l.security.overallScore, r.security.overallScore),
      leftColor: getSecurityScoreColor(l.security.overallScore),
      rightColor: getSecurityScoreColor(r.security.overallScore),
    });
  }

  return rows;
}
