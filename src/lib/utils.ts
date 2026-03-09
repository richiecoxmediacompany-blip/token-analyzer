export function formatPrice(price: number): string {
  if (price === 0) return "$0.00";
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function formatPercentage(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function calculateRiskScore(
  holderScore: number,
  liquidityScore: number,
  securityScore: number,
  socialScore: number,
  developerScore: number
): number {
  const weighted =
    holderScore * 0.3 +
    liquidityScore * 0.25 +
    securityScore * 0.2 +
    socialScore * 0.15 +
    developerScore * 0.1;
  return Math.round(weighted * 10) / 10;
}

export function getRiskLevel(score: number): "high" | "medium" | "low" {
  if (score <= 3) return "high";
  if (score <= 6) return "medium";
  return "low";
}

export function getRiskColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "text-red-500";
    case "medium": return "text-yellow-500";
    case "low": return "text-green-500";
  }
}

export function getRiskBg(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "bg-red-500/20 border-red-500/50";
    case "medium": return "bg-yellow-500/20 border-yellow-500/50";
    case "low": return "bg-green-500/20 border-green-500/50";
  }
}
