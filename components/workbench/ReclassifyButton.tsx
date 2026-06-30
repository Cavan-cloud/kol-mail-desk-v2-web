"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

const AI_FALLBACK_SUMMARY = "AI 分类失败，已保留邮件等待人工处理。";

type Props = {
  emailId: string;
  aiSummary: string;
};

export function ReclassifyButton({ emailId, aiSummary }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (aiSummary !== AI_FALLBACK_SUMMARY) return null;
  if (done) return null;

  async function handleClick() {
    setLoading(true);
    try {
      await apiClient.emails.reclassify(emailId);
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
      title="用 AI 重新分析这封邮件"
    >
      <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
      {loading ? "分析中…" : "重新分析"}
    </button>
  );
}
