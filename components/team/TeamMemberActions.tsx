"use client";

import { Loader2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";

type Props = {
  userId: string;
  status: string;
};

export function TeamMemberActions({ userId, status }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function depart() {
    if (!window.confirm("确认将该成员标记离职，并将其名下 active 达人放入团队池？")) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiClient.team.depart(userId);
      const count = result.orphanedCount ?? 0;
      setMessage(`已标记离职，${count} 位达人已进入团队池。`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.team.members });
      router.refresh();
    } catch (error) {
      setMessage(
        isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "离职处理失败"
      );
    } finally {
      setLoading(false);
    }
  }

  if (status !== "active") {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={depart}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[#f0c6c0] bg-white/75 px-3 text-sm font-semibold text-[#9f3429] shadow-inset transition duration-300 ease-fluid hover:bg-[#fff6f5] disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
        标记离职
      </button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </div>
  );
}
