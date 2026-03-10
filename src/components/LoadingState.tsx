"use client";

export function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-800 rounded"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-gray-800 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
      <div className="h-6 bg-gray-800 rounded w-3/4" />
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
        <span className="text-sm text-gray-400">Fetching data...</span>
        <span className="text-sm text-gray-400">{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(sections).map(([key, isLoading]) => (
          <span
            key={key}
            className={`text-xs px-2 py-1 rounded ${
              isLoading
                ? "bg-blue-900/50 text-blue-400"
                : "bg-green-900/50 text-green-400"
            }`}
          >
            {isLoading ? "Loading" : "Done"}: {key}
          </span>
        ))}
      </div>
    </div>
  );
}
