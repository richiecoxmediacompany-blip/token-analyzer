"use client";

import { useState, useCallback } from "react";
import type {
  TokenInfo,
  HolderAnalysis,
  LiquidityInfo,
  SecurityAnalysis,
  TransactionMetrics,
  SocialSignals,
  RiskAssessment,
  RiskFlag,
} from "@/types";
import { calculateRiskScore, getRiskLevel } from "@/lib/utils";

interface AnalysisResult {
  tokenInfo: TokenInfo | null;
  holders: HolderAnalysis | null;
  liquidity: LiquidityInfo | null;
  security: SecurityAnalysis | null;
  transactions: TransactionMetrics | null;
  social: SocialSignals | null;
  risk: RiskAssessment | null;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  analyze: (address: string) => Promise<void>;
  isAnalyzing: boolean;
}

async function fetchSection<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useTokenAnalysis(): AnalysisResult {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [holders, setHolders] = useState<HolderAnalysis | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityInfo | null>(null);
  const [security, setSecurity] = useState<SecurityAnalysis | null>(null);
  const [transactions, setTransactions] = useState<TransactionMetrics | null>(null);
  const [social, setSocial] = useState<SocialSignals | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [loading, setLoading] = useState<Record<string, boolean>>({
    tokenInfo: false,
    holders: false,
    liquidity: false,
    security: false,
    transactions: false,
    social: false,
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({
    tokenInfo: null,
    holders: null,
    liquidity: null,
    security: null,
    transactions: null,
    social: null,
  });

  const setLoadingKey = (key: string, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));
  const setErrorKey = (key: string, value: string | null) =>
    setErrors((prev) => ({ ...prev, [key]: value }));

  const analyze = useCallback(async (address: string) => {
    // Reset state
    setTokenInfo(null);
    setHolders(null);
    setLiquidity(null);
    setSecurity(null);
    setTransactions(null);
    setSocial(null);
    setRisk(null);
    setIsAnalyzing(true);
    setLoading({
      tokenInfo: true,
      holders: true,
      liquidity: true,
      security: true,
      transactions: true,
      social: true,
    });
    setErrors({
      tokenInfo: null,
      holders: null,
      liquidity: null,
      security: null,
      transactions: null,
      social: null,
    });

    const q = `address=${encodeURIComponent(address)}`;

    // Fetch all sections in parallel, update state as each resolves
    const fetchAndSet = async <T>(
      key: string,
      url: string,
      setter: (data: T) => void
    ): Promise<T | null> => {
      try {
        setLoadingKey(key, true);
        const data = await fetchSection<T>(url);
        setter(data);
        return data;
      } catch (err) {
        setErrorKey(key, err instanceof Error ? err.message : "Failed to fetch");
        return null;
      } finally {
        setLoadingKey(key, false);
      }
    };

    const results = await Promise.all([
      fetchAndSet<TokenInfo>("tokenInfo", `/api/token-info?${q}`, setTokenInfo),
      fetchAndSet<HolderAnalysis>("holders", `/api/holders?${q}`, setHolders),
      fetchAndSet<LiquidityInfo>("liquidity", `/api/liquidity?${q}`, setLiquidity),
      fetchAndSet<SecurityAnalysis>("security", `/api/security?${q}`, setSecurity),
      fetchAndSet<TransactionMetrics>("transactions", `/api/transactions?${q}`, setTransactions),
      fetchAndSet<SocialSignals>("social", `/api/social?${q}`, setSocial),
    ]);

    const [ti, ho, liq, sec, tx, soc] = results;

    // Calculate risk score
    const riskAssessment = computeRisk(ti, ho, liq, sec, soc);
    setRisk(riskAssessment);
    setIsAnalyzing(false);
  }, []);

  return {
    tokenInfo,
    holders,
    liquidity,
    security,
    transactions,
    social,
    risk,
    loading,
    errors,
    analyze,
    isAnalyzing,
  };
}

function computeRisk(
  tokenInfo: TokenInfo | null,
  holders: HolderAnalysis | null,
  liquidity: LiquidityInfo | null,
  security: SecurityAnalysis | null,
  social: SocialSignals | null
): RiskAssessment {
  const flags: RiskFlag[] = [];

  // Holder concentration score (1-10)
  let holderScore = 5;
  if (holders) {
    holderScore = holders.distributionScore;
    if (holders.top10Percentage > 50) {
      flags.push({
        message: `Top 10 holders own ${holders.top10Percentage.toFixed(1)}% of supply (Highly Concentrated)`,
        severity: "critical",
        icon: "red",
      });
    } else if (holders.top10Percentage > 30) {
      flags.push({
        message: `Top 10 holders own ${holders.top10Percentage.toFixed(1)}% of supply (Moderate Concentration)`,
        severity: "medium",
        icon: "yellow",
      });
    }
    // Check for whale
    const topHolder = holders.holders[0];
    if (topHolder && topHolder.percentage > 10) {
      flags.push({
        message: `Single holder owns ${topHolder.percentage.toFixed(1)}% of supply`,
        severity: "high",
        icon: "red",
      });
    }
  }

  // Liquidity score (1-10)
  let liquidityScore = 5;
  if (liquidity) {
    if (liquidity.locked === false) {
      liquidityScore = 2;
      flags.push({
        message: "Liquidity is not locked - High rug risk",
        severity: "high",
        icon: "red",
      });
    } else if (liquidity.locked === true) {
      liquidityScore = 8;
    }
    if (liquidity.liquidityToMcapRatio < 5) {
      liquidityScore = Math.min(liquidityScore, 4);
      flags.push({
        message: `Low liquidity to market cap ratio (${liquidity.liquidityToMcapRatio.toFixed(1)}%)`,
        severity: "medium",
        icon: "yellow",
      });
    } else if (liquidity.liquidityToMcapRatio >= 10) {
      liquidityScore = Math.max(liquidityScore, 7);
    }
    if (liquidity.totalLiquidityUsd < 10000) {
      flags.push({
        message: `Very low liquidity ($${liquidity.totalLiquidityUsd.toFixed(0)})`,
        severity: "high",
        icon: "red",
      });
      liquidityScore = Math.min(liquidityScore, 3);
    }
  }

  // Security score
  let securityScore = 5;
  if (security) {
    securityScore = security.overallScore;
    for (const check of security.checks) {
      if (!check.passed && check.severity === "critical") {
        flags.push({
          message: check.description,
          severity: "critical",
          icon: "red",
        });
      } else if (!check.passed && check.severity === "warning") {
        flags.push({
          message: check.description,
          severity: "medium",
          icon: "yellow",
        });
      }
    }
  }

  // Social score
  let socialScore = 5;
  if (social) {
    socialScore = social.sentimentScore;
    if (!social.website && !social.twitter) {
      flags.push({
        message: "No website or social media presence detected",
        severity: "medium",
        icon: "yellow",
      });
      socialScore = Math.min(socialScore, 3);
    }
  }

  // Developer score (default without detailed data)
  const developerScore = 5;

  const overallScore = calculateRiskScore(
    holderScore,
    liquidityScore,
    securityScore,
    socialScore,
    developerScore
  );

  const level = getRiskLevel(overallScore);

  return {
    overallScore,
    level,
    breakdown: {
      holderConcentration: { score: holderScore, weight: 0.3 },
      liquidityLocked: { score: liquidityScore, weight: 0.25 },
      contractSecurity: { score: securityScore, weight: 0.2 },
      socialActivity: { score: socialScore, weight: 0.15 },
      developerBehavior: { score: developerScore, weight: 0.1 },
    },
    flags,
  };
}
