"use client";

import { CheckCheck, Loader2, Undo2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";

export function ReplyResolvedButton({ kolId, initialResolved }: { kolId: string; initialResolved: boolean }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(initialResolved);

  useEffect(() => {
    setResolved(initialResolved);
  }, [kolId, initialResolved]);

  async function toggle() {
    const next = !resolved;
    setLoading(true);
    try {
      await apiClient.kols.update(kolId, { replyResolved: next });
      setResolved(next);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.kol.detail(kolId) }),
      ]);
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  const Icon = loading ? Loader2 : resolved ? Undo2 : CheckCheck;
  const label = resolved ? "取消「无需回复」" : "标记无需回复";
  const title = resolved
    ? "已手动标记为「无需回复」，该达人暂不计入需回复列表。点击撤销此标记。"
    : "标记该会话无需回复，将该达人从「需我回复」中移除（下次有新来信会自动恢复）。";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      title={title}
      className={`focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
        resolved
          ? "border-accent/30 bg-[#e7f3f0] text-accent hover:bg-[#dcefea]"
          : "border-white/70 bg-white/72 text-muted shadow-inset hover:bg-white hover:text-ink"
      }`}
    >
      <Icon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}
