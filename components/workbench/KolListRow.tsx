import Link from "next/link";
import { KOL_STAGES, PRIORITY_LABELS } from "@/lib/domain";
import type { KolWithLatestEmail } from "@/lib/workbench";

export function KolListRow({
  kol,
  href,
  selected
}: {
  kol: KolWithLatestEmail;
  href: string;
  selected: boolean;
}) {
  const unread = kol.unreadCount > 0;
  const stageLabel = KOL_STAGES.find((item) => item.id === kol.stage)?.label;
  // 只有「对方来信(inbound) + high」才算需我处理的高优先级；自己发出的外联不标红。
  const inboundHigh = kol.latestEmail?.direction === "inbound" && kol.latestEmail.aiPriority === "high";

  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={`focus-ring relative block border-b border-white/45 px-4 py-2.5 transition duration-300 ease-fluid ${
        selected ? "bg-white/[0.78] shadow-inset" : "hover:bg-white/55"
      }`}
    >
      {selected ? <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-accent" /> : null}
      <div className="flex items-center gap-2">
        <span
          className={`size-2 shrink-0 rounded-full ${unread ? "bg-lovart shadow-[0_0_0_3px_rgba(240,182,90,0.18)]" : "bg-transparent"}`}
          aria-hidden
        />
        <span className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-semibold text-ink" : "font-medium text-ink/90"}`}>
          {kol.name ?? kol.email}
        </span>
        {kol.latestEmail ? (
          <time className="shrink-0 text-xs tabular-nums text-muted">{formatShort(kol.latestEmail.sentAt)}</time>
        ) : null}
      </div>

      <p className="m-0 mt-0.5 truncate pl-4 text-xs text-muted">
        {kol.latestEmail?.subject ?? kol.email}
      </p>
      <p className="m-0 mt-0.5 truncate pl-4 text-xs text-muted/80">
        {kol.latestEmail?.aiSummary ?? "暂无邮件摘要"}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-4">
        {stageLabel ? (
          <span className="rounded-full bg-[#e7f3f0] px-2 py-0.5 text-[11px] font-semibold text-accent">
            {stageLabel}
            {kol.stageOverride ? " (校准)" : ""}
          </span>
        ) : null}
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-muted shadow-inset">@{kol.ownerName}</span>
        {kol.unreplied ? (
          <span className="rounded-full bg-[#f7eded] px-2 py-0.5 text-[11px] font-semibold text-[#9f3429]">需我回复</span>
        ) : kol.awaitingReply ? (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-muted shadow-inset">等待对方</span>
        ) : null}
        {kol.latestEmail ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              inboundHigh ? "bg-[#f7eded] text-[#9f3429]" : "bg-white/70 text-muted shadow-inset"
            }`}
          >
            {PRIORITY_LABELS[kol.latestEmail.aiPriority]}
          </span>
        ) : null}
        {unread ? (
          <span className="ml-auto rounded-full bg-lovart-soft px-2 py-0.5 text-[11px] font-semibold text-[#9a5a00]">
            未读 {kol.unreadCount}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function formatShort(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date);
}
