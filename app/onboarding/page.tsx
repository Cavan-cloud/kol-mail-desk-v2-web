"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LovartMark } from "@/components/common/LovartMark";
import { PageSpinner } from "@/components/shell/PageSpinner";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";
import { queryKeys, useMeQuery, useTeamMembersQuery } from "@/lib/api-client/queries";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";

const ROLES: UserRole[] = ["leader", "full_time", "intern"];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const teamQuery = useTeamMembersQuery();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("full_time");
  const [mentorUserId, setMentorUserId] = useState("");
  const [feishuOperatorName, setFeishuOperatorName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = meQuery.data?.id;
  const mentorOptions = (teamQuery.data?.members ?? [])
    .filter((member) => member.id && member.id !== currentUserId && member.status !== "departed")
    .map((member) => ({
      id: member.id!,
      displayName: member.displayName ?? "未命名成员",
    }));

  useEffect(() => {
    if (meQuery.data?.displayName) {
      setDisplayName(meQuery.data.displayName);
    }
  }, [meQuery.data?.displayName]);

  useEffect(() => {
    if (role !== "intern") {
      setMentorUserId("");
    }
  }, [role]);

  useEffect(() => {
    if (meQuery.isError && isApiClientError(meQuery.error) && meQuery.error.status === 401) {
      router.replace("/login");
    }
    if (meQuery.data?.status === "active") {
      router.replace("/");
    }
  }, [meQuery.data?.status, meQuery.error, meQuery.isError, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (role === "intern" && !mentorUserId) {
      setError("实习生必须选择 mentor。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await apiClient.team.updateProfile({
        displayName: displayName.trim(),
        role,
        mentorUserId: role === "intern" ? mentorUserId : null,
        feishuOperatorName: feishuOperatorName.trim() || null,
      });
      queryClient.setQueryData(queryKeys.me, result.profile);
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(isApiClientError(cause) ? cause.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  if (meQuery.isLoading || teamQuery.isLoading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center">
        <PageSpinner label="加载资料…" />
      </main>
    );
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-panel p-4 text-ink">
      <section className="glass-card-strong w-full max-w-lg rounded-[2rem] p-8">
        <div className="mb-6 flex items-center gap-3">
          <LovartMark className="size-11" />
          <div>
            <h1 className="m-0 text-xl font-semibold">完善个人资料</h1>
            <p className="m-0 mt-1 text-sm text-muted">首次登录必填，完成后即可进入工作台</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">显示名</span>
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="field-glass h-10 px-3"
              placeholder="例如：Chloe"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">角色</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="field-glass h-10 px-3"
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {USER_ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          {role === "intern" ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Mentor（必选）</span>
              <select
                required
                value={mentorUserId}
                onChange={(event) => setMentorUserId(event.target.value)}
                className="field-glass h-10 px-3"
              >
                <option value="">请选择 mentor</option>
                {mentorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">飞书运营名（可选）</span>
            <input
              value={feishuOperatorName}
              onChange={(event) => setFeishuOperatorName(event.target.value)}
              className="field-glass h-10 px-3"
              placeholder="与飞书表格中的运营名一致"
            />
          </label>

          {error ? (
            <p className="m-0 rounded-xl border border-[#f0c6c0] bg-[#fff6f5] p-3 text-sm text-[#9f3429]">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={saving} className="primary-island-button h-11">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                保存中…
              </>
            ) : (
              "保存并进入工作台"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
