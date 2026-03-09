"use client";

import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              placeholder="Paste Solana token address (e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)"
              className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Token"
            )}
          </button>
        </div>
        {error && (
          <p className="absolute -bottom-7 left-0 text-red-400 text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-2 justify-center">
        <span className="text-gray-500 text-xs">Try:</span>
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
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors border border-gray-700"
          >
            {token.label}
          </button>
        ))}
      </div>
    </form>
  );
}
