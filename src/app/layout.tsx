import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolScope - Solana Token Analyzer",
  description:
    "Professional Solana token analysis tool for cryptocurrency traders. Analyze holder distribution, liquidity, security, and risk for any SPL token.",
  keywords: [
    "Solana",
    "token analyzer",
    "crypto",
    "DeFi",
    "memecoin",
    "rug pull",
    "security",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#060611] text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
