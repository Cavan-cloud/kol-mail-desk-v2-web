"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";

export function MarkEmailReadButton({
  emailId,
  isRead,
  kolId,
}: {
  emailId: string;
  isRead: boolean;
  kolId?: string;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function flip() {
    setLoading(true);
    try {
      await apiClient.emails.update(emailId, { isRead: !isRead });
      const invalidations = [queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all })];
      if (kolId) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.kol.detail(kolId) }));
      }
      await Promise.all(invalidations);
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "更新已读状态失败");
    } finally {
      setLoading(false);
    }
  }

  const label = isRead ? "标记未读" : "标记已读";
  const Icon = loading ? Loader2 : isRead ? Circle : CheckCircle2;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={flip}
      className="island-button h-8 px-2.5 text-xs"
      title={label}
    >
      <Icon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}
