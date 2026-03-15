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

  const levelConfig = {
    high: {
      glow: "shadow-red-500/20",
      text: "text-red-400",
      scoreBg: "bg-red-500/10 border-red-500/20",
      barColor: "bg-red-500",
    },
    medium: {
      glow: "shadow-amber-500/20",
      text: "text-amber-400",
      scoreBg: "bg-amber-500/10 border-amber-500/20",
      barColor: "bg-amber-500",
    },
    low: {
      glow: "shadow-emerald-500/20",
      text: "text-emerald-400",
      scoreBg: "bg-emerald-500/10 border-emerald-500/20",
      barColor: "bg-emerald-500",
    },
  };

  const c = levelConfig[risk.level];

  return (
    <div className={`card-3d rounded-2xl p-6 shadow-lg ${c.glow}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${c.scoreBg} border flex items-center justify-center shadow-lg ${c.glow}`}>
            <Icon className={`w-6 h-6 ${c.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Risk Assessment</h2>
            <p className={`text-sm font-bold ${c.text}`}>{levelLabel}</p>
          </div>
        </div>
        <div className={`${c.scoreBg} border rounded-2xl px-6 py-3 shadow-lg ${c.glow}`}>
          <span className={`text-4xl font-black ${c.text}`}>
            {risk.overallScore.toFixed(1)}
          </span>
          <span className="text-lg text-gray-500">/10</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {Object.entries(risk.breakdown).map(([key, { score, weight }]) => (
          <div key={key} className="glass-card rounded-xl p-3">
            <p className="text-[10px] text-gray-500 capitalize font-medium tracking-wide">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-white">{score.toFixed(1)}</span>
              <span className="text-[10px] text-gray-600">{(weight * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  score >= 7 ? "bg-emerald-500 shadow-emerald-500/50" : score >= 4 ? "bg-amber-500 shadow-amber-500/50" : "bg-red-500 shadow-red-500/50"
                } shadow-lg`}
                style={{ width: `${score * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      {risk.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Risk Factors
          </h3>
          {risk.flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-sm glass-card rounded-xl px-4 py-2.5"
            >
              <span className="flex-shrink-0 mt-1">
                {flag.severity === "critical" || flag.severity === "high" ? (
                  <div className="w-2 h-2 rounded-full bg-red-400 shadow-lg shadow-red-400/50" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                )}
              </span>
              <span className="text-gray-300 flex-1">{flag.message}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
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
