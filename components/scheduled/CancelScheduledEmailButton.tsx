"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";

export function CancelScheduledEmailButton({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!window.confirm("确认取消这封定时邮件？")) return;
    setLoading(true);
    try {
      await apiClient.scheduled.cancel(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.scheduled.list });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={cancel}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#f0c6c0] bg-white/75 px-3 text-sm font-semibold text-[#9f3429] shadow-inset transition duration-300 ease-fluid hover:bg-[#fff6f5] disabled:opacity-60"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
      取消
    </button>
  );
}
