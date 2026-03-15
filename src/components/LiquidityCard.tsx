"use client";

import { AlertTriangle, Lock, Unlock, Droplets } from "lucide-react";
import type { LiquidityInfo } from "@/types";
import { formatLargeNumber } from "@/lib/utils";

interface LiquidityCardProps {
  liquidity: LiquidityInfo;
}

export default function LiquidityCard({ liquidity }: LiquidityCardProps) {
  return (
    <div className="card-3d rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Droplets className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Liquidity</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total Liquidity</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatLargeNumber(liquidity.totalLiquidityUsd)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Liq / MCap Ratio</p>
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

      {liquidity.mainPool && (
        <div className="glass-card rounded-xl p-4 mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Main Pool</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{liquidity.mainPool.name}</p>
              <p className="text-gray-500 text-sm capitalize">{liquidity.mainPool.dex}</p>
            </div>
            <p className="text-white font-semibold">{formatLargeNumber(liquidity.mainPool.liquidityUsd)}</p>
          </div>
        </div>
      )}

      <div
        className={`rounded-xl p-4 border ${
          liquidity.locked === true
            ? "glass-card border-emerald-500/20 shadow-lg shadow-emerald-500/5"
            : liquidity.locked === false
            ? "glass-card border-red-500/20 shadow-lg shadow-red-500/5"
            : "glass-card border-amber-500/20"
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
              <span className="text-red-400 font-semibold">Not Locked</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-semibold">Unknown</span>
            </>
          )}
        </div>

        {liquidity.locked === false && (
          <p className="text-red-300/70 text-sm mt-2">
            High rug risk. Developer can remove liquidity at any time.
          </p>
        )}

        {liquidity.locked === null && (
          <p className="text-amber-300/70 text-sm mt-2">
            Could not determine lock status. Manual verification recommended.
          </p>
        )}

        {liquidity.lockDetails && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Remaining</p>
              <p className="text-white text-sm">{liquidity.lockDetails.durationRemaining}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Unlock</p>
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
