"use client";

import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import type { RiskAssessment } from "@/types";
import { getRiskColor, getRiskBg } from "@/lib/utils";

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

  return (
    <div className={`rounded-xl border p-6 ${getRiskBg(risk.level)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${getRiskColor(risk.level)}`} />
          <div>
            <h2 className="text-lg font-bold text-white">Risk Assessment</h2>
            <p className={`text-sm font-semibold ${getRiskColor(risk.level)}`}>
              {levelLabel}
            </p>
          </div>
        </div>
        <div className={`text-5xl font-black ${getRiskColor(risk.level)}`}>
          {risk.overallScore.toFixed(1)}
          <span className="text-lg text-gray-400">/10</span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {Object.entries(risk.breakdown).map(([key, { score, weight }]) => (
          <div key={key} className="bg-black/30 rounded-lg p-3">
            <p className="text-xs text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className="text-lg font-bold text-white">
              {score.toFixed(1)}
              <span className="text-xs text-gray-500 ml-1">
                ({(weight * 100).toFixed(0)}%)
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      {risk.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">
            Risk Factors Detected:
          </h3>
          {risk.flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm"
            >
              <span>
                {flag.icon === "red"
                  ? "\u{1F534}"
                  : flag.icon === "yellow"
                  ? "\u{1F7E1}"
                  : "\u{1F7E2}"}
              </span>
              <span className="text-gray-300">{flag.message}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ml-auto whitespace-nowrap ${
                  flag.severity === "critical"
                    ? "bg-red-900/50 text-red-400"
                    : flag.severity === "high"
                    ? "bg-red-900/30 text-red-300"
                    : flag.severity === "medium"
                    ? "bg-yellow-900/50 text-yellow-400"
                    : "bg-green-900/50 text-green-400"
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
