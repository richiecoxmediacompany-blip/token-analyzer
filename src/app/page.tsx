"use client";

import { useCallback } from "react";
import { Shield, Zap, Eye } from "lucide-react";
import TokenSearchBar from "@/components/TokenSearchBar";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import { ProgressBar } from "@/components/LoadingState";
import { useTokenAnalysis } from "@/lib/hooks";

export default function Home() {
  const {
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
  } = useTokenAnalysis();

  const hasResults = !!(
    tokenInfo ||
    holders ||
    liquidity ||
    security ||
    transactions ||
    social
  );

  const handleSearch = useCallback(
    (address: string) => {
      analyze(address);
    },
    [analyze]
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">
              Sol<span className="text-blue-400">Scope</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
            <span>Solana Token Analyzer</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - shown when no results */}
        {!hasResults && !isAnalyzing && (
          <div className="text-center py-16 md:py-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Analyze Any Solana Token
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-12">
              Get comprehensive security analysis, holder distribution,
              liquidity metrics, and risk assessment for any SPL token.
            </p>

            <TokenSearchBar onSearch={handleSearch} isLoading={isAnalyzing} />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
              <FeatureCard
                icon={<Shield className="w-6 h-6 text-green-400" />}
                title="Security Analysis"
                description="Check mint authority, freeze authority, honeypot detection, and contract verification."
              />
              <FeatureCard
                icon={<Eye className="w-6 h-6 text-blue-400" />}
                title="Holder Distribution"
                description="Analyze top holders, concentration risk, and identify known addresses like DEX pools."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-yellow-400" />}
                title="Risk Assessment"
                description="Get an overall risk score with detailed breakdown across 5 key categories."
              />
            </div>
          </div>
        )}

        {/* Search bar - shown when results visible */}
        {(hasResults || isAnalyzing) && (
          <div className="mb-8 no-print">
            <TokenSearchBar onSearch={handleSearch} isLoading={isAnalyzing} />
          </div>
        )}

        {/* Progress bar */}
        {isAnalyzing && <ProgressBar sections={loading} />}

        {/* Results Dashboard */}
        {hasResults && (
          <AnalysisDashboard
            tokenInfo={tokenInfo}
            holders={holders}
            liquidity={liquidity}
            security={security}
            transactions={transactions}
            social={social}
            risk={risk}
            loading={loading}
            errors={errors}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 no-print">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              SolScope - Solana Token Analyzer. Not financial advice. DYOR.
            </p>
            <p>Data from DexScreener, Helius, Birdeye</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left hover:border-gray-700 transition-colors">
      <div className="mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
