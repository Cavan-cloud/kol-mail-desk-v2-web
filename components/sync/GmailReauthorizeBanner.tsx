"use client";

import { TriangleAlert } from "lucide-react";
import type { Profile } from "@/lib/api-client/auth";
import { apiClient } from "@/lib/api-client";

type GmailReauthorizeBannerProps = {
  profile: Profile;
};

/**
 * 顶栏 proactive 提示：已登录但未完成 Gmail 授权时显示（F-WB-SYNC-03 / P3-T04）。
 */
export function GmailReauthorizeBanner({ profile }: GmailReauthorizeBannerProps) {
  if (profile.gmailAuthorized !== false) {
    return null;
  }

  return (
    <a
      href={apiClient.auth.GMAIL_AUTHORIZE_URL}
      className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-semibold text-[#9f3429] shadow-inset hover:bg-red-50"
    >
      <TriangleAlert className="size-5 shrink-0" aria-hidden />
      <span>尚未授权 Gmail，点击完成授权后即可同步邮件</span>
    </a>
  );
}
