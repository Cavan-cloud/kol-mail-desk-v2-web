"use client";

import { KOL_STAGES, STAGE_ORDER, type KolStage } from "@/lib/domain";

const FUNNEL_STAGE_IDS: KolStage[] = [
  "outreach",
  "replied",
  "negotiating",
  "confirmed",
  "producing",
  "reviewing",
  "published",
  "paying",
];
const FUNNEL_STAGES = FUNNEL_STAGE_IDS.map((id) => KOL_STAGES.find((stage) => stage.id === id)!);
const ORDERED_STAGES = [...KOL_STAGES].sort((a, b) => STAGE_ORDER[a.id] - STAGE_ORDER[b.id]);
const SIDE_STAGES = ORDERED_STAGES.filter((stage) => !FUNNEL_STAGE_IDS.includes(stage.id));

type Props = {
  stageCounts: Record<string, number>;
  total: number;
  max: number;
};

export function BoardStageBar({ stageCounts, total, max }: Props) {
  const widthPct = total === 0 ? 0 : Math.max(6, Math.round((total / max) * 100));

  return (
    <div className="mt-3">
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-black/[0.06]"
        style={{ width: `${widthPct}%` }}
        title={`${total} 位达人 · 漏斗段为「本阶段及以后」累计`}
      >
        {FUNNEL_STAGES.map((stage) => {
          const cumulative = cumulativeFromSnapshot(stageCounts, stage.id);
          if (cumulative === 0) return null;
          return (
            <span
              key={stage.id}
              className="h-full"
              style={{ flex: cumulative, background: stageColor(stage.id) }}
              title={`${stage.label}（累计） ${cumulative}`}
            />
          );
        })}
        {SIDE_STAGES.map((stage) => {
          const count = stageCounts[stage.id] ?? 0;
          if (count === 0) return null;
          return (
            <span
              key={stage.id}
              className="h-full opacity-60"
              style={{ flex: count, background: stageColor(stage.id) }}
              title={`${stage.label}（快照） ${count}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function cumulativeFromSnapshot(snapshot: Record<string, number>, stage: KolStage): number {
  const idx = FUNNEL_STAGE_IDS.indexOf(stage);
  if (idx === -1) return snapshot[stage] ?? 0;
  let sum = 0;
  for (let i = idx; i < FUNNEL_STAGE_IDS.length; i += 1) {
    sum += snapshot[FUNNEL_STAGE_IDS[i]] ?? 0;
  }
  return sum;
}

function stageColor(id: KolStage): string {
  if (id === "declined") return "#9aa3a8";
  const ramp = ORDERED_STAGES.filter((stage) => stage.id !== "declined");
  const index = ramp.findIndex((stage) => stage.id === id);
  const t = ramp.length > 1 ? index / (ramp.length - 1) : 0;
  return lerpHex("#0f766e", "#e0922f", t);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
