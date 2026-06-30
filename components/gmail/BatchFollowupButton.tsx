"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";

export type BatchFollowupCandidate = {
  kolId: string;
  name: string;
  to: string;
  subject: string;
};

type Props = {
  candidates: BatchFollowupCandidate[];
};

export function BatchFollowupButton({ candidates }: Props) {
  const [open, setOpen] = useState(false);
  const [ccText, setCcText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendBatch() {
    if (candidates.length === 0) {
      setMessage("当前列表没有可批量跟进的未回复达人。");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const ccEmails = parseEmailList(ccText);
      const result = await apiClient.gmail.batchSend({
        items: candidates.map((candidate) => ({
          kolId: candidate.kolId,
          to: candidate.to,
          ccEmails,
          subject: candidate.subject,
          englishBody: buildFollowupBody(candidate.name),
          chineseDraft: `${candidate.name}，你好，想跟进确认一下上一封邮件是否方便回复。`,
          reviewed: true,
        })),
      });
      setMessage(
        `批量任务完成：成功 ${result.successCount ?? 0}，失败 ${result.failedCount ?? 0}`
      );
    } catch (error) {
      setMessage(
        isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "批量发送失败"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title={
          candidates.length > 0
            ? `给当前列表中 ${candidates.length} 位未回复达人批量发送英文跟进邮件（需逐项确认）。`
            : "当前列表没有超过 3 天未回复的达人，暂无可跟进对象。"
        }
        className="island-button h-9 px-3"
      >
        <Send className="size-4" />
        批量跟进
        {candidates.length > 0 ? (
          <span className="rounded-full bg-lovart-soft px-1.5 text-[11px] font-semibold text-[#9a5a00]">
            {candidates.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass-card-strong absolute right-0 z-20 mt-3 w-[min(92vw,400px)] rounded-3xl p-4 text-sm">
          <div className="font-semibold text-ink">批量跟进确认</div>
          <p className="m-0 mt-2 leading-6 text-muted">
            将给当前列表中 {candidates.length} 位未回复达人发送英文跟进邮件。请确认文案和收件人后再发送。
          </p>

          <label className="mt-3 grid gap-1">
            <span className="font-medium text-ink">统一 CC 邮箱</span>
            <input
              value={ccText}
              onChange={(event) => setCcText(event.target.value)}
              placeholder="多个邮箱用逗号、分号或空格分隔"
              className="field-glass h-10 px-3"
            />
          </label>

          <div className="mt-3 max-h-32 overflow-auto rounded-2xl border border-white/70 bg-white/[0.62] p-3 text-xs leading-5 text-muted shadow-inset">
            {candidates.length ? (
              candidates.map((candidate) => (
                <div key={candidate.kolId}>
                  {candidate.name} · {candidate.to}
                </div>
              ))
            ) : (
              <div>暂无可发送对象</div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            {message ? <span className="min-w-0 flex-1 text-xs text-muted">{message}</span> : <span />}
            <button
              type="button"
              disabled={loading || candidates.length === 0}
              onClick={sendBatch}
              className="primary-island-button h-9 px-3"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              确认发送
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildFollowupBody(name: string) {
  return `Hi ${name},\n\nJust following up on my previous email. Please let me know if you are interested or if there is a better contact for this collaboration.\n\nBest,\nChloe`;
}

function parseEmailList(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
