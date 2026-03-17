import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('solscope-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)] min-h-screen font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
