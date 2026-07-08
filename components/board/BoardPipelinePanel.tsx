"use client";

import Link from "next/link";
import { useState } from "react";
import { KOL_STAGES, STAGE_ORDER, type KolStage } from "@/lib/domain";

type Mode = "funnel" | "snapshot";

const ORDERED_STAGES = [...KOL_STAGES].sort((a, b) => STAGE_ORDER[a.id] - STAGE_ORDER[b.id]);

const FUNNEL_STAGE_IDS: KolStage[] = [
  "outreach",
  "replied",
  "negotiating",
  "confirmed",
  "producing",
  "reviewing",
  "published",
  "paying"
];
const FUNNEL_STAGES = FUNNEL_STAGE_IDS.map(
  (id) => KOL_STAGES.find((stage) => stage.id === id)!
);

type Props = {
  snapshotByStage: Record<KolStage, number>;
  cumulativeByStage: Record<KolStage, number>;
  outreachCum: number;
  replyRate: number;
  conversion: number;
  total: number;
  baseQuery: string;
  timeLabel: string;
  activeDetail?: "kols" | "unreplied" | "unread" | null;
  activeStage?: KolStage | null;
};

export function BoardPipelinePanel({
  snapshotByStage,
  cumulativeByStage,
  outreachCum,
  replyRate,
  conversion,
  total,
  baseQuery,
  timeLabel,
  activeDetail,
  activeStage
}: Props) {
  const [mode, setMode] = useState<Mode>("funnel");

  return (
    <section className="glass-card-strong rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">Pipeline</p>
          <div className="mt-2 inline-flex rounded-full border border-white/70 bg-white/55 p-0.5 shadow-inset">
            <ModePill active={mode === "funnel"} onClick={() => setMode("funnel")} tone="funnel">
              累计漏斗
            </ModePill>
            <ModePill active={mode === "snapshot"} onClick={() => setMode("snapshot")} tone="snapshot">
              阶段分布
            </ModePill>
          </div>
          <p
            className="m-0 mt-2 text-xs text-muted"
            title={
              mode === "funnel"
                ? "每个阶段的数字 = 当前处于该阶段或任何更后阶段的达人累计数。后面阶段不会大于前面阶段，符合真正的漏斗形状。"
                : "每个阶段显示当前在该阶段的达人数（不累计），全部 10 个阶段含已拒绝 / 复投。"
            }
          >
            {mode === "funnel"
              ? `${timeLabel} · 每阶段显示「本阶段及以后的累计达人数」。`
              : `${timeLabel} · 每阶段当前的达人数（不累计）。`}
          </p>
        </div>
        <span
          className="whitespace-nowrap text-xs text-muted"
          title={
            mode === "funnel"
              ? "达人回复率 = 进入「回复/议价」及更后阶段的达人数 / 已触达达人数；已询价、追+、二追仍算触达，不算回复。\n转化率 = 走到「付款」阶段的达人数 / 已触达达人数。"
              : undefined
          }
        >
          {mode === "funnel" ? `${timeLabel} · 达人回复率 ${replyRate}% · 转化率 ${conversion}%` : `${timeLabel} · ${total} 位达人`}
        </span>
      </div>

      {mode === "funnel" ? (
        <div className="mt-4 grid gap-2">
          {FUNNEL_STAGES.map((column) => {
            const count = cumulativeByStage[column.id] ?? 0;
            const snapshot = snapshotByStage[column.id] ?? 0;
            const pct = outreachCum > 0 ? Math.round((count / outreachCum) * 100) : 0;
            return (
              <Link
                key={column.id}
                href={`/board?${appendQuery(baseQuery, { detail: "kols", stage: column.id })}`}
                className={`group grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-2 shadow-inset transition duration-200 hover:bg-white ${
                  activeDetail === "kols" && activeStage === column.id
                    ? "border-lovart/35 bg-lovart-soft/40 ring-2 ring-lovart/25"
                    : "border-white/60 bg-white/55"
                }`}
                title={`${column.description}\n本阶段当前快照：${snapshot} 人；本阶段及以后累计：${count} 人`}
              >
                <span className="truncate text-sm font-semibold">{column.label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500 ease-fluid"
                    style={{
                      width:
                        count === 0
                          ? "0%"
                          : `${Math.max(4, Math.round((count / Math.max(outreachCum, 1)) * 100))}%`,
                      background: funnelStageColor(column.id)
                    }}
                  />
                </span>
                <span className="flex items-baseline gap-1.5 justify-self-end">
                  <strong className="font-mono text-lg tabular-nums">{count}</strong>
                  <span className="w-9 text-right text-xs text-muted">{pct}%</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <SnapshotBody
          snapshotByStage={snapshotByStage}
          total={total}
          baseQuery={baseQuery}
          activeDetail={activeDetail}
          activeStage={activeStage}
        />
      )}
    </section>
  );
}

function SnapshotBody({
  snapshotByStage,
  total,
  baseQuery,
  activeDetail,
  activeStage
}: {
  snapshotByStage: Record<KolStage, number>;
  total: number;
  baseQuery: string;
  activeDetail?: "kols" | "unreplied" | "unread" | null;
  activeStage?: KolStage | null;
}) {
  const maxCount = Math.max(...ORDERED_STAGES.map((s) => snapshotByStage[s.id] ?? 0), 1);
  return (
    <div className="mt-4 grid gap-1.5">
      {ORDERED_STAGES.map((stage) => {
        const count = snapshotByStage[stage.id] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const fillPct = count === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * 100));
        const color = snapshotStageColor(stage.id);
        return (
          <Link
            key={stage.id}
            href={`/board?${appendQuery(baseQuery, { detail: "kols", stage: stage.id })}`}
            className={`group grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-1.5 transition duration-200 hover:border-solid hover:bg-white ${
              activeDetail === "kols" && activeStage === stage.id
                ? "border-lovart/35 bg-lovart-soft/40 ring-2 ring-lovart/25"
                : "border-dashed border-[#5b6b8a]/25 bg-white/35"
            }`}
            title={`${stage.description}\n当前快照：${count} 人（占总体 ${pct}%）`}
          >
            <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: color }} />
              {stage.label}
            </span>
            <span className="relative h-2 overflow-hidden rounded-sm bg-[#5b6b8a]/10">
              <span
                className="block h-full rounded-sm transition-[width] duration-500 ease-fluid"
                style={{ width: `${fillPct}%`, background: color, opacity: 0.85 }}
              />
            </span>
            <span className="flex items-baseline gap-1.5 justify-self-end">
              <strong className="font-mono text-base tabular-nums">{count}</strong>
              <span className="w-9 text-right text-xs text-muted">{pct}%</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ModePill({
  active,
  onClick,
  tone,
  children
}: {
  active: boolean;
  onClick: () => void;
  tone: "funnel" | "snapshot";
  children: React.ReactNode;
}) {
  const activeClass =
    tone === "funnel"
      ? "bg-[#e7f3f0] text-[#0f766e] shadow-inset"
      : "bg-[#eef0f7] text-[#3b5998] shadow-inset";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition duration-200 ${
        active ? activeClass : "text-muted hover:text-ink"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function funnelStageColor(id: KolStage): string {
  if (id === "declined") return "#9aa3a8";
  const ramp = ORDERED_STAGES.filter((stage) => stage.id !== "declined");
  const index = ramp.findIndex((stage) => stage.id === id);
  const t = ramp.length > 1 ? index / (ramp.length - 1) : 0;
  return lerpHex("#0f766e", "#e0922f", t);
}

function snapshotStageColor(id: KolStage): string {
  if (id === "declined") return "#9aa3a8";
  if (id === "reinvest") return "#6b5b8a";
  const ramp = ORDERED_STAGES.filter((stage) => stage.id !== "declined" && stage.id !== "reinvest");
  const index = ramp.findIndex((stage) => stage.id === id);
  const t = ramp.length > 1 ? index / (ramp.length - 1) : 0;
  return lerpHex("#3b5998", "#7d8aa8", t);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function appendQuery(query: string, extra: Record<string, string>) {
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  params.delete("page");
  return params.toString();
}
