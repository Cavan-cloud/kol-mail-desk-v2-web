"use client";

import { Edit3, FileText, Loader2, MailPlus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";
import type { EmailTemplate } from "@/lib/api-client/templates";

function isUserTemplate(template: EmailTemplate): boolean {
  return Boolean(template.createdBy);
}

function templateId(template: EmailTemplate): string {
  return template.id ?? "";
}

export function TemplateLibrary({ templates }: { templates: EmailTemplate[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hiddenBuiltinIds, setHiddenBuiltinIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates
      .filter((template) => {
        const id = templateId(template);
        return id && !hiddenBuiltinIds.includes(id);
      })
      .filter((template) => {
        if (!normalizedQuery) return true;
        return [template.name, template.scenario, template.subject, template.body]
          .filter(Boolean)
          .join("\n")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [hiddenBuiltinIds, query, templates]);

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      await apiClient.templates.create(templatePayload(formData));
      setMessage("模板已创建");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function updateTemplate(template: EmailTemplate, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = templateId(template);
    if (!id) return;
    setSavingId(id);
    setMessage(null);
    try {
      const formData = new FormData(event.currentTarget);
      await apiClient.templates.update(id, templatePayload(formData));
      setMessage("模板已更新");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteTemplate(template: EmailTemplate) {
    if (!window.confirm("确认删除这个模板？")) return;
    const id = templateId(template);
    if (!isUserTemplate(template)) {
      if (id) setHiddenBuiltinIds((next) => [...next, id]);
      return;
    }
    if (!id) return;
    setDeletingId(id);
    setMessage(null);
    try {
      await apiClient.templates.remove(id);
      setMessage("模板已删除");
      router.refresh();
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="glass-card flex flex-col gap-3 rounded-[2rem] p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            aria-label="搜索模板"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索模板名称、场景、主题或正文关键词"
            className="field-glass h-10 w-full pl-9 pr-3 text-sm"
          />
        </div>
        <span className="text-sm text-muted">
          显示 {visibleTemplates.length} / {templates.length}
        </span>
      </div>

      <form onSubmit={createTemplate} className="glass-card-strong grid gap-3 rounded-[2rem] p-4">
        <div className="flex items-center gap-2">
          <MailPlus className="size-4 text-accent" />
          <h2 className="m-0 text-base font-semibold">新建模板</h2>
        </div>
        <TemplateFields />
        <div className="flex items-center justify-between gap-3">
          {message ? <span className="text-sm text-muted">{message}</span> : <span />}
          <button type="submit" disabled={creating} className="primary-island-button h-10">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <MailPlus className="size-4" />}
            保存模板
          </button>
        </div>
      </form>

      {visibleTemplates.map((template) => {
        const id = templateId(template);
        return (
        <article key={id || template.name} className="glass-card-strong rounded-[2rem] p-4">
          {editingId === id ? (
            <form onSubmit={(event) => updateTemplate(template, event)} className="grid gap-3">
              <TemplateFields template={template} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingId(null)} className="island-button h-9 px-3">
                  <X className="size-4" />
                  取消
                </button>
                <button type="submit" disabled={savingId === id} className="primary-island-button h-9 px-3">
                  {savingId === id ? <Loader2 className="size-4 animate-spin" /> : <Edit3 className="size-4" />}
                  保存修改
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent">
                    <FileText className="size-4" />
                    {template.scenario}
                  </div>
                  <h2 className="m-0 text-lg font-semibold tracking-tight">{template.name}</h2>
                  <p className="m-0 mt-1 text-sm text-muted">主题：{template.subject}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex h-9 items-center rounded-full bg-white/70 px-3 text-xs font-semibold text-muted shadow-inset">
                    使用 {template.usedCount ?? 0}
                  </span>
                  <span className="inline-flex h-9 items-center rounded-full bg-white/70 px-3 text-xs font-semibold text-muted shadow-inset">
                    {isUserTemplate(template) ? "我的模板" : "内置示例"}
                  </span>
                  {template.lastUsedAt ? (
                    <span className="inline-flex h-9 items-center rounded-full bg-white/70 px-3 text-xs font-semibold text-muted shadow-inset">
                      最近 {formatDate(template.lastUsedAt)}
                    </span>
                  ) : null}
                  {isUserTemplate(template) && id ? (
                    <button type="button" onClick={() => setEditingId(id)} className="island-button h-9 px-3">
                      <Edit3 className="size-4" />
                      编辑
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteTemplate(template)}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-[#f0c6c0] bg-white/75 px-3 text-sm font-semibold text-[#9f3429] shadow-inset transition duration-300 ease-fluid hover:bg-[#fff6f5]"
                  >
                    {deletingId === id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    删除
                  </button>
                </div>
              </div>
              <pre className="m-0 max-h-60 overflow-auto whitespace-pre-wrap rounded-2xl border border-white/70 bg-white/[0.68] p-3 font-sans text-sm leading-6 text-ink shadow-inset">
                {template.body}
              </pre>
            </>
          )}
        </article>
        );
      })}
      {visibleTemplates.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/80 bg-white/[0.58] p-8 text-center text-sm text-muted shadow-inset">
          暂无匹配模板。
        </div>
      ) : null}
    </div>
  );
}

function TemplateFields({ template }: { template?: EmailTemplate }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">模板名称</span>
          <input name="name" required defaultValue={template?.name} placeholder="如：初次触达" className="field-glass h-10 px-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">场景</span>
          <input name="scenario" defaultValue={template?.scenario ?? ""} placeholder="如：冷启动外联" className="field-glass h-10 px-3" />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">主题</span>
        <input name="subject" required defaultValue={template?.subject} placeholder="邮件主题" className="field-glass h-10 px-3" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">正文</span>
        <textarea
          name="body"
          required
          defaultValue={template?.body}
          placeholder="邮件正文，支持变量 {{name}} 等"
          className="text-field-glass min-h-[120px] resize-y p-3 leading-6"
        />
      </label>
    </>
  );
}

function templatePayload(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    scenario: String(formData.get("scenario") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
