"use client";

import { AlertTriangle, Lock, Unlock, Droplets } from "lucide-react";
import type { LiquidityInfo } from "@/types";
import { formatLargeNumber } from "@/lib/utils";

interface LiquidityCardProps {
  liquidity: LiquidityInfo;
}

export default function LiquidityCard({ liquidity }: LiquidityCardProps) {
  return (
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Liquidity Analysis</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total Liquidity</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatLargeNumber(liquidity.totalLiquidityUsd)}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Liquidity / MCap Ratio
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              liquidity.liquidityToMcapRatio >= 10
                ? "text-emerald-400"
                : liquidity.liquidityToMcapRatio >= 5
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {liquidity.liquidityToMcapRatio.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main pool */}
      {liquidity.mainPool && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">
            Main Liquidity Pool
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{liquidity.mainPool.name}</p>
              <p className="text-gray-500 text-sm capitalize">{liquidity.mainPool.dex}</p>
            </div>
            <p className="text-white font-semibold">
              {formatLargeNumber(liquidity.mainPool.liquidityUsd)}
            </p>
          </div>
        </div>
      )}

      {/* Lock status */}
      <div
        className={`rounded-xl p-4 border ${
          liquidity.locked === true
            ? "bg-emerald-500/5 border-emerald-500/20"
            : liquidity.locked === false
            ? "bg-red-500/5 border-red-500/20"
            : "bg-white/[0.02] border-white/5"
        }`}
      >
        <div className="flex items-center gap-2">
          {liquidity.locked === true ? (
            <>
              <Lock className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Liquidity Locked</span>
            </>
          ) : liquidity.locked === false ? (
            <>
              <Unlock className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">Liquidity Not Locked</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-semibold">Lock Status Unknown</span>
            </>
          )}
        </div>

        {liquidity.locked === false && (
          <p className="text-red-300/80 text-sm mt-2">
            Liquidity Not Locked - High Rug Risk. The developer can remove
            liquidity at any time.
          </p>
        )}

        {liquidity.locked === null && (
          <p className="text-amber-300/80 text-sm mt-2">
            Could not determine if liquidity is locked. Manual verification
            recommended.
          </p>
        )}

        {liquidity.lockDetails && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Duration Remaining</p>
              <p className="text-white text-sm">{liquidity.lockDetails.durationRemaining}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Unlock Date</p>
              <p className="text-white text-sm">{liquidity.lockDetails.unlockDate}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">% Locked</p>
              <p className="text-white text-sm">{liquidity.lockDetails.percentageLocked}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Platform</p>
              <p className="text-white text-sm">{liquidity.lockDetails.platform}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
