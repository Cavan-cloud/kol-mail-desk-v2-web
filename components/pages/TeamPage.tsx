"use client";

import { Mail, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/components/shell/RequireAuth";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { AssignPanel } from "@/components/team/AssignPanel";
import { TeamMemberActions } from "@/components/team/TeamMemberActions";
import { TeamMemberProfileEditor } from "@/components/team/TeamMemberProfileEditor";
import { useMeQuery, useTeamMembersQuery } from "@/lib/api-client/queries";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";

function TeamPageInner() {
  const meQuery = useMeQuery();
  const teamQuery = useTeamMembersQuery();
  const members = teamQuery.data?.members ?? [];
  const poolKols = teamQuery.data?.pool ?? [];
  const currentUserId = meQuery.data?.id;
  const isLeader = meQuery.data?.role === "leader" && meQuery.data?.status !== "departed";
  const canAssignLeader = isLeader || meQuery.data?.status === "pending_approval";
  const mentorOptions = members
    .filter((member) => member.id && member.id !== currentUserId)
    .map((member) => ({
      id: member.id!,
      displayName: member.displayName ?? "未命名成员",
    }));

  if (teamQuery.isLoading || meQuery.isLoading) {
    return (
      <AppShell activeHref="/team" title="团队成员" headerActions={<SignOutButton />}>
        <PageSpinner label="加载团队成员…" />
      </AppShell>
    );
  }

  if (teamQuery.isError) {
    return (
      <AppShell activeHref="/team" title="团队成员" headerActions={<SignOutButton />}>
        <div className="p-6 text-center text-sm text-[#9f3429]">加载团队成员失败，请刷新重试。</div>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/team" title="团队成员" headerActions={<SignOutButton />}>
      <div className="mx-auto max-w-[1200px] p-4 lg:p-6">
        <section className="mb-5 grid gap-3 md:grid-cols-2">
          <SummaryCard icon={<UsersRound className="size-5" />} label="成员总数" value={members.length} />
          <SummaryCard
            icon={<ShieldCheck className="size-5" />}
            label="已激活"
            value={members.filter((row) => row.status === "active").length}
          />
        </section>

        {isLeader ? (
          <section className="mb-5">
            <AssignPanel members={members} orphanedKols={poolKols} />
          </section>
        ) : null}

        <section className="glass-card-strong overflow-hidden rounded-[2rem]">
          <div className="border-b border-white/70 px-5 py-4">
            <h2 className="m-0 text-base font-semibold">成员列表</h2>
            <p className="m-0 mt-1 text-xs text-muted">
              可在本人行内编辑角色、mentor 与飞书运营名；Leader 可标记成员离职并分配团队池达人。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.58] text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">成员</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">角色 / 飞书映射</th>
                  <th className="px-5 py-3 font-medium">在跟达人</th>
                  <th className="px-5 py-3 font-medium">已成交</th>
                  <th className="px-5 py-3 font-medium">停滞风险</th>
                  <th className="px-5 py-3 font-medium">Gmail</th>
                  <th className="px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/70">
                {members.map((row) => {
                  const isSelf = row.id === currentUserId;
                  const memberId = row.id;
                  const mentorName = row.mentorUserId
                    ? members.find((member) => member.id === row.mentorUserId)?.displayName
                    : null;
                  const rowTone =
                    row.status === "departed" ? "opacity-70" : "";
                  return (
                    <tr key={row.id} className={rowTone}>
                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {row.displayName}
                          {isSelf ? (
                            <span className="ml-2 rounded-full bg-lovart-soft px-2 py-0.5 text-[11px] font-semibold text-[#9a5a00]">
                              我
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <Mail className="size-3.5" />
                          {row.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={row.status ?? "active"} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                          <span className="rounded-full bg-white/70 px-2 py-1 font-semibold shadow-inset">
                            {USER_ROLE_LABELS[(row.role ?? "full_time") as keyof typeof USER_ROLE_LABELS]}
                          </span>
                          {mentorName ? (
                            <span className="rounded-full bg-white/70 px-2 py-1 text-muted shadow-inset">
                              mentor: {mentorName}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white/70 px-2 py-1 text-muted shadow-inset">
                            飞书: {row.feishuOperatorName ?? "未绑定"}
                          </span>
                        </div>
                        {isSelf && row.displayName ? (
                          <TeamMemberProfileEditor
                            displayName={row.displayName}
                            initialRole={(row.role ?? "full_time") as UserRole}
                            initialMentorUserId={row.mentorUserId ?? null}
                            initialFeishuOperatorName={row.feishuOperatorName ?? null}
                            mentorOptions={mentorOptions}
                            canAssignLeader={canAssignLeader}
                          />
                        ) : null}
                      </td>
                      <td className="px-5 py-4 font-mono">{row.activeKolCount ?? 0}</td>
                      <td className="px-5 py-4 font-mono">{row.closedKolCount ?? 0}</td>
                      <td className="px-5 py-4 font-mono">{row.stalledKolCount ?? 0}</td>
                      <td className="px-5 py-4 text-xs text-muted">
                        {row.gmailAuthorized ? "已授权" : "未授权"}
                      </td>
                      <td className="px-5 py-4">
                        {row.status === "departed" ? (
                          <Link
                            href="/?view=pool&stage=all"
                            className="island-button inline-flex h-9 items-center px-3 text-sm"
                          >
                            查看团队池
                          </Link>
                        ) : isLeader && memberId && !isSelf ? (
                          <TeamMemberActions userId={memberId} status={row.status ?? "active"} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {members.length === 0 ? (
              <div className="grid min-h-[240px] place-items-center text-sm text-muted">暂无成员数据</div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-[#e7f3f0] text-accent"
      : status === "pending_approval"
        ? "bg-[#fff8e7] text-[#8a5a00]"
        : status === "departed"
          ? "bg-white/50 text-muted line-through"
          : "bg-white/70 text-muted";
  const label =
    status === "active"
      ? "已激活"
      : status === "pending_approval"
        ? "待审批"
        : status === "departed"
          ? "已离职"
          : status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

export function TeamPage() {
  return (
    <RequireAuth>
      <TeamPageInner />
    </RequireAuth>
  );
}
