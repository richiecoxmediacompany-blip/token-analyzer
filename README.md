# SolScope - Solana Token Analyzer

Professional Solana token analysis tool for cryptocurrency traders researching new tokens and memecoins.

## Features

- **Security Analysis** - Mint authority, freeze authority, honeypot detection, metadata mutability
- **Holder Distribution** - Top holder analysis, concentration risk scoring, whale detection
- **Liquidity Analysis** - Total liquidity, pool details, lock status, liquidity-to-mcap ratio
- **Trading Metrics** - 24h transaction counts, buy/sell ratio, price charts with multiple timeframes
- **Social Signals** - Social links, sentiment scoring, community presence
- **Risk Assessment** - Weighted risk score (1-10) across 5 categories with detailed flags

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required:
- `HELIUS_API_KEY` - [Helius](https://helius.dev) for on-chain Solana data

Optional (enhances data):
- `BIRDEYE_API_KEY` - [Birdeye](https://birdeye.so) for price/volume/OHLCV data
- `SOLSCAN_API_KEY` - [Solscan](https://solscan.io) for enhanced holder data
- `TWITTER_BEARER_TOKEN` - Twitter API for social signals

The app works without API keys using DexScreener's free API for basic data.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Architecture

- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS (dark mode default)
- **Data Sources**: DexScreener (free), Helius RPC, Birdeye API
- **Charts**: Custom SVG price charts

### API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/token-info` | Token metadata and price data |
| `/api/holders` | Top holder analysis and distribution |
| `/api/liquidity` | Liquidity pools and lock status |
| `/api/security` | Contract security checks |
| `/api/transactions` | Trading activity and price history |
| `/api/social` | Social links and sentiment |

### Risk Score Calculation

| Factor | Weight |
|--------|--------|
| Holder Concentration | 30% |
| Liquidity Locked | 25% |
| Contract Security | 20% |
| Social Activity | 15% |
| Developer Behavior | 10% |

## Disclaimer

This tool is for informational purposes only. Not financial advice. Always do your own research (DYOR).
