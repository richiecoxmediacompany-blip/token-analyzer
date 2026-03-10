"use client";

import { Globe, ExternalLink, MessageCircle, Users } from "lucide-react";
import type { SocialSignals as SocialSignalsType } from "@/types";

interface SocialSignalsProps {
  social: SocialSignalsType;
}

export default function SocialSignals({ social }: SocialSignalsProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Social Signals</h2>
      </div>

      {/* Sentiment gauge */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Sentiment Score</span>
          <span
            className={`text-lg font-bold ${
              social.sentimentScore >= 7
                ? "text-green-400"
                : social.sentimentScore >= 4
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {social.sentimentScore}/10
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              social.sentimentScore >= 7
                ? "bg-green-500"
                : social.sentimentScore >= 4
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${social.sentimentScore * 10}%` }}
          />
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-3">
        {social.website && (
          <SocialLink
            icon={<Globe className="w-4 h-4" />}
            label="Website"
            href={social.website}
          />
        )}
        {social.twitter && (
          <SocialLink
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
            label="Twitter / X"
            href={social.twitter.startsWith("http") ? social.twitter : `https://twitter.com/${social.twitter}`}
          />
        )}
        {social.telegram && (
          <SocialLink
            icon={<MessageCircle className="w-4 h-4" />}
            label="Telegram"
            href={social.telegram.startsWith("http") ? social.telegram : `https://t.me/${social.telegram}`}
          />
        )}
        {social.discord && (
          <SocialLink
            icon={<Users className="w-4 h-4" />}
            label="Discord"
            href={social.discord}
          />
        )}
      </div>

      {!social.website && !social.twitter && !social.telegram && !social.discord && (
        <div className="text-center py-6 text-gray-500">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No social media profiles detected</p>
          <p className="text-xs mt-1 text-gray-600">
            This could indicate a new or anonymous project
          </p>
        </div>
      )}

      {/* Community metrics */}
      {(social.telegramMembers || social.discordMembers) && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {social.telegramMembers && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Telegram Members</p>
              <p className="text-lg font-semibold text-white">
                {social.telegramMembers.toLocaleString()}
              </p>
            </div>
          )}
          {social.discordMembers && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Discord Members</p>
              <p className="text-lg font-semibold text-white">
                {social.discordMembers.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
    >
      <span className="text-gray-400 group-hover:text-white">{icon}</span>
      <span className="text-gray-300 group-hover:text-white text-sm flex-1">
        {label}
      </span>
      <span className="text-gray-600 text-xs truncate max-w-[200px]">
        {href.replace(/^https?:\/\//, "")}
      </span>
      <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />
    </a>
  );
}
