"use client";

import { useState, type FormEvent } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { isValidSolanaAddress } from "@/lib/utils";

interface TokenSearchBarProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export default function TokenSearchBar({ onSearch, isLoading }: TokenSearchBarProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError("Please enter a token address");
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setError("Invalid Solana address format");
      return;
    }

    setError(null);
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Glow behind input */}
        <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl -z-10" />

        <div className="glass-card rounded-2xl p-2 gradient-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                placeholder="Paste Solana token address..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] text-sm font-mono transition-all"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 solana-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-purple-500/20 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="absolute -bottom-7 left-0 text-red-400 text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-2 justify-center items-center">
        <span className="text-gray-600 text-xs">Quick try:</span>
        {[
          { label: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
          { label: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
          { label: "JUP", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
        ].map((token) => (
          <button
            key={token.address}
            type="button"
            onClick={() => {
              setInput(token.address);
              setError(null);
              onSearch(token.address);
            }}
            disabled={isLoading}
            className="px-3 py-1.5 glass-card hover:bg-white/[0.06] text-gray-400 hover:text-white text-xs rounded-xl transition-all glass-card-hover"
          >
            {token.label}
          </button>
        ))}
      </div>
    </form>
  );
}
