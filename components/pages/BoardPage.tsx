"use client";

import { Inbox, Send, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { BoardPipelinePanel } from "@/components/board/BoardPipelinePanel";
import { RequireAuth } from "@/components/shell/RequireAuth";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { useBoardQuery } from "@/lib/api-client/queries";
import { KOL_STAGES, type KolStage } from "@/lib/domain";

const WINDOW_OPTIONS = [
  { id: "all", label: "全部时间" },
  { id: "week", label: "本周" },
  { id: "month", label: "本月" },
  { id: "last30", label: "最近 30 天" },
] as const;

function boardHref(window: string) {
  const qs = boardQueryString(window);
  return qs ? `/board?${qs}` : "/board";
}

function windowLabel(window: string) {
  const found = WINDOW_OPTIONS.find((item) => item.id === window);
  if (found) return found.label;
  if (/^\d{4}-\d{2}$/.test(window)) {
    const [year, mon] = window.split("-");
    return `${year}年${parseInt(mon, 10)}月`;
  }
  return "全部时间";
}

function boardQueryString(window: string) {
  const params = new URLSearchParams();
  if (window && window !== "all") params.set("window", window);
  return params.toString();
}

function BoardPageInner() {
  const searchParams = useSearchParams();
  const windowParam = searchParams.get("window") ?? "all";
  const boardQuery = useBoardQuery({ window: windowParam });

  const mapped = useMemo(() => {
    const data = boardQuery.data;
    if (!data) return null;

    const snapshotByStage = Object.fromEntries(
      KOL_STAGES.map((stage) => [stage.id, 0])
    ) as Record<KolStage, number>;
    for (const row of data.stageDistribution ?? []) {
      if (row.stage) snapshotByStage[row.stage as KolStage] = row.count ?? 0;
    }

    const cumulativeByStage = Object.fromEntries(
      KOL_STAGES.map((stage) => [stage.id, 0])
    ) as Record<KolStage, number>;
    for (const row of data.funnel ?? []) {
      if (row.stage) cumulativeByStage[row.stage as KolStage] = row.count ?? 0;
    }

    const outreachCum = cumulativeByStage.outreach ?? 0;
    const repliedCum = cumulativeByStage.replied ?? 0;
    const payingCum = cumulativeByStage.paying ?? 0;
    const replyRate = outreachCum > 0 ? Math.round((repliedCum / outreachCum) * 100) : 0;
    const conversion = outreachCum > 0 ? Math.round((payingCum / outreachCum) * 100) : 0;

    return {
      snapshotByStage,
      cumulativeByStage,
      outreachCum,
      replyRate,
      conversion,
      total: data.kpi?.totalKols ?? 0,
      kpi: data.kpi,
    };
  }, [boardQuery.data]);

  if (boardQuery.isLoading) {
    return (
      <AppShell activeHref="/board" title="团队看板" headerActions={<SignOutButton />}>
        <PageSpinner label="加载看板…" />
      </AppShell>
    );
  }

  if (boardQuery.isError || !mapped) {
    return (
      <AppShell activeHref="/board" title="团队看板" headerActions={<SignOutButton />}>
        <div className="p-6 text-center text-sm text-[#9f3429]">加载看板失败，请刷新重试。</div>
      </AppShell>
    );
  }

  const { kpi } = mapped;

  return (
    <AppShell activeHref="/board" title="团队看板" headerActions={<SignOutButton />}>
      <div className="mx-auto max-w-[1280px] p-4 lg:p-6">
        <section className="mb-5 flex flex-wrap gap-2">
          {WINDOW_OPTIONS.map((item) => (
            <Link
              key={item.id}
              href={boardHref(item.id)}
              className={`focus-ring inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition ${
                windowParam === item.id
                  ? "border-lovart/30 bg-lovart-soft text-[#9a5a00]"
                  : "border-white/70 bg-white/70 text-muted shadow-inset hover:bg-white hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<UsersRound className="size-5" />} label="总达人" value={kpi?.totalKols ?? 0} />
          <KpiCard icon={<Inbox className="size-5" />} label="进行中" value={kpi?.activeKols ?? 0} />
          <KpiCard icon={<Send className="size-5" />} label="已发布" value={kpi?.publishedKols ?? 0} />
          <KpiCard
            icon={<TrendingUp className="size-5" />}
            label="转化率"
            value={`${Math.round((kpi?.conversionRate ?? 0) * 100)}%`}
          />
        </section>

        <BoardPipelinePanel
          snapshotByStage={mapped.snapshotByStage}
          cumulativeByStage={mapped.cumulativeByStage}
          outreachCum={mapped.outreachCum}
          replyRate={mapped.replyRate}
          conversion={mapped.conversion}
          total={mapped.total}
          baseQuery={boardQueryString(windowParam)}
          timeLabel={windowLabel(windowParam)}
        />
      </div>
    </AppShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
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

export function BoardPage() {
  return (
    <RequireAuth>
      <BoardPageInner />
    </RequireAuth>
  );
}
