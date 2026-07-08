"use client";

import type { BoardMemberRow } from "@/lib/api-client/board";
import { BoardPanelTitle } from "@/components/board/BoardPanelTitle";
import { BoardStageBar } from "@/components/board/BoardStageBar";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";

type Props = {
  rows: BoardMemberRow[];
  perMember: boolean;
};

export function BoardMembersPanel({ rows, perMember }: Props) {
  const maxRowTotal = Math.max(...rows.map((row) => row.total ?? 0), 1);

  return (
    <section className="glass-card-strong rounded-[2rem] p-5">
      <BoardPanelTitle
        eyebrow="Members"
        title={perMember ? "成员明细" : "成员进度"}
        hint={`${rows.length} 位成员`}
      />
      <div className="mt-4 grid gap-2.5">
        {rows.map((row) => {
          const coveredCount = row.coveredMemberIds?.length ?? 1;
          const role = (row.role ?? "full_time") as UserRole;
          return (
            <div
              key={row.memberId}
              className="rounded-2xl border border-white/60 bg-white/55 p-4 shadow-inset"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{row.displayName ?? "未命名"}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {USER_ROLE_LABELS[role] ?? row.role}
                    {coveredCount > 1 ? ` · 含 ${coveredCount - 1} 名实习生` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <MemberStat
                    label="未读"
                    value={row.unread ?? 0}
                    tooltip="未读 = 该成员名下还没被任何人打开过的对方来信数量。"
                  />
                  <MemberStat
                    label="待回复"
                    value={row.unreplied ?? 0}
                    tone={(row.unreplied ?? 0) > 0 ? "warn" : undefined}
                    tooltip="待回复 = 该成员名下最新一封是对方来信、尚未回复，且未手动标记「无需回复」的达人数。"
                  />
                  <MemberStat
                    label="总数"
                    value={row.total ?? 0}
                    large
                    tooltip="总数 = 该成员负责（含 rollup 实习生）的达人数量。"
                  />
                </div>
              </div>
              <BoardStageBar
                stageCounts={row.stageCounts ?? {}}
                total={row.total ?? 0}
                max={maxRowTotal}
              />
            </div>
          );
        })}
        {rows.length === 0 ? (
          <p className="m-0 rounded-2xl border border-dashed border-white/70 bg-white/55 px-3 py-6 text-center text-sm text-muted shadow-inset">
            暂无成员数据。
          </p>
        ) : null}
      </div>
    </section>
  );
}

function MemberStat({
  label,
  value,
  tone,
  tooltip,
  large,
}: {
  label: string;
  value: number;
  tone?: "warn";
  tooltip?: string;
  large?: boolean;
}) {
  return (
    <span className="text-xs text-muted" title={tooltip}>
      {label}{" "}
      <strong
        className={`font-mono tabular-nums ${
          large ? "text-2xl text-ink" : tone === "warn" ? "text-[#9f3429]" : "text-ink"
        }`}
      >
        {value}
      </strong>
    </span>
  );
}
