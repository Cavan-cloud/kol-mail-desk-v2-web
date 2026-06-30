"use client";

import { CheckCheck, Loader2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

// 手动「已处理 / 无需回复」覆盖按钮。
// 业务场景：最新一封是对方来信（系统默认计入「需我回复」），但内容其实是
// "you're welcome" 之类无需回复的客套，用户主动标记，把该达人移出「需我回复」。
// 下一封新的 inbound 会自动清掉该标记（后端 Gmail 同步写入路径）。
export function ReplyResolvedButton({ kolId, initialResolved }: { kolId: string; initialResolved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(initialResolved);

  async function toggle() {
    const next = !resolved;
    setLoading(true);
    try {
      await apiClient.kols.update(kolId, { replyResolved: next });
      setResolved(next);
      router.refresh();
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
