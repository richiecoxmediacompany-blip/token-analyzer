import { NextRequest, NextResponse } from "next/server";
import { heliusRpcUrl, cachedFetch } from "@/lib/api-client";
import { isValidSolanaAddress } from "@/lib/utils";
import type { SecurityAnalysis, SecurityCheck } from "@/types";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  try {
    const analysis = await runSecurityChecks(address);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Security check error:", error);
    return NextResponse.json(
      { error: "Failed to run security checks" },
      { status: 500 }
    );
  }
}

async function runSecurityChecks(
  address: string
): Promise<SecurityAnalysis> {
  const rpcUrl = heliusRpcUrl();
  const checks: SecurityCheck[] = [];

  let mintAuthority: string | null = null;
  let freezeAuthority: string | null = null;
  let updateAuthority: string | null = null;

  try {
    // Fetch mint account info
    const mintInfo = await cachedFetch<{
      result?: {
        value?: {
          data?: {
            parsed?: {
              info?: {
                mintAuthority?: string | null;
                freezeAuthority?: string | null;
                supply?: string;
                isInitialized?: boolean;
              };
            };
          };
        };
      };
    }>(
      rpcUrl,
      {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "mint-check",
          method: "getAccountInfo",
          params: [address, { encoding: "jsonParsed" }],
        }),
      },
      120_000
    );

    const info = mintInfo.result?.value?.data?.parsed?.info;

    // Check mint authority
    mintAuthority = info?.mintAuthority || null;
    const mintRenounced = !mintAuthority;
    checks.push({
      label: "Mint Authority Renounced",
      passed: mintRenounced,
      description: mintRenounced
        ? "Mint authority has been renounced - no new tokens can be created"
        : "Mint authority NOT renounced - developer can create unlimited tokens",
      severity: mintRenounced ? "info" : "critical",
    });

    // Check freeze authority
    freezeAuthority = info?.freezeAuthority || null;
    const freezeRenounced = !freezeAuthority;
    checks.push({
      label: "Freeze Authority Renounced",
      passed: freezeRenounced,
      description: freezeRenounced
        ? "Freeze authority renounced - wallets cannot be frozen"
        : "Freeze authority NOT renounced - developer can freeze any wallet",
      severity: freezeRenounced ? "info" : "critical",
    });

    // Check if token is initialized
    const isInitialized = info?.isInitialized !== false;
    checks.push({
      label: "Token Initialized",
      passed: isInitialized,
      description: isInitialized
        ? "Token contract is properly initialized"
        : "Token is not initialized - may be invalid",
      severity: isInitialized ? "info" : "warning",
    });
  } catch {
    checks.push({
      label: "On-chain Data",
      passed: false,
      description: "Could not fetch on-chain token data",
      severity: "warning",
    });
  }

  // Check metadata / update authority via Helius DAS
  try {
    const rpcUrl2 = heliusRpcUrl();
    const assetResponse = await cachedFetch<{
      result?: {
        authorities?: Array<{ address: string; scopes: string[] }>;
        mutable?: boolean;
      };
    }>(
      rpcUrl2,
      {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "asset-check",
          method: "getAsset",
          params: { id: address },
        }),
      },
      120_000
    );

    const result = assetResponse.result;
    if (result) {
      // Update authority
      const updateAuth = result.authorities?.find((a) =>
        a.scopes.includes("metadata")
      );
      updateAuthority = updateAuth?.address || null;

      checks.push({
        label: "Update Authority Status",
        passed: !updateAuthority,
        description: updateAuthority
          ? "Update authority is active - metadata can be changed"
          : "No update authority found",
        severity: updateAuthority ? "warning" : "info",
      });

      // Metadata mutability
      const isMutable = result.mutable !== false;
      checks.push({
        label: "Metadata Frozen",
        passed: !isMutable,
        description: !isMutable
          ? "Metadata is frozen - token name/logo cannot be changed"
          : "Metadata is mutable - token name and logo can be changed",
        severity: !isMutable ? "info" : "warning",
      });
    }
  } catch {
    // DAS API not available, skip these checks
  }

  // Honeypot check: look for recent sell transactions
  try {
    const dexData = await cachedFetch<{ pairs?: Array<Record<string, unknown>> }>(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {},
      60_000
    );

    const mainPair = dexData.pairs?.[0];
    if (mainPair) {
      const txns = mainPair.txns as Record<string, Record<string, number>> | undefined;
      const sells24h = txns?.h24?.sells ?? 0;
      const hasSells = sells24h > 0;

      checks.push({
        label: "Honeypot Check (Sell Transactions)",
        passed: hasSells,
        description: hasSells
          ? `${sells24h} sell transactions in 24h - tokens can be sold`
          : "No sell transactions found - potential honeypot",
        severity: hasSells ? "info" : "critical",
      });
    }
  } catch {
    checks.push({
      label: "Honeypot Check",
      passed: false,
      description: "Could not verify if tokens can be sold",
      severity: "warning",
    });
  }

  // Calculate overall security score
  const passedCount = checks.filter((c) => c.passed).length;
  const criticalFails = checks.filter(
    (c) => !c.passed && c.severity === "critical"
  ).length;
  let overallScore = (passedCount / Math.max(checks.length, 1)) * 10;
  overallScore = Math.max(1, overallScore - criticalFails * 2);
  overallScore = Math.round(overallScore * 10) / 10;

  return {
    checks,
    overallScore,
    mintAuthority,
    freezeAuthority,
    updateAuthority,
  };
}
