"use client";

import { Inbox, Send } from "lucide-react";
import Link from "next/link";
import type { BoardKol } from "@/lib/api-client/board";
import { BoardPanelTitle } from "@/components/board/BoardPanelTitle";
import { workbenchHref } from "@/lib/workbench-nav";

type Props = {
  items: BoardKol[];
};

export function BoardActivityPanel({ items }: Props) {
  return (
    <section className="glass-card-strong flex flex-col rounded-[2rem] p-5 xl:sticky xl:top-0">
      <BoardPanelTitle eyebrow="Activity" title="最近邮件动态" hint={`${items.length} 条`} />
      <div className="desk-scroll mt-4 grid max-h-[58vh] min-h-0 gap-1.5 overflow-y-auto">
        {items.map((kol) => (
          <Link
            key={kol.id}
            href={workbenchHref({ view: "all", stage: "all", kol: kol.id ?? null })}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 rounded-xl border border-white/60 bg-white/55 px-3 py-2 shadow-inset transition duration-200 hover:bg-white"
          >
            <span
              className={`mt-0.5 grid size-6 place-items-center rounded-full ${
                kol.latestEmail?.direction === "inbound"
                  ? "bg-[#e7f3f0] text-accent"
                  : "bg-white/70 text-muted shadow-inset"
              }`}
            >
              {kol.latestEmail?.direction === "inbound" ? (
                <Inbox className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{kol.name}</span>
              <span className="block truncate text-xs text-muted">{kol.latestEmail?.subject}</span>
            </span>
            <span className="whitespace-nowrap text-[11px] tabular-nums text-muted">
              {kol.latestEmail?.sentAt ? formatShort(kol.latestEmail.sentAt) : ""}
            </span>
          </Link>
        ))}
        {items.length === 0 ? (
          <p className="m-0 grid min-h-[140px] place-items-center text-sm text-muted">暂无邮件动态。</p>
        ) : null}
      </div>
    </section>
  );
}

function formatShort(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date);
}
