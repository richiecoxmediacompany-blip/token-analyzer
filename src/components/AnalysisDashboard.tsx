"use client";

import type {
  TokenInfo,
  HolderAnalysis,
  LiquidityInfo,
  SecurityAnalysis,
  TransactionMetrics,
  SocialSignals as SocialSignalsType,
  RiskAssessment,
} from "@/types";

import TokenOverview from "./TokenOverview";
import RiskBadge from "./RiskBadge";
import HolderTable from "./HolderTable";
import LiquidityCard from "./LiquidityCard";
import SecurityChecklist from "./SecurityChecklist";
import TradingMetrics from "./TradingMetrics";
import SocialSignals from "./SocialSignals";
import SniperDetection from "./SniperDetection";
import DexBreakdown from "./DexBreakdown";
import { CardSkeleton } from "./LoadingState";

interface AnalysisDashboardProps {
  tokenInfo: TokenInfo | null;
  holders: HolderAnalysis | null;
  liquidity: LiquidityInfo | null;
  security: SecurityAnalysis | null;
  transactions: TransactionMetrics | null;
  social: SocialSignalsType | null;
  risk: RiskAssessment | null;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  tokenAddress: string | null;
}

export default function AnalysisDashboard({
  tokenInfo,
  holders,
  liquidity,
  security,
  transactions,
  social,
  risk,
  loading,
  errors,
  tokenAddress,
}: AnalysisDashboardProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Risk Assessment */}
      {risk ? (
        <RiskBadge risk={risk} />
      ) : (
        Object.values(loading).some(Boolean) && <CardSkeleton />
      )}

      {/* Token Overview */}
      <Section loading={loading.tokenInfo} error={errors.tokenInfo}>
        {tokenInfo && <TokenOverview token={tokenInfo} />}
      </Section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section loading={loading.security} error={errors.security}>
          {security && <SecurityChecklist security={security} />}
        </Section>
        <Section loading={loading.liquidity} error={errors.liquidity}>
          {liquidity && <LiquidityCard liquidity={liquidity} />}
        </Section>
      </div>

      {/* Trading Metrics - Full width */}
      <Section loading={loading.transactions} error={errors.transactions}>
        {transactions && tokenAddress && (
          <TradingMetrics metrics={transactions} tokenAddress={tokenAddress} />
        )}
      </Section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section loading={loading.holders} error={errors.holders}>
          {holders && <HolderTable holders={holders} tokenPrice={tokenInfo?.price ?? 0} />}
        </Section>
        <Section loading={loading.social} error={errors.social}>
          {social && <SocialSignals social={social} />}
        </Section>
      </div>

      {/* Sniper Detection & DEX Breakdown */}
      {tokenAddress && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SniperDetection tokenAddress={tokenAddress} />
          <DexBreakdown tokenAddress={tokenAddress} />
        </div>
      )}
    </div>
  );
}

function Section({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}) {
  if (loading) return <CardSkeleton />;

  if (error) {
    return (
      <div className="card-3d rounded-2xl p-6 border-red-500/20">
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
