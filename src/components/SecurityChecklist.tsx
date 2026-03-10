"use client";

import { CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import type { SecurityAnalysis } from "@/types";
import { shortenAddress } from "@/lib/utils";

interface SecurityChecklistProps {
  security: SecurityAnalysis;
}

export default function SecurityChecklist({ security }: SecurityChecklistProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">
            Security & Contract Analysis
          </h2>
        </div>
        <div
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            security.overallScore >= 7
              ? "bg-green-900/50 text-green-400"
              : security.overallScore >= 4
              ? "bg-yellow-900/50 text-yellow-400"
              : "bg-red-900/50 text-red-400"
          }`}
        >
          {security.overallScore.toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-3">
        {security.checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg ${
              check.passed
                ? "bg-green-900/10"
                : check.severity === "critical"
                ? "bg-red-900/20"
                : "bg-yellow-900/10"
            }`}
          >
            {check.passed ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : check.severity === "critical" ? (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{check.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {check.description}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                check.passed
                  ? "bg-green-900/30 text-green-400"
                  : check.severity === "critical"
                  ? "bg-red-900/30 text-red-400"
                  : "bg-yellow-900/30 text-yellow-400"
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
          <div className="flex items-center gap-2 text-gray-400">
            <span>Mint Authority:</span>
            <a
              href={`https://solscan.io/account/${security.mintAuthority}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300"
            >
              {shortenAddress(security.mintAuthority, 6)}
            </a>
          </div>
        )}
        {security.freezeAuthority && (
          <div className="flex items-center gap-2 text-gray-400">
            <span>Freeze Authority:</span>
            <a
              href={`https://solscan.io/account/${security.freezeAuthority}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300"
            >
              {shortenAddress(security.freezeAuthority, 6)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
