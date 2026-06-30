"use client";

import { useState } from "react";
import Link from "next/link";

export type StageChip = {
  id: string;
  label: string;
  description: string;
  count: number;
  href: string;
  active: boolean;
};

export function StageFilterBar({ chips }: { chips: StageChip[] }) {
  const [expanded, setExpanded] = useState(false);
  const activeChip = chips.find((c) => c.active) ?? chips[0];

  return (
    <nav className="mt-2" aria-label="阶段筛选">
      {/* Single-row header: active chip always visible + toggle */}
      <div className="flex h-9 items-center gap-1.5">
        {activeChip && (
          <Link
            href={activeChip.href}
            title={activeChip.description}
            aria-current="true"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-lovart/30 bg-lovart-soft px-2.5 py-1 text-xs font-semibold text-[#9a5a00] shadow-inset transition duration-200"
          >
            {activeChip.label}
            <span className="rounded-full bg-white/70 px-1.5 text-[11px] tabular-nums text-[#9a5a00]">
              {activeChip.count}
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-xs font-semibold text-muted transition duration-200 hover:bg-white hover:text-ink"
        >
          {expanded ? "收起 ▴" : "展开 ▾"}
        </button>
      </div>

      {/* Expandable all-chips area with smooth max-height transition */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: expanded ? "300px" : "0px",
          transition: "max-height 0.2s ease-in-out"
        }}
      >
        <div className="flex flex-wrap gap-1.5 pb-1 pt-1">
          {chips.map((chip) => (
            <Link
              key={chip.id}
              href={chip.href}
              title={chip.description}
              aria-current={chip.active ? "true" : undefined}
              className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition duration-200 ${
                chip.active
                  ? "border-lovart/30 bg-lovart-soft text-[#9a5a00] shadow-inset"
                  : "border-white/70 bg-white/60 text-muted hover:bg-white hover:text-ink"
              }`}
            >
              {chip.label}
              <span
                className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                  chip.active ? "bg-white/70 text-[#9a5a00]" : "bg-black/5 text-muted"
                }`}
              >
                {chip.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
