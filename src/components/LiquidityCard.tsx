"use client";

import { AlertTriangle, Lock, Unlock, Droplets } from "lucide-react";
import type { LiquidityInfo } from "@/types";
import { formatLargeNumber } from "@/lib/utils";

interface LiquidityCardProps {
  liquidity: LiquidityInfo;
}

export default function LiquidityCard({ liquidity }: LiquidityCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Liquidity Analysis</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Total Liquidity</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatLargeNumber(liquidity.totalLiquidityUsd)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">
            Liquidity / MCap Ratio
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              liquidity.liquidityToMcapRatio >= 10
                ? "text-green-400"
                : liquidity.liquidityToMcapRatio >= 5
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {liquidity.liquidityToMcapRatio.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Main pool */}
      {liquidity.mainPool && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2">
            Main Liquidity Pool
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {liquidity.mainPool.name}
              </p>
              <p className="text-gray-400 text-sm capitalize">
                {liquidity.mainPool.dex}
              </p>
            </div>
            <p className="text-white font-semibold">
              {formatLargeNumber(liquidity.mainPool.liquidityUsd)}
            </p>
          </div>
        </div>
      )}

      {/* Lock status */}
      <div
        className={`rounded-lg p-4 border ${
          liquidity.locked === true
            ? "bg-green-900/20 border-green-800"
            : liquidity.locked === false
            ? "bg-red-900/20 border-red-800"
            : "bg-gray-800/50 border-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          {liquidity.locked === true ? (
            <>
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                Liquidity Locked
              </span>
            </>
          ) : liquidity.locked === false ? (
            <>
              <Unlock className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">
                Liquidity Not Locked
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                Lock Status Unknown
              </span>
            </>
          )}
        </div>

        {liquidity.locked === false && (
          <p className="text-red-300 text-sm mt-2">
            Liquidity Not Locked - High Rug Risk. The developer can remove
            liquidity at any time.
          </p>
        )}

        {liquidity.locked === null && (
          <p className="text-yellow-300 text-sm mt-2">
            Could not determine if liquidity is locked. Manual verification
            recommended.
          </p>
        )}

        {liquidity.lockDetails && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-gray-500">Duration Remaining</p>
              <p className="text-white text-sm">
                {liquidity.lockDetails.durationRemaining}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unlock Date</p>
              <p className="text-white text-sm">
                {liquidity.lockDetails.unlockDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">% Locked</p>
              <p className="text-white text-sm">
                {liquidity.lockDetails.percentageLocked}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Platform</p>
              <p className="text-white text-sm">
                {liquidity.lockDetails.platform}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
