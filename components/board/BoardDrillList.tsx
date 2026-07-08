"use client";

import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BoardKol } from "@/lib/api-client/board";
import { detailLabel, type BoardDetail } from "@/lib/board-nav";
import {
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  type KolStage,
  type Platform,
  type Priority,
} from "@/lib/domain";
import { workbenchHref } from "@/lib/workbench-nav";

const PAGE_SIZE = 20;

type Props = {
  kols: BoardKol[];
  total: number;
  page: number;
  detail: BoardDetail;
  stage: KolStage | null;
  onPageChange: (page: number) => void;
};

export function BoardDrillList({
  kols,
  total,
  page,
  detail,
  stage,
  onPageChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const title = detailLabel(detail, stage) ?? "达人列表";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setCollapsed(false);
  }, [detail, stage]);

  return (
    <section className="glass-card-strong overflow-hidden rounded-[2rem]">
      <div className="flex items-center justify-between gap-3 border-b border-white/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Mail className="size-4 shrink-0 text-accent" />
          <h2 className="m-0 truncate text-base font-semibold">{title}</h2>
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 font-mono text-sm font-semibold shadow-inset">
            {total}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="island-button inline-flex h-8 shrink-0 items-center gap-1 px-3 text-xs"
        >
          {collapsed ? (
            <>
              <ChevronDown className="size-3.5" />
              展开列表
            </>
          ) : (
            <>
              <ChevronUp className="size-3.5" />
              收起列表
            </>
          )}
        </button>
      </div>

      {collapsed ? null : (
        <>
          <div className="grid gap-2 p-4">
            {kols.map((kol) => (
              <Link
                key={kol.id}
                href={workbenchHref({ view: "all", stage: "all", kol: kol.id ?? null })}
                className="grid gap-3 rounded-2xl border border-white/60 bg-white/55 p-3 shadow-inset transition duration-200 hover:bg-white md:grid-cols-[1.2fr_0.8fr_1fr_0.6fr]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{kol.name}</div>
                  <div className="mt-0.5 truncate text-xs text-muted">{kol.email}</div>
                </div>
                <div className="text-sm text-muted">
                  {platformLabel(kol.primaryPlatform)} · {kol.type ?? "未标注"}
                </div>
                <div className="truncate text-sm text-muted">
                  {kol.latestEmail?.aiSummary ?? "暂无摘要"}
                </div>
                <div className="text-right text-sm font-semibold text-[#9a5a00]">
                  {kol.latestEmail?.aiPriority
                    ? PRIORITY_LABELS[priorityKey(kol.latestEmail.aiPriority)]
                    : "无邮件"}
                </div>
              </Link>
            ))}
            {kols.length === 0 ? (
              <div className="grid min-h-[160px] place-items-center rounded-2xl border border-dashed border-white/70 bg-white/55 text-sm text-muted shadow-inset">
                当前筛选下暂无达人
              </div>
            ) : null}
          </div>

          {total > PAGE_SIZE ? (
            <DrillPagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function DrillPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 px-5 py-3 text-sm">
      <span className="text-muted">
        第 {page} / {totalPages} 页 · 共 {total} 位达人
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="island-button h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一页
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="island-button h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          下一页
        </button>
        <PageJump totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

function PageJump({
  totalPages,
  onPageChange,
}: {
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [input, setInput] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = parseInt(input, 10);
    if (!Number.isFinite(next) || next < 1 || next > totalPages) return;
    onPageChange(next);
    setInput("");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <span className="text-xs text-muted">跳至</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        className="h-8 w-14 rounded-full border border-white/70 bg-white/72 px-2 text-center text-xs shadow-inset outline-none focus:border-lovart/40"
      />
      <span className="text-xs text-muted">页</span>
      <button type="submit" className="island-button h-8 px-2 text-xs">
        跳转
      </button>
    </form>
  );
}

function platformLabel(platform?: string | null) {
  if (!platform) return "未知平台";
  return platform in PLATFORM_LABELS
    ? PLATFORM_LABELS[platform as Platform]
    : platform;
}

function priorityKey(value: string): Priority {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}
