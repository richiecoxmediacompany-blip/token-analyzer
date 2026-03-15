"use client";

import { CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import type { SecurityAnalysis } from "@/types";
import { shortenAddress } from "@/lib/utils";

interface SecurityChecklistProps {
  security: SecurityAnalysis;
}

export default function SecurityChecklist({ security }: SecurityChecklistProps) {
  return (
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Security</h2>
        </div>
        <div
          className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
            security.overallScore >= 7
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : security.overallScore >= 4
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {security.overallScore.toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-2">
        {security.checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              check.passed
                ? "bg-emerald-500/[0.03] border-emerald-500/10"
                : check.severity === "critical"
                ? "bg-red-500/[0.05] border-red-500/15"
                : "bg-amber-500/[0.03] border-amber-500/10"
            }`}
          >
            {check.passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : check.severity === "critical" ? (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{check.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex-shrink-0 ${
                check.passed
                  ? "bg-emerald-500/10 text-emerald-400"
                  : check.severity === "critical"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {check.passed ? "PASS" : "FAIL"}
            </span>
          </div>
        ))}
      </div>

      {/* Authority addresses */}
      <div className="mt-4 space-y-2 text-sm">
        {security.mintAuthority && (
          <div className="flex items-center gap-2 text-gray-500">
            <span>Mint Authority:</span>
            <a
              href={`https://solscan.io/account/${security.mintAuthority}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 text-xs"
            >
              {shortenAddress(security.mintAuthority, 6)}
            </a>
          </div>
        )}
        {security.freezeAuthority && (
          <div className="flex items-center gap-2 text-gray-500">
            <span>Freeze Authority:</span>
            <a
              href={`https://solscan.io/account/${security.freezeAuthority}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 text-xs"
            >
              {shortenAddress(security.freezeAuthority, 6)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
