"use client";

import { PLATFORM_LABELS, type Platform } from "@/lib/domain";

export const BOARD_PLATFORM_COLORS: Record<Platform, string> = {
  tiktok: "#0f766e",
  instagram: "#e0922f",
  youtube: "#9f3429",
  x: "#1c8a7b",
  other: "#9aa3a8",
};

type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  segments: Segment[];
  total: number;
  size?: number;
  stroke?: number;
};

export function BoardDonut({ segments, total, size = 132, stroke = 18 }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0) || 1;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="平台分布">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={stroke}
          />
          {segments.map((segment) => {
            const length = (segment.value / sum) * circumference;
            const el = (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none">{total}</div>
          <div className="mt-0.5 text-[11px] text-muted">达人</div>
        </div>
      </div>
    </div>
  );
}

export function platformSegmentColor(platform?: string | null): string {
  if (!platform || !(platform in BOARD_PLATFORM_COLORS)) {
    return BOARD_PLATFORM_COLORS.other;
  }
  return BOARD_PLATFORM_COLORS[platform as Platform];
}

export function platformSegmentLabel(platform?: string | null): string {
  if (!platform || !(platform in PLATFORM_LABELS)) {
    return platform ?? "其他";
  }
  return PLATFORM_LABELS[platform as Platform];
}
