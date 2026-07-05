"use client";

import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/lib/api-client";
import type { SendEmailResult } from "@/lib/api-client/gmail";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";
import {
  BATCH_FOLLOWUP_BODY_TEMPLATE,
  batchFollowupEstimatedSeconds,
  renderBatchFollowupBody,
  type BatchFollowupCandidate,
} from "@/lib/batch-followup";
import { renderTemplateText } from "@/lib/template-render";

export type { BatchFollowupCandidate };

type TemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type ItemProgress = {
  kolId: string;
  name: string;
  status: SendEmailResult["status"] | "pending";
  detail?: string | null;
};

type Props = {
  candidates: BatchFollowupCandidate[];
  templates?: TemplateOption[];
  senderName?: string;
};

export function BatchFollowupButton({ candidates, templates = [], senderName = "Chloe" }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [ccText, setCcText] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState(BATCH_FOLLOWUP_BODY_TEMPLATE);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [itemProgress, setItemProgress] = useState<ItemProgress[]>([]);

  const previewCandidate = candidates[0] ?? null;
  const previewSubject = previewCandidate?.subject ?? "Following up on collaboration";
  const previewBody = useMemo(() => {
    if (!previewCandidate) return bodyTemplate;
    return renderBatchFollowupBody(bodyTemplate, previewCandidate.name, senderName);
  }, [bodyTemplate, previewCandidate, senderName]);

  useEffect(() => {
    if (!open) {
      setReviewConfirmed(false);
      setSelectedTemplateId("");
      setBodyTemplate(BATCH_FOLLOWUP_BODY_TEMPLATE);
      setMessage(null);
      setItemProgress([]);
    }
  }, [open]);

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setBodyTemplate(BATCH_FOLLOWUP_BODY_TEMPLATE);
      return;
    }
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setBodyTemplate(
      renderTemplateText(template.body, {
        kolName: previewCandidate?.name ?? "{{kol_name}}",
        operatorName: senderName,
      }) || BATCH_FOLLOWUP_BODY_TEMPLATE
    );
  }

  async function sendBatch() {
    if (candidates.length === 0) {
      setMessage("当前列表没有可批量跟进的未回复达人。");
      return;
    }
    if (!reviewConfirmed) {
      setMessage("请先勾选「我已确认英文文案和收件人」。");
      return;
    }

    setLoading(true);
    setMessage(`正在批量发送…（预计约 ${batchFollowupEstimatedSeconds(candidates.length)} 秒）`);
    setItemProgress(
      candidates.map((candidate) => ({
        kolId: candidate.kolId,
        name: candidate.name,
        status: "pending",
      }))
    );
    try {
      const ccEmails = parseEmailList(ccText);
      const result = await apiClient.gmail.batchSend({
        items: candidates.map((candidate) => ({
          kolId: candidate.kolId,
          to: candidate.to,
          ccEmails,
          subject: candidate.subject,
          englishBody: renderBatchFollowupBody(bodyTemplate, candidate.name, senderName),
          chineseDraft: `${candidate.name}，你好，想跟进确认一下上一封邮件是否方便回复。`,
          reviewed: true,
        })),
      });
      const results = result.results ?? [];
      setItemProgress(
        candidates.map((candidate, index) => {
          const item = results[index];
          return {
            kolId: candidate.kolId,
            name: candidate.name,
            status: item?.status ?? "failed",
            detail: item?.message ?? null,
          };
        })
      );
      setMessage(
        `批量任务完成：成功 ${result.successCount ?? 0}，失败 ${result.failedCount ?? 0}`
      );
      if ((result.successCount ?? 0) > 0) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all });
      }
    } catch (error) {
      setItemProgress([]);
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

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="批量跟进确认"
            >
              <button
                type="button"
                aria-label="关闭"
                className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />
              <div className="glass-card-strong desk-scroll relative z-[71] max-h-[min(92vh,720px)] w-[min(92vw,520px)] overflow-y-auto rounded-3xl p-4 text-sm shadow-xl">
                <div className="font-semibold text-ink">批量跟进确认</div>
                <p className="m-0 mt-2 leading-6 text-muted">
                  将给当前列表中 {candidates.length} 位未回复达人发送英文跟进邮件。请确认主题、正文和收件人后再发送。
                </p>

                {templates.length > 0 ? (
                  <label className="mt-3 grid gap-1">
                    <span className="font-medium text-ink">邮件模板（可选）</span>
                    <select
                      value={selectedTemplateId}
                      onChange={(event) => applyTemplate(event.target.value)}
                      className="field-glass h-10 px-3"
                    >
                      <option value="">默认跟进文案</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="mt-3 grid gap-1">
                  <span className="font-medium text-ink">邮件主题（按各达人最新邮件自动生成 Re:）</span>
                  <div className="field-glass min-h-10 px-3 py-2 text-muted">{previewSubject}</div>
                </label>

                <label className="mt-3 grid gap-1">
                  <span className="font-medium text-ink">英文正文模板</span>
                  <span className="text-xs text-muted">
                    支持 {"{{kol_name}}"}、{"{{sender_name}}"}；发送时会按每位达人姓名替换。
                  </span>
                  <textarea
                    value={bodyTemplate}
                    onChange={(event) => {
                      setBodyTemplate(event.target.value);
                      setSelectedTemplateId("");
                    }}
                    rows={8}
                    className="text-field-glass min-h-[160px] w-full resize-y px-3 py-2 font-mono text-xs leading-5"
                  />
                </label>

                <div className="mt-3 grid gap-1">
                  <span className="font-medium text-ink">预览（以 {previewCandidate?.name ?? "首位达人"} 为例）</span>
                  <pre className="m-0 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/70 bg-white/[0.62] p-3 text-xs leading-5 text-muted shadow-inset">
                    {previewBody}
                  </pre>
                </div>

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
                  {itemProgress.length > 0 ? (
                    itemProgress.map((item) => (
                      <div key={item.kolId} className="flex items-start gap-2 py-0.5">
                        <ProgressIcon status={item.status} loading={loading && item.status === "pending"} />
                        <span className="min-w-0">
                          <span className="font-medium text-ink">{item.name}</span>
                          {item.detail ? <span className="text-muted"> · {item.detail}</span> : null}
                        </span>
                      </div>
                    ))
                  ) : candidates.length ? (
                    candidates.map((candidate) => (
                      <div key={candidate.kolId}>
                        {candidate.name} · {candidate.to} · {candidate.subject}
                      </div>
                    ))
                  ) : (
                    <div>暂无可发送对象</div>
                  )}
                </div>

                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted">
                  <input
                    type="checkbox"
                    checked={reviewConfirmed}
                    onChange={(event) => setReviewConfirmed(event.target.checked)}
                    className="mt-0.5 size-4 accent-[#0f766e]"
                  />
                  <span>我已确认英文文案和收件人，同意批量发送。</span>
                </label>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {message ? <span className="min-w-0 flex-1 text-xs text-muted">{message}</span> : <span />}
                  <button
                    type="button"
                    disabled={loading || candidates.length === 0 || !reviewConfirmed}
                    onClick={sendBatch}
                    className="primary-island-button h-9 px-3"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    确认发送
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function parseEmailList(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ProgressIcon({
  status,
  loading,
}: {
  status: ItemProgress["status"];
  loading: boolean;
}) {
  if (loading) {
    return <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted" />;
  }
  if (status === "sent") {
    return <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />;
  }
  if (status === "pending") {
    return <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted" />;
  }
  return <XCircle className="mt-0.5 size-3.5 shrink-0 text-[#9f3429]" />;
}
