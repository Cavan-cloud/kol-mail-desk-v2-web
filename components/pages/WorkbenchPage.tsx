"use client";

import {
  Activity,
  Bot,
  Clock3,
  ExternalLink,
  Inbox,
  Mail,
  Send,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/shell/RequireAuth";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { BatchFollowupButton } from "@/components/gmail/BatchFollowupButton";
import { FeishuSyncButton } from "@/components/sync/FeishuSyncButton";
import { GmailSyncButton } from "@/components/sync/GmailSyncButton";
import { GmailReauthorizeBanner } from "@/components/sync/GmailReauthorizeBanner";
import { HistorySyncBanner } from "@/components/sync/HistorySyncBanner";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AssignPanel } from "@/components/team/AssignPanel";
import { AutoMarkRead } from "@/components/workbench/AutoMarkRead";
import { DeleteEmailButton } from "@/components/workbench/DeleteEmailButton";
import { DraftSendPanel } from "@/components/workbench/DraftSendPanel";
import { EmailBodyViewer } from "@/components/workbench/EmailBodyViewer";
import { KolListRow } from "@/components/workbench/KolListRow";
import { KolNameEditor } from "@/components/workbench/KolNameEditor";
import { KolStageEditor } from "@/components/workbench/KolStageEditor";
import { MarkEmailReadButton } from "@/components/workbench/MarkEmailReadButton";
import { ReclassifyButton } from "@/components/workbench/ReclassifyButton";
import { ReplyResolvedButton } from "@/components/workbench/ReplyResolvedButton";
import { StageFilterBar } from "@/components/workbench/StageFilterBar";
import { WorkbenchSearch } from "@/components/workbench/WorkbenchSearch";
import { WorkbenchShell, type SidebarStat } from "@/components/workbench/WorkbenchShell";
import { mapApiEmail, mapApiKol, mapWorkbenchKol } from "@/lib/api-mapper";
import {
  useKolDetailQuery,
  useMeQuery,
  useTeamMembersQuery,
  useTemplatesQuery,
  useWorkbenchQuery,
} from "@/lib/api-client/queries";
import {
  KOL_SOURCE_LABELS,
  KOL_STATUS_LABELS,
  PLATFORM_LABELS,
  VIEW_MODES,
  type StageFilter,
} from "@/lib/domain";
import { buildBatchFollowupCandidates } from "@/lib/batch-followup";
import {
  normalizeStage,
  normalizeView,
  stageChipMeta,
  workbenchHref,
} from "@/lib/workbench-nav";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function WorkbenchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeView(searchParams.get("view"));
  const stage = normalizeStage(searchParams.get("stage"));
  const query = searchParams.get("q")?.trim() || undefined;
  const kolParam = searchParams.get("kol");

  const [focusedEmailId, setFocusedEmailId] = useState<string | null>(null);

  const workbenchQuery = useWorkbenchQuery({ view, stage, q: query });
  const meQuery = useMeQuery();
  const templatesQuery = useTemplatesQuery();
  const teamQuery = useTeamMembersQuery();

  const list = useMemo(
    () => (workbenchQuery.data?.data ?? []).map(mapWorkbenchKol),
    [workbenchQuery.data?.data]
  );

  const selectedKolId = kolParam ?? list[0]?.id ?? null;
  const kolDetailQuery = useKolDetailQuery(selectedKolId);

  useEffect(() => {
    if (kolParam || list.length === 0) return;
    router.replace(
      workbenchHref({ view, stage, kol: list[0].id, q: query ?? null })
    );
  }, [kolParam, list, query, router, stage, view]);

  const selectedKol = useMemo(() => {
    if (!kolDetailQuery.data?.kol) return list.find((k) => k.id === selectedKolId) ?? null;
    const mapped = mapApiKol(kolDetailQuery.data.kol);
    const fromList = list.find((k) => k.id === mapped.id);
    return {
      ...mapped,
      ownerName: kolDetailQuery.data.ownerName ?? fromList?.ownerName ?? "未分配",
      latestEmail: fromList?.latestEmail ?? null,
      unreadCount: fromList?.unreadCount ?? 0,
      unreplied: fromList?.unreplied ?? false,
      awaitingReply: fromList?.awaitingReply ?? false,
    };
  }, [kolDetailQuery.data, list, selectedKolId]);

  const timeline = useMemo(
    () => (kolDetailQuery.data?.emails ?? []).map(mapApiEmail),
    [kolDetailQuery.data?.emails]
  );

  useEffect(() => {
    setFocusedEmailId(null);
  }, [selectedKolId]);

  const latest = timeline[0] ?? selectedKol?.latestEmail ?? null;
  const focusedEmail =
    (focusedEmailId ? timeline.find((email) => email.id === focusedEmailId) : null) ?? latest;
  const sidebar = workbenchQuery.data?.sidebar;
  const stageCounts = useMemo((): Record<string, number> => {
    const fromApi = sidebar?.stageCounts ?? {};
    const unreplied =
      "unreplied" in fromApi ? (fromApi.unreplied ?? 0) : (sidebar?.unreplied ?? 0);
    const unread = "unread" in fromApi ? (fromApi.unread ?? 0) : 0;
    return { ...fromApi, unreplied, unread };
  }, [sidebar?.stageCounts, sidebar?.unreplied]);

  const sidebarStats: SidebarStat[] = [
    {
      label: "需我回复",
      value: sidebar?.unreplied ?? 0,
      href: workbenchHref({ view, stage: "unreplied", q: query ?? null }),
      icon: <Inbox className="size-4" />,
      active: stage === "unreplied",
      tooltip: "需我回复：最新一封是对方来信、尚未回复，且未手动标记「无需回复」。",
    },
    {
      label: "未读",
      value: sidebar?.unread ?? 0,
      href: workbenchHref({ view, stage: "unread", q: query ?? null }),
      icon: <Mail className="size-4" />,
      active: stage === "unread",
      tooltip: "未读：对方来信中尚未被打开过的邮件数。",
    },
    {
      label: "团队池",
      value: sidebar?.teamPool ?? 0,
      href: workbenchHref({ view: "pool", stage: "all", q: query ?? null }),
      icon: <UsersRound className="size-4" />,
      active: view === "pool",
      tooltip: "团队池：无主或待重新分配的达人。",
    },
    {
      label: "总达人",
      value: sidebar?.total ?? 0,
      href: workbenchHref({ view: "all", stage: "all", q: query ?? null }),
      icon: <Activity className="size-4" />,
      active: view === "all" && stage === "all",
      tooltip: "总达人：当前视图下的全部达人数。",
    },
  ];

  const templates = (templatesQuery.data?.data ?? []).map((t) => ({
    id: t.id ?? "",
    name: t.name ?? "",
    scenario: t.scenario ?? "",
    subject: t.subject ?? "",
    body: t.body ?? "",
    createdBy: t.createdBy,
  }));

  const unreadInboundIds = timeline
    .filter((email) => email.direction === "inbound" && !email.isRead)
    .map((email) => email.id);

  const batchFollowupCandidates = useMemo(
    () => buildBatchFollowupCandidates(list),
    [list]
  );

  if (workbenchQuery.isLoading) {
    return <PageSpinner label="加载工作台…" />;
  }

  if (workbenchQuery.isError) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-6 text-center text-sm text-[#9f3429]">
        加载工作台失败，请刷新重试。
      </div>
    );
  }

  const listPane = (
    <>
      <div className="sticky top-0 z-10 border-b border-white/60 bg-white/55 px-3 py-2.5 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold">达人列表 · {list.length}</h2>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-white/70 bg-white/55 p-1 shadow-inset">
          {VIEW_MODES.map((item) => (
            <Link
              key={item.id}
              href={workbenchHref({
                view: item.id,
                stage,
                kol: selectedKolId,
                q: query ?? null,
              })}
              className={`focus-ring rounded-full px-2 py-1.5 text-center text-xs font-semibold transition duration-300 ease-fluid ${
                item.id === view
                  ? "bg-white text-ink shadow-inset"
                  : "text-muted hover:bg-white/70 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <StageFilterBar
          chips={stageChipMeta(stageCounts, sidebar?.total).map((item) => ({
            ...item,
            href: workbenchHref({
              view,
              stage: item.id as StageFilter,
              kol: selectedKolId,
              q: query ?? null,
            }),
            active: item.id === stage,
          }))}
        />
      </div>

      {list.length === 0 ? (
        <div className="m-3 rounded-2xl border border-dashed border-white/80 bg-white/55 p-8 text-center text-sm text-muted shadow-inset">
          {query ? `没有匹配「${query}」的达人` : "当前阶段暂无达人"}
        </div>
      ) : (
        <div>
          {list.map((kol) => (
            <KolListRow
              key={kol.id}
              kol={kol}
              href={workbenchHref({ view, stage, kol: kol.id, q: query ?? null })}
              selected={selectedKolId === kol.id}
            />
          ))}
        </div>
      )}
    </>
  );

  const detailHeader =
    selectedKol && focusedEmail ? (
      <div className="flex items-start justify-between gap-4">
        <KolNameEditor
          kolId={selectedKol.id}
          initialName={selectedKol.name}
          email={selectedKol.email}
        />
        <div className="flex shrink-0 items-center gap-2">
          <ReplyResolvedButton
            kolId={selectedKol.id}
            initialResolved={selectedKol.replyResolved}
          />
          <MarkEmailReadButton emailId={focusedEmail.id} isRead={focusedEmail.isRead} kolId={selectedKol.id} />
        </div>
      </div>
    ) : null;

  const detailBody =
    selectedKol && focusedEmail ? (
      <article className="mx-auto grid max-w-3xl gap-4">
        <AutoMarkRead emailIds={unreadInboundIds} kolId={selectedKol.id} />
        <section className="glass-card-strong rounded-2xl p-4">
          <KolStageEditor
            kolId={selectedKol.id}
            initialStage={selectedKol.stage}
            stageOverride={selectedKol.stageOverride}
          />
        </section>

        <section className="glass-card-strong rounded-2xl p-4">
          <h3 className="m-0 text-sm font-semibold">达人基础信息</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Fact label="来源" value={KOL_SOURCE_LABELS[selectedKol.source]} />
            <Fact label="类型" value={selectedKol.type ?? "待补充"} />
            <Fact label="平台" value={PLATFORM_LABELS[selectedKol.primaryPlatform]} />
            <Fact label="账号" value={selectedKol.platformHandle ?? selectedKol.handle} />
            <Fact label="负责人" value={selectedKol.ownerName} />
            <Fact
              label="合作状态"
              value={KOL_STATUS_LABELS[selectedKol.status] ?? selectedKol.status}
            />
            <Fact
              label="报价"
              value={selectedKol.brandQuote?.trim() || "待确认"}
            />
            {selectedKol.finalCooperationPrice != null ? (
              <Fact
                label="最终合作价格"
                value={`$${selectedKol.finalCooperationPrice}`}
              />
            ) : null}
          </dl>
          {selectedKol.externalProfileUrl ? (
            <a
              href={selectedKol.externalProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 text-xs font-semibold text-accent shadow-inset transition hover:bg-white"
            >
              打开主页
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          {selectedKol.notes ? (
            <p className="m-0 mt-3 whitespace-pre-line rounded-2xl border border-white/70 bg-white/60 p-3 text-xs leading-5 text-muted shadow-inset">
              {selectedKol.notes}
            </p>
          ) : null}
        </section>

        <section className="glass-card-strong rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs text-muted">
                {focusedEmail.id === latest?.id ? "最新邮件" : "邮件正文"}
              </p>
              <h3 className="m-0 mt-1 truncate text-base font-semibold">{focusedEmail.subject}</h3>
            </div>
            <DeleteEmailButton emailId={focusedEmail.id} kolId={selectedKol.id} />
          </div>
          <EmailBodyViewer
            key={focusedEmail.id}
            bodyText={focusedEmail.bodyText}
            bodyHtml={focusedEmail.bodyHtml}
            bodyZh={focusedEmail.bodyZh}
          />
        </section>

        <section className="glass-card-strong rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-[#e7f3f0] text-accent">
              <Mail className="size-4" />
            </span>
            <h3 className="m-0 text-sm font-semibold">跨成员邮件时间线</h3>
          </div>
          {kolDetailQuery.isLoading ? (
            <p className="text-sm text-muted">加载邮件时间线…</p>
          ) : (
            <div className="grid gap-3">
              {timeline.map((email) => {
                const isFocused = email.id === focusedEmail.id;
                return (
                <div key={email.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <div
                    className={`mt-1 grid size-7 place-items-center rounded-full ${
                      email.direction === "inbound"
                        ? "bg-[#e7f3f0] text-accent"
                        : "bg-white/70 text-muted shadow-inset"
                    }`}
                  >
                    {email.direction === "inbound" ? (
                      <Inbox className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </div>
                  <div
                    className={`min-w-0 rounded-2xl border bg-white/60 p-3 shadow-inset transition ${
                      isFocused
                        ? "border-accent/40 ring-2 ring-accent/20"
                        : "border-white/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setFocusedEmailId(email.id)}
                        className="focus-ring min-w-0 flex-1 truncate text-left text-sm font-medium text-ink"
                      >
                        {email.subject}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{formatDate(email.sentAt)}</span>
                        <ReclassifyButton emailId={email.id} aiSummary={email.aiSummary} />
                        <MarkEmailReadButton emailId={email.id} isRead={email.isRead} kolId={selectedKol.id} />
                        <DeleteEmailButton emailId={email.id} kolId={selectedKol.id} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFocusedEmailId(email.id)}
                      className="focus-ring mt-2 w-full text-left text-sm leading-6 text-muted"
                    >
                      {email.aiSummary ?? "点击查看邮件正文"}
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </section>
      </article>
    ) : (
      <div className="grid h-full min-h-[480px] place-items-center text-center">
        <div>
          <Clock3 className="mx-auto size-8 text-muted" />
          <p className="mt-3 text-sm text-muted">请选择一位达人查看详情</p>
        </div>
      </div>
    );

  const composeDock =
    selectedKol && focusedEmail ? (
      <div className="mx-auto max-w-3xl">
        <DraftSendPanel
          kolId={selectedKol.id}
          kolName={selectedKol.name}
          kolStage={selectedKol.stage}
          kolPlatform={selectedKol.primaryPlatform}
          kolAgreedPrice={selectedKol.agreedPrice}
          kolHandle={selectedKol.handle}
          kolHomepageUrl={selectedKol.externalProfileUrl}
          senderName={meQuery.data?.displayName ?? "Chloe"}
          operatorName={meQuery.data?.feishuOperatorName}
          to={selectedKol.email}
          subject={latest?.subject ?? focusedEmail.subject}
          latestEmail={latest?.bodyText ?? focusedEmail.bodyText}
          history={timeline
            .slice(0, 5)
            .map(
              (email) =>
                `${email.direction === "inbound" ? "KOL" : "Lovart"}: ${email.subject}\n${email.bodyText}`
            )
            .join("\n\n")}
          initialChineseDraft=""
          initialEnglishBody=""
          templates={templates}
        />
      </div>
    ) : undefined;

  const aiSuggestedAction = latest?.aiSuggestedAction ?? null;
  const showAiAction = Boolean(aiSuggestedAction?.trim());

  const infoPane = (
    <div className="grid gap-4">
      {showAiAction ? (
        <section className="glass-card-strong rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-[#e7f3f0] text-accent">
              <Bot className="size-4" />
            </span>
            <h3 className="m-0 text-sm font-semibold">AI 建议动作</h3>
          </div>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">{aiSuggestedAction}</p>
        </section>
      ) : null}
      {selectedKol ? (
        <section className="glass-card-strong rounded-2xl p-3">
          <h3 className="m-0 text-sm font-semibold">关键事实</h3>
          <dl className="mt-2 grid gap-2 text-sm">
            <Fact label="来源" value={KOL_SOURCE_LABELS[selectedKol.source]} />
            <Fact label="平台" value={PLATFORM_LABELS[selectedKol.primaryPlatform]} />
            <Fact label="阶段" value={selectedKol.stage} />
          </dl>
        </section>
      ) : null}
      {view === "pool" && teamQuery.data ? (
        <AssignPanel
          members={teamQuery.data.members ?? []}
          orphanedKols={teamQuery.data.pool ?? []}
        />
      ) : null}
    </div>
  );

  return (
    <WorkbenchShell
      navBadges={sidebar?.unreplied ? { "/": sidebar.unreplied } : undefined}
      alerts={
        meQuery.data ? (
          <>
            <GmailReauthorizeBanner profile={meQuery.data} />
            <HistorySyncBanner profile={meQuery.data} />
          </>
        ) : null
      }
      search={<WorkbenchSearch initialQuery={searchParams.get("q") ?? ""} />}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <GmailSyncButton />
          <FeishuSyncButton />
          <BatchFollowupButton
            candidates={batchFollowupCandidates}
            templates={templates}
            senderName={meQuery.data?.displayName ?? "Chloe"}
          />
          <SignOutButton />
        </div>
      }
      sidebarStats={sidebarStats}
      listPane={listPane}
      detailHeader={detailHeader}
      detailBody={detailBody}
      composeDock={composeDock}
      infoPane={infoPane}
    />
  );
}

export function WorkbenchPage() {
  return (
    <RequireAuth>
      <WorkbenchPageInner />
    </RequireAuth>
  );
}
