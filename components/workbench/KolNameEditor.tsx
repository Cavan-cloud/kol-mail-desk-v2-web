"use client";

import { Pencil, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/api-client/queries";
import { isApiClientError } from "@/lib/api-client/error";

export function KolNameEditor({
  kolId,
  initialName,
  email
}: {
  kolId: string;
  initialName: string;
  email: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
    setSavedName(initialName);
  }, [initialName, kolId]);

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.kols.update(kolId, { name: name.trim() });
      setSavedName(name.trim());
      setEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workbench.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.kol.detail(kolId) }),
      ]);
    } catch (error) {
      window.alert(isApiClientError(error) ? error.message : error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="m-0 text-xs font-medium text-muted">达人卡片</p>
      {editing ? (
        <div className="mt-1 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-glass h-10 min-w-0 flex-1 px-3 text-lg font-semibold"
            autoFocus
          />
          <button
            type="button"
            disabled={saving}
            onClick={saveName}
            className="primary-island-button h-10 px-3"
          >
            <Save className="size-4" />
            保存
          </button>
        </div>
      ) : (
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <h2 className="m-0 truncate text-2xl font-semibold tracking-tight">{savedName}</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="island-button h-8 shrink-0 px-2 text-xs"
          >
            <Pencil className="size-3.5" />
            改名
          </button>
        </div>
      )}
      <p className="m-0 mt-1 break-all text-sm text-muted">邮箱：{email}</p>
    </div>
  );
}
