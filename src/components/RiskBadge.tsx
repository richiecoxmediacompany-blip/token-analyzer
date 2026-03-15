"use client";

import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import type { RiskAssessment } from "@/types";

interface RiskBadgeProps {
  risk: RiskAssessment;
}

export default function RiskBadge({ risk }: RiskBadgeProps) {
  const Icon =
    risk.level === "high"
      ? AlertTriangle
      : risk.level === "medium"
      ? Shield
      : CheckCircle;

  const levelLabel =
    risk.level === "high"
      ? "High Risk"
      : risk.level === "medium"
      ? "Medium Risk"
      : "Low Risk";

  const levelColors = {
    high: {
      border: "border-red-500/20",
      bg: "from-red-500/10 to-transparent",
      text: "text-red-400",
      glow: "shadow-red-500/10",
      scoreBg: "bg-red-500/10",
    },
    medium: {
      border: "border-amber-500/20",
      bg: "from-amber-500/10 to-transparent",
      text: "text-amber-400",
      glow: "shadow-amber-500/10",
      scoreBg: "bg-amber-500/10",
    },
    low: {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/10 to-transparent",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/10",
      scoreBg: "bg-emerald-500/10",
    },
  };

  const c = levelColors[risk.level];

  return (
    <div className={`rounded-2xl border ${c.border} bg-gradient-to-b ${c.bg} bg-[#0d0d20] p-6 shadow-lg ${c.glow}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${c.scoreBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${c.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Risk Assessment</h2>
            <p className={`text-sm font-semibold ${c.text}`}>{levelLabel}</p>
          </div>
        </div>
        <div className={`${c.scoreBg} rounded-2xl px-5 py-3`}>
          <span className={`text-4xl font-black ${c.text}`}>
            {risk.overallScore.toFixed(1)}
          </span>
          <span className="text-lg text-gray-500">/10</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {Object.entries(risk.breakdown).map(([key, { score, weight }]) => (
          <div key={key} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 capitalize font-medium tracking-wide">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-white">{score.toFixed(1)}</span>
              <span className="text-[10px] text-gray-600">
                {(weight * 100).toFixed(0)}%
              </span>
            </div>
            {/* Mini bar */}
            <div className="w-full bg-white/5 rounded-full h-1 mt-2 overflow-hidden">
              <div
                className={`h-1 rounded-full ${
                  score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${score * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      {risk.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Risk Factors
          </h3>
          {risk.flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-sm bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5"
            >
              <span className="flex-shrink-0 mt-0.5">
                {flag.severity === "critical" || flag.severity === "high" ? (
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </span>
              <span className="text-gray-300 flex-1">{flag.message}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${
                  flag.severity === "critical"
                    ? "bg-red-500/10 text-red-400"
                    : flag.severity === "high"
                    ? "bg-red-500/10 text-red-300"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {flag.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
