"use client";

import { History, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";
import type { Profile } from "@/lib/api-client/auth";

const MAX_HISTORY_PAGES = 200;

type HistorySyncBannerProps = {
  profile: Profile;
};

/**
 * 首次入职引导：已授权 Gmail 但从未同步过时，提示跑历史同步。
 * 完成同步后 {@code lastSyncedAt} 更新，banner 自动消失（F-AUTH-06）。
 */
export function HistorySyncBanner({ profile }: HistorySyncBannerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const needsHistory =
    profile.gmailAuthorized === true && (profile.lastSyncedAt == null || profile.lastSyncedAt === "");

  const runHistorySync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    setProcessed(0);
    let pageToken: string | null = null;
    try {
      for (let page = 0; page < MAX_HISTORY_PAGES; page += 1) {
        const data = await apiClient.sync.triggerGmail({
          mode: "history",
          pageToken: pageToken ?? undefined,
        });
        const pageCount = data.processed ?? 0;
        setProcessed((prev) => prev + pageCount);
        const token = data.nextPageToken ?? null;
        if (!token) break;
        pageToken = token;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      router.refresh();
    } catch (err) {
      const msg = isApiClientError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "历史同步失败";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }, [queryClient, router, syncing]);

  if (dismissed || !needsHistory) {
    return null;
  }

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-inset md:flex-row md:items-center md:justify-between"
      role="status"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <History className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">建议先完成历史同步</p>
          <p className="mt-0.5 text-amber-900/80">
            首次使用请拉取最近一年的 Gmail 往来邮件，与飞书达人数据对齐。同步在后台进行，可继续操作工作台。
          </p>
          {syncing ? (
            <p className="mt-1 text-xs font-medium text-amber-800">已处理 {processed} 封…</p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-[#9f3429]">{error}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void runHistorySync()}
          disabled={syncing}
          className="island-button h-9 px-3 text-xs font-semibold"
        >
          {syncing ? "历史同步中…" : "开始历史同步"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex size-9 items-center justify-center rounded-full text-amber-800/70 hover:bg-amber-100/80 hover:text-amber-950"
          aria-label="暂时关闭提示"
          title="暂时关闭（未完成同步时下次登录仍会提示）"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
