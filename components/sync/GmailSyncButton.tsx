"use client";

import { Check, History, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";
import type { GmailSyncStatus } from "@/lib/api-client/sync";

type SyncMode = "incremental" | "history";

type Status =
  | { kind: "idle" }
  | { kind: "syncing"; mode: SyncMode; processed?: number }
  | { kind: "done"; added: number; message: string }
  | { kind: "error"; message: string };

const MAX_HISTORY_PAGES = 200;
const GMAIL_AUTHORIZE_URL = apiClient.auth.GMAIL_AUTHORIZE_URL;

export function GmailSyncButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const syncing = status.kind === "syncing";

  async function fetchSyncPage(mode: SyncMode, pageToken: string | null): Promise<GmailSyncStatus> {
    return apiClient.sync.triggerGmail({
      mode,
      pageToken: pageToken ?? undefined,
    });
  }

  function handleAuthError(msg: string) {
    setStatus({ kind: "error", message: msg });
    if (/refresh.?token|oauth|offline|consent|授权/i.test(msg)) {
      setTimeout(() => {
        window.location.href = GMAIL_AUTHORIZE_URL;
      }, 2000);
    } else {
      resetTimer.current = setTimeout(() => setStatus({ kind: "idle" }), 8000);
    }
  }

  async function runSync(mode: SyncMode) {
    if (syncing) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);

    if (mode === "history") {
      await runHistorySync();
      return;
    }

    setStatus({ kind: "syncing", mode });
    try {
      const data = await fetchSyncPage(mode, null);
      const added = data.processed ?? 0;
      setStatus({
        kind: "done",
        added,
        message: added > 0 ? `增量同步完成，处理 ${added} 封` : "增量同步完成",
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      router.refresh();
      resetTimer.current = setTimeout(() => setStatus({ kind: "idle" }), 6000);
    } catch (error) {
      const msg = isApiClientError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gmail 同步失败";
      handleAuthError(msg);
    }
  }

  async function runHistorySync() {
    setStatus({ kind: "syncing", mode: "history", processed: 0 });
    let pageToken: string | null = null;
    let added = 0;
    let processed = 0;
    try {
      for (let page = 0; page < MAX_HISTORY_PAGES; page += 1) {
        const data = await fetchSyncPage("history", pageToken);
        const pageCount = data.processed ?? 0;
        added += pageCount;
        processed += pageCount;
        setStatus({ kind: "syncing", mode: "history", processed });
        const token = data.nextPageToken ?? null;
        if (!token) break;
        pageToken = token;
      }
      setStatus({ kind: "done", added, message: `历史同步完成，处理 ${added} 封` });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      router.refresh();
      resetTimer.current = setTimeout(() => setStatus({ kind: "idle" }), 6000);
    } catch (error) {
      const msg = isApiClientError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gmail 同步失败";
      handleAuthError(msg);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status.kind === "syncing" ? (
        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 text-xs font-semibold text-accent shadow-inset">
          <Loader2 className="size-4 animate-spin" />
          {status.mode === "history"
            ? `历史同步中…已处理 ${status.processed ?? 0} 封（可继续操作）`
            : "同步中…可继续操作"}
        </span>
      ) : null}
      {status.kind === "done" ? (
        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-3 text-xs font-semibold text-emerald-700 shadow-inset">
          <Check className="size-4" />
          同步完成，处理 {status.added} 封
        </span>
      ) : null}
      {status.kind === "error" ? (
        /refresh.?token|oauth|offline|consent|授权/i.test(status.message) ? (
          <a
            href={GMAIL_AUTHORIZE_URL}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-red-300/60 bg-red-50/80 px-3 text-xs font-semibold text-[#9f3429] shadow-inset"
            title={status.message}
          >
            <TriangleAlert className="size-4" />
            重新授权 Gmail
          </a>
        ) : (
          <span
            className="inline-flex h-9 max-w-[220px] items-center gap-2 truncate rounded-full border border-red-300/60 bg-red-50/80 px-3 text-xs font-semibold text-[#9f3429] shadow-inset"
            title={status.message}
          >
            <TriangleAlert className="size-4" />
            同步失败
          </span>
        )
      ) : null}

      <button
        type="button"
        onClick={() => runSync("incremental")}
        disabled={syncing}
        className="island-button hidden h-9 px-3 md:flex"
        title="增量同步：只拉取上次同步之后的新邮件，速度快，日常使用。同步在后台进行，可继续操作。"
      >
        <RefreshCw className={`size-4 ${syncing && status.kind === "syncing" && status.mode === "incremental" ? "animate-spin" : ""}`} />
        增量同步
      </button>
      <button
        type="button"
        onClick={() => runSync("history")}
        disabled={syncing}
        className="island-button hidden h-9 px-3 md:flex"
        title="历史同步：分页拉取最近一年的全部历史邮件，逐页写入并显示进度，中途超时也不会丢失已处理的邮件。仅新成员入职或漏同步时使用，可继续操作。"
      >
        <History className={`size-4 ${syncing && status.kind === "syncing" && status.mode === "history" ? "animate-spin" : ""}`} />
        历史同步
      </button>
    </div>
  );
}
