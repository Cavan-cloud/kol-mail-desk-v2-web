"use client";

import { CalendarClock, Clock3, XCircle } from "lucide-react";
import { RequireAuth } from "@/components/shell/RequireAuth";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { CancelScheduledEmailButton } from "@/components/scheduled/CancelScheduledEmailButton";
import { useScheduledQuery } from "@/lib/api-client/queries";

const STATUS_LABELS = {
  scheduled: "待发送",
  processing: "发送中",
  sent: "已发送",
  failed: "失败",
} as const;

function ScheduledPageInner() {
  const scheduledQuery = useScheduledQuery();
  const rows = scheduledQuery.data?.data ?? [];
  const scheduledCount = rows.filter((row) => row.status === "scheduled").length;
  const failedCount = rows.filter((row) => row.status === "failed").length;

  return (
    <AppShell activeHref="/scheduled" title="定时邮件" headerActions={<SignOutButton />}>
      <div className="mx-auto max-w-[1280px] p-4 lg:p-6">
        {scheduledQuery.isLoading ? (
          <PageSpinner label="加载定时邮件…" />
        ) : scheduledQuery.isError ? (
          <div className="text-center text-sm text-[#9f3429]">加载定时邮件失败，请刷新重试。</div>
        ) : (
          <>
            <section className="mb-5 grid gap-3 md:grid-cols-3">
              <Summary icon={<CalendarClock className="size-5" />} label="全部计划" value={rows.length} />
              <Summary icon={<Clock3 className="size-5" />} label="待发送" value={scheduledCount} />
              <Summary icon={<XCircle className="size-5" />} label="失败" value={failedCount} />
            </section>

            <section className="glass-card-strong overflow-hidden rounded-[2rem]">
              <div className="grid grid-cols-[1fr_1fr_180px_120px_120px_120px] border-b border-white/70 bg-white/[0.58] px-5 py-3 text-xs font-semibold text-muted">
                <div>达人 / 收件人</div>
                <div>主题</div>
                <div>发送时间</div>
                <div>尝试</div>
                <div>状态</div>
                <div className="text-right">操作</div>
              </div>
              <div className="divide-y divide-white/70">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1fr_180px_120px_120px_120px] items-center gap-3 px-5 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{row.kolName ?? "—"}</div>
                      <div className="mt-1 truncate text-xs text-muted">{row.toEmail}</div>
                    </div>
                    <div className="truncate text-muted">{row.subject}</div>
                    <div className="font-mono text-xs text-muted">
                      {row.scheduledAt ? formatDate(row.scheduledAt) : "—"}
                    </div>
                    <div className="font-mono text-xs text-muted">{row.attemptCount ?? 0}/3</div>
                    <StatusPill status={row.status ?? "scheduled"} error={row.lastError} />
                    <div className="text-right">
                      {row.status === "scheduled" && row.id ? (
                        <CancelScheduledEmailButton id={row.id} />
                      ) : null}
                    </div>
                  </div>
                ))}
                {rows.length === 0 ? (
                  <div className="grid min-h-[320px] place-items-center text-sm text-muted">
                    暂无定时邮件。可以在工作台草稿面板里选择时间并保存计划。
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="glass-card rounded-3xl p-4">
      <div className="flex items-center justify-between text-muted">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <strong className="mt-2 block font-mono text-3xl tabular-nums">{value}</strong>
    </div>
  );
}

function StatusPill({
  status,
  error,
}: {
  status: keyof typeof STATUS_LABELS;
  error?: string | null;
}) {
  const tone =
    status === "sent"
      ? "bg-[#e7f3f0] text-accent"
      : status === "failed"
        ? "bg-[#f7eded] text-[#9f3429]"
        : status === "processing"
          ? "bg-[#fff8e7] text-[#8a5a00]"
          : "bg-white/70 text-muted";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`} title={error ?? undefined}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ScheduledPage() {
  return (
    <RequireAuth>
      <ScheduledPageInner />
    </RequireAuth>
  );
}
