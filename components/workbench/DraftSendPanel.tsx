"use client";

import { CheckCircle2, ClipboardCheck, FileText, Languages, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { RichTextEditor, htmlToPlainText, isEditorEmpty } from "@/components/common/RichTextEditor";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";
import { renderTemplateText, type TemplateRenderInput } from "@/lib/template-render";

type Props = {
  kolId: string;
  kolName: string;
  kolStage?: string;
  kolPlatform?: string;
  kolAgreedPrice?: number | null;
  kolHandle?: string | null;
  kolHomepageUrl?: string | null;
  senderName?: string;
  operatorName?: string | null;
  to: string;
  subject: string;
  latestEmail: string;
  history: string;
  initialChineseDraft: string;
  initialEnglishBody: string;
  templates: Array<{
    id: string;
    name: string;
    scenario: string;
    subject: string;
    body: string;
    createdBy?: string | null;
  }>;
};

export function DraftSendPanel({
  kolId,
  kolName,
  kolStage,
  kolPlatform,
  kolAgreedPrice,
  kolHandle,
  kolHomepageUrl,
  senderName = "Chloe",
  operatorName,
  to,
  subject,
  latestEmail,
  history,
  initialChineseDraft,
  initialEnglishBody,
  templates
}: Props) {
  const router = useRouter();
  const [ccText, setCcText] = useState("");
  const [chineseDraft, setChineseDraft] = useState(initialChineseDraft);
  // The English body is rich text (HTML). Existing AI/template content arrives
  // as plain text; we wrap it in <p> blocks so the Tiptap editor shows it as
  // structured content rather than one long line.
  const [englishBody, setEnglishBody] = useState(() => plainTextToHtml(initialEnglishBody));
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkIssues, setCheckIssues] = useState<string[] | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [reviewed, setReviewed] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const ccEmails = useMemo(() => parseEmailList(ccText), [ccText]);
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );
  const selectedTemplateIdForSend = selectedTemplate?.createdBy ? selectedTemplate.id : null;

  useEffect(() => {
    if (!expanded) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const templateRenderInput: TemplateRenderInput = useMemo(
    () => ({
      kolName,
      kolHandle,
      platform: kolPlatform,
      agreedPrice: kolAgreedPrice,
      homepageUrl: kolHomepageUrl,
      operatorName,
      stage: kolStage,
    }),
    [kolAgreedPrice, kolHandle, kolHomepageUrl, kolName, kolPlatform, kolStage, operatorName]
  );

  async function send() {
    if (!reviewed) {
      setMessage("发送前请勾选「已确认」。");
      return;
    }
    if (isEditorEmpty(englishBody)) {
      setMessage("英文发送稿不能为空。");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const englishPlain = htmlToPlainText(englishBody);
      const result = await apiClient.gmail.send({
        kolId,
        to,
        ccEmails,
        subject,
        englishBody: englishPlain,
        englishBodyHtml: englishBody,
        chineseDraft,
        templateId: selectedTemplateIdForSend ?? undefined,
        reviewed: true,
      });
      setMessage(result.message ?? "发送请求已提交");
      if (result.status === "sent") router.refresh();
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "发送失败");
    } finally {
      setLoading(false);
    }
  }

  async function generateDraft() {
    setDrafting(true);
    setMessage(null);
    setCheckIssues(null);
    try {
      const result = await apiClient.ai.draft({
        kolName,
        senderName,
        latestEmail,
        history,
        templateHint: selectedTemplate
          ? `${selectedTemplate.scenario}\n主题参考：${selectedTemplate.subject}\n正文参考：${selectedTemplate.body}`
          : "Keep it short, polite, and action-oriented for a KOL collaboration email.",
        kolStage,
        kolPlatform,
        kolAgreedPrice,
      });
      if (!result.englishDraft || !result.chineseDraft) {
        throw new Error("草稿生成失败");
      }
      setEnglishBody(plainTextToHtml(result.englishDraft));
      setChineseDraft(result.chineseDraft);
      setMessage("AI 草稿已生成，请人工确认后再发送。");
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "草稿生成失败");
    } finally {
      setDrafting(false);
    }
  }

  async function checkDraftContent() {
    const plainText = htmlToPlainText(englishBody).trim();
    if (plainText.length < 50) {
      setMessage("请先填写英文发送稿再检查。");
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const result = await apiClient.ai.check({
        draft: plainText,
        context: [kolStage, kolPlatform, kolName].filter(Boolean).join(" / ") || undefined,
      });
      setCheckIssues((result.issues ?? []).map((issue) => issue.message ?? "未知问题"));
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "检查失败");
    } finally {
      setChecking(false);
    }
  }

  async function scheduleSend() {
    if (!reviewed) {
      setMessage("定时发送前请勾选「已确认」。");
      return;
    }
    if (!scheduledAt) {
      setMessage("请选择定时发送时间。");
      return;
    }
    if (isEditorEmpty(englishBody)) {
      setMessage("英文发送稿不能为空。");
      return;
    }
    setScheduling(true);
    setMessage(null);
    try {
      await apiClient.scheduled.create({
        kolId,
        templateId: selectedTemplateIdForSend ?? undefined,
        to,
        ccEmails,
        subject,
        englishBody: htmlToPlainText(englishBody),
        englishBodyHtml: englishBody,
        chineseDraft,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      setMessage("已保存定时邮件。发送前仍可在后续任务列表中取消。");
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "创建定时邮件失败");
    } finally {
      setScheduling(false);
    }
  }

  function insertSelectedTemplate() {
    if (!selectedTemplate) {
      setMessage("请先选择邮件模板。");
      return;
    }
    const renderedBody = renderTemplateText(selectedTemplate.body, templateRenderInput);
    setEnglishBody(plainTextToHtml(renderedBody));
    setChineseDraft(renderTemplateText(selectedTemplate.body, templateRenderInput));
    setCheckIssues(null);
    setMessage(`已插入模板「${selectedTemplate.name}」，请人工确认后再发送。`);
  }

  async function translateChineseToEnglish() {
    if (!chineseDraft.trim()) {
      setMessage("请先填写中文编辑稿。");
      return;
    }

    setTranslating(true);
    setMessage(null);
    try {
      const result = await apiClient.ai.translate({ text: chineseDraft, targetLang: "en" });
      if (!result.translated) throw new Error("翻译失败");
      setEnglishBody(plainTextToHtml(result.translated));
      setMessage("已将中文编辑稿翻译为英文发送稿，请人工确认。");
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "翻译失败");
    } finally {
      setTranslating(false);
    }
  }

  function panelInner(isExpanded: boolean) {
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-lovart shadow-[0_0_0_4px_rgba(240,182,90,0.16)]" />
              <h3 className="m-0 text-sm font-semibold">撰写回复</h3>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-muted shadow-inset">
                AI 辅助
              </span>
            </div>
            <p className="m-0 mt-1 text-xs text-muted">
              收件人：{to}
              {ccEmails.length ? ` · CC ${ccEmails.length}` : ""} · 中文用于编辑，英文用于发送。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={translating} className="island-button h-9 px-3" onClick={translateChineseToEnglish}>
              <Languages className="size-4" />
              {translating ? "翻译中" : "中译英"}
            </button>
            <button type="button" disabled={drafting} className="island-button h-9 px-3" onClick={generateDraft}>
              <Languages className="size-4" />
              {drafting ? "生成中" : "AI 生成回复"}
            </button>
            <button
              type="button"
              disabled={checking || isEditorEmpty(englishBody)}
              className="island-button h-9 px-3"
              onClick={checkDraftContent}
              title="AI 检查草稿是否包含必要内容"
            >
              <ClipboardCheck className="size-4" />
              {checking ? "检查中" : "📋 检查"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="island-button h-9 px-3"
              title={isExpanded ? "退出全屏" : "全屏撰写"}
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              {isExpanded ? "退出全屏" : "全屏"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">邮件模板</span>
            <div className="flex gap-2">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="field-glass h-10 min-w-0 flex-1 px-3 text-sm"
              >
                <option value="">不使用模板，直接让 AI 判断</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.scenario} / {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedTemplate}
                onClick={insertSelectedTemplate}
                className="island-button h-10 shrink-0 px-3"
                title="将模板正文插入编辑器（变量已替换）"
              >
                <FileText className="size-4" />
                插入
              </button>
            </div>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">CC 邮箱</span>
            <input
              value={ccText}
              onChange={(event) => setCcText(event.target.value)}
              placeholder="多个邮箱用逗号、分号或空格分隔"
              className="field-glass h-10 px-3 text-sm"
            />
          </label>
        </div>

        <div className={`grid gap-4 ${isExpanded ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          <DraftBox
            title="中文编辑稿"
            value={chineseDraft}
            onChange={setChineseDraft}
            heightClass={isExpanded ? "min-h-[60vh]" : "min-h-[220px]"}
          />
          <label className="grid gap-2">
            <span className="text-sm font-medium">英文发送稿（富文本）</span>
            <RichTextEditor
              value={englishBody}
              onChange={(val) => { setEnglishBody(val); setCheckIssues(null); }}
              heightClass={isExpanded ? "min-h-[60vh]" : "min-h-[220px]"}
              placeholder="可使用工具栏加粗、配色、列表与链接，发送时将作为 HTML 邮件投递。"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">定时发送</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minScheduleLocalValue()}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="field-glass h-10 px-3 text-sm"
            />
          </label>
          <div className="flex items-end">
            <label className="flex w-full items-center justify-between gap-2 rounded-2xl border border-lovart/25 bg-lovart-soft px-3 py-2.5 text-xs text-[#9a5a00] shadow-inset">
              <span className="font-semibold">发送前请人工确认内容</span>
              <span className="inline-flex items-center gap-2 text-[#6f4700]">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(event) => setReviewed(event.target.checked)}
                  className="size-4 rounded border-lovart/40 accent-[#f0b65a]"
                />
                已确认
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {message ? <span className="mr-auto text-sm text-muted">{message}</span> : null}
          {checkIssues !== null && (
            <div className="mr-auto w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {checkIssues.length === 0 ? (
                <span className="font-medium text-emerald-700">✓ 草稿看起来没问题</span>
              ) : (
                <ul className="m-0 list-none space-y-1 p-0">
                  {checkIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <button type="button" disabled={scheduling} onClick={scheduleSend} className="island-button h-10">
            {scheduling ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            保存定时发送
          </button>
          <button type="button" disabled={loading || !reviewed} onClick={send} className="primary-island-button h-10">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            确认发送英文稿
          </button>
        </div>
      </div>
    );
  }

  const overlay =
    expanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] grid animate-[fadeIn_160ms_ease-out] place-items-center bg-ink/40 p-3 backdrop-blur-sm lg:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="全屏撰写邮件"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setExpanded(false);
            }}
          >
            <div className="glass-card-strong desk-scroll flex h-[min(94vh,920px)] w-[min(96vw,1200px)] animate-[popIn_200ms_cubic-bezier(0.32,0.72,0,1)] flex-col overflow-y-auto rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="m-0 truncate text-lg font-semibold tracking-tight">撰写回复 · {kolName}</h2>
                  <p className="m-0 mt-0.5 truncate text-xs text-muted">{subject}</p>
                </div>
                <button type="button" onClick={() => setExpanded(false)} className="island-button h-9 px-3" title="退出全屏 (Esc)">
                  <Minimize2 className="size-4" />
                  退出全屏
                </button>
              </div>
              {panelInner(true)}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="glass-card-strong grid gap-4 rounded-2xl p-4">{panelInner(false)}</div>
      {overlay}
    </>
  );
}

function DraftBox({
  title,
  value,
  onChange,
  heightClass
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  heightClass: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{title}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`text-field-glass resize-y p-3 text-sm leading-6 ${heightClass}`}
      />
    </label>
  );
}

function plainTextToHtml(text: string): string {
  if (!text) return "";
  // Already HTML (AI/template content sometimes is) → leave as-is so we never
  // double-escape Tiptap's own markup.
  if (/<\/?(p|div|br|strong|em|ul|ol|li|a|span)\b/i.test(text)) return text;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\r?\n\r?\n+/)
    .map((para) => `<p>${para.replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}

function parseEmailList(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function minScheduleLocalValue() {
  const next = new Date(Date.now() + 5 * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}
