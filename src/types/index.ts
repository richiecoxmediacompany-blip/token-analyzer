export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
  price: number;
  priceChange24h: number;
  marketCap: number;
  fdv: number;
  volume24h: number;
  ath: { price: number; date: string } | null;
  atl: { price: number; date: string } | null;
  supply: number;
  circulatingSupply: number;
}

export interface Holder {
  address: string;
  amount: number;
  usdValue: number;
  percentage: number;
  label: string | null;
}

export interface HolderAnalysis {
  totalHolders: number;
  top10Percentage: number;
  top100Percentage: number;
  distributionScore: number;
  holders: Holder[];
  concentration: "low" | "medium" | "high";
}

export interface LiquidityInfo {
  totalLiquidityUsd: number;
  mainPool: {
    name: string;
    dex: string;
    liquidityUsd: number;
    baseToken: string;
    quoteToken: string;
  } | null;
  locked: boolean | null;
  lockDetails: {
    durationRemaining: string;
    unlockDate: string;
    percentageLocked: number;
    platform: string;
  } | null;
  liquidityToMcapRatio: number;
}

export interface SecurityCheck {
  label: string;
  passed: boolean;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface SecurityAnalysis {
  checks: SecurityCheck[];
  overallScore: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string | null;
}

export interface TransactionMetrics {
  count24h: number;
  buyCount: number;
  sellCount: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  avgTransactionSize: number;
  largestTransaction: {
    amount: number;
    signature: string;
    type: "buy" | "sell";
  } | null;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SocialSignals {
  twitterMentions24h: number;
  trending: boolean;
  recentTweets: Tweet[];
  telegramMembers: number | null;
  discordMembers: number | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  sentimentScore: number;
}

export interface Tweet {
  text: string;
  author: string;
  date: string;
  likes: number;
  retweets: number;
}

export interface DeveloperInfo {
  creatorAddress: string;
  creatorBalance: number;
  recentActivity: CreatorActivity[];
  otherTokens: { address: string; name: string; symbol: string }[];
  hasRecentDumps: boolean;
}

export interface CreatorActivity {
  type: "buy" | "sell" | "transfer";
  amount: number;
  date: string;
  signature: string;
}

export interface RiskAssessment {
  overallScore: number;
  level: "high" | "medium" | "low";
  breakdown: {
    holderConcentration: { score: number; weight: number };
    liquidityLocked: { score: number; weight: number };
    contractSecurity: { score: number; weight: number };
    socialActivity: { score: number; weight: number };
    developerBehavior: { score: number; weight: number };
  };
  flags: RiskFlag[];
}

export interface RiskFlag {
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  icon: "red" | "yellow" | "green";
}

export interface AnalysisState {
  tokenInfo: TokenInfo | null;
  holders: HolderAnalysis | null;
  liquidity: LiquidityInfo | null;
  security: SecurityAnalysis | null;
  transactions: TransactionMetrics | null;
  social: SocialSignals | null;
  developer: DeveloperInfo | null;
  risk: RiskAssessment | null;
  loading: {
    tokenInfo: boolean;
    holders: boolean;
    liquidity: boolean;
    security: boolean;
    transactions: boolean;
    social: boolean;
  };
  errors: {
    tokenInfo: string | null;
    holders: string | null;
    liquidity: string | null;
    security: string | null;
    transactions: string | null;
    social: string | null;
  };
}
