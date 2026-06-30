"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { isApiClientError } from "@/lib/api-client/error";
import type { Kol } from "@/lib/api-client/kols";
import type { TeamMember } from "@/lib/api-client/team";
import { USER_ROLE_LABELS } from "@/lib/domain";

type Props = {
  members: TeamMember[];
  orphanedKols: Kol[];
};

export function AssignPanel({ members, orphanedKols }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const assignableMembers = useMemo(
    () => members.filter((member) => member.role !== "intern"),
    [members]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected((prev) => {
      const ids = orphanedKols.flatMap((kol) => (kol.id ? [kol.id] : []));
      return prev.size === ids.length ? new Set<string>() : new Set(ids);
    });
  }

  async function assign() {
    const kolIds = Array.from(selected);
    if (kolIds.length === 0) {
      setMessage({ tone: "error", text: "请先勾选要分配的达人。" });
      return;
    }
    if (!assigneeUserId) {
      setMessage({ tone: "error", text: "请选择接收的团队成员。" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const data = await apiClient.kols.assign({ kolIds, ownerUserId: assigneeUserId });
      setMessage({ tone: "ok", text: `已分配 ${data.assignedCount ?? kolIds.length} 位达人。` });
      setSelected(new Set());
      setAssigneeUserId("");
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: isApiClientError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "分配失败",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card-strong rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-accent" />
        <h3 className="m-0 text-sm font-semibold">离职遗留达人分配</h3>
        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-muted shadow-inset">
          {orphanedKols.length}
        </span>
      </div>
      <p className="m-0 mt-1 text-xs text-muted">仅 Leader 可见。将离职成员遗留（orphaned）的达人重新分配给在职成员。</p>

      {orphanedKols.length === 0 ? (
        <p className="m-0 mt-3 rounded-2xl border border-dashed border-white/80 bg-white/55 px-3 py-4 text-center text-xs text-muted shadow-inset">
          当前没有待分配的离职遗留达人。
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={selectAll}
              className="focus-ring rounded text-xs font-semibold text-accent hover:underline"
            >
              {selected.size === orphanedKols.length ? "取消全选" : "全选"}
            </button>
            <span className="text-xs text-muted">已选 {selected.size}</span>
          </div>

          <ul className="desk-scroll mt-2 max-h-44 list-none overflow-y-auto rounded-2xl border border-white/70 bg-white/55 p-0 shadow-inset">
            {orphanedKols.map((kol) => {
              const kolId = kol.id;
              if (!kolId) return null;
              return (
              <li key={kolId} className="border-b border-white/60 last:border-0">
                <label className="flex cursor-pointer items-center gap-2 px-2.5 py-2 text-sm hover:bg-white/70">
                  <input
                    type="checkbox"
                    checked={selected.has(kolId)}
                    onChange={() => toggle(kolId)}
                    className="size-4 accent-[#0f766e]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{kol.name ?? kol.email}</span>
                    <span className="block truncate text-xs text-muted">{kol.email}</span>
                  </span>
                </label>
              </li>
              );
            })}
          </ul>

          <label className="mt-3 grid gap-1">
            <span className="text-xs font-medium text-muted">分配给</span>
            <select
              value={assigneeUserId}
              onChange={(event) => setAssigneeUserId(event.target.value)}
              className="field-glass h-9 px-2.5 text-sm"
            >
              <option value="">选择团队成员</option>
              {assignableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName ?? member.email}（{(member.role && USER_ROLE_LABELS[member.role]) ?? "成员"})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={assign}
            disabled={loading}
            className="primary-island-button mt-3 h-9 w-full"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            确认分配
          </button>
        </>
      )}

      {message ? (
        <p className={`m-0 mt-2 text-xs ${message.tone === "ok" ? "text-accent" : "text-[#9f3429]"}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
