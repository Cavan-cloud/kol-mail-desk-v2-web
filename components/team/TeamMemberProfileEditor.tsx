"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";

type MemberOption = {
  id: string;
  displayName: string;
};

export function TeamMemberProfileEditor({
  displayName,
  initialRole,
  initialMentorUserId,
  initialFeishuOperatorName,
  mentorOptions,
  canAssignLeader,
}: {
  displayName: string;
  initialRole: UserRole;
  initialMentorUserId: string | null;
  initialFeishuOperatorName: string | null;
  mentorOptions: MemberOption[];
  canAssignLeader: boolean;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [mentorUserId, setMentorUserId] = useState(initialMentorUserId ?? "");
  const [feishuOperatorName, setFeishuOperatorName] = useState(initialFeishuOperatorName ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    if (role === "intern" && !mentorUserId) {
      setMessage("实习生必须选择 mentor");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await apiClient.team.updateProfile({
        displayName: displayName.trim(),
        role,
        mentorUserId: role === "intern" ? mentorUserId || null : null,
        feishuOperatorName: feishuOperatorName.trim() || null,
      });
      const assigned = result.kolsAssigned ?? 0;
      setMessage(
        assigned > 0
          ? `已保存，自动认领 ${assigned} 位无主达人`
          : "成员资料已更新"
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.team.members }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all }),
      ]);
    } catch (error) {
      setMessage(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-w-[280px] gap-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="h-9 rounded-full border border-white/70 bg-white/75 px-3 text-xs shadow-inset outline-none focus:border-accent/50"
        >
          {canAssignLeader ? <option value="leader">{USER_ROLE_LABELS.leader}</option> : null}
          <option value="full_time">{USER_ROLE_LABELS.full_time}</option>
          <option value="intern">{USER_ROLE_LABELS.intern}</option>
        </select>
        <select
          value={mentorUserId}
          onChange={(event) => setMentorUserId(event.target.value)}
          disabled={role !== "intern"}
          required={role === "intern"}
          className="h-9 rounded-full border border-white/70 bg-white/75 px-3 text-xs shadow-inset outline-none focus:border-accent/50 disabled:opacity-50"
        >
          <option value="">{role === "intern" ? "请选择 mentor" : "无 mentor"}</option>
          {mentorOptions.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
        <input
          value={feishuOperatorName}
          onChange={(event) => setFeishuOperatorName(event.target.value)}
          placeholder="飞书运营名"
          className="h-9 rounded-full border border-white/70 bg-white/75 px-3 text-xs shadow-inset outline-none focus:border-accent/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={loading} onClick={save} className="island-button h-8 px-3 text-xs">
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
          保存设置
        </button>
        {message ? <span className="text-xs text-muted">{message}</span> : null}
      </div>
    </div>
  );
}
