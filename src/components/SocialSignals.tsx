"use client";

import { Globe, ExternalLink, MessageCircle, Users } from "lucide-react";
import type { SocialSignals as SocialSignalsType } from "@/types";

interface SocialSignalsProps {
  social: SocialSignalsType;
}

export default function SocialSignals({ social }: SocialSignalsProps) {
  return (
    <div className="card-3d rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <Globe className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Social</h2>
      </div>

      {/* Sentiment */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Sentiment Score</span>
          <span
            className={`text-lg font-bold ${
              social.sentimentScore >= 7 ? "text-emerald-400" :
              social.sentimentScore >= 4 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {social.sentimentScore}/10
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all shadow-lg ${
              social.sentimentScore >= 7 ? "bg-emerald-500 shadow-emerald-500/30" :
              social.sentimentScore >= 4 ? "bg-amber-500 shadow-amber-500/30" :
              "bg-red-500 shadow-red-500/30"
            }`}
            style={{ width: `${social.sentimentScore * 10}%` }}
          />
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        {social.website && (
          <SocialLink icon={<Globe className="w-4 h-4" />} label="Website" href={social.website} />
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
          <SocialLink icon={<Users className="w-4 h-4" />} label="Discord" href={social.discord} />
        )}
      </div>

      {!social.website && !social.twitter && !social.telegram && !social.discord && (
        <div className="text-center py-6 text-gray-600">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No social profiles detected</p>
          <p className="text-xs mt-1 text-gray-700">New or anonymous project</p>
        </div>
      )}

      {(social.telegramMembers || social.discordMembers) && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {social.telegramMembers && (
            <div className="glass-card rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Telegram</p>
              <p className="text-lg font-bold text-white">{social.telegramMembers.toLocaleString()}</p>
            </div>
          )}
          {social.discordMembers && (
            <div className="glass-card rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Discord</p>
              <p className="text-lg font-bold text-white">{social.discordMembers.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 glass-card rounded-xl transition-all group glass-card-hover"
    >
      <span className="text-gray-500 group-hover:text-white">{icon}</span>
      <span className="text-gray-300 group-hover:text-white text-sm flex-1">{label}</span>
      <span className="text-gray-700 text-xs truncate max-w-[180px]">{href.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="w-3 h-3 text-gray-700 group-hover:text-gray-400" />
    </a>
  );
}
