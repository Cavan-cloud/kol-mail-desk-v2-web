"use client";

import { AlertTriangle, Inbox, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { BoardActivityPanel } from "@/components/board/BoardActivityPanel";
import { BoardCompositionPanel } from "@/components/board/BoardCompositionPanel";
import { BoardDrillList } from "@/components/board/BoardDrillList";
import { BoardMainLayout } from "@/components/board/BoardMainLayout";
import { BoardMembersPanel } from "@/components/board/BoardMembersPanel";
import { BoardOwnerSelector } from "@/components/board/BoardOwnerSelector";
import { BoardPipelinePanel } from "@/components/board/BoardPipelinePanel";
import { RequireAuth } from "@/components/shell/RequireAuth";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { useBoardQuery, useTeamMembersQuery } from "@/lib/api-client/queries";
import {
  boardHref,
  boardQueryString,
  parseBoardSearchParams,
  type BoardQueryState,
} from "@/lib/board-nav";
import { KOL_STAGES, type KolStage } from "@/lib/domain";

const WINDOW_OPTIONS = [
  { id: "all", label: "全部时间" },
  { id: "week", label: "本周" },
  { id: "month", label: "本月" },
  { id: "last30", label: "最近 30 天" },
] as const;

function windowLabel(window: string) {
  const found = WINDOW_OPTIONS.find((item) => item.id === window);
  if (found) return found.label;
  if (/^\d{4}-\d{2}$/.test(window)) {
    const [year, mon] = window.split("-");
    return `${year}年${parseInt(mon, 10)}月`;
  }
  return "全部时间";
}

function withBoardState(
  current: BoardQueryState,
  patch: Partial<BoardQueryState>
): BoardQueryState {
  return {
    window: patch.window ?? current.window ?? "all",
    owner: patch.owner !== undefined ? patch.owner : current.owner,
    includeInterns:
      patch.includeInterns !== undefined ? patch.includeInterns : current.includeInterns,
    detail: patch.detail !== undefined ? patch.detail : current.detail,
    stage: patch.stage !== undefined ? patch.stage : current.stage,
    page: patch.page !== undefined ? patch.page : current.page,
  };
}

function BoardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardState = useMemo(
    () => parseBoardSearchParams(searchParams),
    [searchParams]
  );
  const windowParam = boardState.window ?? "all";
  const detail = boardState.detail ?? null;
  const stageFilter = boardState.stage ?? null;
  const drillPage = boardState.page ?? 1;

  const boardQuery = useBoardQuery({
    window: windowParam === "all" ? undefined : windowParam,
    owner: boardState.owner ?? undefined,
    includeInterns: boardState.includeInterns,
    detail: detail ?? undefined,
    stage: stageFilter ?? undefined,
    page: detail ? drillPage : undefined,
    size: detail ? 20 : undefined,
  });
  const teamQuery = useTeamMembersQuery();

  const [monthInput, setMonthInput] = useState(
    /^\d{4}-\d{2}$/.test(windowParam) ? windowParam : ""
  );

  const members = (teamQuery.data?.members ?? []).filter(
    (member) => member.status !== "departed"
  );

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

  function navigate(next: Partial<BoardQueryState>) {
    router.push(boardHref(withBoardState(boardState, next)));
  }

  function navigateDrill(next: Partial<BoardQueryState>) {
    router.push(boardHref(withBoardState(boardState, next)));
  }

  function applyMonthFilter(event: FormEvent) {
    event.preventDefault();
    if (!monthInput) return;
    navigate({ window: monthInput, detail: null, stage: null, page: 1 });
  }

  if (boardQuery.isLoading || teamQuery.isLoading) {
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
  const timeLabel = windowLabel(windowParam);
  const conversionPct = Math.round((kpi?.conversionRate ?? 0) * 100);
  const includeInterns = boardState.includeInterns !== false;
  const selectedOwnerId = boardState.owner ?? null;
  const drillTotal = boardQuery.data?.kolsPage?.total ?? boardQuery.data?.kols?.length ?? 0;

  return (
    <AppShell activeHref="/board" title="团队看板" headerActions={<SignOutButton />}>
      <div className="mx-auto grid max-w-[1680px] gap-4 p-4 lg:p-6">
        <section className="relative z-30 flex flex-wrap items-center gap-2 rounded-[2rem] px-4 py-3 glass-card">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">视角</span>
          <BoardOwnerSelector
            members={includeInterns ? members : members.filter((member) => member.role !== "intern")}
            selectedOwnerId={selectedOwnerId}
            boardState={boardState}
          />
          <span className="mx-1 hidden h-5 w-px bg-black/10 md:block" />
          <FilterChip
            active={includeInterns}
            href={boardHref(withBoardState(boardState, { includeInterns: !includeInterns }))}
            title={
              selectedOwnerId
                ? "切换是否将该成员名下实习生的达人合并统计"
                : "切换团队汇总与成员列表是否包含实习生及其名下达人"
            }
          >
            {includeInterns ? "含实习生" : "不含实习生"}
          </FilterChip>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          {WINDOW_OPTIONS.map((item) => (
            <Link
              key={item.id}
              href={boardHref(withBoardState(boardState, { window: item.id, detail: null, stage: null, page: 1 }))}
              className={`focus-ring inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition ${
                windowParam === item.id
                  ? "border-lovart/30 bg-lovart-soft text-[#9a5a00]"
                  : "border-white/70 bg-white/70 text-muted shadow-inset hover:bg-white hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <form onSubmit={applyMonthFilter} className="ml-1 flex items-center gap-1.5">
            <input
              type="month"
              value={monthInput}
              onChange={(event) => setMonthInput(event.target.value)}
              className="h-9 rounded-full border border-white/70 bg-white/72 px-3 text-sm font-semibold text-muted shadow-inset outline-none focus:border-lovart/40"
              title="选择飞书建联/触达月份"
            />
            <button type="submit" className="island-button h-9 px-3 text-xs">
              按月
            </button>
          </form>
          <span
            className="ml-auto text-xs text-muted"
            title="时间窗按飞书表记录的建联/触达日期过滤；未记录日期的达人只出现在「全部时间」。"
          >
            当前：{timeLabel}
          </span>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            href={boardHref(withBoardState(boardState, { detail: "kols", stage: null, page: 1 }))}
            active={detail === "kols" && !stageFilter}
            icon={<UsersRound className="size-5" />}
            label={`总达人（${timeLabel}）`}
            value={kpi?.totalKols ?? 0}
          />
          <KpiCard
            href={boardHref(withBoardState(boardState, { detail: "unreplied", stage: null, page: 1 }))}
            active={detail === "unreplied"}
            icon={<AlertTriangle className="size-5" />}
            label="待回复"
            value={kpi?.unrepliedKols ?? 0}
            tone="warn"
            tooltip="待回复：最新动作为对方来信、尚未回复，且未手动标记「无需回复」的达人数（不含 3 天停滞口径）。"
          />
          <KpiCard
            href={boardHref(withBoardState(boardState, { detail: "unread", stage: null, page: 1 }))}
            active={detail === "unread"}
            icon={<Inbox className="size-5" />}
            label="未读邮件"
            value={kpi?.unreadEmails ?? 0}
            tooltip="未读邮件 = 还没被任何团队成员打开过的对方来信数量。"
          />
          <KpiCard
            icon={<TrendingUp className="size-5" />}
            label="进入合作 / 转化率"
            value={kpi?.cooperationKols ?? 0}
            suffix={`${conversionPct}%`}
          />
        </section>

        <BoardMainLayout
          left={
              <>
                <BoardPipelinePanel
                  snapshotByStage={mapped.snapshotByStage}
                  cumulativeByStage={mapped.cumulativeByStage}
                  outreachCum={mapped.outreachCum}
                  replyRate={mapped.replyRate}
                  conversion={mapped.conversion}
                  total={mapped.total}
                  baseQuery={boardQueryString(boardState)}
                  timeLabel={timeLabel}
                  activeDetail={detail}
                  activeStage={stageFilter}
                />
                <BoardMembersPanel
                  rows={boardQuery.data?.members ?? []}
                  perMember={Boolean(selectedOwnerId)}
                />
              </>
            }
            right={
              <>
                <BoardCompositionPanel
                  segments={boardQuery.data?.platformDistribution ?? []}
                  total={mapped.total}
                />
                <BoardActivityPanel items={boardQuery.data?.recentActivity ?? []} />
              </>
            }
            footer={
              detail ? (
                <BoardDrillList
                  kols={boardQuery.data?.kols ?? []}
                  total={drillTotal}
                  page={drillPage}
                  detail={detail}
                  stage={stageFilter}
                  onPageChange={(page) => navigateDrill({ page })}
                />
              ) : null
            }
        />
      </div>
    </AppShell>
  );
}

function FilterChip({
  active,
  href,
  children,
  title,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={`focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${
        active
          ? "border-lovart/30 bg-lovart-soft text-[#9a5a00]"
          : "border-white/70 bg-white/70 text-muted shadow-inset hover:bg-white hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function KpiCard({
  icon,
  label,
  value,
  suffix,
  tone,
  tooltip,
  href,
  active,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "warn";
  tooltip?: string;
  href?: string;
  active?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-muted">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <strong
          className={`block font-mono text-3xl tabular-nums ${
            tone === "warn" ? "text-[#9f3429]" : ""
          }`}
        >
          {value}
        </strong>
        {suffix ? <span className="text-sm font-semibold text-muted">{suffix}</span> : null}
      </div>
    </>
  );

  const className = `glass-card block rounded-3xl p-4 transition ${
    active ? "ring-2 ring-lovart/35 ring-offset-2 ring-offset-transparent" : ""
  } ${href ? "hover:bg-white/80" : ""}`;

  if (href) {
    return (
      <Link href={href} className={className} title={tooltip}>
        {body}
      </Link>
    );
  }

  return (
    <div className={className} title={tooltip}>
      {body}
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
