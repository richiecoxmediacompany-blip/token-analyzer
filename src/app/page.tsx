"use client";

import { useCallback } from "react";
import { Shield, Zap, Eye, Activity, Search as SearchIcon } from "lucide-react";
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
    currentAddress,
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
    <div className="min-h-screen bg-[#060611]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Sol<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Scope</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-400">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {!hasResults && !isAnalyzing && (
          <div className="text-center py-16 md:py-24 relative">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 text-sm text-gray-400">
                <Activity className="w-4 h-4 text-cyan-400" />
                Real-time Solana Token Analysis
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                Analyze Any{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Solana Token
                </span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto mb-12">
                Security analysis, holder distribution, liquidity metrics,
                and risk assessment with real-time OHLCV charts.
              </p>

              <TokenSearchBar onSearch={handleSearch} isLoading={isAnalyzing} />

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl mx-auto">
                <FeatureCard
                  icon={<Shield className="w-5 h-5" />}
                  color="emerald"
                  title="Security Analysis"
                  description="Mint authority, freeze authority, honeypot detection, contract verification."
                />
                <FeatureCard
                  icon={<Eye className="w-5 h-5" />}
                  color="blue"
                  title="Holder Distribution"
                  description="Top holders, concentration risk, whale detection, known address labels."
                />
                <FeatureCard
                  icon={<Zap className="w-5 h-5" />}
                  color="amber"
                  title="Risk Assessment"
                  description="Overall risk score with detailed breakdown across 5 key categories."
                />
              </div>
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
            tokenAddress={currentAddress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 no-print">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p>SolScope - Not financial advice. DYOR.</p>
            <p>Data from DexScreener, GeckoTerminal, Helius</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: "emerald" | "blue" | "amber";
  title: string;
  description: string;
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/0 border-emerald-500/20 text-emerald-400",
    blue: "from-blue-500/20 to-blue-500/0 border-blue-500/20 text-blue-400",
    amber: "from-amber-500/20 to-amber-500/0 border-amber-500/20 text-amber-400",
  };

  const iconColors = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className={`bg-gradient-to-b ${colors[color]} border rounded-2xl p-6 text-left hover:scale-[1.02] transition-transform`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${iconColors[color]}`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
