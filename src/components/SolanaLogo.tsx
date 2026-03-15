"use client";

export function SolanaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg">
      <linearGradient id="sol-a" x1="360.88" y1="351.46" x2="141.21" y2="-69.29" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -1)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <linearGradient id="sol-b" x1="264.83" y1="401.6" x2="45.16" y2="-19.15" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -1)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <linearGradient id="sol-c" x1="312.55" y1="376.69" x2="92.88" y2="-44.06" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -1)">
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" fill="url(#sol-a)" />
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" fill="url(#sol-b)" />
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1z" fill="url(#sol-c)" />
    </svg>
  );
}

export function SolanaLogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <div className="absolute inset-0 solana-gradient rounded-xl opacity-20 blur-lg" />
      <div className="relative w-full h-full solana-gradient rounded-xl flex items-center justify-center">
        <SolanaLogo className="w-[60%] h-[60%]" />
      </div>
    </div>
  );
}
