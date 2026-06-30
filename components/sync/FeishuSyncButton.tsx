"use client";

import { Check, DatabaseZap, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";

type Status =
  | { kind: "idle" }
  | { kind: "syncing"; startedAt: number }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

export function FeishuSyncButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  useEffect(() => {
    if (status.kind === "syncing") {
      const startedAt = status.startedAt;
      setElapsed(0);
      tickTimer.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
      return () => {
        if (tickTimer.current) clearInterval(tickTimer.current);
      };
    }
  }, [status]);

  async function runSync() {
    if (status.kind === "syncing") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus({ kind: "syncing", startedAt: Date.now() });
    try {
      const data = await apiClient.sync.triggerFeishu();
      const upserted = data.upserted ?? 0;
      setStatus({
        kind: "done",
        message: upserted > 0 ? `同步完成，更新 ${upserted} 位达人` : "飞书同步完成",
      });
      router.refresh();
      resetTimer.current = setTimeout(() => setStatus({ kind: "idle" }), 8000);
    } catch (error) {
      setStatus({
        kind: "error",
        message: isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "飞书同步失败",
      });
      resetTimer.current = setTimeout(() => setStatus({ kind: "idle" }), 10000);
    }
  }

  const syncing = status.kind === "syncing";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runSync}
          disabled={syncing}
          className="primary-island-button h-10 disabled:opacity-60"
          title="从飞书 Sheet 只读拉取达人数据并 upsert 到数据库。"
        >
          {syncing ? <Loader2 className="size-4 animate-spin" /> : <DatabaseZap className="size-4" />}
          {syncing ? `同步中…${elapsed}s` : "同步飞书"}
        </button>
        {status.kind === "done" ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-3 text-xs font-semibold text-emerald-700 shadow-inset">
            <Check className="size-4" />
            同步完成
          </span>
        ) : null}
        {status.kind === "error" ? (
          <span
            className="inline-flex h-9 max-w-[260px] items-center gap-2 truncate rounded-full border border-red-300/60 bg-red-50/80 px-3 text-xs font-semibold text-[#9f3429] shadow-inset"
            title={status.message}
          >
            <TriangleAlert className="size-4" />
            同步失败
          </span>
        ) : null}
      </div>
      {status.kind === "syncing" ? (
        <p className="text-xs text-muted">正在读取飞书分页并写入后端，通常 10–30 秒完成，可以继续在其他页面操作。</p>
      ) : status.kind === "done" ? (
        <p className="text-xs text-muted">{status.message}</p>
      ) : (
        <p className="text-xs text-muted">只读拉取飞书 Sheet，不会修改飞书数据</p>
      )}
    </div>
  );
}
