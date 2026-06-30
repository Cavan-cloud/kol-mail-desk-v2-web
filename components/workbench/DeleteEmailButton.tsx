"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";

export function DeleteEmailButton({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteEmail() {
    if (!window.confirm("确认删除这封邮件？如果该达人没有其他邮件，达人卡片也会一起删除。")) return;
    setLoading(true);
    try {
      await apiClient.emails.remove(emailId);
      router.refresh();
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={deleteEmail}
      className="inline-flex h-8 items-center gap-1 rounded-full border border-[#f0c6c0] bg-white/75 px-2.5 text-xs font-semibold text-[#9f3429] shadow-inset transition duration-300 ease-fluid hover:bg-[#fff6f5] disabled:opacity-60"
    >
      <Trash2 className="size-3.5" />
      删除
    </button>
  );
}
