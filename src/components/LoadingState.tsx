"use client";

export function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-white/[0.03] rounded-lg"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-3d rounded-2xl p-6 animate-pulse">
      <div className="h-5 bg-white/[0.04] rounded-lg w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-white/[0.03] rounded-lg w-3/4" />
        <div className="h-4 bg-white/[0.03] rounded-lg w-1/2" />
        <div className="h-4 bg-white/[0.03] rounded-lg w-2/3" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="card-3d rounded-2xl p-4 animate-pulse">
      <div className="h-3 bg-white/[0.03] rounded-lg w-1/2 mb-2" />
      <div className="h-6 bg-white/[0.03] rounded-lg w-3/4" />
    </div>
  );
}

export function ProgressBar({ sections }: { sections: Record<string, boolean> }) {
  const total = Object.keys(sections).length;
  const done = Object.values(sections).filter((v) => !v).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  if (pct >= 100) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Analyzing token...</span>
        <span className="text-sm text-gray-500 font-mono">{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div
          className="solana-gradient h-1.5 rounded-full transition-all duration-500 shadow-lg shadow-purple-500/20"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(sections).map(([key, isLoading]) => (
          <span
            key={key}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${
              isLoading
                ? "glass-card text-purple-400 border border-purple-500/20"
                : "glass-card text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
