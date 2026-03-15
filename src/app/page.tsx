"use client";

import { useCallback } from "react";
import { Shield, Zap, Eye, BarChart3, Search } from "lucide-react";
import TokenSearchBar from "@/components/TokenSearchBar";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import { ProgressBar } from "@/components/LoadingState";
import { useTokenAnalysis } from "@/lib/hooks";
import { SolanaLogo, SolanaLogoMark } from "@/components/SolanaLogo";

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
    <div className="min-h-screen bg-[#050510] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-teal-500/[0.03] blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-50 no-print">
        <div className="glass-card border-t-0 border-x-0 rounded-none">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SolanaLogoMark className="w-9 h-9" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Sol<span className="solana-text">Scope</span>
                </h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Token Analyzer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
                <SolanaLogo className="w-3.5 h-3.5" />
                <span className="text-xs text-gray-400">Solana</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {!hasResults && !isAnalyzing && (
          <div className="text-center py-12 md:py-20 relative">
            {/* Hero glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative">
              {/* Floating Solana logo */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 solana-gradient rounded-3xl opacity-20 blur-2xl scale-150 animate-pulse" />
                  <div className="relative w-20 h-20 solana-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20">
                    <SolanaLogo className="w-12 h-12" />
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6 text-sm text-gray-400">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Real-time Token Intelligence
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
                Analyze Any{" "}
                <span className="solana-text">
                  Solana Token
                </span>
              </h2>
              <p className="text-gray-500 text-lg max-w-lg mx-auto mb-12">
                Live charts, security analysis, holder distribution,
                and risk assessment powered by on-chain data.
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
                  color="purple"
                  title="Holder Intelligence"
                  description="Top holders, concentration risk, whale detection, known address labels."
                />
                <FeatureCard
                  icon={<Zap className="w-5 h-5" />}
                  color="blue"
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
      <footer className="relative z-10 border-t border-white/5 mt-16 no-print">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <SolanaLogo className="w-4 h-4" />
              <p>SolScope - Not financial advice. DYOR.</p>
            </div>
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
  color: "emerald" | "purple" | "blue";
  title: string;
  description: string;
}) {
  const iconColors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
  };

  return (
    <div className="card-3d rounded-2xl p-6 text-left glass-card-hover">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border shadow-lg ${iconColors[color]}`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
