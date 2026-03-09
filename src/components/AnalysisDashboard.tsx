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
  onTimeframeChange?: (timeframe: string) => void;
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
  onTimeframeChange,
}: AnalysisDashboardProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Risk Assessment - Most prominent */}
      {risk ? (
        <RiskBadge risk={risk} />
      ) : (
        Object.values(loading).some(Boolean) && <CardSkeleton />
      )}

      {/* Token Overview */}
      <Section loading={loading.tokenInfo} error={errors.tokenInfo}>
        {tokenInfo && <TokenOverview token={tokenInfo} />}
      </Section>

      {/* Two column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security */}
        <Section loading={loading.security} error={errors.security}>
          {security && <SecurityChecklist security={security} />}
        </Section>

        {/* Liquidity */}
        <Section loading={loading.liquidity} error={errors.liquidity}>
          {liquidity && <LiquidityCard liquidity={liquidity} />}
        </Section>
      </div>

      {/* Trading Metrics - Full width */}
      <Section loading={loading.transactions} error={errors.transactions}>
        {transactions && tokenInfo && (
          <TradingMetrics
            metrics={transactions}
            tokenAddress={tokenInfo.address}
            onTimeframeChange={onTimeframeChange}
          />
        )}
      </Section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holders */}
        <Section loading={loading.holders} error={errors.holders}>
          {holders && (
            <HolderTable
              holders={holders}
              tokenPrice={tokenInfo?.price ?? 0}
            />
          )}
        </Section>

        {/* Social */}
        <Section loading={loading.social} error={errors.social}>
          {social && <SocialSignals social={social} />}
        </Section>
      </div>
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
      <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
