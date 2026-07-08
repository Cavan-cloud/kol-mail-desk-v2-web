"use client";

import type { BoardPlatformSegment } from "@/lib/api-client/board";
import { BoardDonut } from "@/components/board/BoardDonut";
import { BoardPanelTitle } from "@/components/board/BoardPanelTitle";

type Props = {
  segments: BoardPlatformSegment[];
  total: number;
};

export function BoardCompositionPanel({ segments, total }: Props) {
  const donutSegments = segments.map((segment) => ({
    label: segment.label ?? segment.platform ?? "其他",
    value: segment.count ?? 0,
    color: segmentColor(segment.platform),
  }));

  return (
    <section className="glass-card-strong rounded-[2rem] p-5">
      <BoardPanelTitle eyebrow="Composition" title="平台分布" />
      <div className="mt-4 flex items-center gap-5">
        <BoardDonut segments={donutSegments} total={total} />
        <ul className="m-0 grid flex-1 list-none gap-1.5 p-0">
          {donutSegments.length === 0 ? (
            <li className="text-sm text-muted">暂无数据</li>
          ) : (
            donutSegments.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
                <span className="flex-1 text-muted">{segment.label}</span>
                <strong className="font-mono tabular-nums">{segment.value}</strong>
                <span className="w-9 text-right text-xs text-muted">
                  {total > 0 ? Math.round((segment.value / total) * 100) : 0}%
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

function segmentColor(platform?: string | null) {
  const colors: Record<string, string> = {
    tiktok: "#0f766e",
    instagram: "#e0922f",
    youtube: "#9f3429",
    x: "#1c8a7b",
    other: "#9aa3a8",
  };
  return colors[platform ?? "other"] ?? colors.other;
}
